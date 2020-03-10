# PostgreSQL connector

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Connection string parameters](#connection-string-parameters)
  - [`schema`](#schema)
  - [`connection_limit`](#connection_limit)
  - [`host`](#host)
  - [SSL-related parameters](#ssl-related-parameters)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Connection string parameters

### `schema`

Connect to a particular schema inside the specified database. This is set to `public` by default.

### `connection_limit`

The maximum number of connections that should be maintained in the connection pool.

### `host`

Additionally the host can be given as a parameter, typically in cases when connectiong to the database through a unix socket to separate the database name from the database path, such as `postgresql:///dbname?host=/var/run/postgresql`.

### SSL-related parameters

- `sslmode`: `disable`, `require` or `prefer` (optional, default: `prefer`)
- `sslcert`: the path of a PEM certificate file (optional)
- `sslidentity`: the path to the identity file, should point to a PKCS12 certificate database (optional)
- `sslpassword`: the password to open the PKCS12 database (optional)
- `sslaccept`: either `strict` or `accept_invalid_certs`. If strict, the certificate needs to be valid and in the CA certificates. `accept_invalid_certs` accepts any certificate from the server. Defaults to `accept_invalid_certs` to align with
  other postgres clients, like `psql` (optional)
