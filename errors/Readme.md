# Errors

- Owner: @divyenduz
- Stakeholders: @mavilein @timsuchanek @nikolasburk
- State:
  - Spec: In Progress 🚧
  - Implementation: Future 👽

Definition of errors in the Prisma Framework. (In this document we make the distinction between [Unknown Errors](https://github.com/prisma/specs/tree/master/errors#unknown-errors) and [Known Errors](https://github.com/prisma/specs/tree/master/errors#known-errors).)

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
      - [P1004: Incompatible binary](#p1004-incompatible-binary)
      - [P1005: Unable to start the query engine](#p1005-unable-to-start-the-query-engine)
      - [P1006: Binary not found](#p1006-binary-not-found)
      - [P1007: Missing write access to download binary](#p1007-missing-write-access-to-download-binary)
  - [Prisma Client JS](#prisma-client-js)
      - [Prisma Client JS runtime validation error](#prisma-client-js-runtime-validation-error)
      - [Query engine connection error](#query-engine-connection-error)
  - [Prisma Studio](#prisma-studio)
  - [Prisma CLI](#prisma-cli)
    - [Init](#init)
      - [Directory already contains schema file](#directory-already-contains-schema-file)
      - [Starter kit](#starter-kit)
    - [Generate](#generate)
    - [Dev](#dev)
    - [Lift](#lift)
    - [Introspect](#introspect)
  - [Programmatic access](#programmatic-access)
- [Unknown Errors](#unknown-errors)
  - [Unknown Error Template](#unknown-error-template)
  - [Unknown Error Handling](#unknown-error-handling)
    - [Prisma Client JS](#prisma-client-js-1)
    - [Studio](#studio)
    - [CLI](#cli)
- [Error Log Masking](#error-log-masking)
- [Open Questions?](#open-questions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Motivation

![Prisma 2 architecture diagram with errors overlay](./errors-spec.png)

| Component            | Description                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Systems that use SDK | Prisma Client js, Studio, Prisma CLI: dev, lift, generate commands, etc.                           |
| Prisma SDK           | Helps tools interact with binaries. Spec [here](../sdk-js/Readme.md)                               |
| Core                 | Binary artifacts of Prisma 2 compilation and a part of the SDK. Spec [here](../binaries/Readme.md) |
| Data source          | A database or any other data source supported by Prisma                                            |

Prisma 2 ecosystem provides various layers of tools that communicate with each other to provide the desired outcome.

Broadly, the life-cycle of a request (Query request or CLI command) can be seen in this diagram.

| System that uses SDK | →   | Prisma SDK | →   | Binaries | →   | Data source |
| -------------------- | --- | ---------- | --- | -------- | --- | ----------- |


Note: This spec is primarily targeted at users who would build tools using the Prisma SDK. The spec also targets users of those tools.

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
- SDK failed to bind a port for the query engine
- The database is not reachable
- Database timeout

Handling strategy: Notify the user by relaying the message from OS/Database and suggesting them to retry. They might need to free up resources or do something at the OS level.

In certain cases, like when a port collision, Prisma SDK can try to retry gracefully as well with a different port.

</p>
</details>

# Error Codes

Error codes make identification/classification of error easier. Moreover, we can have an internal range for different system components

| Tool (Binary)        | Range | Description                                                                                                                                                                        |
| -------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Common               | 1000  | Common errors across all binaries. Common by itself is not a binary.                                                                                                               |
| Query Engine         | 2000  | Query engine binary is responsible for getting data from data sources via connectors (This powers Prisma Client). The errors in this range would usually be data constraint errors |
| Migration Engine     | 3000  | Migration engine binary is responsible for performing database migrations (This powers lift). The errors in this range would usually be schema migration/data destruction errors   |
| Introspection Engine | 4000  | Introspection engine binary is responsible for printing Prisma schema from an existing database. The errors in this range would usually be errors with schema inferring            |
| Prisma Format        | 6000  | Prisma format powers the Prisma VSCode extension to pretty-print the Prisma schema. The errors in this range are usually syntactic or semantic errors.                             |

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

This spec does not list individual errors (Except for some errors in the "common" category which occur in the Javascript part of the code, these errors are listed below). Instead, the single source of truth for them is our code where they are defined with their codes and messages. Here is a list of links to their definitions for each error category:

- [Common](https://github.com/prisma/prisma-engines/blob/master/libs/user-facing-errors/src/common.rs)
- [Query Engine](https://github.com/prisma/prisma-engines/blob/master/libs/user-facing-errors/src/query_engine.rs)
- [Migration Engine](https://github.com/prisma/prisma-engines/blob/master/libs/user-facing-errors/src/migration_engine.rs)
- [Introspection Engine](https://github.com/prisma/prisma-engines/blob/master/libs/user-facing-errors/src/introspection_engine.rs)

### Common

The following errors have to be listed separately because they happen in the Javascript code that wraps the rust binaries.

#### P1004: Incompatible binary

- **Description**: The downloaded/provided binary `${binary_path}` is not compiled for platform `${platform}`
- **Meta schema**:
  ```ts
  type Meta = {
    // Fully resolved path of the binary file
    binary_path: string
    // Identifiers for the currently identified execution environment, e.g. `native`, `windows`, `darwin` etc
    platform: string
  }
  ```

#### P1005: Unable to start the query engine

- **Description**: Failed to spawn the binary `${binary_path}` process for platform `${platform}`
- **Meta schema**:
  ```ts
  type Meta = {
    // Fully resolved path of the binary file
    binary_path: string
    // Identifiers for the currently identified execution environment, e.g. `native`, `windows`, `darwin` etc
    platform: string
  }
  ```

#### P1006: Binary not found

- **Description**: Query engine binary for current platform `${platform}` could not be found. Make sure to adjust the generator configuration in the `schema.prisma` file. <br /> <br />`${generator_config}` <br /> <br />Please run `prisma2 generate` for your changes to take effect.
- **Meta schema**:
  ```ts
  type Meta = {
    // Identifiers for the currently identified execution environment, e.g. `native`, `windows`, `darwin` etc
    platform: string
    // Details of how a generator can be added.
    generator_config: string
  }
  ```
- **Notes**: Tools (like Prisma CLI) consuming `generator_config` might color it using ANSI characters for better reading experience.

#### P1007: Missing write access to download binary

- **Description**: Can't write to `${targetDir}` please make sure you install "prisma2" with the right permissions.

## Prisma Client JS

#### Prisma Client JS runtime validation error

- **Description**: Validation Error: `${prismaClientRuntimeError}`
- **Meta schema**:

  ```ts
  type Meta = {
    // Prisma Client runtime error describing a validation error like missing argument or incorrect data type.
    prismaClientRuntimeError: string
  }
  ```

- **Notes**: Prisma Client might use ANSI escape characters to color the response for a better reading experience. Disabling that feature is documented [here](https://github.com/prisma/specs/tree/master/prisma-client-js#error-character-encoding).

#### Query engine connection error

- **Description**: The query engine process died, please restart the application

---

Additionally, Prisma Client JS relays the following errors from the SDK: `P1000`, `P1001` , `P1002`, `P1003`, `P1004`, `P1005`, `P1006`, `P2000`, `P2001` , `P2002`, `P2003`, `P2004`, `P2005`, `P2006`, `P2007`, `P2008`, `P2009`.

Note: For `P1006`, Prisma Client JS provides additional information in case it detects that the binary is incorrectly pinned.

## Prisma Studio

Note: Studio has two workflows:

Electron app: Credentials from the UI → Introspection → Prisma schema → Valid Prisma project
Web app: `prisma2 dev` → Provides Prisma schema i.e a Valid Prisma project

Since studio uses Prisma Client JS for query building. It relays the same error messages as Prisma Client JS. Additionally, it relays the following errors from the SDK: `P3000`.

## Prisma CLI

Note that Prisma CLI must exit with a non-zero exit code when it encounters an error from which it cannot recover.

### Init

#### Directory already contains schema file

- **Description**: Directory `${folder_name}` is an existing Prisma project
- **Meta schema**:

  ```ts
  type Meta = {
    // Folder name of current working directory (Equivalent of folder name from unix `pwd`)
    folder_name: string
  }
  ```

#### Starter kit

- **Description**: Directory `${folder_name}` is not empty
- **Meta schema**:

  ```ts
  type Meta = {
    // Folder name of current working directory (Equivalent of folder name from unix `pwd`)
    folder_name: string
  }
  ```

Init command relays the following errors from the SDK: `P3000`, `P4000`

More issues for init command failures are covered here: https://prisma-specs.netlify.com/cli/init/errors/

### Generate

!TODO

### Dev

Dev command relays the following errors from the SDK: `P1000`, `P1001` , `P1002`, `P1003`, `P1004`, `P1005`, `P1006`, `P3000`, `P3001`

### Lift

Lift commands relays the following errors from the SDK: `P1000`, `P1001` , `P1002`, `P1003`, `P1004`, `P1005`, `P1006`, `P3000`, `P3001`

### Introspect

Introspect command relays the following errors from the SDK: `P1000`, `P1001` , `P1002`, `P1003`, `P1004`, `P1005`, `P1006`, `P4000`

## Programmatic access

Many of these errors from the previous section are expected to be consumed programmatically.

`Prisma Client JS`: In user's code base
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

- Prisma Client JS
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

### Prisma Client JS

On encountering an unexpected error, Prisma Client should inform the user and prepare an error report with context of the issue and masked sensitive information to be shared manually or via telemetry.

<details><Summary>Logging output</Summary>

```
Oops, an unexpected error occurred.

Find more info in the error report:
**/path/to/dir/prisma-error-TIMESTAMP.md**

Please help us fix the problem!

Copy the error report and paste it as a GitHub issue here:
**https://www.github.com/prisma/prisma-client-js/issues**

Thanks for helping us making Prisma Client more stable! 🙏

An internal error occurred during invocation of **prisma.user.create()** in **/path/to/dir/src/.../file.ts**

  ${userStackTrace}
```

> Note: Text enclosed by the double-asterisk `**` means the text should be printed in **bold**.

</details>

<details><Summary>Error report</Summary>

File name: `prisma-error.md` is created inside the project directory on first error and is appended to on subsequent errors.

```
# Error report (Prisma Client JS | July 23, 2019 | 14:42:23 h)

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

## Generated Prisma Client JS code

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

Note that studio can also yield Prisma Client JS errors as it uses Prisma Client JS internally. The error log generation in that case would be done by Prisma Client JS but the UI to prompt user to create a Github issue or send it to us would be handled by Studio.

### CLI

Note that Prisma CLI must exit with a non-zero exit code when it encounters an error from which it cannot recover.

On encountering an unexpected error, CLI should inform the user and prepare an error report with context of the issue.

File name: `prisma-error-TIMESTAMP.zip` where `TIMESTAMP` is a placeholder for the current timestamp. It would contain the migrations and schema files with sensitive information redacted (see [Error Log Masking](#error-log-masking)).

This is covered in the [CLI error handling spec](https://prisma-specs.netlify.com/cli/error-handling/).

# Error Log Masking

Both logging output, error report might contain logs with sensitive information like database URL. Prisma 2 should mask the sensitive information (with asterisks `********`) before dumping the data on the file system.

The error report to be sent back automatically might also contain some proprietary information like the database schema via Prisma schema file.

We must ask the user before collecting such information. This is covered in the [telemetry spec](https://prisma-specs.netlify.com/cli/telemetry/).

# Open Questions?

- Batch API and errors? Discussion https://www.notion.so/prismaio/Errors-Spec-Error-Arrays-4160085305444374a74f6a81b785e57a

- Single errors or error arrays? (in the GraphQL layer for example?) Discussion https://www.notion.so/prismaio/Errors-Spec-Error-Arrays-4160085305444374a74f6a81b785e57a

- Error slugs in place of error codes like: https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin/src/rules
  -- A downside of error codes is that it makes reordering errors (in the spec) cumbersome.

- Should known errors have a CTA? To create a GH issue? That might help funnel user input for better developer experience. This also teaches users about multiple repositories.
