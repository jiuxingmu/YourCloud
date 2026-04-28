package handler

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
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
	router.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	router.POST("/shares", h.Create)
	router.GET("/shares", h.ListMine)
	router.PATCH("/shares/:id/revoke", h.RevokeMine)
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

func TestShareHandlerCreateIgnoresUntrustedOrigin(t *testing.T) {
	router, file, _ := setupShareHandlerTest(t)
	body := []byte(fmt.Sprintf(`{"fileId":%d,"expireHours":24}`, file.ID))
	req := httptest.NewRequest(http.MethodPost, "/shares", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "https://evil.example")
	req.Host = "api.safe.local"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 when creating share, got %d", w.Code)
	}
	if got := w.Body.String(); got == "" || !strings.Contains(got, "http://api.safe.local/share/") {
		t.Fatalf("expected response url to use request host, got %s", got)
	}
	if strings.Contains(w.Body.String(), "evil.example") {
		t.Fatalf("expected response to ignore untrusted origin, got %s", w.Body.String())
	}
}

func TestShareHandlerListMineAndRevoke(t *testing.T) {
	router, _, share := setupShareHandlerTest(t)

	listReq := httptest.NewRequest(http.MethodGet, "/shares", nil)
	listW := httptest.NewRecorder()
	router.ServeHTTP(listW, listReq)
	if listW.Code != http.StatusOK {
		t.Fatalf("expected 200 for share list, got %d", listW.Code)
	}
	if !strings.Contains(listW.Body.String(), `"id":`) {
		t.Fatalf("expected share list payload, got %s", listW.Body.String())
	}

	revokeReq := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/shares/%d/revoke", share.ID), nil)
	revokeW := httptest.NewRecorder()
	router.ServeHTTP(revokeW, revokeReq)
	if revokeW.Code != http.StatusOK {
		t.Fatalf("expected 200 for revoke, got %d body=%s", revokeW.Code, revokeW.Body.String())
	}

	accessReq := httptest.NewRequest(http.MethodGet, "/shares/token123?extractCode=9988", nil)
	accessW := httptest.NewRecorder()
	router.ServeHTTP(accessW, accessReq)
	if accessW.Code != http.StatusGone {
		t.Fatalf("expected 410 for revoked share, got %d body=%s", accessW.Code, accessW.Body.String())
	}
	if !strings.Contains(accessW.Body.String(), "REVOKED") {
		t.Fatalf("expected REVOKED code after revoke, got %s", accessW.Body.String())
	}
}
