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

func normalizePath(path string) string {
	return strings.Trim(strings.ReplaceAll(path, "\\", "/"), "/")
}

func joinFolderAndFilename(folderPath, filename string) string {
	base := strings.TrimSpace(filename)
	folder := normalizePath(folderPath)
	if folder == "" {
		return base
	}
	return folder + "/" + base
}

func (s FileService) Upload(ownerID uint, fh *multipart.FileHeader, folderPath string) (*model.File, error) {
	storedPath, size, err := s.Storage.Save(fh)
	if err != nil {
		return nil, err
	}
	f := &model.File{
		OwnerID:    ownerID,
		Filename:   joinFolderAndFilename(folderPath, fh.Filename),
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
	if f.MimeType == "inode/directory" {
		return nil
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

func (s FileService) CreateFolder(ownerID uint, folderPath string) error {
	path := normalizePath(folderPath)
	if path == "" {
		return gorm.ErrInvalidData
	}
	if err := s.Storage.CreateFolder(path); err != nil {
		return err
	}
	if _, err := s.Files.FindByFilenameForOwner(path, ownerID); err == nil {
		return nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	f := &model.File{
		OwnerID:    ownerID,
		Filename:   path,
		StoredPath: path,
		Size:       0,
		MimeType:   "inode/directory",
	}
	return s.Files.Create(f)
}
