# YourCloud

## Overview

YourCloud is an open-source cloud drive for everyone: no speed limits, cross-platform, and built for long-term reliability.  
We believe file access should not be throttled, locked to one platform, or trapped in black-box services.

Our mission is simple:
- Build a cloud drive that is truly usable and maintainable
- Keep everything open and transparent so anyone can contribute
- Make self-hosting first-class, so users and teams own their data

If you are looking for a cloud drive project you can trust, run, and evolve over time, welcome to build it with us.

## Tech Stack

- **Server:** Go, Gin, GORM, PostgreSQL
- **Web:** React, Vite, TypeScript, MUI
- **Local Infra:** Docker (PostgreSQL)
- **Testing:** Vitest (web), Go test (server)

## Build and Run Locally

### 1) Prerequisites

- Docker
- Go
- Node.js + npm

### 2) One-command startup (recommended)

```bash
./scripts/dev.sh
```

After startup:
- Web: `http://localhost:8082/`
- API: `http://localhost:8080/`

Health check:

```bash
curl http://localhost:8080/health
```

### 3) Build separately (optional)

Web:

```bash
cd clients/web
npm install
npm run build
```

Server:

```bash
cd services/api-go
go build ./...
```

### 4) Run tests (optional)

Web:

```bash
cd clients/web
npm test
```

Server:

```bash
cd services/api-go
go test ./...
```

## Progress

### Completed

- Auth: register, login, logout (JWT)
- Files: list, upload, download, delete, move
- Folders: create and hierarchical navigation
- Sharing: create link, token access, extraction code validation, download
- Views (web): recent, starred, trash
- Baseline testing and regression documentation

### Planned

- More clients (Android / iOS / Desktop)
- Richer preview support (for formats like Office)
- Better upload pipeline (multipart upload, resume support)
- Stronger permissions and collaboration features
- Better self-hosting and multi-cloud storage configuration experience
