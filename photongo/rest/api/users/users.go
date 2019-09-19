package users

import (
	"net/http"

	"github.com/apex/log"
	"github.com/jackc/pgx"
)

// New users API
func New(log log.Interface, pg *pgx.Conn) *Controller {
	return &Controller{log, pg}
}

// Controller for users
type Controller struct {
	log log.Interface
	pg  *pgx.Conn
}

// Index lists all the users
func (c *Controller) Index(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("listing users"))
}

// Create a users
func (c *Controller) Create(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("creating users"))
}

// Edit a post
func (c *Controller) Edit(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get(":id")
	w.Write([]byte("editing users: " + id))
}
