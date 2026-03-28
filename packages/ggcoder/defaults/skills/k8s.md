---
name: k8s
description: Kubernetes — deployments, services, pods, ingress, configmaps, secrets, and kubectl operations
---

You are now equipped with Kubernetes and kubectl expertise.

## Prerequisites

Ensure `kubectl` is installed. Check with `kubectl version --client`. Ensure you have a valid kubeconfig at `~/.kube/config` or set via `KUBECONFIG` env var. Verify cluster connectivity with `kubectl cluster-info`.

## kubectl Basics

### Context & Namespace

- List contexts: `kubectl config get-contexts`
- Current context: `kubectl config current-context`
- Switch context: `kubectl config use-context my-cluster`
- Set default namespace for context: `kubectl config set-context --current --namespace=my-namespace`
- Override namespace per-command: `kubectl get pods -n kube-system`
- View entire kubeconfig: `kubectl config view`

### Core Commands

- List resources: `kubectl get pods`, `kubectl get svc`, `kubectl get deploy`, `kubectl get all`
- Wide output with IPs/nodes: `kubectl get pods -o wide`
- YAML output: `kubectl get pod my-pod -o yaml`
- JSON output: `kubectl get pod my-pod -o json`
- Custom columns: `kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase`
- Watch for changes: `kubectl get pods -w`
- All namespaces: `kubectl get pods -A`
- Describe (detailed info + events): `kubectl describe pod my-pod`
- Apply manifest: `kubectl apply -f deployment.yaml`
- Apply entire directory: `kubectl apply -f ./k8s/`
- Apply from URL: `kubectl apply -f https://raw.githubusercontent.com/...`
- Delete resource: `kubectl delete pod my-pod`
- Delete from manifest: `kubectl delete -f deployment.yaml`
- Dry run (client-side): `kubectl apply -f deployment.yaml --dry-run=client`
- Dry run (server-side validation): `kubectl apply -f deployment.yaml --dry-run=server`
- Generate YAML without applying: `kubectl create deployment nginx --image=nginx --dry-run=client -o yaml`

### Logs & Debugging

- View logs: `kubectl logs my-pod`
- Follow logs: `kubectl logs -f my-pod`
- Logs for specific container: `kubectl logs my-pod -c my-container`
- Previous container logs (after crash): `kubectl logs my-pod --previous`
- Last N lines: `kubectl logs my-pod --tail=100`
- Logs since time: `kubectl logs my-pod --since=1h`
- Exec into pod: `kubectl exec -it my-pod -- /bin/sh`
- Exec into specific container: `kubectl exec -it my-pod -c my-container -- /bin/sh`
- Run one-off command: `kubectl exec my-pod -- cat /etc/config/app.conf`
- Port forward to pod: `kubectl port-forward pod/my-pod 8080:80`
- Port forward to service: `kubectl port-forward svc/my-service 8080:80`
- Copy file from pod: `kubectl cp my-pod:/app/data.json ./data.json`
- Copy file to pod: `kubectl cp ./config.yaml my-pod:/app/config.yaml`
- Top (CPU/memory) for pods: `kubectl top pods`
- Top for nodes: `kubectl top nodes`
- View events: `kubectl get events --sort-by=.metadata.creationTimestamp`

### Labels & Selectors

- List pods with label: `kubectl get pods -l app=myapp`
- List pods with multiple labels: `kubectl get pods -l app=myapp,env=prod`
- Add label: `kubectl label pod my-pod version=v1`
- Remove label: `kubectl label pod my-pod version-`
- Show labels: `kubectl get pods --show-labels`

## Pods

### Basic Pod Spec

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  labels:
    app: myapp
spec:
  containers:
    - name: app
      image: node:20-alpine
      ports:
        - containerPort: 3000
      resources:
        requests:
          cpu: "100m"
          memory: "128Mi"
        limits:
          cpu: "500m"
          memory: "512Mi"
      env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
