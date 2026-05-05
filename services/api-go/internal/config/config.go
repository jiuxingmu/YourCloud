package config

import (
	"errors"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	DBURL                 string
	JWTSecret             string
	StoragePath           string
	StorageKind           string
	TokenTTLMin           int
	UserStorageQuotaBytes int64 // 0 = unlimited
}

func Load() Config {
	_ = godotenv.Load()
	// Default 7 days (10080 minutes). Override with JWT_TTL_MIN.
	ttl, _ := strconv.Atoi(getEnv("JWT_TTL_MIN", "10080"))
	quota := int64(10 * 1024 * 1024 * 1024) // default 10 GiB per user
	if qStr := strings.TrimSpace(os.Getenv("USER_STORAGE_QUOTA_BYTES")); qStr != "" {
		if q, err := strconv.ParseInt(qStr, 10, 64); err == nil && q >= 0 {
			quota = q
		}
	}
	return Config{
		Port:                  getEnv("PORT", "8080"),
		DBURL:                 getEnv("DB_URL", "postgres://yourcloud:yourcloud@localhost:5432/yourcloud?sslmode=disable"),
		JWTSecret:             getEnv("JWT_SECRET", ""),
		StoragePath:           getEnv("STORAGE_PATH", "apps/backend-go/uploads"),
		StorageKind:           getEnv("STORAGE_PROVIDER", "local"),
		TokenTTLMin:           ttl,
		UserStorageQuotaBytes: quota,
	}
}

func ValidateJWTSecret(secret string) error {
	trimmed := strings.TrimSpace(secret)
	if trimmed == "" {
		return errors.New("JWT_SECRET is required")
	}
	if trimmed == "dev-secret" {
		return errors.New("JWT_SECRET must not use insecure default value")
	}
	return nil
}

func getEnv(k, fallback string) string {
	v := os.Getenv(k)
	if v == "" {
		return fallback
	}
	return v
}
