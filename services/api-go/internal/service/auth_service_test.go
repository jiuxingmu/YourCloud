package service

import (
	"testing"
	"yourcloud/backend-go/internal/model"
	"yourcloud/backend-go/internal/repo"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupAuthTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func TestAuthServiceRegisterAndLogin(t *testing.T) {
	db := setupAuthTestDB(t)
	svc := AuthService{Users: repo.UserRepo{DB: db}, JWTSecret: "test-secret", TokenTTLMin: 60}
	if _, err := svc.Register("a@b.com", "pass123"); err != nil {
		t.Fatalf("register failed: %v", err)
	}
	token, _, err := svc.Login("a@b.com", "pass123")
	if err != nil || token == "" {
		t.Fatalf("login failed: %v", err)
	}
}
