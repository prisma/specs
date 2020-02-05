# CLI

- Stakeholders: @janpio @sorenbs @timsuchanek @nikolasburk
- State:
  - Spec: In Progress 🚧
  - Implementation: In Progress 🚧

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Problem, Idea, Concept](#problem-idea-concept)
- [Use Cases](#use-cases)
- [Installation](#installation)
- [Commands](#commands)
  - [Setup Prisma](#setup-prisma)
  - [Create datamodel based on existing database](#create-datamodel-based-on-existing-database)
  - [Iterate on datamodel](#iterate-on-datamodel)
    - [Interactive](#interactive)
    - [Non-Interactive](#non-interactive)
  - [Migrate datamodel](#migrate-datamodel)
  - [Generate Photon](#generate-photon)
  - [Convert Prisma 1.x service configuration to Prisma Framework schema file](#convert-prisma-1x-service-configuration-to-prisma-framework-schema-file)
- [Error Handling](#error-handling)
- [Other Functionality](#other-functionality)
  - [Help](#help)
  - [Proxy Support](#proxy-support)
- [Design Document](#design-document)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Background

Prisma CLI offers essential workflows to Prisma users, including introspecting databases and generating a typesafe data-access client.

> Note: During the Prisma 2 preview period, the cli command is `prisma2`. In this spec we will refer to is simply as `prisma` as that will be the name when we publish the first release candidate.

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

~~~
✔ Your Prisma schema was created at prisma/schema.prisma.
  You can now open it in your favorite editor.

Next steps
1. Set your DB connection string as the `url` of the `datasource` block.
2. Run prisma introspect to test the connection and obtain your data model.
3. Run prisma generate to generate Prisma Client.

You can then start using Prisma Client in your application:

```
import { PrismaClient } from '@prisma/client'
// or const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

```

More information in our documentation:
https://pris.ly/d/getting-started
~~~

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

```
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
# See the documentation for all the connection string options: https://github.com/prisma/prisma2/tree/master/docs/core/connectors

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

The `prisma introspect` command connects the the specified database and generates a canonical schema representing the database structure. It requires an existing `schema.prisma` file to be present and correctly configured with a `datasource` that points to an accessible database. The existing `schema.prisma` file is overwritten with the new schema, and any manual changes applied to that file are lost.

~~~
Introspecting based on datasource defined in schema.prisma …
Done with introspection in 2.48s
~~~

If a connection to the database can not be established, an error is printed:

```
Introspecting based on datasource defined in prisma/schema.prisma …
Error: P1000

Authentication failed against database server at `localhost`, the provided database credentials for `johndoe` are not valid.

Please make sure to provide valid database credentials for the database server at `localhost`.
```

### Arguments

The `prisma introspect` command can be run without arguments. Additionally, these arguments can be specified:

- **path** specify the path used to read the `schema.prisma` file instead of the default path. Note that the generation result is written to that same file.

### Canonical Schema Mapping

The Prisma Schema is a reflection of the structure of a database. The Prisma Schema can express more information than the database schema. This is a problem for the `prisma introspect` command, as it needs to produce a single schema for any given database. The Canonical Schema Mapping describes the defaults picked by the introspection command for all ambiguos cases. See the Introspection Spec for the full details.

For example, it is common for ORMs to automatically keep a column up to date with the latest time the record was updated. The column is typically called something like `updatedAt` or `updated_at`. Prisma provides similar functionality, but does not rely on name conventions to decide when to enable this behavior. Instead, an explicit schema attribute is used to enable this behaviour:

```
model User {
  lastUpdateTime DateTime @updatedAt
}
```

During introspection, the Canonical Schema Mapping is used to decide if a field should have the `@updatedAt` attribute applied. It dictates that this should never happen.

### Introspection Configuration

The Canonical Schema Mapping is designed to ensure the introspection result is always easy to understand. It is a design goal to not perform any magic. As a result, often it is required to manually extend the schema after introspecting a database. This is tedious and leads to extra work when re-introspecting, because manual edits will be lost.

Introspection Configuration allows the user to change the Canonical Schema Mapping to be in line with patterns used in the database. 

The following configuration options are awailable:

- **fieldPatterns**: Add attributes to a field by matching on its name
- **modelPatterns**: Add attributes to a model by matching on its name

The configuration is stored in a `prismarc.json` file. The following example will

- add the `@updatedAt` attribute to all fields called updatedAt or updated_at
- add the `@createdAt` attribute to all fields called createdAt
- add `@id` and `@default(cuid)` attributes to all fields that end with _id.

```
{
  "introspection": {
    fieldPatterns: {
      "@updatedAt": "/^updatedAt|updated_at$/",
      "@createdAt": "/^createdAt$/",
      "@id @default(cuid())": "/_id$/",
    }
  }
}
```

> Note: I am not wild about the format itself, but it can be changed in the future

See the full Prisma Config spec for more details

### Inferred Introspection Configuration

### Considerations for the first-run experience

# Generate


