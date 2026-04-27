package service

import (
	"mime/multipart"
	"yourcloud/backend-go/internal/model"
	"yourcloud/backend-go/internal/repo"
	"yourcloud/backend-go/internal/storage"
)

type FileService struct {
	Files   repo.FileRepo
	Storage storage.LocalStorage
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
