package storage

import (
	"errors"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type LocalStorage struct {
	BasePath string
}

func (s LocalStorage) Name() string {
	return "local"
}

func (s LocalStorage) Exists(storedPath string) error {
	_, err := os.Stat(storedPath)
	return err
}

func (s LocalStorage) Delete(storedPath string) error {
	return os.Remove(storedPath)
}

func (s LocalStorage) CreateFolder(folderPath string) error {
	clean := filepath.Clean(strings.TrimSpace(folderPath))
	if clean == "." || clean == "" || strings.HasPrefix(clean, "..") || filepath.IsAbs(clean) {
		return errors.New("invalid folder path")
	}
	target := filepath.Join(s.BasePath, clean)
	baseClean := filepath.Clean(s.BasePath)
	if !strings.HasPrefix(target, baseClean+string(filepath.Separator)) && target != baseClean {
		return errors.New("invalid folder path")
	}
	return os.MkdirAll(target, 0o755)
}

func (s LocalStorage) Save(fileHeader *multipart.FileHeader) (string, int64, error) {
	if err := os.MkdirAll(s.BasePath, 0o755); err != nil {
		return "", 0, err
	}
	src, err := fileHeader.Open()
	if err != nil {
		return "", 0, err
	}
	defer src.Close()

	name := uuid.NewString() + "_" + filepath.Base(fileHeader.Filename)
	dstPath := filepath.Join(s.BasePath, name)
	dst, err := os.Create(dstPath)
	if err != nil {
		return "", 0, err
	}
	defer dst.Close()

	n, err := io.Copy(dst, src)
	if err != nil {
		return "", 0, err
	}
	return dstPath, n, nil
}
