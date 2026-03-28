---
name: redis
description: Redis — caching, sessions, pub/sub, queues, and CLI operations
---

You are now equipped with Redis expertise.

## Installation & CLI

- **Ubuntu:** `sudo apt install redis-server && sudo systemctl enable redis-server`
- **macOS:** `brew install redis && brew services start redis`
- **Docker:** `docker run -d --name redis -p 6379:6379 redis:7-alpine`
- **Docker with password:** `docker run -d --name redis -p 6379:6379 redis:7-alpine --requirepass mysecret`
- Connect: `redis-cli`
- Connect remote: `redis-cli -h 10.0.0.5 -p 6379 -a password`
- Connect with URL: `redis-cli -u redis://default:password@host:6379`
- Ping test: `redis-cli PING` → `PONG`
- Server info: `INFO` / `INFO memory` / `INFO keyspace`
- Select database (0–15): `SELECT 1`
- Monitor all commands: `MONITOR` (debug only, high overhead)
- Flush current DB: `FLUSHDB` / Flush all: `FLUSHALL` (DESTRUCTIVE)

## Data Types

### Strings

```
SET user:123:name "Alice"
GET user:123:name                  → "Alice"
SET session:abc "data" EX 3600    → set with 1h TTL
SETNX lock:order:456 1            → set only if not exists (atomic lock)
MSET k1 "v1" k2 "v2"             → set multiple
MGET k1 k2                        → get multiple
INCR counter:visits               → atomic increment (returns new value)
INCRBY counter:visits 10
DECR counter:stock
EXPIRE user:123:name 300          → set TTL to 300s
TTL user:123:name                 → seconds remaining (-1 = no TTL, -2 = key gone)
```

### Hashes

```
HSET user:123 name "Alice" email "alice@example.com" role "admin"
HGET user:123 name                → "Alice"
HGETALL user:123                  → all fields + values
HMGET user:123 name email         → multiple fields
HINCRBY user:123 login_count 1    → atomic field increment
HDEL user:123 role
HEXISTS user:123 email            → 1 or 0
```

### Lists

```
LPUSH queue:emails "msg1"         → push to head
RPUSH queue:emails "msg2"         → push to tail
LRANGE queue:emails 0 -1          → all elements
LPOP queue:emails                 → pop from head
RPOP queue:emails                 → pop from tail
LLEN queue:emails                 → length
LINDEX queue:emails 0             → element at index
LTRIM queue:emails 0 99           → keep only first 100 elements
```

### Sets

```
SADD tags:post:1 "redis" "database" "nosql"
SMEMBERS tags:post:1              → all members
SISMEMBER tags:post:1 "redis"     → 1 or 0
SCARD tags:post:1                 → count
SINTER tags:post:1 tags:post:2    → intersection
SUNION tags:post:1 tags:post:2    → union
SDIFF tags:post:1 tags:post:2     → difference
SREM tags:post:1 "nosql"          → remove member
```

### Sorted Sets

```
ZADD leaderboard 100 "alice" 85 "bob" 92 "charlie"
ZRANGE leaderboard 0 -1 WITHSCORES         → ascending
ZREVRANGE leaderboard 0 2 WITHSCORES       → top 3 descending
ZRANGEBYSCORE leaderboard 90 100            → scores between 90–100
ZSCORE leaderboard "alice"                  → 100
ZRANK leaderboard "alice"                   → rank (0-based, ascending)
ZINCRBY leaderboard 5 "bob"                 → increment score
ZREM leaderboard "charlie"
ZCARD leaderboard                           → count
```

## Key Management

