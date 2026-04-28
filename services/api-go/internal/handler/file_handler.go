package handler

import (
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"yourcloud/backend-go/internal/preview"
	"yourcloud/backend-go/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FileHandler struct {
	Files service.FileService
}

func (h FileHandler) Upload(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "file is required"}})
		return
	}
	targetPath := c.PostForm("path")
	userID := c.MustGet("userID").(uint)
	f, err := h.Files.Upload(userID, fileHeader, targetPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "UPLOAD_FAILED", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": f})
}

func (h FileHandler) List(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	files, err := h.Files.List(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "LIST_FAILED", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": files, "meta": gin.H{"count": len(files)}})
}

func (h FileHandler) Download(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid file id"}})
		return
	}

	f, err := h.Files.FindDownloadByOwner(userID, uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "DOWNLOAD_FAILED", "message": "download failed"}})
		return
	}

	if _, err := os.Stat(f.StoredPath); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file data missing"}})
		return
	}
	c.FileAttachment(f.StoredPath, f.Filename)
}

func (h FileHandler) Thumbnail(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid file id"}})
		return
	}
	f, err := h.Files.FindDownloadByOwner(userID, uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "THUMBNAIL_FAILED", "message": "thumbnail failed"}})
		return
	}
	if _, err := os.Stat(f.StoredPath); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file data missing"}})
		return
	}
	out, err := preview.CreateJPEGThumbnail(f.StoredPath, 400, 260)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": gin.H{"code": "NOT_IMAGE", "message": "thumbnail only supports images"}})
		return
	}
	c.Header("Cache-Control", "public, max-age=86400")
	c.Data(http.StatusOK, "image/jpeg", out)
}

func (h FileHandler) Delete(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid file id"}})
		return
	}
	if err := h.Files.DeleteByOwner(userID, uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "DELETE_FAILED", "message": "delete failed"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"ok": true}})
}

func (h FileHandler) Move(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid file id"}})
		return
	}
	var req struct {
		Filename string `json:"filename"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid request body"}})
		return
	}
	if strings.TrimSpace(req.Filename) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "filename is required"}})
		return
	}
	file, err := h.Files.MoveByOwner(userID, uint(id), req.Filename)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file not found"}})
			return
		}
		if errors.Is(err, gorm.ErrInvalidData) {
			c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "filename is required"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "MOVE_FAILED", "message": "move failed"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": file})
}

func (h FileHandler) CreateFolder(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req struct {
		Path string `json:"path"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid request body"}})
		return
	}
	if strings.TrimSpace(req.Path) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "path is required"}})
		return
	}
	folder, err := h.Files.CreateFolder(userID, req.Path)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "CREATE_FOLDER_FAILED", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": folder})
}
