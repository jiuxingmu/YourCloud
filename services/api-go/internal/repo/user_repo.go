package repo

import (
	"yourcloud/backend-go/internal/model"

	"gorm.io/gorm"
)

type UserRepo struct{ DB *gorm.DB }

func (r UserRepo) Create(user *model.User) error {
	return r.DB.Create(user).Error
}

func (r UserRepo) FindByEmail(email string) (*model.User, error) {
	var u model.User
	if err := r.DB.Where("email = ?", email).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r UserRepo) FindByID(id uint) (*model.User, error) {
	var u model.User
	if err := r.DB.First(&u, id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}
