package storage

import (
	"fmt"
	"mime/multipart"
	"strings"
)

type Provider interface {
	Save(fileHeader *multipart.FileHeader) (string, int64, error)
	Exists(storedPath string) error
	Name() string
}

type unsupportedProvider struct {
	kind string
}

func (p unsupportedProvider) Save(_ *multipart.FileHeader) (string, int64, error) {
	return "", 0, fmt.Errorf("unsupported storage provider: %s", p.kind)
}

func (p unsupportedProvider) Exists(_ string) error {
	return fmt.Errorf("unsupported storage provider: %s", p.kind)
}

func (p unsupportedProvider) Name() string {
	return p.kind
}

func NewProvider(kind, basePath string) Provider {
	switch strings.ToLower(strings.TrimSpace(kind)) {
	case "", "local":
		return LocalStorage{BasePath: basePath}
	default:
		return unsupportedProvider{kind: kind}
	}
}
