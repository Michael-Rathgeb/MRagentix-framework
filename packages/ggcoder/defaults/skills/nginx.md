---
name: nginx
description: Nginx — reverse proxy, SSL/TLS, load balancing, static files, and server configuration
---

You are now equipped with Nginx expertise. Use this knowledge to help configure, deploy, and manage Nginx web servers.

## Installation & Service

- Install on Ubuntu/Debian: `sudo apt update && sudo apt install -y nginx`
- Install mainline (latest features) via official repo:
  ```bash
  sudo apt install -y curl gnupg2 ca-certificates lsb-release
  echo "deb http://nginx.org/packages/mainline/ubuntu $(lsb_release -cs) nginx" | sudo tee /etc/apt/sources.list.d/nginx.list
  curl -fsSL https://nginx.org/keys/nginx_signing.key | sudo apt-key add -
  sudo apt update && sudo apt install -y nginx
  ```
- Check version: `nginx -v`
- Test config before reload: `sudo nginx -t`
- Start: `sudo systemctl start nginx`
- Stop: `sudo systemctl stop nginx`
- Restart (hard): `sudo systemctl restart nginx`
- Reload (graceful, zero-downtime): `sudo systemctl reload nginx`
- Alternative reload: `sudo nginx -s reload`
- Enable on boot: `sudo systemctl enable nginx`
- Check status: `sudo systemctl status nginx`

## Config Structure

Main config: `/etc/nginx/nginx.conf`

```
/etc/nginx/
├── nginx.conf              # Main config (worker settings, http block)
├── conf.d/                 # Drop-in config files (*.conf auto-included)
├── sites-available/        # All virtual host configs (Debian/Ubuntu)
├── sites-enabled/          # Symlinks to active configs
├── snippets/               # Reusable config fragments
├── mime.types              # MIME type mappings
└── modules-enabled/        # Dynamic module symlinks
```

Block hierarchy: `main → events → http → server → location`

```nginx
# /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

- Enable a site: `sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/`
- Disable a site: `sudo rm /etc/nginx/sites-enabled/mysite`
- Always run `sudo nginx -t` before `sudo systemctl reload nginx`.

## Static File Serving

### Basic Static Site

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /var/www/example.com/public;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### root vs alias

```nginx
# root — appends location path to root
location /images/ {
    root /var/www/site;
    # Serves /var/www/site/images/photo.jpg
}

# alias — replaces location path entirely
location /images/ {
    alias /var/www/media/;
    # Serves /var/www/media/photo.jpg
}
```

### Gzip Compression

```nginx
http {
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;
}
```

### Cache Headers

```nginx
# Cache static assets aggressively
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# No cache for HTML
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

## Reverse Proxy

### Basic Proxy to Node.js / Backend

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### WebSocket Proxying

```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

### Upstream Blocks

```nginx
upstream backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL/TLS

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and auto-configure SSL
sudo certbot --nginx -d example.com -d www.example.com

# Test auto-renewal
sudo certbot renew --dry-run

# Cron auto-renews via systemd timer or:
# 0 0,12 * * * certbot renew --quiet
```

### Manual SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Modern SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # HSTS (1 year)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    root /var/www/example.com/public;
    index index.html;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}
```

### Reusable SSL Snippet

Save as `/etc/nginx/snippets/ssl-params.conf`:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

Then include in server blocks: `include /etc/nginx/snippets/ssl-params.conf;`

## Load Balancing

```nginx
upstream app_cluster {
    # Round-robin (default) — requests distributed sequentially
    server 10.0.0.1:3000 weight=3;    # Gets 3x traffic
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
    server 10.0.0.4:3000 backup;      # Only used when others are down

    # Alternative strategies (uncomment one):
    # least_conn;        # Route to server with fewest active connections
    # ip_hash;           # Sticky sessions — same client IP always hits same server
    # hash $request_uri; # Route by URI for cache consistency

    # Health checks
    server 10.0.0.5:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://app_cluster;
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }
}
```

## Security Headers

```nginx
# Add to server or http block
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'self';" always;
```

Save as `/etc/nginx/snippets/security-headers.conf` and `include` it.

## Common Patterns

### SPA Fallback (React / Vue / Angular)

```nginx
server {
    listen 80;
    server_name app.example.com;

    root /var/www/app/dist;
    index index.html;

    # All routes fall back to index.html for client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Node.js App with SSL (Complete)

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    include /etc/nginx/snippets/ssl-params.conf;
    include /etc/nginx/snippets/security-headers.conf;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}
```

### Multiple Domains on One Server

