package storage

import (
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

type LocalStorage struct {
	BasePath string
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
