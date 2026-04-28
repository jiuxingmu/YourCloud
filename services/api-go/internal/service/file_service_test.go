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

	if err := svc.CreateFolder(1, "projects/demo"); err != nil {
		t.Fatalf("create folder: %v", err)
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

	if err := svc.CreateFolder(1, "../escape"); err == nil {
		t.Fatalf("expected invalid folder path error")
	}
}
