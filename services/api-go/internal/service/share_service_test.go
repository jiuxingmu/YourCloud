package service

import (
	"errors"
	"testing"
	"yourcloud/backend-go/internal/model"
	"yourcloud/backend-go/internal/repo"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestShareCreate(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.File{}, &model.Share{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	file := &model.File{OwnerID: 1, Filename: "a.txt", StoredPath: "/tmp/a", Size: 1}
	if err := db.Create(file).Error; err != nil {
		t.Fatalf("seed file: %v", err)
	}
	svc := ShareService{Shares: repo.ShareRepo{DB: db}, Files: repo.FileRepo{DB: db}}
	s, err := svc.Create(1, file.ID, 24)
	if err != nil || s.Token == "" {
		t.Fatalf("create share failed: %v", err)
	}
}

func TestShareValidateExtractCode(t *testing.T) {
	svc := ShareService{}

	noCode := &model.Share{Passcode: ""}
	if err := svc.ValidateExtractCode(noCode, ""); err != nil {
		t.Fatalf("expected no passcode share to allow access, got %v", err)
	}

	withCode := &model.Share{Passcode: "1234"}
	if err := svc.ValidateExtractCode(withCode, "1234"); err != nil {
		t.Fatalf("expected matching extract code to pass, got %v", err)
	}
	if err := svc.ValidateExtractCode(withCode, " 1234 "); err != nil {
		t.Fatalf("expected trimmed extract code to pass, got %v", err)
	}

	err := svc.ValidateExtractCode(withCode, "")
	if !errors.Is(err, ErrInvalidExtractCode) {
		t.Fatalf("expected invalid extract code error, got %v", err)
	}
}

func TestNormalizeExtractCode(t *testing.T) {
	valid, err := NormalizeExtractCode("  Ab12  ")
	if err != nil {
		t.Fatalf("expected valid extract code, got %v", err)
	}
	if valid != "Ab12" {
		t.Fatalf("expected trimmed code Ab12, got %s", valid)
	}

	if _, err := NormalizeExtractCode("1"); !errors.Is(err, ErrWeakExtractCode) {
		t.Fatalf("expected weak extract code error for short code, got %v", err)
	}
	if _, err := NormalizeExtractCode("12 34"); !errors.Is(err, ErrWeakExtractCode) {
		t.Fatalf("expected weak extract code error for invalid chars, got %v", err)
	}
}
