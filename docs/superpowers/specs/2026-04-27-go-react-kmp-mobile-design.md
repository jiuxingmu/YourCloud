# YourCloud Alignment Design (Go Backend + React Web + KMP Mobile)

## 1. Background and Goal

This design aligns product docs and implementation direction with confirmed constraints:

- Backend continues with Go (`Gin + GORM`)
- Web continues with React (`Vite + TypeScript`)
- KMP is used only for mobile clients

The objective is to keep shipping on the current codebase while introducing a clean storage abstraction that supports future object storage providers (COS first), without breaking the current MVP flow.

## 2. Scope

### In scope (this cycle)

- Update architecture positioning in docs (`docs/prd.md`, `README.md`)
- Add a backend storage adapter boundary in Go service code
- Keep existing APIs available, with minimal evolution for future direct-upload flow
- Preserve current local-storage behavior as default runtime path

### Out of scope (this cycle)

- Kotlin backend migration
- iOS/Mac/Windows client implementation
- Full COS adapter production integration
- Complex tenant permission model and audit pipeline

## 3. Architecture Decisions

### 3.1 Tech stack baseline

- **Backend**: Go only, service package remains `services/api-go`
- **Web**: React web app remains `clients/web`
- **Mobile**: KMP applies to mobile shared logic only; does not constrain backend implementation language

### 3.2 Storage abstraction policy

Business logic must not depend on provider SDK details. Service code talks only to an abstract storage interface.

Provider selection is driven by config (start with `local`, reserve `cos` in provider enum/factory shape).

### 3.3 Compatibility policy

Existing endpoints stay available:

- `POST /api/v1/files`
- `GET /api/v1/files`
- `GET /api/v1/files/:id/download`

Behavior may be normalized internally, but external contract stays backward-compatible for existing web client.

## 4. Backend Module Design (Go)

### 4.1 Storage layer

Define a storage capability interface in `internal/storage` to cover current and next-step needs:

- store object (upload)
- read/download access (stream or signed URL)
- delete object
- optional signed download generation

`LocalStorage` implements this interface now. Future `COSStorage` implements the same contract.

### 4.2 Service layer

`FileService` depends on storage interface only. It is responsible for:

- ownership checks
- metadata persistence (repository)
- provider-agnostic object key conventions

No provider-specific conditions should leak into handler/controller.

### 4.3 Data model extension

File metadata should support multi-provider evolution with minimal fields:

- `storage_provider`
- `storage_key`
- `content_type`
- `size`

If some fields already exist, standardize usage rather than introducing duplicate columns.

### 4.4 Error model

Use `internal/pkg/apperror` as the single normalized error shape at API boundaries.

Common categories:

- validation error
- unauthorized/forbidden
- resource not found
- storage failure
- internal failure

## 5. API Evolution Plan

### 5.1 Current contract stability

Keep upload/list/download endpoints functional for existing React web app.

### 5.2 Future-ready upload path

Add or reserve request/response shapes that can support direct-to-object-storage upload later (signed policy/temporary upload token), while local mode can still pass through current upload behavior.

### 5.3 Download normalization

Download route should expose a unified behavior (redirect URL or proxied stream), and hide provider differences from clients.

## 6. Documentation Changes

### 6.1 `docs/prd.md`

- Replace Kotlin-backend assumptions with Go backend baseline
- Clarify platform strategy:
  - Web: React
  - Mobile: KMP
  - Backend: Go API for all clients
- Keep COS as default provider target, but document adapter-based storage decoupling

### 6.2 `README.md`

- Update architecture summary to match actual code
- Add phased roadmap:
  - M1: local storage + basic file APIs (current)
  - M2: storage adapter boundary + metadata normalization
  - M3: COS provider integration + signed upload/download flow

## 7. Testing Strategy

### 7.1 Unit tests

- storage interface behavior tests (local implementation)
- file service tests for provider-agnostic behavior
- error mapping tests for handler responses

### 7.2 Regression checks

- auth register/login still work
- file upload/list/download remain compatible with current web flow
- share flow unaffected by storage abstraction changes

## 8. Delivery Plan (Incremental)

1. Doc alignment (`prd`, `README`, this design)
2. Introduce storage interface and provider selection wiring
3. Refactor file service to interface dependency
4. Normalize file metadata fields and mapping
5. Run tests and local smoke checks

## 9. Risks and Mitigations

- **Risk**: Refactor breaks existing upload path  
  **Mitigation**: keep endpoint contracts unchanged and add regression tests

- **Risk**: Schema changes complicate existing data  
  **Mitigation**: prefer backward-compatible nullable fields and phased migration

- **Risk**: Document drift returns later  
  **Mitigation**: tie roadmap milestones in `README` to actual implementation checkpoints

## 10. Acceptance Criteria for This Alignment

- Docs no longer describe Kotlin backend as active implementation target
- Backend architecture description clearly states Go service + storage adapter direction
- Mobile KMP scope is explicit and isolated from backend language choice
- Implementation plan can proceed without architecture contradictions
