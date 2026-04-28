# YourCloud

Cloud-drive style MVP built with:

- **Backend:** Go + Gin + GORM + PostgreSQL
- **Frontend:** React + Vite + TypeScript + MUI

---

## Project Structure

- `services/api-go`: API service
- `clients/web`: web client
- `infra/docker-compose.yml`: local PostgreSQL
- `scripts/dev.sh`: one-command local startup (DB + API + Web)

---

## Core Features

- Register / Login (JWT auth)
- File list / upload / download
- Folder creation and drive-style navigation
- Share link creation and share page lookup by token
- Trash, recent, starred views (web)

---

## Run Locally

### Prerequisites

- Docker (for PostgreSQL)
- Go toolchain
- Node.js + npm

### Start everything

```bash
./scripts/dev.sh
```

After startup:

- Web: `http://localhost:8082/`
- Backend: `http://localhost:8080/`

Health check:

```bash
curl http://localhost:8080/health
```

---

## Frontend Test

Run web tests from `clients/web`:

```bash
npm test
```

Run specific test files:

```bash
npm test -- src/App.test.ts src/pages/FilesPage.test.ts
```

---

## API (v1)

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Files

- `POST /api/v1/files`
- `GET /api/v1/files`
- `GET /api/v1/files/:id/download`
- `POST /api/v1/files/folders`
- `DELETE /api/v1/files/:id`
- `PATCH /api/v1/files/:id/move`

### Shares

- `POST /api/v1/shares`
- `GET /api/v1/shares/:token`
- `GET /api/v1/shares/:token/download`

---

## Notes

- Local QA artifacts under `dogfood-output/` are ignored by git.
- Share routes are handled at `/share/:token`; invalid tokens should render share error state in web UI.
