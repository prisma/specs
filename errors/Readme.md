- Start Date: 2019-07-10
- RFC PR: (leave this empty)
- Prisma Issue: (leave this empty)

---

<!-- toc -->

- [Error Codes](#error-codes)
  - [Currently Known Errors](#currently-known-errors)
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

# Error Codes

## Currently Known Errors

### Query Engine

Query engine errors will need to be handled by Photon.

#### `UniqueConstraintViolation: Unique constraint failed: ${field_name}`

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

#### `NullConstraintViolation: Null constraint failed: ${field_name}`

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

#### `RecordDoesNotExist: Record does not exist`

Occurs when a query doesn't return any rows.

```rust
rusqlite::Error::QueryReturnedNoRows => SqlError::RecordDoesNotExist,
```

**TODO** I think we should probably

#### `ColumnDoesNotExist: Column does not exist`

This can occur if we try pulling a result value from SQL that we didn't request. I don't think this one will happen much (famous last words). It seems like it's
usually a for loop mistake.

```rust
SqlError::ColumnDoesNotExist => ConnectorError::ColumnDoesNotExist,
```

#### `ConnectionError: Error creating a database connection`

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

#### `QueryError: Error querying the database`

Generic query error. This is the fallback if we can't determine what kind of query error was returned.

```rust
e => SqlError::QueryError(e.into()),
```

#### `InvalidConnectionArguments: The provided arguments are not supported.`

This can occur when we pass an argument into the connection string that is either invalid or we don't yet support.

```rust
"connection_limit" => {
    let as_int: u32 =  v.parse().map_err(|_|SqlError::InvalidConnectionArguments)?;
    connection_limit = as_int;
}
```

#### `ColumnReadFailure: The column value was different from the model`

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

#### `FieldCannotBeNull: Field cannot be null: ${field}`

Prisma-level null check constraint. This will have some overlap with `NullConstraintViolation`, which comes from the database

```rust
if field.is_required && value.is_null() {
    return Err(SqlError::FieldCannotBeNull {
        field: field.name.clone(),
    });
}
```

#### `DomainError`

**TODO** When does this occur?

- Domain::FieldNotFound
- Domain::ScalarFieldNotFound
- Domain::RelationFieldNotFound
- Domain::FieldForRelationNotFound
- Domain::ModelNotFound
- Domain::RelationNotFound
- Domain::ConversionFailure
- Domain::ModelForRelationNotFound

#### `RecordNotFoundForWhere: Record not found`

Prisma-level null check constraint. This will have some overlap with `RecordDoesNotExist`, which comes from the database.

```rust
RootWriteQuery::UpsertRecord(ref ups) => match conn.find_id(&ups.where_) {
    Err(_e @ SqlError::RecordNotFoundForWhere { .. }) => Ok(create(conn, &ups.create)?),
    Err(e) => return Err(e.into()),
    Ok(_) => Ok(update(conn, &ups.update)?),
},
```

#### `RelationViolation: Violating a relation ${relation_name} between ${model_a_name} and ${model_b_name}`

Prisma-level violation when a write violates a relationship in the schema.

```rust
if self.top_is_create {
    match (p.is_list, p.is_required, c.is_list, c.is_required) {
        (false, true, false, true) => Err(self.relation_violation()),
    }
}
```

#### `RecordsNotConnected: The relation ${} has no record for the model {} connected to a record for the model {} on your write path.`

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

#### `ConversionError: Conversion error`

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

#### `DatabaseCreationError: Database creation error: ${error}`

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

### Migration Engine

#### `DataModelErrors`

This error occurs when there is no datasource in the schema.

```rust
let source = config.datasources.first().ok_or(CommandError::DataModelErrors {
    code: 1000,
    errors: vec!["There is no datasource in the configuration.".to_string()],
})?;
```

#### `InitializationError`

**TODO** This doesn't seem to be in use.

#### `Generic`

Generic error that can occur in a couple different ways:

**Parsing the schema fails**

```rust
pub fn parse_datamodel(datamodel: &str) -> CommandResult<Datamodel> {
    let result = datamodel::parse_with_formatted_error(&datamodel, "datamodel file, line");
    result.map_err(|e| CommandError::Generic { code: 1001, error: e })
}
```

**TODO** Make this more specific. It seems like all the submodule-specific errors end up getting wrapped into this generic error.

#### `ConnectorError`

Connection errors can occur whenever you connect to the database. In the migration engine, this can happen when you initialize the connection or reset the
database.

```rust
fn initialize(&self) -> ConnectorResult<()>;
fn reset(&self) -> ConnectorResult<()>;
pub type ConnectorResult<T> = Result<T, ConnectorError>;
```

#### `MigrationError`

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

#### `RollbackFailure`

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
