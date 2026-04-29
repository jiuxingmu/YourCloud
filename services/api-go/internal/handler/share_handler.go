package handler

import (
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"yourcloud/backend-go/internal/preview"
	"yourcloud/backend-go/internal/repo"
	"yourcloud/backend-go/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ShareHandler struct {
	Shares    service.ShareService
	ShareRepo repo.ShareRepo
	FileRepo  repo.FileRepo
}

func trustedBaseURL(c *gin.Context) string {
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	if forwardedProto := strings.TrimSpace(c.GetHeader("X-Forwarded-Proto")); forwardedProto != "" {
		scheme = forwardedProto
	}
	return scheme + "://" + c.Request.Host
}

type createShareReq struct {
	FileID      uint `json:"fileId"`
	ExpireHours int  `json:"expireHours"`
	ExtractCode string `json:"extractCode"`
}

func (h ShareHandler) Create(c *gin.Context) {
	var req createShareReq
	if err := c.ShouldBindJSON(&req); err != nil || req.FileID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid payload"}})
		return
	}
	if req.ExpireHours < 0 {
		req.ExpireHours = 72
	}
	userID := c.MustGet("userID").(uint)
	extractCode := strings.TrimSpace(req.ExtractCode)
	s, err := h.Shares.CreateWithOptions(userID, req.FileID, req.ExpireHours, extractCode)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "forbidden" {
			status = http.StatusForbidden
		}
		if errors.Is(err, service.ErrWeakExtractCode) {
			c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "EXTRACT_CODE_INVALID", "message": err.Error()}})
			return
		}
		c.JSON(status, gin.H{"error": gin.H{"code": "SHARE_FAILED", "message": err.Error()}})
		return
	}
	baseURL := trustedBaseURL(c)
	c.JSON(http.StatusCreated, gin.H{"data": gin.H{
		"token":       s.Token,
		"url":         baseURL + "/share/" + s.Token,
		"expiresAt":   s.ExpiresAt,
		"extractCode": extractCode,
	}})
}

func (h ShareHandler) GetByToken(c *gin.Context) {
	token := c.Param("token")
	extractCode := strings.TrimSpace(c.Query("extractCode"))
	s, err := h.ShareRepo.FindByToken(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "share not found"}})
		return
	}
	if err := (service.ShareService{}).ValidateExtractCode(s, extractCode); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "EXTRACT_CODE_INVALID", "message": "extract code invalid"}})
		return
	}
	if inactive, code := h.Shares.IsInactive(s, time.Now()); inactive {
		message := "share expired"
		if code == "REVOKED" {
			message = "share revoked"
		}
		c.JSON(http.StatusGone, gin.H{"error": gin.H{"code": code, "message": message}})
		return
	}
	f, err := h.FileRepo.FindByID(s.FileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file not found"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"token": token, "file": f, "share": gin.H{"id": s.ID, "fileId": s.FileID, "expiresAt": s.ExpiresAt}}})
}

func (h ShareHandler) DownloadByToken(c *gin.Context) {
	token := c.Param("token")
	extractCode := strings.TrimSpace(c.Query("extractCode"))
	s, err := h.ShareRepo.FindByToken(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "share not found"}})
		return
	}
	if err := (service.ShareService{}).ValidateExtractCode(s, extractCode); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "EXTRACT_CODE_INVALID", "message": "extract code invalid"}})
		return
	}
	if inactive, code := h.Shares.IsInactive(s, time.Now()); inactive {
		message := "share expired"
		if code == "REVOKED" {
			message = "share revoked"
		}
		c.JSON(http.StatusGone, gin.H{"error": gin.H{"code": code, "message": message}})
		return
	}
	f, err := h.FileRepo.FindByID(s.FileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file not found"}})
		return
	}
	if _, err := os.Stat(f.StoredPath); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file data missing"}})
		return
	}
	if f.MimeType != "" {
		c.Header("Content-Type", f.MimeType)
	}
	c.FileAttachment(f.StoredPath, f.Filename)
}

func (h ShareHandler) ThumbnailByToken(c *gin.Context) {
	token := c.Param("token")
	extractCode := strings.TrimSpace(c.Query("extractCode"))
	s, err := h.ShareRepo.FindByToken(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "share not found"}})
		return
	}
	if err := (service.ShareService{}).ValidateExtractCode(s, extractCode); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "EXTRACT_CODE_INVALID", "message": "extract code invalid"}})
		return
	}
	if inactive, code := h.Shares.IsInactive(s, time.Now()); inactive {
		message := "share expired"
		if code == "REVOKED" {
			message = "share revoked"
		}
		c.JSON(http.StatusGone, gin.H{"error": gin.H{"code": code, "message": message}})
		return
	}
	f, err := h.FileRepo.FindByID(s.FileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file not found"}})
		return
	}
	if _, err := os.Stat(f.StoredPath); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file data missing"}})
		return
	}
	out, err := preview.CreateJPEGThumbnail(f.StoredPath, 720, 450)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": gin.H{"code": "NOT_IMAGE", "message": "thumbnail only supports images"}})
		return
	}
	c.Header("Cache-Control", "public, max-age=86400")
	c.Data(http.StatusOK, "image/jpeg", out)
}

func ParseUintParam(raw string) uint {
	i, _ := strconv.Atoi(raw)
	if i < 0 {
		return 0
	}
	return uint(i)
}

func (h ShareHandler) ListMine(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	items, err := h.Shares.ListByCreator(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "SHARE_LIST_FAILED", "message": "list shares failed"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h ShareHandler) RevokeMine(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	shareID := ParseUintParam(c.Param("id"))
	if shareID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid share id"}})
		return
	}
	share, err := h.Shares.RevokeByCreator(userID, shareID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "share not found"}})
			return
		}
		if errors.Is(err, service.ErrShareAlreadyRevoked) {
			c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "ALREADY_REVOKED", "message": "share already revoked"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "REVOKE_FAILED", "message": "revoke failed"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": share})
}
