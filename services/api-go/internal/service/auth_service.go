package service

import (
	"errors"
	"time"
	"yourcloud/backend-go/internal/model"
	"yourcloud/backend-go/internal/repo"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	Users      repo.UserRepo
	JWTSecret  string
	TokenTTLMin int
}

func (s AuthService) Register(email, password string) (*model.User, error) {
	if _, err := s.Users.FindByEmail(email); err == nil {
		return nil, errors.New("email already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	u := &model.User{Email: email, PasswordHash: string(hash)}
	if err := s.Users.Create(u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s AuthService) Login(email, password string) (string, *model.User, error) {
	u, err := s.Users.FindByEmail(email)
	if err != nil {
		return "", nil, errors.New("invalid credentials")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return "", nil, errors.New("invalid credentials")
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": u.ID,
		"exp": time.Now().Add(time.Duration(s.TokenTTLMin) * time.Minute).Unix(),
	})
	signed, err := token.SignedString([]byte(s.JWTSecret))
	if err != nil {
		return "", nil, err
	}
	return signed, u, nil
}
