# Datasource URLs

The connection information for a datasource is provided through a URL. The specification for the URL is based on either of two approaches:

1. If a given database already defines a connection URL standard the datasource URL is based on this standard. Additional parameters required by the Prisma tool
   suite are added on top of the existing standard.
2. If a given database does not define a connection URL standard the datasource URL is defined as a custom format that is only used by Prisma.

## URLs for SQL Databases

This standard applies for the following providers:

- `postgresql`
- `mysql`
- `sqlite`

All of those mentioned providers define a connection URL standard. Here are the links to the respective documentations:

- [PostgreSQL](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [MySQL](https://dev.mysql.com/doc/refman/8.0/en/connecting-using-uri-or-key-value-pairs.html)
- [SQLite](http://www.sqlite.org/c3ref/open.html)

In addition to those standards the following parameters are defined:

- `connection_limit`: Specifies the maximum amount of connections that may be established to a datasource at a given time.
- `schema`: This parameter is only available for the provider `postgresql`. It specifies the schema which should be used.
