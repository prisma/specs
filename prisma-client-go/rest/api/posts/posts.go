package posts

import (
	"net/http"

	"github.com/apex/log"
	"github.com/jackc/pgx"
)

// New posts API
func New(log log.Interface, pg *pgx.Conn) *Controller {
	return &Controller{log, pg}
}

// Controller for posts
type Controller struct {
	log log.Interface
	pg  *pgx.Conn
}

// Index lists all the posts
func (c *Controller) Index(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("listing posts"))
}

// Create posts
func (c *Controller) Create(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("creating posts"))
}

// Edit a post
func (c *Controller) Edit(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("editing posts"))
}
