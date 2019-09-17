package api

import (
	"net/http"

	"github.com/apex/log"

	"github.com/bmizerany/pat"
	"github.com/jackc/pgx"
	"github.com/prisma/specs/photongo/rest/api/posts"
	"github.com/prisma/specs/photongo/rest/api/users"
	"github.com/prisma/specs/photongo/rest/internal/env"
	"github.com/prisma/specs/photongo/rest/internal/middleware"
)

// New API
func New(env *env.Env, log log.Interface, pg *pgx.Conn) http.Handler {
	handler := middleware.Compose(middleware.Log(log))
	router := pat.New()

	// users
	users := users.New(log, pg)
	router.Get("/users", http.HandlerFunc(users.Index))
	router.Post("/users", http.HandlerFunc(users.Create))
	router.Post("/users/:id", http.HandlerFunc(users.Edit))

	// posts
	posts := posts.New(log, pg)
	router.Get("/posts", http.HandlerFunc(posts.Index))
	router.Post("/posts", http.HandlerFunc(posts.Create))
	router.Post("/posts/:id", http.HandlerFunc(posts.Edit))

	return handler(router)
}
