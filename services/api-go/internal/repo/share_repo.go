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

func (r ShareRepo) ListByCreator(creatorID uint) ([]model.Share, error) {
	var shares []model.Share
	if err := r.DB.Where("created_by = ?", creatorID).Order("created_at desc").Find(&shares).Error; err != nil {
		return nil, err
	}
	return shares, nil
}

func (r ShareRepo) FindByIDForCreator(shareID, creatorID uint) (*model.Share, error) {
	var s model.Share
	if err := r.DB.Where("id = ? AND created_by = ?", shareID, creatorID).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r ShareRepo) Save(share *model.Share) error {
	return r.DB.Save(share).Error
}