- List keys (NEVER in production): `KEYS user:*`
- Scan safely: `SCAN 0 MATCH user:* COUNT 100` (iterate with returned cursor until 0)
- Delete: `DEL key1 key2` (blocking) / `UNLINK key1 key2` (async, preferred for large keys)
- Check existence: `EXISTS key` → 1 or 0
- Set TTL: `EXPIRE key 3600` / `PEXPIRE key 3600000` (milliseconds)
- Set absolute expiry: `EXPIREAT key 1700000000` (Unix timestamp)
- Check TTL: `TTL key` / `PTTL key` (milliseconds)
- Remove TTL: `PERSIST key`
- Check type: `TYPE key`
- Rename: `RENAME old new` / `RENAMENX old new` (only if new doesn't exist)
- Dump size: `MEMORY USAGE key`

### Key Naming Conventions

Use colon-separated hierarchical names:
- `user:123:profile` — user profile hash
- `session:abc123` — session data
- `cache:api:/users?page=1` — cached API response
- `queue:emails:pending` — email queue
- `lock:order:456` — distributed lock
- `rate:ip:192.168.1.1` — rate limiter counter

Keep names short but descriptive. Avoid spaces and special characters.

## Caching Patterns

### Cache-Aside (Lazy Loading) — Most Common

```typescript
async function getUser(id: string): Promise<User> {
  const cached = await redis.get(`cache:user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(id);
  await redis.set(`cache:user:${id}`, JSON.stringify(user), 'EX', 3600);
  return user;
}
```

### Write-Through

```typescript
async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const user = await db.users.update(id, data);
  await redis.set(`cache:user:${id}`, JSON.stringify(user), 'EX', 3600);
  return user;
}
```

### Write-Behind (Write-Back)

Write to cache immediately, persist to DB asynchronously via queue:

```typescript
async function updateUser(id: string, data: Partial<User>): Promise<void> {
  await redis.set(`cache:user:${id}`, JSON.stringify(data), 'EX', 3600);
  await redis.lpush('queue:db-writes', JSON.stringify({ type: 'user:update', id, data }));
}
```

### Cache Invalidation

- **TTL-based:** Always set EX/PX. Short TTLs for volatile data (60s), longer for stable data (3600s).
- **Event-based:** Delete on write: `await redis.del(\`cache:user:${id}\`)`.
- **Pattern invalidation:** Use SCAN + UNLINK to clear groups: `cache:user:123:*`.
- **Versioned keys:** `cache:v2:user:123` — change version to invalidate all.

## Sessions

### Express + connect-redis + ioredis

```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';
import Redis from 'ioredis';

const redis = new Redis({ host: '127.0.0.1', port: 6379 });

app.use(session({
  store: new RedisStore({ client: redis, prefix: 'session:' }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400000, // 24h
    sameSite: 'lax',
  },
}));
```

### Manual Session Management

```typescript
async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const sessionData = { userId, createdAt: Date.now() };
  await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), 'EX', 86400);
  return sessionId;
}

async function getSession(sessionId: string): Promise<SessionData | null> {
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

async function destroySession(sessionId: string): Promise<void> {
  await redis.del(`session:${sessionId}`);
}
```

## Pub/Sub

### CLI

```
# Terminal 1 — subscribe
SUBSCRIBE chat:room:general
PSUBSCRIBE chat:room:*          → pattern subscribe (all rooms)

# Terminal 2 — publish
PUBLISH chat:room:general "Hello everyone"
```

### Node.js with ioredis

**IMPORTANT:** A subscribed client cannot run other commands. Use separate clients for pub/sub and regular operations.

```typescript
import Redis from 'ioredis';

const subscriber = new Redis();
const publisher = new Redis();

// Subscribe
subscriber.subscribe('events:order', 'events:payment', (err, count) => {
  console.log(`Subscribed to ${count} channels`);
});

// Pattern subscribe
subscriber.psubscribe('events:*');

// Handle messages
subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);
  console.log(`[${channel}]`, data);
});

subscriber.on('pmessage', (pattern, channel, message) => {
  console.log(`[${pattern} → ${channel}]`, JSON.parse(message));
});

// Publish
await publisher.publish('events:order', JSON.stringify({ orderId: '123', status: 'created' }));
```

### Channel Naming Conventions

- `events:order:created` — domain events
- `chat:room:general` — chat rooms
- `notifications:user:123` — per-user notifications
- `system:deployments` — system-wide broadcasts

## Queues

### Simple Queue (LPUSH/BRPOP)

```typescript
// Producer
await redis.lpush('queue:emails', JSON.stringify({ to: 'user@example.com', subject: 'Welcome' }));

// Consumer (blocking pop — waits up to 30s for a message)
const result = await redis.brpop('queue:emails', 30);
if (result) {
  const [key, message] = result;
  const job = JSON.parse(message);
  await sendEmail(job);
}
```

### Reliable Queue (RPOPLPUSH / LMOVE)

Move job to processing list atomically. If consumer crashes, reprocess from processing list:

```typescript
// Consumer: move from pending to processing
const message = await redis.lmove('queue:pending', 'queue:processing', 'RIGHT', 'LEFT');
if (message) {
  try {
    await processJob(JSON.parse(message));
    await redis.lrem('queue:processing', 1, message); // remove on success
  } catch (err) {
    // Message remains in queue:processing for retry
  }
}
```

### BullMQ (Production Queue Library)

```typescript
import { Queue, Worker } from 'bullmq';

const connection = { host: '127.0.0.1', port: 6379 };

// Producer
const emailQueue = new Queue('emails', { connection });

await emailQueue.add('welcome', { to: 'user@example.com', name: 'Alice' }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
});

// Delayed job
await emailQueue.add('reminder', { to: 'user@example.com' }, {
  delay: 3600000, // 1 hour
});

// Repeatable (cron)
await emailQueue.add('digest', {}, {
  repeat: { pattern: '0 9 * * *' }, // daily at 9am
});

// Worker
const worker = new Worker('emails', async (job) => {
  console.log(`Processing ${job.name}`, job.data);
  await sendEmail(job.data);
}, {
  connection,
  concurrency: 5,
  limiter: { max: 10, duration: 1000 }, // rate limit: 10/sec
});

worker.on('completed', (job) => console.log(`Done: ${job.id}`));
worker.on('failed', (job, err) => console.error(`Failed: ${job?.id}`, err));
```

## Streams

### Basic Stream Operations

```
XADD events:orders * action "created" orderId "123" total "49.99"
XLEN events:orders
XRANGE events:orders - +                   → all entries
XRANGE events:orders - + COUNT 10          → first 10
XREAD COUNT 5 BLOCK 5000 STREAMS events:orders $   → read new entries (block 5s)
```

### Consumer Groups

```
# Create group ($ = only new messages, 0 = all existing)
XGROUP CREATE events:orders orderProcessors $ MKSTREAM

# Read as consumer in group (> = unacknowledged messages)
XREADGROUP GROUP orderProcessors worker-1 COUNT 10 BLOCK 5000 STREAMS events:orders >

# Acknowledge processed message
XACK events:orders orderProcessors 1234567890-0

# Check pending (unacknowledged) messages
XPENDING events:orders orderProcessors - + 10

# Claim stale messages from crashed consumer
XAUTOCLAIM events:orders orderProcessors worker-2 3600000 0-0
```

### Node.js Stream Consumer

```typescript
import Redis from 'ioredis';

const redis = new Redis();

// Producer
await redis.xadd('stream:events', '*',
  'type', 'order.created',
  'payload', JSON.stringify({ orderId: '123', total: 49.99 })
);

// Consumer group setup
try {
  await redis.xgroup('CREATE', 'stream:events', 'processors', '$', 'MKSTREAM');
} catch (e: any) {
  if (!e.message.includes('BUSYGROUP')) throw e; // group already exists is OK
}

// Consumer loop
async function consumeStream() {
  while (true) {
    const results = await redis.xreadgroup(
      'GROUP', 'processors', 'worker-1',
      'COUNT', '10', 'BLOCK', '5000',
      'STREAMS', 'stream:events', '>'
    );

    if (!results) continue;

    for (const [stream, messages] of results) {
      for (const [id, fields] of messages) {
        const data: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          data[fields[i]] = fields[i + 1];
        }

        try {
          await processEvent(data);
          await redis.xack('stream:events', 'processors', id);
        } catch (err) {
          console.error(`Failed to process ${id}`, err);
          // Message stays pending, will be retried or claimed
        }
      }
    }
  }
}
```

## Transactions & Scripting

### MULTI/EXEC (Atomic Batch)

```
MULTI
SET user:123:balance 100
INCR user:123:login_count
EXPIRE user:123:balance 3600
EXEC
```

```typescript
const pipeline = redis.multi();
pipeline.set(`user:${id}:balance`, 100);
pipeline.incr(`user:${id}:login_count`);
pipeline.expire(`user:${id}:balance`, 3600);
const results = await pipeline.exec();
// results = [[null, 'OK'], [null, 5], [null, 1]]  → [error, result] pairs
```

### WATCH (Optimistic Locking)

```typescript
async function transferFunds(from: string, to: string, amount: number) {
  while (true) {
    await redis.watch(`balance:${from}`, `balance:${to}`);

    const fromBalance = parseInt(await redis.get(`balance:${from}`) || '0');
    if (fromBalance < amount) {
      await redis.unwatch();
      throw new Error('Insufficient funds');
    }

    const result = await redis.multi()
      .decrby(`balance:${from}`, amount)
      .incrby(`balance:${to}`, amount)
      .exec();

    if (result) return; // success — no one modified the watched keys
    // result is null = conflict, retry
  }
}
```

### Lua Scripting (Atomic Custom Logic)

```typescript
// Rate limiter — atomic check-and-increment
const rateLimitScript = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])

  local current = tonumber(redis.call('GET', key) or '0')
  if current >= limit then
    return 0
  end

  redis.call('INCR', key)
  if current == 0 then
    redis.call('EXPIRE', key, window)
  end
  return 1
`;

const allowed = await redis.eval(rateLimitScript, 1, `rate:${ip}`, 100, 60);
// Returns 1 if allowed, 0 if rate limited
```

## Node.js Integration (ioredis)

### Connection Setup

```typescript
import Redis from 'ioredis';

// Basic
const redis = new Redis(); // localhost:6379

// With options
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  keyPrefix: 'myapp:',
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay; // return null to stop retrying
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

// From URL (e.g., Railway, Render, Upstash)
const redis = new Redis(process.env.REDIS_URL!);
// redis://default:password@host:port

// Event handling
redis.on('connect', () => console.log('Redis connected'));
redis.on('ready', () => console.log('Redis ready'));
redis.on('error', (err) => console.error('Redis error:', err));
redis.on('close', () => console.log('Redis connection closed'));
redis.on('reconnecting', () => console.log('Redis reconnecting...'));

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
  process.exit(0);
});
```

### Pipelining (Batch Commands Without Transaction)

```typescript
const pipeline = redis.pipeline();
pipeline.get('user:1:name');
pipeline.get('user:2:name');
pipeline.get('user:3:name');
pipeline.incr('page:views');
const results = await pipeline.exec();
// results = [[null, 'Alice'], [null, 'Bob'], [null, 'Charlie'], [null, 42]]
```

### Cluster Mode

```typescript
import Redis from 'ioredis';

