package service

import (
	"errors"
	"mime/multipart"
	"os"
	"sort"
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

func isSameOrChildPath(targetPath, folderPath string) bool {
	target := normalizePath(targetPath)
	folder := normalizePath(folderPath)
	if target == folder {
		return true
	}
	return strings.HasPrefix(target, folder+"/")
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
	if f.MimeType == "inode/directory" {
		files, err := s.Files.ListByOwner(ownerID)
		if err != nil {
			return err
		}
		var targets []model.File
		for _, item := range files {
			if isSameOrChildPath(item.Filename, f.Filename) {
				targets = append(targets, item)
			}
		}
		sort.Slice(targets, func(i, j int) bool {
			return len(targets[i].Filename) > len(targets[j].Filename)
		})
		for _, item := range targets {
			if err := s.Files.DeleteByIDForOwner(item.ID, ownerID); err != nil {
				return err
			}
			if item.MimeType == "inode/directory" {
				continue
			}
			if err := s.Storage.Delete(item.StoredPath); err != nil && !errors.Is(err, os.ErrNotExist) {
				return err
			}
		}
		return nil
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
	current, err := s.Files.FindByIDForOwner(fileID, ownerID)
	if err != nil {
		return nil, err
	}
	if current.MimeType == "inode/directory" {
		files, err := s.Files.ListByOwner(ownerID)
		if err != nil {
			return nil, err
		}
		oldPrefix := normalizePath(current.Filename)
		newPrefix := normalizePath(name)
		if isSameOrChildPath(newPrefix, oldPrefix) && newPrefix != oldPrefix {
			return nil, gorm.ErrInvalidData
		}
		for _, item := range files {
			if !isSameOrChildPath(item.Filename, oldPrefix) {
				continue
			}
			suffix := strings.TrimPrefix(normalizePath(item.Filename), oldPrefix)
			updatedName := newPrefix + suffix
			if err := s.Files.UpdateFilenameByIDForOwner(item.ID, ownerID, updatedName); err != nil {
				return nil, err
			}
		}
		return s.Files.FindByIDForOwner(fileID, ownerID)
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
