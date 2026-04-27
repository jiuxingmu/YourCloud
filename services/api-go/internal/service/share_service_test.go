package service

import (
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
