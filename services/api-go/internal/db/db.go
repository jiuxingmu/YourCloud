package db

import (
	"yourcloud/backend-go/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(dbURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&model.User{}, &model.File{}, &model.Share{}); err != nil {
		return nil, err
	}
	return db, nil
}
