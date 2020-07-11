package main

import (
	"net/http"
	"os"

	"github.com/apex/log/handlers/text"
	"github.com/prisma/specs/photongo/rest/api"
	"github.com/prisma/specs/photongo/rest/internal/env"
	"github.com/prisma/specs/photongo/rest/internal/logs"
	"github.com/prisma/specs/photongo/rest/internal/postgres"
)

func main() {
	log := logs.Info(text.New(os.Stderr))
	env, err := env.Load()
	if err != nil {
		log.WithError(err).Fatalf("unable to setup the environment")
	}
	pg, err := postgres.Dial(env.PostgresURL)
	if err != nil {
		log.WithError(err).Fatalf("unable to install postgres")
	}
	api := api.New(env, log, pg)
	log.Info("listening on http://localhost:5000")
	if err := http.ListenAndServe(":5000", api); err != nil {
		log.WithError(err).Fatalf("server died")
	}
}
