package service

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
	"yourcloud/backend-go/internal/model"
	"yourcloud/backend-go/internal/repo"
	"yourcloud/backend-go/internal/storage"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestFileServiceFindDownloadByOwner(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.File{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	ownerFile := &model.File{
		OwnerID:    1,
		Filename:   "a.txt",
		StoredPath: "apps/backend-go/uploads/a.txt",
		Size:       1,
	}
	if err := db.Create(ownerFile).Error; err != nil {
		t.Fatalf("seed file: %v", err)
	}

	svc := FileService{
		Files:   repo.FileRepo{DB: db},
		Storage: storage.LocalStorage{BasePath: "apps/backend-go/uploads"},
	}

	got, err := svc.FindDownloadByOwner(1, ownerFile.ID)
	if err != nil {
		t.Fatalf("find download by owner: %v", err)
	}
	if got.ID != ownerFile.ID {
		t.Fatalf("expected file id %d got %d", ownerFile.ID, got.ID)
	}

	_, err = svc.FindDownloadByOwner(2, ownerFile.ID)
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("expected record not found for non-owner, got %v", err)
	}
}

func TestFileServiceCreateFolder(t *testing.T) {
	basePath := t.TempDir()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.File{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	svc := FileService{
		Files:   repo.FileRepo{DB: db},
		Storage: storage.LocalStorage{BasePath: basePath},
	}

	created, err := svc.CreateFolder(1, "projects/demo")
	if err != nil {
		t.Fatalf("create folder: %v", err)
	}
	if created == nil || created.Filename != "projects/demo" {
		t.Fatalf("expected created folder metadata, got %#v", created)
	}

	if _, err := os.Stat(filepath.Join(basePath, "projects/demo")); err != nil {
		t.Fatalf("expected folder created: %v", err)
	}

	saved, err := svc.Files.FindByFilenameForOwner("projects/demo", 1)
	if err != nil {
		t.Fatalf("expected folder persisted in db: %v", err)
	}
	if saved.MimeType != "inode/directory" {
		t.Fatalf("expected directory mime type, got %s", saved.MimeType)
	}

	if _, err := svc.CreateFolder(1, "../escape"); err == nil {
		t.Fatalf("expected invalid folder path error")
	}
}

func TestFileServiceMoveByOwnerRenamesFolderDescendants(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.File{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	items := []model.File{
		{OwnerID: 1, Filename: "projects", StoredPath: "projects", MimeType: "inode/directory"},
		{OwnerID: 1, Filename: "projects/spec.md", StoredPath: "/tmp/spec.md", MimeType: "text/markdown"},
		{OwnerID: 1, Filename: "projects/design/mock.png", StoredPath: "/tmp/mock.png", MimeType: "image/png"},
		{OwnerID: 1, Filename: "projects-legacy/keep.txt", StoredPath: "/tmp/keep.txt", MimeType: "text/plain"},
	}
	for i := range items {
		if err := db.Create(&items[i]).Error; err != nil {
			t.Fatalf("seed file %d: %v", i, err)
		}
	}

	svc := FileService{
		Files:   repo.FileRepo{DB: db},
		Storage: storage.LocalStorage{BasePath: t.TempDir()},
	}

	moved, err := svc.MoveByOwner(1, items[0].ID, "archives")
	if err != nil {
		t.Fatalf("move folder: %v", err)
	}
	if moved.Filename != "archives" {
		t.Fatalf("expected renamed folder path, got %s", moved.Filename)
	}

	expectPath := func(id uint, want string) {
		got, err := svc.Files.FindByIDForOwner(id, 1)
		if err != nil {
			t.Fatalf("find file %d: %v", id, err)
		}
		if got.Filename != want {
			t.Fatalf("file %d expected %s got %s", id, want, got.Filename)
		}
	}
	expectPath(items[1].ID, "archives/spec.md")
	expectPath(items[2].ID, "archives/design/mock.png")
	expectPath(items[3].ID, "projects-legacy/keep.txt")
}

func TestFileServiceDeleteByOwnerDeletesFolderDescendants(t *testing.T) {
	basePath := t.TempDir()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.File{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	files := []model.File{
		{OwnerID: 1, Filename: "docs", StoredPath: "docs", MimeType: "inode/directory"},
		{OwnerID: 1, Filename: "docs/readme.txt", StoredPath: filepath.Join(basePath, "docs/readme.txt"), MimeType: "text/plain"},
		{OwnerID: 1, Filename: "docs/sub/image.png", StoredPath: filepath.Join(basePath, "docs/sub/image.png"), MimeType: "image/png"},
		{OwnerID: 1, Filename: "docs-archive/keep.txt", StoredPath: filepath.Join(basePath, "docs-archive/keep.txt"), MimeType: "text/plain"},
	}
	for i := range files {
		if err := db.Create(&files[i]).Error; err != nil {
			t.Fatalf("seed file %d: %v", i, err)
		}
	}
	for _, path := range []string{files[1].StoredPath, files[2].StoredPath, files[3].StoredPath} {
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatalf("mkdir for %s: %v", path, err)
		}
		if err := os.WriteFile(path, []byte("x"), 0o644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}

	svc := FileService{
		Files:   repo.FileRepo{DB: db},
		Storage: storage.LocalStorage{BasePath: basePath},
	}

	if err := svc.DeleteByOwner(1, files[0].ID); err != nil {
		t.Fatalf("delete folder: %v", err)
	}

	for _, id := range []uint{files[0].ID, files[1].ID, files[2].ID} {
		if _, err := svc.Files.FindByIDForOwner(id, 1); !errors.Is(err, gorm.ErrRecordNotFound) {
			t.Fatalf("expected file %d removed, got err=%v", id, err)
		}
	}
	if _, err := svc.Files.FindByIDForOwner(files[3].ID, 1); err != nil {
		t.Fatalf("expected unrelated file to remain, got %v", err)
	}
	for _, path := range []string{files[1].StoredPath, files[2].StoredPath} {
		if _, err := os.Stat(path); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("expected %s removed from storage, err=%v", path, err)
		}
	}
	if _, err := os.Stat(files[3].StoredPath); err != nil {
		t.Fatalf("expected unrelated file data to remain, got %v", err)
	}
}

func TestFileServiceMoveByOwnerRejectsMovingFolderIntoOwnDescendant(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.File{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	items := []model.File{
		{OwnerID: 1, Filename: "projects", StoredPath: "projects", MimeType: "inode/directory"},
		{OwnerID: 1, Filename: "projects/spec.md", StoredPath: "/tmp/spec.md", MimeType: "text/markdown"},
	}
	for i := range items {
		if err := db.Create(&items[i]).Error; err != nil {
			t.Fatalf("seed file %d: %v", i, err)
		}
	}

	svc := FileService{
		Files:   repo.FileRepo{DB: db},
		Storage: storage.LocalStorage{BasePath: t.TempDir()},
	}

	_, err = svc.MoveByOwner(1, items[0].ID, "projects/sub")
	if !errors.Is(err, gorm.ErrInvalidData) {
		t.Fatalf("expected invalid data error when moving folder into own descendant, got %v", err)
	}
}

func TestFileServiceMoveByOwnerRejectsSamePath(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.File{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	item := model.File{OwnerID: 1, Filename: "docs/readme.md", StoredPath: "/tmp/readme.md", MimeType: "text/markdown"}
	if err := db.Create(&item).Error; err != nil {
		t.Fatalf("seed file: %v", err)
	}

	svc := FileService{
		Files:   repo.FileRepo{DB: db},
		Storage: storage.LocalStorage{BasePath: t.TempDir()},
	}

	_, err = svc.MoveByOwner(1, item.ID, "docs/readme.md")
	if !errors.Is(err, gorm.ErrInvalidData) {
		t.Fatalf("expected invalid data for same-path move, got %v", err)
	}
}
