package model

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type File struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	OwnerID    uint      `gorm:"index;not null" json:"ownerId"`
	Filename   string    `gorm:"size:255;not null" json:"filename"`
	StoredPath string    `gorm:"size:1024;not null" json:"-"`
	Size       int64     `gorm:"not null" json:"size"`
	MimeType   string    `gorm:"size:255" json:"mimeType"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type Share struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Token     string     `gorm:"uniqueIndex;size:128;not null" json:"token"`
	FileID    uint       `gorm:"index;not null" json:"fileId"`
	CreatedBy uint       `gorm:"index;not null" json:"createdBy"`
	ExpiresAt *time.Time `json:"expiresAt"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}
