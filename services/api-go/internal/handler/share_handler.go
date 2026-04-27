package handler

import (
	"net/http"
	"strconv"
	"time"
	"yourcloud/backend-go/internal/repo"
	"yourcloud/backend-go/internal/service"

	"github.com/gin-gonic/gin"
)

type ShareHandler struct {
	Shares    service.ShareService
	ShareRepo repo.ShareRepo
	FileRepo  repo.FileRepo
}

type createShareReq struct {
	FileID      uint `json:"fileId"`
	ExpireHours int  `json:"expireHours"`
}

func (h ShareHandler) Create(c *gin.Context) {
	var req createShareReq
	if err := c.ShouldBindJSON(&req); err != nil || req.FileID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid payload"}})
		return
	}
	if req.ExpireHours <= 0 {
		req.ExpireHours = 24
	}
	userID := c.MustGet("userID").(uint)
	s, err := h.Shares.Create(userID, req.FileID, req.ExpireHours)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "forbidden" {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": gin.H{"code": "SHARE_FAILED", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": s})
}

func (h ShareHandler) GetByToken(c *gin.Context) {
	token := c.Param("token")
	s, err := h.ShareRepo.FindByToken(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "share not found"}})
		return
	}
	if s.ExpiresAt != nil && s.ExpiresAt.Before(time.Now()) {
		c.JSON(http.StatusGone, gin.H{"error": gin.H{"code": "EXPIRED", "message": "share expired"}})
		return
	}
	f, err := h.FileRepo.FindByID(s.FileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "file not found"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"token": token, "file": f, "share": gin.H{"id": s.ID, "fileId": s.FileID, "expiresAt": s.ExpiresAt}}})
}

func ParseUintParam(raw string) uint {
	i, _ := strconv.Atoi(raw)
	if i < 0 {
		return 0
	}
	return uint(i)
}
