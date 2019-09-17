package middleware

import (
	"net/http"
	"time"

	"github.com/apex/log"
)

// Log middleware
func Log(log log.Interface) Middleware {
	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rw := writer{ResponseWriter: w}
			h.ServeHTTP(&rw, r)
			duration := time.Since(start)
			log.Infof("%s %s %s (%s) %d", r.Proto, r.Method, r.URL.Path, duration, rw.status)
		})
	}
}

type writer struct {
	http.ResponseWriter
	status int
	length int
}

func (w *writer) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *writer) Write(b []byte) (int, error) {
	if w.status == 0 {
		w.status = 200
	}
	n, err := w.ResponseWriter.Write(b)
	w.length += n
	return n, err
}
