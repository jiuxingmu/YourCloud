package repo

import (
	"yourcloud/backend-go/internal/model"

	"gorm.io/gorm"
)

type ShareRepo struct{ DB *gorm.DB }

func (r ShareRepo) Create(share *model.Share) error {
	return r.DB.Create(share).Error
}

func (r ShareRepo) FindByToken(token string) (*model.Share, error) {
	var s model.Share
	if err := r.DB.Where("token = ?", token).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}
