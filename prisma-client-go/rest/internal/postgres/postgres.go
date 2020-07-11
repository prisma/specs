package postgres

import "github.com/jackc/pgx"

// Dial a postgres server
func Dial(url string) (*pgx.Conn, error) {
	cfg, err := pgx.ParseConnectionString(url)
	if err != nil {
		return nil, err
	}
	return pgx.Connect(cfg)
}
