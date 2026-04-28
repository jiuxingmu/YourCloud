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

var ErrInvalidExtractCode = errors.New("invalid extract code")
var ErrShareAlreadyRevoked = errors.New("share already revoked")

type ShareWithFile struct {
	Share    *model.Share `json:"share"`
	FileID   uint         `json:"fileId"`
	Filename string       `json:"filename"`
	MimeType string       `json:"mimeType"`
	ExtractCode string    `json:"extractCode"`
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
	share := &model.Share{Token: newShareToken(), FileID: fileID, CreatedBy: userID, ExpiresAt: expiresAt, Passcode: strings.TrimSpace(passcode)}
	if err := s.Shares.Create(share); err != nil {
		return nil, err
	}
	return share, nil
}

func (s ShareService) ValidateExtractCode(share *model.Share, providedCode string) error {
	if share == nil {
		return errors.New("share not found")
	}
	if strings.TrimSpace(share.Passcode) == "" {
		return nil
	}
	if strings.TrimSpace(providedCode) != strings.TrimSpace(share.Passcode) {
		return ErrInvalidExtractCode
	}
	return nil
}

func (s ShareService) IsInactive(share *model.Share, now time.Time) (bool, string) {
	if share == nil {
		return true, "NOT_FOUND"
	}
	if share.RevokedAt != nil {
		return true, "REVOKED"
	}
	if share.ExpiresAt != nil && share.ExpiresAt.Before(now) {
		return true, "EXPIRED"
	}
	return false, ""
}

func (s ShareService) ListByCreator(creatorID uint) ([]ShareWithFile, error) {
	shares, err := s.Shares.ListByCreator(creatorID)
	if err != nil {
		return nil, err
	}
	result := make([]ShareWithFile, 0, len(shares))
	for _, item := range shares {
		file, fileErr := s.Files.FindByID(item.FileID)
		filename := "[已删除文件]"
		mimeType := ""
		if fileErr == nil {
			filename = file.Filename
			mimeType = file.MimeType
		}
		shareCopy := item
		result = append(result, ShareWithFile{
			Share:    &shareCopy,
			FileID:   item.FileID,
			Filename: filename,
			MimeType: mimeType,
			ExtractCode: strings.TrimSpace(item.Passcode),
		})
	}
	return result, nil
}

func (s ShareService) RevokeByCreator(creatorID, shareID uint) (*model.Share, error) {
	share, err := s.Shares.FindByIDForCreator(shareID, creatorID)
	if err != nil {
		return nil, err
	}
	if share.RevokedAt != nil {
		return nil, ErrShareAlreadyRevoked
	}
	now := time.Now()
	share.RevokedAt = &now
	if err := s.Shares.Save(share); err != nil {
		return nil, err
	}
	return share, nil
}