```

### Multi-Container Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-container
spec:
  containers:
    - name: app
      image: myapp:latest
      ports:
        - containerPort: 3000
    - name: sidecar-logger
      image: fluentd:latest
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app
  volumes:
    - name: shared-logs
      emptyDir: {}
```

### Init Containers

Init containers run to completion before app containers start. Use for setup tasks like DB migrations or waiting for dependencies.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-init
spec:
  initContainers:
    - name: wait-for-db
      image: busybox:1.36
      command:
        - sh
        - -c
        - |
          until nc -z postgres-service 5432; do
            echo "Waiting for postgres..."
            sleep 2
          done
    - name: run-migrations
      image: myapp:latest
      command: ["npm", "run", "migrate"]
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
  containers:
    - name: app
      image: myapp:latest
      ports:
        - containerPort: 3000
```

### Liveness & Readiness Probes

```yaml
containers:
  - name: app
    image: myapp:latest
    ports:
      - containerPort: 3000
    # Readiness — when to send traffic to this pod
    readinessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 10
      failureThreshold: 3
    # Liveness — when to restart the container
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 15
      periodSeconds: 20
      failureThreshold: 3
    # Startup — for slow-starting containers (disables liveness/readiness until it passes)
    startupProbe:
      httpGet:
        path: /health
        port: 3000
      failureThreshold: 30
      periodSeconds: 10
```

Probe types: `httpGet`, `tcpSocket` (port check), `exec` (run command, 0 = success), `grpc`.

### Restart Policies

- `Always` (default for Deployments) — always restart
- `OnFailure` — restart only on non-zero exit (good for Jobs)
- `Never` — never restart

```yaml
spec:
  restartPolicy: OnFailure
```

## Deployments

### Basic Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: app
          image: myapp:1.0.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
```

### Rolling Update Strategy

```yaml
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1    # At most 1 pod down during update
      maxSurge: 1           # At most 1 extra pod during update
  # OR for destructive updates:
  # strategy:
  #   type: Recreate        # Kill all old pods, then create new ones
```

### Deployment Operations

- Scale: `kubectl scale deployment myapp --replicas=5`
- Update image: `kubectl set image deployment/myapp app=myapp:2.0.0`
- Rollout status: `kubectl rollout status deployment/myapp`
- Rollout history: `kubectl rollout history deployment/myapp`
- Rollback to previous: `kubectl rollout undo deployment/myapp`
- Rollback to specific revision: `kubectl rollout undo deployment/myapp --to-revision=2`
- Pause rollout: `kubectl rollout pause deployment/myapp`
- Resume rollout: `kubectl rollout resume deployment/myapp`
- Restart all pods (rolling): `kubectl rollout restart deployment/myapp`
- Autoscale: `kubectl autoscale deployment myapp --min=2 --max=10 --cpu-percent=80`

## Services

### ClusterIP (default — internal only)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
    - port: 80            # Service port (what other pods connect to)
      targetPort: 3000    # Container port (where traffic is forwarded)
      protocol: TCP
```

DNS: other pods reach this at `myapp-service.default.svc.cluster.local` or just `myapp-service` (same namespace).

### NodePort (expose on every node's IP)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-nodeport
spec:
  type: NodePort
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 3000
      nodePort: 30080     # Optional, range 30000-32767. Omit for auto-assign.
```

Access via `<any-node-ip>:30080`.

### LoadBalancer (cloud provider external LB)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-lb
  annotations:
    # AWS-specific annotations
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 3000
```

### ExternalName (DNS alias to external service)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: my-database.us-east-1.rds.amazonaws.com
```

Pods can connect to `external-db` and it resolves to the RDS endpoint.

### Multi-Port Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
    - name: http
      port: 80
      targetPort: 3000
    - name: metrics
      port: 9090
      targetPort: 9090
