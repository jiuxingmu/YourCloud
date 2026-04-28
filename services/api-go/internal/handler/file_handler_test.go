package handler

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"yourcloud/backend-go/internal/model"
	"yourcloud/backend-go/internal/repo"
	"yourcloud/backend-go/internal/service"
	"yourcloud/backend-go/internal/storage"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestFileHandlerCreateFolderReturnsFolderPayload(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.File{}); err != nil {
		t.Fatalf("migrate db: %v", err)
	}

	h := FileHandler{
		Files: service.FileService{
			Files:   repo.FileRepo{DB: db},
			Storage: storage.LocalStorage{BasePath: t.TempDir()},
		},
	}

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.POST("/files/folders", h.CreateFolder)

	req := httptest.NewRequest(http.MethodPost, "/files/folders", bytes.NewBufferString(`{"path":"contracts"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", w.Code, w.Body.String())
	}
	body := w.Body.String()
	if !strings.Contains(body, `"filename":"contracts"`) || !strings.Contains(body, `"mimeType":"inode/directory"`) {
		t.Fatalf("expected folder payload in response, got %s", body)
	}
}
