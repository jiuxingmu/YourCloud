package handler

import (
	"errors"
	"net/http"
	"os"
	"strconv"
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
	userID := c.MustGet("userID").(uint)
	f, err := h.Files.Upload(userID, fileHeader)
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
