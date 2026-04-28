package service

import (
	"errors"
	"mime/multipart"
	"os"
	"strings"
	"yourcloud/backend-go/internal/model"
	"yourcloud/backend-go/internal/repo"
	"yourcloud/backend-go/internal/storage"

	"gorm.io/gorm"
)

type FileService struct {
	Files   repo.FileRepo
	Storage storage.Provider
}

func (s FileService) Upload(ownerID uint, fh *multipart.FileHeader) (*model.File, error) {
	storedPath, size, err := s.Storage.Save(fh)
	if err != nil {
		return nil, err
	}
	f := &model.File{
		OwnerID:    ownerID,
		Filename:   fh.Filename,
		StoredPath: storedPath,
		Size:       size,
		MimeType:   fh.Header.Get("Content-Type"),
	}
	if err := s.Files.Create(f); err != nil {
		return nil, err
	}
	return f, nil
}

func (s FileService) List(ownerID uint) ([]model.File, error) {
	return s.Files.ListByOwner(ownerID)
}

func (s FileService) FindDownloadByOwner(ownerID, fileID uint) (*model.File, error) {
	return s.Files.FindByIDForOwner(fileID, ownerID)
}

func (s FileService) DeleteByOwner(ownerID, fileID uint) error {
	f, err := s.Files.FindByIDForOwner(fileID, ownerID)
	if err != nil {
		return err
	}
	if err := s.Files.DeleteByIDForOwner(fileID, ownerID); err != nil {
		return err
	}
	if err := s.Storage.Delete(f.StoredPath); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}

func (s FileService) MoveByOwner(ownerID, fileID uint, nextFilename string) (*model.File, error) {
	name := strings.TrimSpace(nextFilename)
	if name == "" {
		return nil, gorm.ErrInvalidData
	}
	if _, err := s.Files.FindByIDForOwner(fileID, ownerID); err != nil {
		return nil, err
	}
	if err := s.Files.UpdateFilenameByIDForOwner(fileID, ownerID, name); err != nil {
		return nil, err
	}
	return s.Files.FindByIDForOwner(fileID, ownerID)
}

func (s FileService) CreateFolder(_ uint, folderPath string) error {
	return s.Storage.CreateFolder(folderPath)
}
