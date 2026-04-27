package apperror

type AppError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
	Status  int         `json:"-"`
}

func (e AppError) Error() string { return e.Message }

func New(status int, code, message string, details interface{}) AppError {
	return AppError{Status: status, Code: code, Message: message, Details: details}
}