const cluster = new Redis.Cluster([
  { host: 'node1.redis.example.com', port: 6379 },
  { host: 'node2.redis.example.com', port: 6379 },
  { host: 'node3.redis.example.com', port: 6379 },
], {
  redisOptions: { password: 'secret' },
  scaleReads: 'slave', // read from replicas
  natMap: {},          // NAT mapping if needed
});
```

### Singleton Pattern

```typescript
// lib/redis.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!);
  }
  return redis;
}
```

## Docker & Production

### docker-compose.yml

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

volumes:
  redis-data:
```

### redis.conf Key Settings

```conf
# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru        # evict least recently used keys when full
# Options: noeviction, allkeys-lru, volatile-lru, allkeys-random, volatile-ttl, allkeys-lfu

# Security
requirepass your-strong-password
# bind 127.0.0.1                    # uncomment in production to restrict access
protected-mode yes

# Persistence — RDB (snapshots)
save 900 1                           # snapshot if 1+ keys changed in 900s
save 300 10                          # snapshot if 10+ keys changed in 300s
save 60 10000                        # snapshot if 10000+ keys changed in 60s
dbfilename dump.rdb
dir /data

# Persistence — AOF (append-only log, more durable)
appendonly yes
appendfsync everysec                 # options: always (safest), everysec (recommended), no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Connections
timeout 300                          # close idle clients after 300s
tcp-keepalive 60

# Logging
loglevel notice
```