```nginx
# Domain 1 — static marketing site
server {
    listen 80;
    server_name marketing.example.com;
    root /var/www/marketing/public;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}

# Domain 2 — app with API proxy
server {
    listen 80;
    server_name app.example.com;
    root /var/www/app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
    }
}

# Domain 3 — API only
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
    }
}
```

### Rate Limiting

```nginx
http {
    # Define rate limit zone: 10 requests/second per IP, 10MB shared memory
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=1r/s;

    server {
        # Allow bursts of 20, don't delay within burst
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://127.0.0.1:3000;
        }

        # Strict rate limit on login
        location /api/auth/login {
            limit_req zone=login_limit burst=5;
            proxy_pass http://127.0.0.1:3000;
        }
    }
}
```

### Basic Auth

```bash
# Create password file
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

```nginx
location /admin/ {
    auth_basic "Restricted Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://127.0.0.1:3000;
}
```

## Logging

```nginx
http {
    # Custom log format
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    '$request_time $upstream_response_time';

    # JSON log format (for log aggregators)
    log_format json escape=json '{'
        '"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"request":"$request",'
        '"status":$status,'
        '"body_bytes_sent":$body_bytes_sent,'
        '"request_time":$request_time,'
        '"upstream_response_time":"$upstream_response_time",'
        '"http_user_agent":"$http_user_agent"'
    '}';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    server {
        # Per-site logs
        access_log /var/log/nginx/example.com.access.log main;
        error_log /var/log/nginx/example.com.error.log;

        # Disable logging for health checks / static assets
        location /health {
            access_log off;
            return 200 "ok";
        }

        location ~* \.(js|css|png|jpg|ico)$ {
            access_log off;
        }
    }
}
```

Log rotation is handled by `/etc/logrotate.d/nginx` (installed by default). To view logs:

- Tail access log: `sudo tail -f /var/log/nginx/access.log`
- Tail errors: `sudo tail -f /var/log/nginx/error.log`
- Error log levels (least to most verbose): `emerg`, `alert`, `crit`, `error`, `warn`, `notice`, `info`, `debug`

## Performance Tuning

```nginx
# /etc/nginx/nginx.conf
user www-data;
worker_processes auto;                   # Match CPU cores
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;             # Max simultaneous connections per worker
    multi_accept on;                     # Accept all new connections at once
    use epoll;                           # Efficient event model (Linux)
}

http {
    sendfile on;                         # Kernel-level file transfer
    tcp_nopush on;                       # Send headers and file in one packet
    tcp_nodelay on;                      # Don't buffer small packets
    keepalive_timeout 65;                # Keep connections alive
    keepalive_requests 1000;             # Max requests per keep-alive connection
    client_max_body_size 50M;            # Max upload size
    types_hash_max_size 2048;
    server_tokens off;                   # Hide Nginx version in headers

    # Proxy buffering
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 32k;

    # Proxy cache
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=1g inactive=60m;

    server {
        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_cache app_cache;
            proxy_cache_valid 200 10m;
            proxy_cache_valid 404 1m;
            proxy_cache_use_stale error timeout updating http_502 http_503;
            add_header X-Cache-Status $upstream_cache_status;
        }

        # Bypass cache for authenticated requests
        location /api/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_cache app_cache;
            proxy_cache_bypass $http_authorization;
            proxy_no_cache $http_authorization;
        }
    }
}
```

## Key Gotchas

- Always run `sudo nginx -t` before reloading. A bad config will prevent Nginx from restarting entirely.
- Use `reload` not `restart` in production — reload is graceful with zero downtime.
- `proxy_pass http://backend/` (trailing slash) strips the location prefix. Without the slash, it preserves it.
- `add_header` in a nested block **replaces** all parent `add_header` directives — it doesn't merge. Use `always` to include headers on error pages too.
- `try_files` checks files relative to `root`. The last argument is the fallback (can be a URI like `/index.html` or a status code like `=404`).
- `location = /path` (exact match) takes priority over `location /path` (prefix) and `location ~ regex`.
- Location priority order: `=` exact → `^~` preferential prefix → `~` / `~*` regex → longest prefix.
- `client_max_body_size 0;` disables the body size check entirely (useful for file upload endpoints).
- WebSocket proxy requires both `Upgrade` and `Connection` headers — missing either will silently fail.
- If certbot fails, ensure port 80 is accessible and DNS A record points to your server.
- Default site `/etc/nginx/sites-enabled/default` can catch unmatched requests — remove or customize it.
- Check for port conflicts: `sudo ss -tlnp | grep :80` or `sudo lsof -i :80`.
