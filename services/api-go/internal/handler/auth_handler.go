package handler

import (
	"net/http"
	"strings"
	"yourcloud/backend-go/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct{ Auth service.AuthService }

type authReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h AuthHandler) Register(c *gin.Context) {
	var req authReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid payload"}})
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "email and password are required"}})
		return
	}
	u, err := h.Auth.Register(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": gin.H{"code": "EMAIL_EXISTS", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": gin.H{"id": u.ID, "email": u.Email}})
}

func (h AuthHandler) Login(c *gin.Context) {
	var req authReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "invalid payload"}})
		return
	}
	token, u, err := h.Auth.Login(strings.TrimSpace(strings.ToLower(req.Email)), req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "INVALID_CREDENTIALS", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"token": token, "user": gin.H{"id": u.ID, "email": u.Email}}})
}

func (h AuthHandler) Me(c *gin.Context) {
	userID, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "missing user context"}})
		return
	}

	uid, ok := userID.(uint)
	if !ok || uid == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "UNAUTHORIZED", "message": "invalid user context"}})
		return
	}

	user, err := h.Auth.GetUserByID(uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "user not found"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"id": user.ID, "email": user.Email}})
}
