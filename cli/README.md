# CLI

- Stakeholders: @janpio @sorenbs @timsuchanek @nikolasburk
- State:
  - Spec: In Progress 🚧
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
    - [Introspection Configuration](#introspection-configuration)
    - [Inferred Introspection Configuration](#inferred-introspection-configuration)
    - [Disabling Introspection Configuration](#disabling-introspection-configuration)
    - [Considerations for the first-run experience](#considerations-for-the-first-run-experience-1)
- [Generate](#generate)

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

The `prisma introspect` command connects to the specified database and generates a canonical schema representing the database structure. It requires an existing `schema.prisma` file to be present and correctly configured with a `datasource` that points to an accessible database. The existing `schema.prisma` file is overwritten with the new schema, and any manual changes applied to that file are lost.

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

- **schema** specify the path used to read the `schema.prisma` file instead of the default path. Note that the generation result is written to that same file.

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

The Canonical Schema Mapping is designed to ensure that the introspection result is always easy to understand. It is a design goal to not perform any magic. As a result, often it is required to manually extend the schema after introspecting a database. This is tedious and leads to extra work when re-introspecting, because manual edits will be lost.

Introspection Configuration allows the user to change the Canonical Schema Mapping to be in line with patterns used in the database. 

The following configuration options are awailable:

- **fieldPatterns**: Add attributes to a field by matching on its name
- **modelPatterns**: Add attributes to a model by matching on its name

The configuration is stored in a `prismarc.json` file next to the schema.prisma file. The following example will

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

If one or more Introspection Configuration patterns are applied during introspection, the CLI output is amended to include an informational line:

```
Introspection Configuration patterns were applied 7 times. See [link to docs] for details
```

The docs should explain how Introspection configuration works, including how to disable it.

### Inferred Introspection Configuration

If there is no `prismarc.json` file, `prisma introspect` will run a set of heuristics to identify common patterns. If one or more patterns are identified, a `prismarc.json` file is created, and all the patterns are written to it. `prisma introspect` will then proceed as normally, and take the newly created Introspection Configuration into account.

The common patterns are pciked to minimise false positives while providing an easy transition from most popular ORMs, including Sequelize, TypeORM, Objection, ActiveRecord, Hibernate, Laravel. Additionally, it is a goal to provide a smooth upgrade path for Prisma1 users.

List of inferred patterns:

> Note: This list should be moved to a separate introspection spec

**Variations of updatedAt fields**

If a column has any of the names `updatedAt`, `updated_at`, `updated_on`, `updated`, `updateDate`, `updatedDate`, `lastModifiedDate` and is of a type that maps to the Prisma type `DateTime`, the following fieldPattern is added:

```
"@updatedAt": "/^updatedAt|updated_at|updated_on|updated|updateDate|updatedDate|lastModifiedDate$/",
```

**Variations of createdAt fields**

If a column has any of the names `createdAt`, `created_at`, `created_on`, `created`, `createDate`, `createdDate` and is of a type that maps to the Prisma type `DateTime`, the following fieldPattern is added:

```
"@createdAt": "/^createdAt|created_at|created_on|created|createDate|createdDate$/",
```

**UUID**

If a column has the name `id` and native database type `UUID` or `CHAR(36)` or `VARCHAR(36)`, the following pattern is added:

```
"@id @default(uuid())": "/^id$/",
```

**CUID**

If a column has the name `id` and native database type `VARCHAR(24)`, the following pattern is added:

```
"@id @default(cuid())": "/^id$/",
```

### Disabling Introspection Configuration

Introspection Configuration and Inferred Introspection Configuration can be disavled by leaving the `prismarc.json` empty, or set `"fieldPatterns"` to an empty object.

### Considerations for the first-run experience

When a user first approaches Prisma, they will rin `prisma generate` immediadtely after running `prisma init`. As such, there will be no `prismarc.json` file, an the Inferred Introspection Configuration is triggered.

If any patterns are found, the `prismarc.json` file is created and a message is added to the CLI output, indicating how many times patterns were used during introspection. In the event of a false positive, the CLI message will direct the user to the docs describing how to modify or disable the patterns. 

If no patterns are found, the `prismarc.json` file is not created, and no additional message is printed. In the event of a false negative (a missing pattern), there is no way for a new user to discover this functionality. They will observe a less functional generated client, and potentially attempt to manually edit the schema, resulting in loss of those changes at the next introspection run. Addressing this shortcoming would lead to an overly complex product, so we will accept this, and focus on adding new patterns as we learn about them.


# Generate

[Joël - please expand this section to cover all details]

The `prisma generate` command parses the `schema.prisma` file, identifies `generator` blocks and invokes the relevant generators. Currently, we support the single generator `prisma-client-js`. In the future we will provide generators for other languages and support third party generators.

A generator will code-generate a data access client based on the schema. The following will describe how the `prisma-client-js` generator works.

~~~
Generated Prisma Client to ./node_modules/@prisma/client
Done in 1.49s
~~~

### Arguments

The `prisma generate` command can be run without arguments. Additionally, these arguments can be specified:

- **schema** specify the path used to read the `schema.prisma` file instead of the default path. This does not affect the location of the generated artefacts.

### Identifying the npm project

The prisma client is being generated into an npm project. As such, a npm project must first be identified. The generator follows normal npm conventions and will search recursively from the directory where it is invoked, all the way up to the root of the filesystem.

If no npm project is found, it wil run `npm init -y` in the folder where it is invoked to create a new npm project.

### Install @prisma/client

After identifying the npm project, the generator will ensure that the `@prisma/client` package is installed. If it is already present in the `package.json` file, no action is taken. Otherwise [Joël - explain]

> Question: How do we handle the case where `@prisma/client` package has a different version than the CLI/generator?