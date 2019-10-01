# Errors

- Owner: @divyenduz
- Stakeholders: @mavilein @timsuchanek @nikolasburk
- State:
  - Spec: In Progress 🚧
  - Implementation: Future 👽

Definition of errors in Prisma Framework. (In this document we make the distinction between [Unknown Errors](https://github.com/prisma/specs/tree/master/errors#unknown-errors) and [Known Errors](https://github.com/prisma/specs/tree/master/errors#known-errors).)

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Motivation](#motivation)
- [Error Causes and Handling Strategies](#error-causes-and-handling-strategies)
- [Error Codes](#error-codes)
- [Known Errors](#known-errors)
  - [Known Errors Template](#known-errors-template)
  - [Prisma SDK](#prisma-sdk)
    - [Common](#common)
    - [Query Engine](#query-engine)
    - [Migration Engine](#migration-engine)
    - [Schema Parser](#schema-parser)
    - [Introspection](#introspection)
    - [Unclassified SDK errors](#unclassified-sdk-errors)
  - [Photon.js](#photonjs)
  - [Prisma Studio](#prisma-studio)
  - [Prisma CLI](#prisma-cli)
    - [Init](#init)
    - [Generate](#generate)
    - [Dev](#dev)
    - [Lift](#lift)
    - [Introspect](#introspect)
  - [Programmatic access](#programmatic-access)
- [Unknown Errors](#unknown-errors)
  - [Unknown Error Template](#unknown-error-template)
  - [Unknown Error Handling](#unknown-error-handling)
    - [Photon.js](#photonjs-1)
    - [Studio](#studio)
    - [CLI](#cli)
- [Error Log Masking](#error-log-masking)
- [Appendix](#appendix)
  - [Error Message Template Variables](#error-message-template-variables)
  - [Meta Schema Index](#meta-schema-index)
  - [Common Database Errors](#common-database-errors)
    - [MySQL](#mysql)
    - [PostgreSQL](#postgresql)
    - [SQLite](#sqlite)
- [Open Questions?](#open-questions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Motivation

![Prisma 2 architecture diagram with errors overlay](./errors-spec.png)

| Component            | Description                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Systems that use SDK | Photon.js, Studio, Prisma CLI: dev, lift, generate commands, etc.                                  |
| Prisma SDK           | Helps tools interact with binaries. Spec [here](../sdk-js/Readme.md)                               |
| Core                 | Binary artifacts of Prisma 2 compilation and a part of the SDK. Spec [here](../binaries/Readme.md) |
| Data source          | A database or any other data source supported by Prisma                                            |

Prisma 2 ecosystem provides various layers of tools that communicate with each other to provide desired outcome.

Broadly, the life-cycle of a request (Query request or CLI command) can be seen in this diagram.

| System that uses SDK | →   | Prisma SDK | →   | Binaries | →   | Data source |
| -------------------- | --- | ---------- | --- | -------- | --- | ----------- |


# Error Causes and Handling Strategies

There can be various reasons for a request/operation to fail. This section broadly classifies potential error causes and handling strategies.

<details>
<summary>Validation Errors</summary>
<p>
These are usually caused by faulty user input. For example,

- Incorrect database credentials
- Invalid data source URL
- Malformed schema syntax

Handling strategy: Any user input must be validated and user should be notified about the validation error details.

</p>
</details>

<details>
<summary>Data Error</summary>
<p>These are usually caused when a database constraint fails. For example,

- Record not found
- Unique constraint violation
- Foreign key constraint violation
- Custom constraint violation

Handling strategy: Domain errors would usually originate from the data source and the underlying message should be relayed to the user with some context.

</p>
</details>

<details>
<summary>Runtime Error</summary>
<p>
These are caused due to an error in Prisma runtime. For example,

- The available binary is not compiled for this platform
- SDK failed to bind a port for query engine
- Database is not reachable
- Database timeout

Handling strategy: Notify the user by relaying the message from OS/Database and suggesting them to retry. They might need to free up resources or do something at the OS level.

In certain cases, like when a port collision, Prisma SDK can try to retry gracefully as well with a different port.

</p>
</details>

# Error Codes

Error codes make identification/classification of error easier. Moreover, we can have internal range for different system components

| Tool (Binary)    | Range |
| ---------------- | ----- |
| Common           | 1000  |
| Query Engine     | 2000  |
| Migration Engine | 3000  |
| Schema Parser    | 4000  |
| Introspection    | 5000  |
| Prisma Format    | 6000  |

# Known Errors

## Known Errors Template

When we encounter a known error, we should try to convey enough information to the user so they get a good understanding of the error and can possibly unblock themselves.

The format of our error should be the following:

```
{error_code}: {error_message}

{serialized_meta_schema}

Read more: {code_link}
```

| Template Field         | Description                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| error_code             | Code identifier of the encountered error                                             |
| error_message          | Error message description that also contains a one liner for "how to fix" suggestion |
| serialized_meta_schema | Serialization of the meta schema that might different for each error                 |
| code_link              | Each error code has a permalink with detailed information                            |

If we encounter a Rust panic, that is covered in the [Unknown Errors](#unknown-errors) section.

## Prisma SDK

SDK acts as the interface between the binaries and the tools. This section covers errors from SDK, binaries and the network between SDK ⇆ Binary and Binary ⇆ Data source.

### Common

| Title                                   | Message                                                                                                                                                                                                                                                          | Code  | Meta Fields                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------- |
| Incorrect database credentials          | Authentication failed against database server at `${database_host}`, the provided database credentials for `${database_user}` are not valid. <br /> <br /> Please make sure to provide valid database credentials for the database server at `${database_host}`. | P1000 | database_host, database_user                |
| Database not reachable                  | Can't reach database server at `${database_host}`:`${database_port}` <br /> <br /> Please make sure your database server is running at \${host:port}.                                                                                                            | P1001 | database_host, database_port                |
| Database timeout                        | The database server at `${database_host}`:`${database_port}` was reached but timed out. <br /> <br /> Please try again. <br /> <br /> Please make sure your database server is running at \${host:port}.                                                         | P1002 | database_host, database_port                |
| Database does not exist                 | Database `${database_name}` does not exist on the database server at `${database_host}`. <br /> <br />                                                                                                                                                           | P1003 | database_name, database_host                |
| Incompatible binary                     | The downloaded/provided binary `${binary_path}` is not compiled for platform `${platform}`                                                                                                                                                                       | P1004 | binary_path, platform                       |
| Unable to start the query engine        | Failed to spawn the binary `${binary_path}` process for platform `${platform}`                                                                                                                                                                                   | P1005 | binary_path, platform                       |
| Binary not found                        | Photon binary for current platform `${platform}` could not be found. Make sure to adjust the generator configuration in the `schema.prisma` file. <br /> <br />`${generator_config}` <br /> <br />Please run `prisma2 generate` for your changes to take effect. | P1006 | platform, generator_config                  |
| Missing write access to download binary | Please try installing Prisma 2 CLI again with the `--unsafe-perm` option. <br /> Example: `npm i -g --unsafe-perm prisma2`                                                                                                                                       | P1007 |                                             |
| Database operation timeout              | Operations timed out after `${time}`                                                                                                                                                                                                                             | P1008 | time                                        |
| Database already exists                 | Database `${database_name}` already exists on the database server at `${database_host}:${database_port}`                                                                                                                                                         | P1009 | database_name, database_host, database_port |
| Database access denied                  | User `${database_user}` was denied access on the database `${database_name}`                                                                                                                                                                                     | P1010 | database_user, database_name                |

Note on P1003: Different consumers of the SDK might handle that differently. Lift save, for example, shows a interactive dialog for user to create it.

### Query Engine

| Title                                         | Message                                                                                                              | Code  | Meta Fields                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------- |
| Input value too long                          | The value `${value}` for the field `${field_name}` on the is too long for the field's type                           | P2000 | value, field_name                         |
| Record not found                              | The record searched for in the where condition (`${model_name}.${argument_name} = ${argument_value}`) does not exist | P2001 | model_name, argument_name, argument_value |
| Unique key violation                          | Unique constraint failed on the field: `${field_name}`                                                               | P2002 | field_name                                |
| Foreign key violation                         | Foreign key constraint failed on the field: `${field_name}`                                                          | P2003 | field_name                                |
| Constraint violation                          | A constraint failed on the database: `${database_error}`                                                             | P2004 | database_error                            |
| Stored value is invalid                       | The value `${value}` stored in the database for the field `${field_name}` is invalid for the field's type            | P2005 | value, field_name                         |
| `*`Type mismatch: invalid (ID/Date/Json/Enum) | The provided value `${field_value}` for (ID/Date/Json/Enum) field `${field_name}` is not valid                       | P2006 | field_value, field_name                   |
| `*`Type mismatch: invalid custom type         | Data validation error `${database_error}`                                                                            | P2007 | database_error                            |
| Query parsing failed                          | Failed to parse the query `${query_parsing_error}` at `${query_position}`                                            | P2008 | query_parsing_error, query_position       |
| Query validation failed                       | Failed to validate the query `${query_validation_error}` at `${query_position}`                                      | P2009 | query_validation_error, query_position    |

Note: Details of P2006 are not finalized. The current idea is that any variable coercion will happen in the query engine. Json might be recognized as a native Prisma scalar. This also brings up the question of shims. Clarity in those parts of the spec would help us answer this. The same questions apply to bring your own ID feature, will we recognize all known ID types (like uuid, cuid, MongoID) and validate them in any later before it hits the database?

Note: Details of P2007 are not finalized. The current idea is that Photon, Query Engine will simply pass through the data and rely on database for data validation.

Note: `P2008`, `2009` wouldn't come from Photon (if they do it is a bug in Photon) but they are useful for anyone writing a query builder on top of the query engine.

Note: Features like raw execution do not exist now and the error does not talk about them. But re-throwing database error from the query engine is where it will be handled. We may error more cases for specific handling there.

Note: Errors with `*` in the title represent multiple types and are less defined.

### Migration Engine

| Title                          | Message                                                                                                       | Code  | Meta Fields                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------ |
| Database creation failed       | Failed to create database: `${database_error}`                                                                | P3000 | Database Error                       |
| Destructive migration detected | Migration possible with destructive changes and possible data loss: `${migration_engine_destructive_details}` | P3001 | migration_engine_destructive_details |
| Migration rollback             | The attempted migration was rolled back: `${database_error}`                                                  | P3002 | database_error                       |

### Schema Parser

| Title                                 | Message                                                                                                    | Code  | Meta Fields                               |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------- |
| Schema parsing failed                 | Failed to parse schema file: `${schema_parsing_error}` at `${schema_position}`                             | P4000 | schema_parsing_error, schema_position     |
| Schema relational ambiguity           | There is a relational ambiguity in the schema file between the models `${A}` and `${B}`.                   | P4001 | A, B                                      |
| Schema string input validation errors | Database URL provided in the schema failed to parse: `${schema_sub_parsing_error}` at `${schema_position}` | P4002 | schema_sub_parsing_error, schema_position |

### Introspection

| Title                | Message                                                                            | Code  | Meta Fields         |
| -------------------- | ---------------------------------------------------------------------------------- | ----- | ------------------- |
| Introspection failed | Introspection operation failed to produce a schema file: `${introspection_error}`. | P5000 | introspection_error |

### Unclassified SDK errors

## Photon.js

| Title                           | Message                                                       |
| ------------------------------- | ------------------------------------------------------------- |
| Photon runtime validation error | Validation Error: `${photon_runtime_error}`                   |
| Query engine connection error   | The query engine process died, please restart the application |

Photon relays the following errors from the SDK: `P1000`, `P1001` , `P1002`, `P1003`, `P1004`, `P1005`, `P1006`, `P2000`, `P2001` , `P2002`, `P2003`, `P2004`, `P2005`, `P2006`, `P2007`, `P2008`, `P2009`.

Note: For `P1006`, Photon provides additional information in case it detects that the binary is incorrectly pinned.

## Prisma Studio

Note: Studio has two workflows:

Electron app: Credentials from the UI → Introspection → Prisma schema → Valid Prisma project
Web app: `prisma2 dev` → Provides Prisma schema i.e a Valid Prisma project

Since studio uses Photon for query building. It relays the same error messages as Photon. Additionally, it relays the following errors from the SDK: `P3000`, `P5000`

## Prisma CLI

Note that Prisma CLI must exit with a non-zero exit code when it encounters an error from which it cannot recover.

### Init

| Title                                  | Message                                                  |
| -------------------------------------- | -------------------------------------------------------- |
| Directory already contains schema file | Directory `${folder_name}` is an existing Prisma project |
| Starter kit                            | Directory `${folder_name}` is not empty                  |

Init command relays the following errors from the SDK: `P3000`, `P5000`

More issues for init command failures are covered here: https://prisma-specs.netlify.com/cli/init/errors/

### Generate

Generate command relays the following errors from the SDK: `P4000`, `P4001`, `P4002`

### Dev

Dev command relays the following errors from the SDK: `P1000`, `P1001` , `P1002`, `P1003`, `P1004`, `P1005`, `P1006`, `P3000`, `P3001`, `P4000`, `P4001`, `P4002`

### Lift

Lift commands relays the following errors from the SDK: `P1000`, `P1001` , `P1002`, `P1003`, `P1004`, `P1005`, `P1006`, `P3000`, `P3001`, `P4000`, `P4001`, `P4002`

// TODO: Be more specific and mention different lift commands

### Introspect

Introspect command relays the following errors from the SDK: `P1000`, `P1001` , `P1002`, `P1003`, `P1004`, `P1005`, `P1006`, `P5000`

## Programmatic access

Many of these errors from the previous section are expected to be consumed programmatically.

`Photon.js`: In user's code base
`Prisma SDK`: Lift etc, in the tools that use Prisma SDK

Therefore, they should be consumable programmatically and have an error structure:

Error object:

```json
{
  "code": "<ERROR_CODE>",
  "message": "<ERROR_MESSAGE>",
  "meta": "<meta-schema-object>"
}
```

Serialization of the error message (default `toString`) will have the following template:

```
${ERROR_CODE}: ${ERROR_MESSAGE}
```

# Unknown Errors

As Prisma 2 is still early, we're not yet aware of all error cases that can occur. This section explains what should happen when Prisma encounters an _unknown_ error.

An error can occur in any of the following tools that currently make up Prisma 2's developer surface area:

- Photon.js
- Studio
- CLI

When an unknown error occurs, **our primary goal** is to get the user to report it by creating a new GitHub issue or send the error report to us via telemetry.

Error messages should include clear guidelines of where to report the issue and what information to include. The following sections provide the templates for these error message per tool.

## Unknown Error Template

Additionally to showing the the error message directly to the user by printing it to the console, we also want to provide rich error reports that users can use to report the issue manually via Github issue or automatically via telemetry. These error reports are stored as markdown files or zip files on the file system. Therefore, each tool has two templates:

- **Logging output** directly shown to the user
- **Error report** (markdown or a zip file) stored on the file system

The error report generally is more exhaustive than the logging output (e.g. it also contains the Prisma schema which would be overkill if printed to the terminal as well). It is also written in Markdown enabling the user to copy and paste the report as a GitHub issue directly.

## Unknown Error Handling

### Photon.js

On encountering an unexpected error, Photon should inform the user and prepare an error report with context of the issue and masked sensitive information to be shared manually or via telemetry.

<details><Summary>Logging output</Summary>

```
Oops, an unexpected error occurred.

Find more info in the error report:
**/path/to/dir/prisma-error-TIMESTAMP.md**

Please help us fix the problem!

Copy the error report and paste it as a GitHub issue here:
**https://www.github.com/prisma/photonjs/issues**

Thanks for helping us making Photon.js more stable! 🙏

An internal error occurred during invocation of **photon.users.create()** in **/path/to/dir/src/.../file.ts**

  ${userStackTrace}
```

> Note: Text enclosed by the double-asterisk `**` means the text should be printed in **bold**.

</details>

<details><Summary>Error report</Summary>

File name: `prisma-error.md` is created inside the project directory on first error and is appended to on subsequent errors.

```
# Error report (Photon JS | July 23, 2019 | 14:42:23 h)

This is an exhaustive report containing all relevant information about the error.

**Please post this report as a GitHub issue so we can fix the problem: https://github.com/prisma/prisma2/issues** 🙏

## Stack trace

${internalStackTrace}

## System info

${uname -a}

## Prisma 2 CLI version

${prisma2 -v}

## Prisma schema file

${schema.prisma}

## Generated Photon JS code

${index.d.ts}
```

> **Note**: The connection strings for the data sources in the Prisma schema file must be obscured!

</details>

### Studio

On encountering an unexpected error, Studio should inform the user and prepare an error report with context of the issue and masked sensitive information to be shared manually or via telemetry.

<details><Summary>Logging output</Summary>

```
Oops, an unexpected error occurred! Find more info in the error report:
**/path/to/dir/prisma-error-TIMESTAMP.md**

Please help us fix the problem!

Copy the error report and paste it as a GitHub issue here:
**https://www.github.com/prisma/prisma2/issues**

Thanks for helping us making Prisma 2 more stable! 🙏
```

> Note: Text enclosed by the double-asterisk `**` means the text should be printed in **bold**.

</details>

<details><Summary>Error report</Summary>

File name: `studio-error-TIMESTAMP.zip` where `TIMESTAMP` is a placeholder for the current timestamp. It would contain the migrations and schema files with sensitive information redacted (see [Error Log Masking](#error-log-masking)) and an information file containing the error report:

```
# Error report (Prisma Studio | July 23, 2019 | 14:42:23 h)

This is an exhaustive report containing all relevant information about the error.

**Please post this report as a GitHub issue so we can fix the problem: https://github.com/prisma/prisma2/issues** 🙏

## Stack trace

${stacktrace}

## System info

${uname -a}

## Browser info

${browserInfo}

## Prisma 2 CLI version

${prisma2 -v}

## Prisma schema file

${schema.prisma}
```

> **Note**: The connection strings for the data sources in the Prisma schema file must be obscured!

</details>

Note that studio can also yield Photon errors as it uses Photon internally. The error log generation in that case would be done by Photon but the UI to prompt user to create a Github issue or send it to us would be handled by Studio.

### CLI

Note that Prisma CLI must exit with a non-zero exit code when it encounters an error from which it cannot recover.

On encountering an unexpected error, CLI should inform the user and prepare an error report with context of the issue.

File name: `prisma-error-TIMESTAMP.zip` where `TIMESTAMP` is a placeholder for the current timestamp. It would contain the migrations and schema files with sensitive information redacted (see [Error Log Masking](#error-log-masking)).

This is covered in the [CLI error handling spec](https://prisma-specs.netlify.com/cli/error-handling/).

# Error Log Masking

Both logging output, error report might contain logs with sensitive information like database URL. Prisma 2 should mask the sensitive information (with asterisks `********`) before dumping the data on the file system.

The error report to be sent back automatically might also contain some proprietary information like the database schema via Prisma schema file.

We must ask the user before collecting such information. This is covered in the [telemetry spec](https://prisma-specs.netlify.com/cli/telemetry/).

# Appendix

## Error Message Template Variables

| Field                                  | Description                                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `database_host`                        | Database host URI                                                                                                                                   |
| `database_port`                        | Database port                                                                                                                                       |
| `database_user`                        | Database user name                                                                                                                                  |
| `database_name`                        | Database name, append `database_schema_name` when applicable                                                                                        |
| `database_schema_name`                 | Database schema name (For Postgres for example)                                                                                                     |
| `binary_path`                          | Fully resolved path of the binary file                                                                                                              |
| `platform`                             | Identifiers for the currently identified execution environment, e.g. `native`, `windows`, `darwin` etc                                              |
| `time`                                 | Operation time in s or ms (if <1000ms)                                                                                                              |
| `model_name`                           | Model name from Prisma schema                                                                                                                       |
| `field_name`                           | Field name from one model from Prisma schema                                                                                                        |
| `field_value`                          | Concrete value provided for a field on a model in Prisma schema. Should be peeked/truncated if too long to display in the error message             |
| `argument_name`                        | Argument name from a supported query on a Prisma schema model                                                                                       |
| `argument_value`                       | Concrete value provided for an argument on a query. Should be peeked/truncated if too long to display in the error message                          |
| `database_error`                       | Database error returned by the underlying data source                                                                                               |
| `query_parsing_error`                  | Error(s) encountered when trying to parse a query in the query engine                                                                               |
| `query_validation_error`               | Error(s) encountered when trying to validate a query in the query engine                                                                            |
| `query_position`                       | Location of the incorrect parsing, validation in a query. Represented by tuple or object with (line, char)                                          |
| `schema_parsing_error`                 | Error(s) encountered when trying to parse the schema in the schema parser                                                                           |
| `schema_sub_parsing_error`             | Error(s) encountered when trying to parse a string input to the schema in the schema parser (Like database URL)                                     |
| `schema_validation_error`              | Error(s) encountered when trying to validate the schema in the schema parser                                                                        |
| `schema_position`                      | Location of the incorrect parsing, validation in the schema. Represented by tuple or object with (line, char)                                       |
| `introspection_error`                  | Generic error received from the introspection engine. Indicator of why an introspection failed                                                      |
| `migration_engine_destructive_details` | Details of a destructive migration from the migration engine                                                                                        |
| `folder_name`                          | Folder name of current working directory (Equivalent of folder name from unix `pwd`)                                                                |
| `photon_runtime_error`                 | Photon runtime error describing a validation error like missing argument or incorrect data type. May contain ANSI characters and query/schema diff. |
| `generator_config`                     | Details of how a generator can be added. Can contain ANSI characters.                                                                               |

## Meta Schema Index

Same as the `Error Message Template Variables` table with the following exception:

| Field                  | Description                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `photon_runtime_error` | Photon runtime error describing a validation error like missing argument or incorrect data type. May contain query/schema diff. ANSI characters must be stripped |
| `generator_config`     | Details of how a generator can be added. ANSI characters must be stripped                                                                                        |

## Common Database Errors

### MySQL

- https://www.fromdual.com/mysql-error-codes-and-messages
- https://docs.oracle.com/cd/E19078-01/mysql/mysql-refman-5.0/error-handling.html
- https://www.oreilly.com/library/view/mysql-reference-manual/0596002653/apas02.html
- https://dev.mysql.com/doc/refman/5.5/en/server-error-reference.html

### PostgreSQL

- https://www.postgresql.org/docs/10/errcodes-appendix.html
- https://www.postgresql.org/docs/8.1/errcodes-appendix.html
- https://www.enterprisedb.com/docs/en/9.2/pg/errcodes-appendix.html

### SQLite

- https://www.sqlite.org/rescode.html
- https://www.sqlite.org/c3ref/intro.html
- https://www.sqlite.org/c3ref/c_abort.html
- https://www.sqlite.org/c3ref/errcode.html

# Open Questions?

- Batch API and errors? Discussion https://www.notion.so/prismaio/Errors-Spec-Error-Arrays-4160085305444374a74f6a81b785e57a

- Single errors or error arrays? (in the GraphQL layer for example?) Discussion https://www.notion.so/prismaio/Errors-Spec-Error-Arrays-4160085305444374a74f6a81b785e57a

- Error slugs in place of error codes like: https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin/src/rules
  -- A downside of error codes is that it makes reordering errors (in the spec) cumbersome.

- Should known errors have a CTA? To create a GH issue? That might help funnel user input for better developer experience. This also teaches users about multiple repositories.
