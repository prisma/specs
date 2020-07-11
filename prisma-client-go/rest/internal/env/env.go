package env

import (
	env "github.com/caarlos0/env"
)

// Env is the CLI environment
type Env struct {
	PostgresURL string `env:"POSTGRES_URL,required"`
}

// Load the CLI environment
func Load() (*Env, error) {
	var e Env
	// parse the environment
	if err := env.Parse(&e); err != nil {
		return nil, err
	}
	return &e, nil
}
