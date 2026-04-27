package config

import (
	"os"
	"strconv"

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
		JWTSecret:   getEnv("JWT_SECRET", "dev-secret"),
		StoragePath: getEnv("STORAGE_PATH", "apps/backend-go/uploads"),
		StorageKind: getEnv("STORAGE_PROVIDER", "local"),
		TokenTTLMin: ttl,
	}
}

func getEnv(k, fallback string) string {
	v := os.Getenv(k)
	if v == "" {
		return fallback
	}
	return v
}
