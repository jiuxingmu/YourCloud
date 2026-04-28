package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"yourcloud/backend-go/internal/model"
	"yourcloud/backend-go/internal/repo"
	"yourcloud/backend-go/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupShareHandlerTest(t *testing.T) (*gin.Engine, model.File, model.Share) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.File{}, &model.Share{}); err != nil {
		t.Fatalf("migrate db: %v", err)
	}

	file := model.File{OwnerID: 1, Filename: "docs/readme.txt", StoredPath: "/tmp/readme.txt", MimeType: "text/plain", Size: 12}
	if err := db.Create(&file).Error; err != nil {
		t.Fatalf("seed file: %v", err)
	}
	share := model.Share{Token: "token123", FileID: file.ID, CreatedBy: 1, Passcode: "9988"}
	if err := db.Create(&share).Error; err != nil {
		t.Fatalf("seed share: %v", err)
	}

	h := ShareHandler{
		Shares:    service.ShareService{Shares: repo.ShareRepo{DB: db}, Files: repo.FileRepo{DB: db}},
		ShareRepo: repo.ShareRepo{DB: db},
		FileRepo:  repo.FileRepo{DB: db},
	}
	router := gin.New()
	router.GET("/shares/:token", h.GetByToken)
	router.GET("/shares/:token/download", h.DownloadByToken)
	return router, file, share
}

func TestShareHandlerGetByTokenRequiresExtractCode(t *testing.T) {
	router, _, _ := setupShareHandlerTest(t)

	req := httptest.NewRequest(http.MethodGet, "/shares/token123", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 without extract code, got %d", w.Code)
	}
}

func TestShareHandlerGetByTokenWithExtractCode(t *testing.T) {
	router, _, _ := setupShareHandlerTest(t)

	req := httptest.NewRequest(http.MethodGet, "/shares/token123?extractCode=9988", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 with extract code, got %d", w.Code)
	}
}

func TestShareHandlerDownloadByTokenRejectsWrongExtractCode(t *testing.T) {
	router, _, _ := setupShareHandlerTest(t)

	req := httptest.NewRequest(http.MethodGet, "/shares/token123/download?extractCode=wrong", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for wrong extract code, got %d", w.Code)
	}
}
