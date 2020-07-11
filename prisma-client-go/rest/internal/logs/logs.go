package logs

import (
	"net/http"

	"github.com/apex/log"
)

// Interface alias
type Interface = log.Interface

// Handler alias
type Handler = log.Handler

// Info logger
func Info(handler Handler) *Log {
	return &Log{
		Interface: &log.Logger{
			Level:   log.InfoLevel,
			Handler: handler,
		},
	}
}

// Error logger
func Error(handler Handler) *Log {
	return &Log{
		Interface: &log.Logger{
			Level:   log.ErrorLevel,
			Handler: handler,
		},
	}
}

// Log struct
type Log struct {
	log.Interface
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
