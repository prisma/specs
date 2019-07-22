- Start Date: 2019-07-10
- RFC PR: (leave this empty)
- Prisma Issue: (leave this empty)

---

<!-- toc -->

- [Philosophy](#philosophy)
  - [Error Format](#error-format)
    - [`error_code`](#error_code)
    - [`error_category`](#error_category)
      - [Different Layers](#different-layers)
    - [`how_to_proceed`](#how_to_proceed)
    - [`best_guess`](#best_guess)
- [Error Handbook](#error-handbook)
  - [Photon JS / Photon Go](#photon-js--photon-go)
    - [Generation: Datamodel Syntax or Semantic Error](#generation-datamodel-syntax-or-semantic-error)
    - [Runtime: Binary built for the wrong platform](#runtime-binary-built-for-the-wrong-platform)
    - [Runtime: Permissions](#runtime-permissions)
    - [Runtime: Connection failed](#runtime-connection-failed)
  - [Query Engine](#query-engine)
    - [`UniqueConstraintViolation: Unique constraint failed: ${field_name}`](#uniqueconstraintviolation-unique-constraint-failed-field_name)
    - [`NullConstraintViolation: Null constraint failed: ${field_name}`](#nullconstraintviolation-null-constraint-failed-field_name)
    - [`RecordDoesNotExist: Record does not exist`](#recorddoesnotexist-record-does-not-exist)
    - [`ColumnDoesNotExist: Column does not exist`](#columndoesnotexist-column-does-not-exist)
    - [`ConnectionError: Error creating a database connection`](#connectionerror-error-creating-a-database-connection)
    - [`QueryError: Error querying the database`](#queryerror-error-querying-the-database)
    - [`InvalidConnectionArguments: The provided arguments are not supported.`](#invalidconnectionarguments-the-provided-arguments-are-not-supported)
    - [`ColumnReadFailure: The column value was different from the model`](#columnreadfailure-the-column-value-was-different-from-the-model)
    - [`FieldCannotBeNull: Field cannot be null: ${field}`](#fieldcannotbenull-field-cannot-be-null-field)
    - [`DomainError`](#domainerror)
    - [`RecordNotFoundForWhere: Record not found`](#recordnotfoundforwhere-record-not-found)
    - [`RelationViolation: Violating a relation ${relation_name} between ${model_a_name} and ${model_b_name}`](#relationviolation-violating-a-relation-relation_name-between-model_a_name-and-model_b_name)
    - [`RecordsNotConnected: The relation ${} has no record for the model {} connected to a record for the model {} on your write path.`](#recordsnotconnected-the-relation--has-no-record-for-the-model--connected-to-a-record-for-the-model--on-your-write-path)
    - [`ConversionError: Conversion error`](#conversionerror-conversion-error)
    - [`DatabaseCreationError: Database creation error: ${error}`](#databasecreationerror-database-creation-error-error)
  - [Migration Engine](#migration-engine)
    - [`DataModelErrors`](#datamodelerrors)
    - [`InitializationError`](#initializationerror)
    - [`Generic`](#generic)
    - [`ConnectorError`](#connectorerror)
    - [`MigrationError`](#migrationerror)
    - [`RollbackFailure`](#rollbackfailure)

<!-- tocstop -->

# Philosophy

Whenever we show an error, we should always show a path forward towards resolution. If we don't know the path forward, we should atleast link to a place to get help.

## Error Format

The format of our error should be the following:

```
${error_code} ${error_category}: ${best_guess}? ${error_message}.

${how_to_proceed}

Stack Trace:

${stack_trace}
```

Here's an example:

```
QE001 ConnectionError: Is postgres running? We couldn't connect to the query engine on postgresql://localhost:5432.

You can find `ConnectionError` documentation here: https://prisma.io/docs/xxx
You can post an question or issue here: https://github.com/prisma/photonjs/issues

Stack Trace:

ConnectorError(QueryError(Error { kind: FromSql, cause: Some(WrongType(Type(Timestamptz))) }\ \ stack backtrace:\ 0: failure::backtrace::internal::InternalBacktrace::new::h84e0252f893b7b0e (0x55a8a0489290)\ 1: failure::backtrace::Backtrace::new::h381a1eb507d04e2c (0x55a8a0489440)\ 2: <sql_connector::error::SqlError as core::convert::From<tokio_postgres::error::Error>>::from::h34ff4340a0dd5b3f (0x55a89febbc67)\ 3: sql_connector::database::postgresql::<impl sql_connector::row::ToSqlRow for tokio_postgres::row::Row>::to_sql_row::convert::h178249b965d8493a (0x55a89fe2686b)\ 4: sql_connector::database::postgresql::<impl sql_connector::row::ToSqlRow for tokio_postgres::row::Row>::to_sql_row::h3875436f09b0556f (0x55a89fe368ff)\ 5: sql_connector::database::postgresql::<impl sql_connector::transactional::Transaction for postgres::transaction::Transaction>::filter::h498f6550aa3967b1 (0x55a89fe9156a)\ 6: <sql_connector::database::postgresql::PostgreSql as sql_connector::transactional::Transactional>::with_transaction::hd5f1950fe91ab7e3 (0x55a89fbe22a8)\ 7: sql_connector::transactional::database_reader::<impl connector::database_reader::DatabaseReader for sql_connector::database::SqlDatabase<T>>::get_related_records::h291c7a1f45dc7434
```

### `error_code`

**required**

A unique error across all the products. Error codes will have a 2 or 3-letter prefix to categorize the error and 3 digits to uniquely identify the error.

| Prefix |      Category      |
| :----: | :----------------: |
|  PJS   |     Photon JS      |
|  PGO   |     Photon Go      |
|   QE   |    Query Engine    |
|   ME   |  Migration Engine  |
|  CPG   | Connector Postgres |
|  CMS   |  Connector MySQL   |
|  CSQ   |  Connector SQLite  |
|  CMG   |  Connector Mongo   |
|  CDD   | Connector DynamoDB |

The error codes will also have a 3-digit number identifying the unique error, starting at 001. As we discover or add more errors, we'll increment this number
(e.g. 002, 003, ...)

### `error_category`

**required**

Is it a connection error? Is it a configuration error? These errors will come from the codebase and will give the error a name. This will help the user identify
what type of error occurred.

#### Different Layers

Errors can bubble up from different layers. Depending on the engineering effort, a breadcrumb of errors would be very helpful. Otherwise the original "deepest"
error in the stack is the most helpful and should be bubbled up unwraped.

|     Layers      |
| :-------------: |
|     Photon      |
|  Query Parser   |
| Query Execution |
|    Connector    |

**TODO**: Rust already wraps errors at each layer. How difficult would it be to have a breadcrumb system?

- e.g. `Photon Error < Connector Error < SQL Connector Error`

### `how_to_proceed`

**required**

Whenever an error occurs, we should always show the user a path out of their current predicament. The more time they spend debugging, the less time they have
building things on top of Prisma and telling their friends about it.

We will try to be as helpful as we can here:

- **required** tell them where they can post a question or create an issue.

  - e.g. "You can post an question or issue here: https://github.com/prisma/photonjs/issues"

- **encouraged** If we have documentation for this error, provide a URL to that documentation

  - e.g. "You can find `ConnectionError` documentation here: https://prisma.io/docs/xxx"

### `best_guess`

**encouraged**

Oftentimes, we have a pretty good guess as to what the problem is. Why not ask the user to double-check their setup?

It should be a question and never be condescending.

- **DO:** "Is Postgres running?"
- **DONT:** "Your Postgres probably isn't runninng"

### `stack_trace`

The stack trace is the raw error from either Typescript or Rust.

Ideally we can clean it up a bit with [clean-stack](https://github.com/sindresorhus/clean-stack) on the Javascript-side. In Rust, we should research or create a
stack trace formatter.

#### Credential Masking

We may see credentials in the stack trace. It's very important that we hide this information. Sensitive information should be hidden with astericks `********`.

# Error Handbook

This is a list of currently known errors. We'll update this list as more error conditions are required

## Photon JS / Photon Go

### Generation: Datamodel Syntax or Semantic Error

### Runtime: Binary built for the wrong platform

This isn't an exhaustive list, but should give you a good idea of what kind of errors you'll encounter if you pass in the wrong binaries

|   Query Engine Binary   |                      OSX                      |                                   ubuntu:latest (w/ `apt install openssl`)                                    |
| :---------------------: | :-------------------------------------------: | :-----------------------------------------------------------------------------------------------------------: |
|         darwin          |                      ok                       |                                 cannot execute binary file: Exec format error                                 |
|       linux-glibc       | cannot execute binary file: Exec format error |                                                      ok                                                       |
| linux-glibc-libssl1.0.1 | cannot execute binary file: Exec format error | error while loading shared libraries: libssl.so.10: cannot open shared object file: No such file or directory |
| linux-glibc-libssl1.0.2 | cannot execute binary file: Exec format error | error while loading shared libraries: libssl.so.10: cannot open shared object file: No such file or directory |
|       linux-musl        | cannot execute binary file: Exec format error | error while loading shared libraries: libssl.so.10: cannot open shared object file: No such file or directory |

### Runtime: Permissions

If the binary isn't an executable (`chmod +x`), then we'll run into `./darwin: Permission denied`. Photon checks for this so it shouldn't really happen.

### Runtime: Connection failed

This shouldn't really happen now without an error from the query engine, but when we start needing to make network requests, we'll need to account for
connection errors.

## Query Engine

Query engine errors will need to be handled by Photon.

### `UniqueConstraintViolation: Unique constraint failed: ${field_name}`

Occurs when SQL returns a unique constraint violation.

```rust
rusqlite::Error::SqliteFailure(
    ffi::Error {
        code: ffi::ErrorCode::ConstraintViolation,
        extended_code: 2067,
    },
    Some(description),
)
```

### `NullConstraintViolation: Null constraint failed: ${field_name}`

Occurs when SQL returns a null constraint violation.

```rust
rusqlite::Error::SqliteFailure(
    ffi::Error {
        code: ffi::ErrorCode::ConstraintViolation,
        extended_code: 1299,
    },
    Some(description),
)
```

### `RecordDoesNotExist: Record does not exist`

Occurs when a query doesn't return any rows.

```rust
rusqlite::Error::QueryReturnedNoRows => SqlError::RecordDoesNotExist,
```

**TODO** I think we should probably rename back to `QueryReturnedNoRows`. `RecordDoesNotExist` implies a single result not existing.

### `ColumnDoesNotExist: Column does not exist`

This can occur if we try pulling a result value from SQL that we didn't request. I don't think this one will happen much (famous last words). It seems like it's
usually a for loop mistake.

```rust
SqlError::ColumnDoesNotExist => ConnectorError::ColumnDoesNotExist,
```

### `ConnectionError: Error creating a database connection`

This error happens when we're unable to connect to the database.

**Connection Pooling Error**

```rust
impl From<r2d2::Error> for SqlError {
    fn from(e: r2d2::Error) -> SqlError {
        SqlError::ConnectionError(e.into())
    }
}
```

**TLS Connection Error**

```rust
#[cfg(feature = "postgresql")]
impl From<native_tls::Error> for SqlError {
    fn from(e: native_tls::Error) -> SqlError {
        SqlError::ConnectionError(e.into())
    }
}
```

### `QueryError: Error querying the database`

Generic query error. This is the fallback if we can't determine what kind of query error was returned.

```rust
e => SqlError::QueryError(e.into()),
```

### `InvalidConnectionArguments: The provided arguments are not supported.`

This can occur when we pass an argument into the connection string that is either invalid or we don't yet support.

```rust
"connection_limit" => {
    let as_int: u32 =  v.parse().map_err(|_|SqlError::InvalidConnectionArguments)?;
    connection_limit = as_int;
}
```

### `ColumnReadFailure: The column value was different from the model`

Serialization has failed.

**TODO** Not sure if this is for serialization, deserialization or both.

```rust
impl From<uuid::parser::ParseError> for SqlError {
    fn from(e: uuid::parser::ParseError) -> SqlError {
        SqlError::ColumnReadFailure(e.into())
    }
}

impl From<uuid::BytesError> for SqlError {
    fn from(e: uuid::BytesError) -> SqlError {
        SqlError::ColumnReadFailure(e.into())
    }
}

impl From<FromUtf8Error> for SqlError {
    fn from(e: FromUtf8Error) -> SqlError {
        SqlError::ColumnReadFailure(e.into())
    }
}
```

### `FieldCannotBeNull: Field cannot be null: ${field}`

Prisma-level null check constraint. This will have some overlap with `NullConstraintViolation`, which comes from the database

```rust
if field.is_required && value.is_null() {
    return Err(SqlError::FieldCannotBeNull {
        field: field.name.clone(),
    });
}
```

### `DomainError`

**TODO** When does this occur?

- Domain::FieldNotFound
- Domain::ScalarFieldNotFound
- Domain::RelationFieldNotFound
- Domain::FieldForRelationNotFound
- Domain::ModelNotFound
- Domain::RelationNotFound
- Domain::ConversionFailure
- Domain::ModelForRelationNotFound

### `RecordNotFoundForWhere: Record not found`

Prisma-level null check constraint. This will have some overlap with `RecordDoesNotExist`, which comes from the database.

```rust
RootWriteQuery::UpsertRecord(ref ups) => match conn.find_id(&ups.where_) {
    Err(_e @ SqlError::RecordNotFoundForWhere { .. }) => Ok(create(conn, &ups.create)?),
    Err(e) => return Err(e.into()),
    Ok(_) => Ok(update(conn, &ups.update)?),
},
```

### `RelationViolation: Violating a relation ${relation_name} between ${model_a_name} and ${model_b_name}`

Prisma-level violation when a write violates a relationship in the schema.

```rust
if self.top_is_create {
    match (p.is_list, p.is_required, c.is_list, c.is_required) {
        (false, true, false, true) => Err(self.relation_violation()),
    }
}
```

### `RecordsNotConnected: The relation ${} has no record for the model {} connected to a record for the model {} on your write path.`

Prisma-level error when you try connecting to a record that doesn't exist

```rust
let child_id = conn
    .find_id_by_parent(Arc::clone(&relation_field), parent_id, record_finder)
    .map_err(|e| match e {
        SqlError::RecordsNotConnected {
            relation_name,
            parent_name,
            parent_where: _,
            child_name,
            child_where,
        }
    }
```

### `ConversionError: Conversion error`

This error can occur while constructing a Prisma 2 Schema

```rust
load_v2_dml_string().inner_map(|dml_string| match datamodel::parse(&dml_string) {
    Err(errors) => Err(PrismaError::ConversionError(errors, dml_string.clone())),
    Ok(dm) => match datamodel::load_configuration(&dml_string) {
        Err(errors) => Err(PrismaError::ConversionError(errors, dml_string.clone())),
        Ok(configuration) => {
            debug!("Loaded Prisma v2 data model.");
            Ok(Some(DatamodelV2Components {
                datamodel: dm,
                data_sources: configuration.datasources,
            }))
        }
    },
})
```

### `DatabaseCreationError: Database creation error: ${error}`

Occurs when you pass in an invalid connection string

```rust
if file_path.exists() && !file_path.is_dir() {
    Sqlite::new(normalized.into(), 10, false)
} else {
    Err(SqlError::DatabaseCreationError(
        "Sqlite data source must point to an existing file.",
    ))
}
```

## Migration Engine

### `DataModelErrors`

This error occurs when there is no datasource in the schema.

```rust
let source = config.datasources.first().ok_or(CommandError::DataModelErrors {
    code: 1000,
    errors: vec!["There is no datasource in the configuration.".to_string()],
})?;
```

### `InitializationError`

**TODO** This doesn't seem to be in use.

### `Generic`

Generic error that can occur in a couple different ways:

**Parsing the schema fails**

```rust
pub fn parse_datamodel(datamodel: &str) -> CommandResult<Datamodel> {
    let result = datamodel::parse_with_formatted_error(&datamodel, "datamodel file, line");
    result.map_err(|e| CommandError::Generic { code: 1001, error: e })
}
```

**TODO** Make this more specific. It seems like all the submodule-specific errors end up getting wrapped into this generic error.

### `ConnectorError`

Connection errors can occur whenever you connect to the database. In the migration engine, this can happen when you initialize the connection or reset the
database.

```rust
fn initialize(&self) -> ConnectorResult<()>;
fn reset(&self) -> ConnectorResult<()>;
pub type ConnectorResult<T> = Result<T, ConnectorError>;
```

### `MigrationError`

Migration errors occur when we detect a destructive change

**TODO** verify

```rust
#[allow(unused, dead_code)]
impl DestructiveChangesChecker<SqlMigration> for SqlDestructiveChangesChecker {
    fn check(&self, database_migration: &SqlMigration) -> Vec<MigrationErrorOrWarning> {
        vec![]
    }
}
```

### `RollbackFailure`

Rollback errors occur when we try to unapply a migration but fail.

```rust
match unapply_result {
    Ok(()) => {
        migration_updates.status = MigrationStatus::RollbackSuccess;
        self.migration_persistence.update(&migration_updates);
        Ok(())
    }
    Err(err) => {
        migration_updates.status = MigrationStatus::RollbackFailure;
        migration_updates.errors = vec![format!("{:?}", err)];
        self.migration_persistence.update(&migration_updates);
        Err(err)
    }
}
```
