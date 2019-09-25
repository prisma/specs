package middleware

import "net/http"

// Middleware function
type Middleware func(http.Handler) http.Handler

// Compose middleware
func Compose(mm ...Middleware) Middleware {
	return func(h http.Handler) http.Handler {
		if len(mm) == 0 {
			return h
		}
		for i := len(mm) - 1; i >= 0; i-- {
			h = mm[i](h)
		}
		return h
	}
}