```

### Service Discovery

Within the cluster, services are discoverable via DNS:
- Same namespace: `myapp-service` or `myapp-service.default`
- Cross-namespace: `myapp-service.other-namespace.svc.cluster.local`
- Headless service (no ClusterIP, returns pod IPs directly): set `clusterIP: None`

## Ingress

### Basic Ingress (nginx-ingress)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-service
                port:
                  number: 80
```

### Path-Based Routing

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-path-ingress
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  ingressClassName: nginx
  rules:
    - host: example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

### Host-Based Routing

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-host-ingress
spec:
  ingressClassName: nginx
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

### TLS Termination

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-service
                port:
                  number: 80
```

### Common nginx-ingress Annotations

```yaml
annotations:
  nginx.ingress.kubernetes.io/rewrite-target: /          # Rewrite path
  nginx.ingress.kubernetes.io/ssl-redirect: "true"       # Force HTTPS
  nginx.ingress.kubernetes.io/proxy-body-size: "50m"     # Max upload size
  nginx.ingress.kubernetes.io/proxy-read-timeout: "300"  # Backend timeout (seconds)
  nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
  nginx.ingress.kubernetes.io/cors-allow-origin: "*"     # CORS
  nginx.ingress.kubernetes.io/enable-cors: "true"
  nginx.ingress.kubernetes.io/rate-limit: "10"           # Requests per second
  nginx.ingress.kubernetes.io/whitelist-source-range: "10.0.0.0/8"  # IP whitelist
  nginx.ingress.kubernetes.io/affinity: "cookie"         # Sticky sessions
  nginx.ingress.kubernetes.io/websocket-services: "myapp-service"   # WebSocket support
```

## ConfigMaps & Secrets

### ConfigMap — Create

From literal values:
```bash
kubectl create configmap app-config \
  --from-literal=APP_ENV=production \
  --from-literal=LOG_LEVEL=info \
  --from-literal=MAX_CONNECTIONS=100
```

From file:
```bash
kubectl create configmap nginx-config --from-file=nginx.conf
kubectl create configmap app-config --from-file=config/   # All files in directory
```

From manifest:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"
  app.conf: |
    server.port=3000
    server.host=0.0.0.0
    database.pool_size=10
```

### ConfigMap — Use as Env Vars

```yaml
containers:
  - name: app
    image: myapp:latest
    # Inject all keys as env vars
    envFrom:
      - configMapRef:
          name: app-config
    # OR inject specific keys
    env:
      - name: APP_ENVIRONMENT
        valueFrom:
          configMapKeyRef:
            name: app-config
            key: APP_ENV
```

### ConfigMap — Mount as Volume

```yaml
containers:
  - name: app
    image: myapp:latest
    volumeMounts:
      - name: config-volume
        mountPath: /etc/config
        readOnly: true
volumes:
  - name: config-volume
    configMap:
      name: app-config
      # Optional: mount only specific keys
      items:
        - key: app.conf
          path: app.conf    # File will be at /etc/config/app.conf
```

### Secrets — Create

From literal values:
```bash
kubectl create secret generic app-secrets \
  --from-literal=database-url='postgres://user:pass@host:5432/db' \
  --from-literal=api-key='sk-abc123'
```

From file:
```bash
kubectl create secret generic tls-certs \
  --from-file=tls.crt=./server.crt \
  --from-file=tls.key=./server.key
```

From manifest (use `stringData` for plain text, `data` for base64-encoded):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  database-url: "postgres://user:pass@host:5432/db"
  api-key: "sk-abc123"
# OR base64-encoded:
# data:
#   database-url: cG9zdGdyZXM6Ly91c2VyOnBhc3NAaG9zdDo1NDMyL2Ri
#   api-key: c2stYWJjMTIz
```

Encode/decode base64: `echo -n 'my-secret' | base64` / `echo 'bXktc2VjcmV0' | base64 -d`

### Secrets — Use as Env Vars

```yaml
containers:
  - name: app
    image: myapp:latest
    envFrom:
      - secretRef:
          name: app-secrets
    # OR specific keys
    env:
      - name: DATABASE_URL
        valueFrom:
          secretKeyRef:
            name: app-secrets
            key: database-url
