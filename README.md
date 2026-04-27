# YourCloud

Go + Gin + GORM backend and React + Vite web demo for a cloud-drive style MVP.

## Architecture

- `services/api-go`: Go backend (`Gin + GORM + PostgreSQL`)
- `clients/web`: React frontend (`Vite + TypeScript`)
- `infra/docker-compose.yml`: local PostgreSQL

## Features

- Register / Login (JWT)
- File upload / list / download
- Share link creation and share lookup

## Local run

```bash
./scripts/dev.sh
```

Then open:

- Web: `http://localhost:8082/`
- Backend: `http://localhost:8080/`

## API (v1)

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/files`
- `GET /api/v1/files`
- `GET /api/v1/files/:id/download`
- `POST /api/v1/shares`
- `GET /api/v1/shares/:token`
