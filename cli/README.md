# CLI

- Stakeholders: @janpio @sorenbs @timsuchanek @nikolasburk
- State:
  - Spec: Almost up-to-date with the implementation
  - Implementation: In Progress 🚧

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Background](#background)
- [CLI Layout](#cli-layout)
    - [Help screen](#help-screen)
    - [Commands](#commands)
- [Init](#init)
    - [Arguments](#arguments)
    - [Behaviour](#behaviour)
    - [Generated files](#generated-files)
    - [Considerations for the first-run experience](#considerations-for-the-first-run-experience)
- [Introspect](#introspect)
    - [Arguments](#arguments-1)
    - [Canonical Schema Mapping](#canonical-schema-mapping)
- [Generate](#generate)
    - [Arguments](#arguments-2)
    - [Identifying the npm project](#identifying-the-npm-project)
    - [Install @prisma/client](#install-prismaclient)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Background

Prisma CLI offers essential workflows to Prisma users, including introspecting databases and generating a typesafe data-access client.

> Note: During the Prisma 2 preview period, the cli command is `prisma2`. In this spec we will refer to it simply as `prisma` as that will be the name when we publish the first release candidate.

> Note: This spec refers to other specs that do not yet exist

# CLI Layout

Prisma CLI has a help screen and 3 commands. Additionally it has a flag to enable experimental features - primarily database migrations. Experimental features are to be treated as engineering prototypes and do not accurately reflect how the finished product will work. Experimental features will be properly specced in this document at a later time.

### Help screen

The help message can be displayed by running `prisma` or `prisma -h` or `prisma --help`:

```
◭ Prisma is a modern DB toolkit to query, migrate and model your database (https://prisma.io)

Usage

  $ prisma2 [command]

Commands

            init   Setup Prisma for your app
      introspect   Get the datamodel of your database
        generate   Generate artifacts (e.g. Prisma Client)

Flags

  --experimental   Show and run experimental Prisma commands

Examples

  Setup Prisma for your existing database
  $ prisma2 init

  Introspect an existing database
  $ prisma2 introspect

  Generate artifacts (e.g. Prisma Client)
  $ prisma2 generate

```

### Commands

The three commands are documented in separate chapters below. All CLI commands are non-interactive

- init
- introspect
- generate

# Init

The `prisma init` command helps bootstrap a Prisma project. It does not connect to a database, and it does not read any existing files in the directory.

```
✔ Your Prisma schema was created at prisma/schema.prisma.
  You can now open it in your favorite editor.

NEXT STEPS
1. Modify the `DATABASE_URL` in the `.env` file to point to your existing database. If you need to create a new database schema, read https://pris.ly/d/getting-started.
2. Run `prisma introspect` to turn your database schema into a Prisma Data Model.
3. Run `prisma generate` to install Prisma Client and start querying your database.

More information in our documentation:
https://pris.ly/d/getting-started
```

### Arguments

The init command does not take any arguments.

### Behaviour

The init command creates a new folder called `prisma` in the directory where it is run. Inside this directory two new files are created: `schema.prisma` and `.env`.

If a folder named `prisma` is already present, the init command will fail with the following warning:

```
 ERROR  Folder prisma already exists in your project.
        Please try again in a project that is not yet using Prisma.
```

### Generated files

**schema.prisma**

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**.env**

```
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#using-environment-variables

# Prisma supports the native connection string format for Postgres, MySQL and SQLite.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="postgresql://johndoe:johndoe@localhost:5432/mydb?schema=public"
```

### Considerations for the first-run experience

> note: Each command will have a first-run section. We might pull these sections out to a separate spec

`prisma init` is the first software new users will run. Most new users will go through these steps:

- Visit prisma.io
- Press the `Get Started` call to action
- Begin reading the tutorial
- Install Prisma using npm or yarn
- Run `prisma init` and read the `Next steps` section
- Open the two generated files
- Adapt the database connection string
- Run `prisma introspect` and get a conenction error
- Open the connection url documentation
- Successfully run `prisma introspect`
- Look at the `schema.prisma` file again and try to learn how it maps their database
- Run `prisma generate`

Note how the user has two sets of instructions to follow: the `Get started guide` and the `Next steps` section from the `prisma init` output. For this reason, we choose to keep the two generated files as minimal as posible, and focus the comments on directing the user to the docs where they will find very detailed information that will be needed if they choose to divert from the narrow first-run experience.

Obviously, the `Get started guide` and the `Next steps` section from the `prisma init` output must be in complete sync.

# Introspect

The `prisma introspect` command connects to the specified database and generates a canonical schema representing the database structure. It requires an existing `schema.prisma` file to be present and correctly configured with a `datasource` that points to an accessible database. The existing `schema.prisma` file is overwritten with the new schema, and any manual changes applied to that file are lost.

```
Connecting to ["database"|`[db name]`] at `[host or filename]`...
✔ Wrote Prisma Data Model into `./prisma/schema.prisma` in 2.48s

Run `prisma generate` to generate Prisma Client.
```

If a connection to the database can not be established, an error is printed:

```
Connecting to ["database"|`[db name]`] at `[host or filename]`...

Error: P1000

Authentication failed against database server at `[host or filename]`, the provided database credentials for `[user]` are not valid.

Please make sure to provide valid database credentials for the database server at `[host or filename]`.
```

If the database does not have any tables, a useful message instructs the user to read our getting started material:

```
Connecting to ["database"|`[db name]`] at `[host or filename]`...

Your database does not contain any tables. Read how to proceed: [NIKO - LINK].
```

### Arguments

The `prisma introspect` command can be run without arguments. Additionally, these arguments can be specified:

- **schema** specify the path used to read the `schema.prisma` file instead of the default path. The path can be absolute or relative. Note that the generation result is written to that same file.

### Canonical Schema Mapping

The Prisma Schema is a reflection of the structure of a database. The Prisma Schema can express more information than the database schema. This is a problem for the `prisma introspect` command, as it needs to produce a single schema for any given database. The Canonical Schema Mapping describes the defaults picked by the introspection command for all ambiguos cases. See the Introspection Spec for the full details.

For example, it is common for ORMs to automatically keep a column up to date with the latest time the record was updated. The column is typically called something like `updatedAt` or `updated_at`. Prisma provides similar functionality, but does not rely on name conventions to decide when to enable this behavior. Instead, an explicit schema attribute is used to enable this behaviour:

```prisma
model User {
  lastUpdateTime DateTime @updatedAt
}
```

During introspection, the Canonical Schema Mapping is used to decide if a field should have the `@updatedAt` attribute applied. It dictates that this should never happen.

# Generate

The `prisma generate` command parses the `schema.prisma` file, identifies `generator` blocks and invokes the relevant generators. Currently, we support the single generator `prisma-client-js`. In the future we will provide generators for other languages and support third party generators.

A generator will code-generate a data access client based on the schema. The following will describe how the `prisma-client-js` generator works.

Below is the CLI output from the command.

First are three lines of checkmarks describing things that happened. The first two only happens in certain cases as described below in the sections `Identifying the npm project` and `Install @prisma/client`.
Second is a super minimal example.
Third is a link to the API docs.

````
[✔ Created `./package.json`]
[✔ Installed the `@prisma/client` package in your project]
✔ Generated Prisma Client to ./node_modules/@prisma/client in 1.48s

You can now start using Prisma Client in your code:

```
import { PrismaClient } from '@prisma/client'
// or const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
```

Explore the full API: http://pris.ly/d/client
````

### Arguments

The `prisma generate` command can be run without arguments. Additionally, these arguments can be specified:

- **schema** specify the path used to read the `schema.prisma` file instead of the default path. The path can be absolute or relative. This does not affect the location of the generated artefacts.
- **watch** enables watching the `schema.prisma` file and re-runs `generate` when the file changes.

### Identifying the npm project

The prisma client is being generated into an npm project. As such, a npm project must first be identified. The generator follows normal npm conventions and will search recursively from the directory where it is invoked, all the way up to the root of the filesystem.

If no npm project is found, it will create a new `package.json` file (similar to `npm init -y`) in the folder where it is invoked to create a new npm project.

### Install @prisma/client

After identifying the npm project, the generator will ensure that the `@prisma/client` package is installed. If it is already present in the `package.json` file, no action is taken. Otherwise it will run `npm install @prisma/client` to add the package as a dependency.

> Question: How do we handle the case where `@prisma/client` package has a different version than the CLI/generator?

Currently, the CLI only prints a warning. This is useful for developing as versions are always different

> Right now there is no reason to have this warning in the first place because CLI and Client can currently be used in any combination. In the future we might want to have a versioning system for the internal API, which could lead to errors on mismatch.
> [See issue here.](https://github.com/prisma/prisma2/issues/1539#issuecomment-584110461)

# Status

Application developers can make changes to their Prisma Schema and they can make changes to their Database Schema. This means that these two schemas can get out of sync. Out of sync means that the state of your database is different than the state that's represented in your Prisma Schema.

`prisma status` provides a way to check if your database and your Prisma schema are in-sync.

![Status Link](https://www.dropbox.com/s/bqpp132szvg4e5x/Screen%20Shot%202020-04-24%20at%2010.56.37%20AM.png?raw=1)

## Suggested Implementation

> This is left up to the engineers, but it's @matthewmueller's thought-process on how one might implement this.

When the user runs `prisma status`, we issue a call to the Rust Engine to introspect the database, read and parse the Prisma Schema, then diff the result.

If there is a difference between the Database Schema and the Prisma Schema, we'll display that diff to the user and exit 1. If there isn't any difference, we'll display nothing and exit 0.

![Suggested Implementation](https://www.dropbox.com/s/dfx5ev8qwv2nv1d/Screen%20Shot%202020-04-24%20at%2010.59.33%20AM.png?raw=1)

## Open Questions

1. How do we avoid noise? Like permanent adjustments to the Prisma Schema that aren't present in the database that you want to keep?
