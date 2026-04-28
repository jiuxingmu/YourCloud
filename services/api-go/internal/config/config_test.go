package config

import "testing"

func TestValidateJWTSecret(t *testing.T) {
	t.Run("rejects empty secret", func(t *testing.T) {
		if err := ValidateJWTSecret(""); err == nil {
			t.Fatalf("expected empty secret to be rejected")
		}
	})

	t.Run("rejects insecure default secret", func(t *testing.T) {
		if err := ValidateJWTSecret("dev-secret"); err == nil {
			t.Fatalf("expected insecure default secret to be rejected")
		}
	})

	t.Run("accepts non-default secret", func(t *testing.T) {
		if err := ValidateJWTSecret("prod-super-secret-123"); err != nil {
			t.Fatalf("expected valid secret to pass, got %v", err)
		}
	})
}