```

### Secrets — Mount as Volume

```yaml
containers:
  - name: app
    image: myapp:latest
    volumeMounts:
      - name: secrets-volume
        mountPath: /etc/secrets
        readOnly: true
volumes:
  - name: secrets-volume
    secret:
      secretName: app-secrets
      defaultMode: 0400    # Restrictive file permissions
```

### TLS Secret

```bash
kubectl create secret tls myapp-tls \
  --cert=./tls.crt \
  --key=./tls.key
```

### Docker Registry Secret

```bash
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=myuser \
  --docker-password=ghp_xxxx \
  --docker-email=me@example.com
```

Use in pod: `spec.imagePullSecrets: [{name: regcred}]`

## Namespaces

### Create & Manage

```bash
kubectl create namespace staging
kubectl create namespace production
```

From manifest:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: staging
  labels:
    env: staging
```

- List: `kubectl get namespaces`
- Set default: `kubectl config set-context --current --namespace=staging`
- Delete (DESTRUCTIVE — deletes ALL resources in namespace): `kubectl delete namespace staging`

### Resource Quotas

Limit total resource consumption in a namespace:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: staging
spec:
  hard:
    requests.cpu: "4"
    requests.memory: "8Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
    pods: "20"
    services: "10"
    persistentvolumeclaims: "5"
    configmaps: "20"
    secrets: "20"
```

### Limit Ranges

Set default and max resource constraints per container:

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: staging
spec:
  limits:
    - type: Container
      default:
        cpu: "500m"
        memory: "256Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      max:
        cpu: "2"
        memory: "2Gi"
      min:
        cpu: "50m"
        memory: "64Mi"
```

## Storage

### PersistentVolume (PV)

Cluster-level storage resource (usually provisioned by admin or dynamically):

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  hostPath:
    path: /mnt/data
```

Access modes: `ReadWriteOnce` (RWO), `ReadOnlyMany` (ROX), `ReadWriteMany` (RWX).
Reclaim policies: `Retain` (keep data), `Delete` (remove data), `Recycle` (deprecated).

### PersistentVolumeClaim (PVC)

Namespace-level request for storage:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard    # Must match a StorageClass or PV
```

### StorageClass (Dynamic Provisioning)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs     # Cloud-specific
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

Common provisioners: `kubernetes.io/aws-ebs`, `kubernetes.io/gce-pd`, `kubernetes.io/azure-disk`, `rancher.io/local-path`.

### Using PVC in a Pod

```yaml
containers:
  - name: app
    image: myapp:latest
    volumeMounts:
      - name: data
        mountPath: /app/data
volumes:
  - name: data
    persistentVolumeClaim:
      claimName: app-data
```

### Check Storage

- List PVs: `kubectl get pv`
- List PVCs: `kubectl get pvc`
- List StorageClasses: `kubectl get storageclass`
- Describe PVC (check binding status): `kubectl describe pvc app-data`

## Jobs & CronJobs

