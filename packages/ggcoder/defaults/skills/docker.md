---
name: docker
description: Docker — containers, images, compose, volumes, networks, system management
---

You are now equipped with Docker CLI expertise.

## Prerequisites

Ensure Docker is installed and running. Check with `docker --version` and `docker info`.

## Building Images

- Build from Dockerfile: `docker build -t myapp:latest .`
- Specific Dockerfile: `docker build -f Dockerfile.prod -t myapp:prod .`
- With build args: `docker build --build-arg NODE_ENV=production -t myapp:prod .`
- Multi-platform: `docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .`
- List images: `docker images`
- Remove image: `docker rmi myapp:latest`
- Remove dangling images: `docker image prune`
- Remove all unused: `docker image prune -a`

## Running Containers

- Run interactive: `docker run -it node:20-alpine sh`
- Run detached with port mapping: `docker run -d --name myapp -p 3000:3000 myapp:latest`
- With env vars: `docker run -d -e DATABASE_URL=postgres://... myapp:latest`
- With env file: `docker run -d --env-file .env myapp:latest`
- With volume mount: `docker run -d -v $(pwd):/app myapp:latest`

## Container Management

- List running: `docker ps`
- List all (including stopped): `docker ps -a`
- Stop: `docker stop myapp`
- Start: `docker start myapp`
- Restart: `docker restart myapp`
- Remove: `docker rm myapp`
- Force remove running: `docker rm -f myapp`
- Shell into container: `docker exec -it myapp sh`
- View logs: `docker logs -f myapp`
- Last N lines: `docker logs --tail 100 myapp`
- Copy files: `docker cp myapp:/app/data.json ./data.json`

## Docker Compose

- Start all services: `docker compose up -d`
- Start with rebuild: `docker compose up -d --build`
- Start specific service: `docker compose up -d postgres`
- Stop all: `docker compose down`
- Stop and remove volumes (DESTRUCTIVE): `docker compose down -v`
- View logs: `docker compose logs -f api`
- List services: `docker compose ps`
- Shell into service: `docker compose exec api sh`
- Run one-off command: `docker compose run --rm api npm test`
- Build without starting: `docker compose build`
- Pull latest: `docker compose pull`
- Scale: `docker compose up -d --scale worker=3`

## Volumes & Networks

- List volumes: `docker volume ls`
- Create: `docker volume create mydata`
- Remove: `docker volume rm mydata`
- Prune unused: `docker volume prune`
- List networks: `docker network ls`
- Create network: `docker network create mynetwork`

## System Cleanup

- Show disk usage: `docker system df`
- Prune everything: `docker system prune`
- Prune including images and volumes: `docker system prune -a --volumes`

## Key Gotchas

- Always create `.dockerignore` — without it, build copies everything including `node_modules`, `.git`, `.env`.
- Compose v2 is `docker compose` (space). Old `docker-compose` (hyphen) is deprecated.
- `docker compose down -v` removes volumes INCLUDING database data. Only use for clean slate.
- Order Dockerfile for layer caching: `COPY package*.json → RUN npm ci → COPY . .`
- Port conflicts: use `lsof -i :3000` or `docker ps` to find what's using a port.
- Use multi-stage builds for smaller production images.
- Use HEALTHCHECK in Dockerfile for readiness detection.
- Login to registries: `docker login` (Docker Hub), `docker login ghcr.io` (GitHub).
