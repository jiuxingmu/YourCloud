package main

import (
	"log"
	"net/http"
	"yourcloud/backend-go/internal/config"
	"yourcloud/backend-go/internal/db"
	"yourcloud/backend-go/internal/handler"
	"yourcloud/backend-go/internal/middleware"
	"yourcloud/backend-go/internal/repo"
	"yourcloud/backend-go/internal/service"
	"yourcloud/backend-go/internal/storage"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	database, err := db.Connect(cfg.DBURL)
	if err != nil {
		log.Fatalf("failed to connect db: %v", err)
	}

	userRepo := repo.UserRepo{DB: database}
	fileRepo := repo.FileRepo{DB: database}
	shareRepo := repo.ShareRepo{DB: database}

	authSvc := service.AuthService{Users: userRepo, JWTSecret: cfg.JWTSecret, TokenTTLMin: cfg.TokenTTLMin}
	fileStorage := storage.NewProvider(cfg.StorageKind, cfg.StoragePath)
	fileSvc := service.FileService{Files: fileRepo, Storage: fileStorage}
	shareSvc := service.ShareService{Shares: shareRepo, Files: fileRepo}

	authHandler := handler.AuthHandler{Auth: authSvc}
	fileHandler := handler.FileHandler{Files: fileSvc}
	shareHandler := handler.ShareHandler{Shares: shareSvc, ShareRepo: shareRepo, FileRepo: fileRepo}

	r := gin.Default()
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": gin.H{"status": "ok"}})
	})

	v1 := r.Group("/api/v1")
	auth := v1.Group("/auth")
	auth.POST("/register", authHandler.Register)
	auth.POST("/login", authHandler.Login)

	v1.GET("/shares/:token", shareHandler.GetByToken)
	v1.GET("/shares/:token/download", shareHandler.DownloadByToken)
	v1.GET("/shares/:token/thumbnail", shareHandler.ThumbnailByToken)

	protected := v1.Group("")
	protected.Use(middleware.Auth(cfg.JWTSecret))
	protected.POST("/files", fileHandler.Upload)
	protected.POST("/files/folders", fileHandler.CreateFolder)
	protected.GET("/files", fileHandler.List)
	protected.GET("/files/:id/download", fileHandler.Download)
	protected.GET("/files/:id/thumbnail", fileHandler.Thumbnail)
	protected.DELETE("/files/:id", fileHandler.Delete)
	protected.PATCH("/files/:id/move", fileHandler.Move)
	protected.POST("/shares", shareHandler.Create)

	log.Printf("backend listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
