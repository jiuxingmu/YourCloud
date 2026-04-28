package repo

import (
	"yourcloud/backend-go/internal/model"

	"gorm.io/gorm"
)

type FileRepo struct{ DB *gorm.DB }

func (r FileRepo) Create(file *model.File) error {
	return r.DB.Create(file).Error
}

func (r FileRepo) ListByOwner(ownerID uint) ([]model.File, error) {
	var files []model.File
	err := r.DB.Where("owner_id = ?", ownerID).Order("created_at desc").Find(&files).Error
	return files, err
}

func (r FileRepo) FindByID(id uint) (*model.File, error) {
	var f model.File
	if err := r.DB.First(&f, id).Error; err != nil {
		return nil, err
	}
	return &f, nil
}

func (r FileRepo) FindByIDForOwner(id, ownerID uint) (*model.File, error) {
	var f model.File
	if err := r.DB.Where("id = ? AND owner_id = ?", id, ownerID).First(&f).Error; err != nil {
		return nil, err
	}
	return &f, nil
}

func (r FileRepo) DeleteByIDForOwner(id, ownerID uint) error {
	return r.DB.Where("id = ? AND owner_id = ?", id, ownerID).Delete(&model.File{}).Error
}

func (r FileRepo) UpdateFilenameByIDForOwner(id, ownerID uint, filename string) error {
	return r.DB.Model(&model.File{}).
		Where("id = ? AND owner_id = ?", id, ownerID).
		Update("filename", filename).Error
}

func (r FileRepo) FindByFilenameForOwner(filename string, ownerID uint) (*model.File, error) {
	var f model.File
	if err := r.DB.Where("filename = ? AND owner_id = ?", filename, ownerID).First(&f).Error; err != nil {
		return nil, err
	}
	return &f, nil
}
