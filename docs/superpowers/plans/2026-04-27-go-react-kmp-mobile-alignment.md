# Go Backend + React Web + KMP Mobile Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align docs and backend architecture to the confirmed direction (Go backend, React web, KMP only for mobile) while preserving existing API compatibility.

**Architecture:** Keep `services/api-go` as the single backend runtime, introduce a provider-agnostic storage interface in `internal/storage`, and refactor file service to depend on that interface instead of `LocalStorage` directly. Keep endpoint contracts stable and evolve internals for future COS provider insertion.

**Tech Stack:** Go (Gin, GORM), React + Vite, PostgreSQL, local file storage (current), planned COS adapter (future).

---

## File Structure (Planned Changes)

- Modify: `docs/prd.md` (architecture and scope alignment)
- Modify: `README.md` (stack + roadmap alignment)
- Create: `services/api-go/internal/storage/provider.go` (storage interface + provider selection)
- Modify: `services/api-go/internal/storage/local.go` (implement storage interface)
- Modify: `services/api-go/internal/config/config.go` (storage provider config)
- Modify: `services/api-go/cmd/server/main.go` (wire provider factory)
- Modify: `services/api-go/internal/service/file_service.go` (interface dependency + download by id path)
- Modify: `services/api-go/internal/repo/file_repo.go` (owner-scoped find by id)
- Modify: `services/api-go/internal/handler/file_handler.go` (use service download lookup, unified app errors)
- Modify: `services/api-go/internal/model/models.go` (metadata fields for provider/key/content type)
- Modify: `services/api-go/internal/handler/health_test.go` (if needed for compile changes)
- Create: `services/api-go/internal/service/file_service_test.go` (TDD for storage abstraction behavior)

---

### Task 1: Align PRD and README with Confirmed Stack

**Files:**
- Modify: `docs/prd.md`
- Modify: `README.md`
- Test: manual read-through + `rg "Kotlin.*后端|后端采用.*Kotlin" docs/prd.md README.md`

- [ ] **Step 1: Write the failing doc check command**

Run:

```bash
rg "Kotlin.*后端|后端采用.*Kotlin" docs/prd.md README.md
```

Expected: at least one match in `docs/prd.md`.

- [ ] **Step 2: Update PRD architecture language**

Apply edits in `docs/prd.md`:

```markdown
- 后端采用 **Kotlin** 开发。
+ 后端采用 **Go（Gin + GORM）** 开发。

- 客户端采用 **KMP（Kotlin Multiplatform）** 跨平台技术。
+ 移动端采用 **KMP（Kotlin Multiplatform）** 共享业务逻辑；Web 端采用 React 独立实现。
```

- [ ] **Step 3: Update README architecture and roadmap**

Replace and extend sections in `README.md`:

```markdown
## Architecture

- `services/api-go`: Go backend (`Gin + GORM + PostgreSQL`)
- `clients/web`: React frontend (`Vite + TypeScript`)
- `clients/mobile-kmp` (planned): KMP shared domain/data for mobile clients
- `infra/docker-compose.yml`: local PostgreSQL

## Roadmap

- M1 (current): local storage + auth + upload/list/download/share
- M2: storage adapter boundary + file metadata normalization
- M3: COS provider integration + signed upload/download
```

- [ ] **Step 4: Re-run doc check**

Run:

```bash
rg "Kotlin.*后端|后端采用.*Kotlin" docs/prd.md README.md
```

Expected: no matches.

- [ ] **Step 5: Commit docs**

```bash
git add docs/prd.md README.md
git commit -m "docs: align stack to Go backend React web and mobile KMP"
```

---

### Task 2: Introduce Storage Provider Abstraction (TDD)

**Files:**
- Create: `services/api-go/internal/storage/provider.go`
- Modify: `services/api-go/internal/storage/local.go`
- Modify: `services/api-go/internal/config/config.go`
- Test: `services/api-go/internal/service/file_service_test.go` (new test file in next task depends on this interface)

- [ ] **Step 1: Write failing compile test by introducing interface usage in service test skeleton**

Create a placeholder failing test file:

```go
package service

import "testing"

func TestFileService_UsesAbstractStorage(t *testing.T) {}
```