### One-Off Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
spec:
  backoffLimit: 3           # Retry up to 3 times on failure
  activeDeadlineSeconds: 300 # Timeout after 5 minutes
  ttlSecondsAfterFinished: 86400  # Clean up job after 24 hours
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: migrate
          image: myapp:latest
          command: ["npm", "run", "migrate"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
```

Run job imperatively: `kubectl create job my-job --image=busybox -- echo "Hello"`

### Parallel Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-process
spec:
  completions: 10     # Total tasks to complete
  parallelism: 3      # Run 3 pods at a time
  backoffLimit: 5
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: worker
          image: myapp:latest
          command: ["npm", "run", "process-batch"]
```

### CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-backup
spec:
  schedule: "0 2 * * *"          # 2:00 AM daily (cron syntax)
  concurrencyPolicy: Forbid       # Don't run if previous still running
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  startingDeadlineSeconds: 600    # Skip if can't start within 10 min
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: myapp:latest
              command: ["npm", "run", "backup"]
              env:
                - name: DATABASE_URL
                  valueFrom:
                    secretKeyRef:
                      name: app-secrets
                      key: database-url
```

Concurrency policies: `Allow` (default — concurrent runs OK), `Forbid` (skip if still running), `Replace` (kill old, start new).

Schedule examples:
- Every 5 minutes: `*/5 * * * *`
- Every hour: `0 * * * *`
- Daily at midnight: `0 0 * * *`
- Monday at 9 AM: `0 9 * * 1`
- First of month: `0 0 1 * *`

Job commands:
- List jobs: `kubectl get jobs`
- List cronjobs: `kubectl get cronjobs`
- Trigger cronjob manually: `kubectl create job --from=cronjob/nightly-backup manual-backup`
- View job logs: `kubectl logs job/db-migrate`

## Helm

### Setup

- Install Helm: check `helm version`
- Add a repo: `helm repo add bitnami https://charts.bitnami.com/bitnami`
- Add ingress-nginx: `helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx`
- Add cert-manager: `helm repo add jetstack https://charts.jetstack.io`
- Update repos: `helm repo update`
- Search charts: `helm search repo bitnami/postgres`
- Search hub: `helm search hub redis`

### Install / Upgrade / Uninstall

```bash
# Install with defaults
helm install my-release bitnami/postgresql

# Install into specific namespace (create if needed)
helm install my-release bitnami/postgresql -n database --create-namespace

# Install with custom values file
helm install my-release bitnami/postgresql -f values.yaml

# Install with inline overrides
helm install my-release bitnami/postgresql \
  --set auth.postgresPassword=secretpass \
  --set primary.persistence.size=20Gi

# Upgrade (apply new values or chart version)
helm upgrade my-release bitnami/postgresql -f values.yaml

# Install or upgrade (idempotent)
helm upgrade --install my-release bitnami/postgresql -f values.yaml

# Uninstall
helm uninstall my-release
helm uninstall my-release -n database

# List releases
helm list
helm list -A    # All namespaces

# Show release status
helm status my-release

# Show release history
helm history my-release

# Rollback
helm rollback my-release 1    # Rollback to revision 1

# Show default values for a chart
helm show values bitnami/postgresql > values.yaml

# Template locally (render without installing)
helm template my-release bitnami/postgresql -f values.yaml
```

### Chart Structure

```
mychart/
├── Chart.yaml          # Chart metadata (name, version, dependencies)
├── values.yaml         # Default values
├── charts/             # Dependency charts
├── templates/          # Kubernetes manifest templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── _helpers.tpl    # Template helpers/partials
│   ├── hpa.yaml
│   └── NOTES.txt       # Post-install message
└── .helmignore         # Files to exclude from packaging
```

### Example values.yaml

```yaml
# values.yaml for a typical app
replicaCount: 3

image:
  repository: myapp
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - myapp.example.com

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

env:
  NODE_ENV: production
  LOG_LEVEL: info
```

## Common Patterns

### Complete Node.js App Deployment

`deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-api
  labels:
    app: node-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: node-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      labels:
        app: node-api
    spec:
      containers:
        - name: api
          image: myregistry/node-api:1.0.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          envFrom:
            - configMapRef:
                name: node-api-config
            - secretRef:
                name: node-api-secrets
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
      imagePullSecrets:
        - name: regcred
```

`service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: node-api-service
spec:
  type: ClusterIP
  selector:
    app: node-api
  ports:
    - port: 80
      targetPort: 3000
```

`ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: node-api-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: node-api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: node-api-service
                port:
                  number: 80
```

`configmap.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: node-api-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "3000"
```

`secrets.yaml`:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: node-api-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgres://user:pass@postgres-service:5432/mydb"
  JWT_SECRET: "super-secret-jwt-key"
  REDIS_URL: "redis://redis-service:6379"
```

Apply all: `kubectl apply -f ./k8s/`

### PostgreSQL StatefulSet

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
spec:
  type: ClusterIP
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_DB
              value: "mydb"
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secrets
                  key: username
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secrets
                  key: password
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          readinessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - postgres
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - postgres
            initialDelaySeconds: 30
            periodSeconds: 30
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
        storageClassName: standard
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secrets
type: Opaque
stringData:
  username: "appuser"
  password: "strong-password-here"
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: node-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: node-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120
```

Requires metrics-server: `kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml`

Check HPA: `kubectl get hpa`

### Python App Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-api
  labels:
    app: python-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: python-api
  template:
    metadata:
      labels:
        app: python-api
    spec:
      containers:
        - name: api
          image: myregistry/python-api:1.0.0
          ports:
            - containerPort: 8000
          command: ["gunicorn"]
          args: ["--bind", "0.0.0.0:8000", "--workers", "4", "app:app"]
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          envFrom:
            - configMapRef:
                name: python-api-config
            - secretRef:
                name: python-api-secrets
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: python-api-service
spec:
  type: ClusterIP
  selector:
    app: python-api
  ports:
    - port: 80
      targetPort: 8000
```

### Debugging with port-forward

```bash
# Forward local port to a pod
kubectl port-forward pod/postgres-0 5432:5432
# Then connect locally: psql -h localhost -p 5432 -U appuser mydb

# Forward local port to a service
kubectl port-forward svc/node-api-service 8080:80
# Then: curl http://localhost:8080/health

# Forward to a deployment (picks a pod)
kubectl port-forward deployment/node-api 8080:3000

# Listen on all interfaces (not just localhost)
kubectl port-forward --address 0.0.0.0 svc/node-api-service 8080:80
```

### Network Policy (restrict pod traffic)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
spec:
  podSelector:
    matchLabels:
      app: node-api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
        - namespaceSelector:
            matchLabels:
              env: production
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:    # Allow DNS
        - namespaceSelector: {}
      ports:
        - protocol: UDP
          port: 53
```

## Key Gotchas

- Always set resource `requests` and `limits`. Without them, a single pod can starve the node.
- `selector.matchLabels` in a Deployment MUST match `template.metadata.labels`. Mismatch = nothing works.
- Secrets are base64-encoded, NOT encrypted. Use `stringData` for readability. Use sealed-secrets or external-secrets for real encryption.
- Ingress requires an ingress controller (e.g., nginx-ingress) to be installed in the cluster. The resource alone does nothing.
- `kubectl apply` is declarative and idempotent. Prefer it over `kubectl create` for repeatable deployments.
- StatefulSets give pods stable names (`postgres-0`, `postgres-1`) and stable storage. Use for databases, not for stateless apps.
- `kubectl delete pod my-pod` in a Deployment just restarts it — the Deployment controller recreates it. Delete the Deployment to truly remove it.
- PVCs are namespace-scoped, PVs are cluster-scoped. Deleting a namespace deletes its PVCs (and potentially data if reclaimPolicy is Delete).
- ConfigMap/Secret updates don't auto-restart pods. Use `kubectl rollout restart deployment/myapp` after updating, or use a hash annotation pattern.
- `imagePullPolicy: Always` is default for `:latest` tag. Use specific version tags in production and `IfNotPresent` to avoid unnecessary pulls.
- HPA requires metrics-server installed. Check with `kubectl get deployment metrics-server -n kube-system`.
- CronJob timezone is the kube-controller-manager timezone (usually UTC). Use `.spec.timeZone` field (v1.27+) for explicit timezone.
- `kubectl port-forward` is for debugging only — it's a single connection, not production traffic.
- Use `--dry-run=server` over `--dry-run=client` for accurate validation against cluster state.
- When debugging pod startup issues, check events: `kubectl describe pod my-pod` (look at Events section at the bottom).