### Persistence: RDB vs AOF

- **RDB (snapshotting):** Periodic point-in-time snapshots. Fast restarts, but can lose data between snapshots. Good for caching.
- **AOF (append-only file):** Logs every write. More durable (≤1s data loss with `everysec`). Slower restart due to replay. Good for sessions/queues.
- **Both:** Use both for maximum durability. Redis restores from AOF (more complete) when both exist.
- **Neither:** Pure cache, no persistence needed. Set `save ""` and `appendonly no`.

### Redis Sentinel (High Availability)

Sentinel monitors Redis master/replicas and handles automatic failover:

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 },
  ],
  name: 'mymaster', // Sentinel master group name
  password: 'redis-password',
  sentinelPassword: 'sentinel-password',
});
```

### Redis Cluster

- Horizontal scaling — data sharded across 16384 hash slots.
- Minimum 3 master nodes (6 nodes with replicas).
- Multi-key commands (MGET, pipeline) must use same hash slot. Use hash tags: `{user:123}:profile` and `{user:123}:settings` go to same slot.
- Create cluster: `redis-cli --cluster create node1:6379 node2:6379 node3:6379 --cluster-replicas 1`

## Key Gotchas

- **KEYS is O(n) — never use in production.** Use SCAN instead with cursor iteration.
- **A subscribed client is blocked** — it can only run SUBSCRIBE/UNSUBSCRIBE/PSUBSCRIBE/PUNSUBSCRIBE/PING. Use a dedicated connection for pub/sub.
- **Redis is single-threaded** for command execution. Long Lua scripts or large KEYS block everything.
- **SET with EX is atomic.** Don't do separate SET + EXPIRE — the key could expire between the two calls.
- **JSON must be serialized.** Redis stores strings. Always `JSON.stringify()` / `JSON.parse()`.
- **maxmemory-policy matters.** Without it, Redis returns errors when full (`noeviction` default). Set `allkeys-lru` for caches.
- **Connection limits.** Default is 10,000. Monitor with `INFO clients`. Don't create a new connection per request.
- **Key expiration is lazy + active.** Keys may briefly exist after TTL. Don't rely on exact-second expiration for business logic.
- **FLUSHDB/FLUSHALL are destructive and instant.** No confirmation prompt in CLI. Protect with `rename-command FLUSHALL ""` in production.
- **Cluster mode:** multi-key operations require hash tags `{tag}:key` to ensure same slot.
