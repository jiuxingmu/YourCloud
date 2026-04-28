package service

import (
	"errors"
	"strings"
	"time"
	"yourcloud/backend-go/internal/model"
	"yourcloud/backend-go/internal/repo"

	"github.com/google/uuid"
)

type ShareService struct {
	Shares repo.ShareRepo
	Files  repo.FileRepo
}

func newShareToken() string {
	return strings.ReplaceAll(uuid.NewString(), "-", "")
}

func (s ShareService) Create(userID, fileID uint, expireHours int) (*model.Share, error) {
	f, err := s.Files.FindByID(fileID)
	if err != nil {
		return nil, errors.New("file not found")
	}
	if f.OwnerID != userID {
		return nil, errors.New("forbidden")
	}
	t := time.Now().Add(time.Duration(expireHours) * time.Hour)
	share := &model.Share{Token: newShareToken(), FileID: fileID, CreatedBy: userID, ExpiresAt: &t}
	if err := s.Shares.Create(share); err != nil {
		return nil, err
	}
	return share, nil
}

func (s ShareService) CreateWithOptions(userID, fileID uint, expireHours int, passcode string) (*model.Share, error) {
	f, err := s.Files.FindByID(fileID)
	if err != nil {
		return nil, errors.New("file not found")
	}
	if f.OwnerID != userID {
		return nil, errors.New("forbidden")
	}
	var expiresAt *time.Time
	if expireHours > 0 {
		t := time.Now().Add(time.Duration(expireHours) * time.Hour)
		expiresAt = &t
	}
	share := &model.Share{Token: newShareToken(), FileID: fileID, CreatedBy: userID, ExpiresAt: expiresAt, Passcode: passcode}
	if err := s.Shares.Create(share); err != nil {
		return nil, err
	}
	return share, nil
}