Run:

```bash
cd services/api-go && go test ./internal/service -run TestFileService_UsesAbstractStorage -v
```

Expected: PASS now (skeleton only), establishes test file path.

- [ ] **Step 2: Add storage interface and provider factory contract**

Create `internal/storage/provider.go`:

```go
package storage

import (
	"io"
	"mime/multipart"
)

type Provider interface {
	Save(fileHeader *multipart.FileHeader) (storageKey string, size int64, err error)
	Open(storageKey string) (io.ReadCloser, error)
	Exists(storageKey string) (bool, error)
}

func NewProvider(kind, basePath string) Provider {
	switch kind {
	case "local", "":
		return LocalStorage{BasePath: basePath}
	default:
		return LocalStorage{BasePath: basePath}
	}
}
```

- [ ] **Step 3: Implement interface methods in local storage**

Update `internal/storage/local.go` (add methods, keep Save contract):

```go
func (s LocalStorage) Open(storageKey string) (io.ReadCloser, error) {
	return os.Open(storageKey)
}

func (s LocalStorage) Exists(storageKey string) (bool, error) {
	_, err := os.Stat(storageKey)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}
```

- [ ] **Step 4: Add config for provider kind**

Update `internal/config/config.go`:

```go
type Config struct {
	Port            string
	DBURL           string
	JWTSecret       string
	StoragePath     string
	StorageProvider string
	TokenTTLMin     int
}
```

And in `Load()`:

```go
StorageProvider: getEnv("STORAGE_PROVIDER", "local"),
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
cd services/api-go && go test ./internal/storage ./internal/config -v
```

Expected: PASS.

- [ ] **Step 6: Commit abstraction layer**

```bash
git add services/api-go/internal/storage/provider.go services/api-go/internal/storage/local.go services/api-go/internal/config/config.go
git commit -m "refactor: add storage provider abstraction and config"
```

---

### Task 3: Refactor File Service and Repo for Owner-Scoped Download

**Files:**
- Modify: `services/api-go/internal/service/file_service.go`
- Modify: `services/api-go/internal/repo/file_repo.go`
- Modify: `services/api-go/internal/model/models.go`
- Create: `services/api-go/internal/service/file_service_test.go`
- Test: `services/api-go/internal/service/file_service_test.go`

- [ ] **Step 1: Write failing tests for upload metadata + download lookup**

Create `internal/service/file_service_test.go` with tests like:

```go
func TestFileService_UploadSetsStorageMetadata(t *testing.T) {
	// setup fake repo + fake storage
	// call Upload(ownerID, fileHeader)
	// assert StorageProvider == "local", StorageKey non-empty, Size > 0
}

func TestFileService_GetForDownloadChecksOwnership(t *testing.T) {
	// repo returns file for owner+id
	// storage.Exists returns true
	// assert returns file without error
}
```

Run:

```bash
cd services/api-go && go test ./internal/service -run TestFileService_ -v
```

Expected: FAIL (methods/fields not implemented yet).

- [ ] **Step 2: Add owner-scoped repo lookup**

In `internal/repo/file_repo.go` add:

```go
func (r FileRepo) FindByIDAndOwner(id, ownerID uint) (*model.File, error) {
	var f model.File
	if err := r.DB.Where("id = ? AND owner_id = ?", id, ownerID).First(&f).Error; err != nil {
		return nil, err
	}
	return &f, nil
}
```

- [ ] **Step 3: Extend file model metadata fields**

In `internal/model/models.go` update `File`:

```go
StorageProvider string    `gorm:"size:64;not null;default:local" json:"storageProvider"`
StorageKey      string    `gorm:"size:1024;not null" json:"-"`
ContentType     string    `gorm:"size:255" json:"contentType"`
```

Keep `StoredPath` as a backward-compatible alias field for this iteration, or replace usages with `StorageKey` consistently in service and handler.

- [ ] **Step 4: Refactor file service to depend on abstraction**

Update service struct:

```go
type FileService struct {
	Files   repo.FileRepo
	Storage storage.Provider
}
```

In `Upload`, persist provider metadata:

```go
f := &model.File{
	OwnerID:         ownerID,
	Filename:        fh.Filename,
	StorageProvider: "local",
	StorageKey:      storedPath,
	StoredPath:      storedPath,
	Size:            size,
	ContentType:     fh.Header.Get("Content-Type"),
	MimeType:        fh.Header.Get("Content-Type"),
}
```

Add method:

```go
func (s FileService) GetForDownload(ownerID, fileID uint) (*model.File, error) {
	f, err := s.Files.FindByIDAndOwner(fileID, ownerID)
	if err != nil {
		return nil, err
	}
	ok, err := s.Storage.Exists(f.StorageKey)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, os.ErrNotExist
	}
	return f, nil
}
```

- [ ] **Step 5: Run service tests**

Run:

```bash
cd services/api-go && go test ./internal/service -v
```

Expected: PASS.

- [ ] **Step 6: Commit service/repo/model changes**

```bash
git add services/api-go/internal/service/file_service.go services/api-go/internal/repo/file_repo.go services/api-go/internal/model/models.go services/api-go/internal/service/file_service_test.go
git commit -m "refactor: decouple file service from local storage details"
```

---

### Task 4: Update Handler and Main Wiring to New Storage Provider

**Files:**
- Modify: `services/api-go/internal/handler/file_handler.go`
- Modify: `services/api-go/cmd/server/main.go`
- Test: `services/api-go/internal/handler/health_test.go` + backend package tests

- [ ] **Step 1: Write failing integration compile check**

Run:

```bash
cd services/api-go && go test ./... -run TestHealth -v
```

Expected: FAIL after previous refactors until wiring/handler are updated.

- [ ] **Step 2: Wire provider factory in main**

Update `cmd/server/main.go`:

```go
storageProvider := storage.NewProvider(cfg.StorageProvider, cfg.StoragePath)
fileSvc := service.FileService{Files: fileRepo, Storage: storageProvider}
```

- [ ] **Step 3: Simplify handler download path via service method**

In `internal/handler/file_handler.go`, replace list loop with:

```go
fileID, err := strconv.ParseUint(c.Param("id"), 10, 64)
if err != nil {
	c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid file id"}})
	return
}
f, err := h.Files.GetForDownload(userID, uint(fileID))
if err != nil {
	// map not-found vs internal
}
c.FileAttachment(f.StorageKey, f.Filename)
```

- [ ] **Step 4: Run full backend tests**

Run:

```bash
cd services/api-go && go test ./... -v
```

Expected: PASS.

- [ ] **Step 5: Commit wiring + handler updates**

```bash
git add services/api-go/cmd/server/main.go services/api-go/internal/handler/file_handler.go
git commit -m "refactor: wire configurable storage provider and download lookup"
```

---

### Task 5: Smoke Validation and Final Documentation Check

**Files:**
- Verify only: `README.md`, `docs/prd.md`, backend runtime
- Optional modify: fix any discovered drift in docs

- [ ] **Step 1: Run backend + web smoke commands**

Run:

```bash
./scripts/dev.sh
```

Expected:
- Backend serves `GET /health` with status ok
- Web loads and can upload/list/download with existing flow

- [ ] **Step 2: Verify docs align with code reality**

Run:

```bash
rg "Kotlin.*后端|后端采用.*Kotlin" docs/prd.md README.md
rg "Go backend|React|KMP" docs/prd.md README.md
```

Expected:
- no Kotlin-backend claim remains
- explicit stack alignment exists

- [ ] **Step 3: Final test run**

Run:

```bash
cd services/api-go && go test ./... -v
```

Expected: PASS.

- [ ] **Step 4: Commit final polish**

```bash
git add README.md docs/prd.md services/api-go
git commit -m "feat: align architecture docs and storage abstraction baseline"
```

---

## Self-Review Checklist (Completed in Authoring)

- Spec coverage: each spec section is mapped to at least one task (docs, storage abstraction, service decoupling, compatibility checks).
- Placeholder scan: no TBD/TODO placeholders remain in executable steps.
- Type consistency: uses `storage.Provider`, `StorageProvider`, and `StorageKey` naming consistently across tasks.
