package config

import (
	"errors"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DBURL       string
	JWTSecret   string
	StoragePath string
	StorageKind string
	TokenTTLMin int
}

func Load() Config {
	_ = godotenv.Load()
	ttl, _ := strconv.Atoi(getEnv("JWT_TTL_MIN", "1440"))
	return Config{
		Port:        getEnv("PORT", "8080"),
		DBURL:       getEnv("DB_URL", "postgres://yourcloud:yourcloud@localhost:5432/yourcloud?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		StoragePath: getEnv("STORAGE_PATH", "apps/backend-go/uploads"),
		StorageKind: getEnv("STORAGE_PROVIDER", "local"),
		TokenTTLMin: ttl,
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
