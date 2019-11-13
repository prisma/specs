# Lift

- Owner: @schickling
- Stakeholders: @matthewmueller @timsuchanek @mavilein
- State:
  - Spec: Outdated 🚨
  - Implementation: Unknown ❔

Lift is Prisma's declarative migration system. Rather than scripting your migrations by hand, Lift allows you to describe how you want the structure of your
data to look after the migration and Lift will take care of generating the necessary steps to get you there.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


  - [A Brief History](#a-brief-history)
  - [The Lift Approach](#the-lift-approach)
  - [Concepts](#concepts)
    - [Project](#project)
    - [Schema](#schema)
    - [Migration](#migration)
    - [Step](#step)
    - [Hook](#hook)
    - [Destructive Changes](#destructive-changes)
  - [Migration History](#migration-history)
  - [Architecture](#architecture)
    - [Lift Client](#lift-client)
      - [Save](#save)
      - [Up](#up)
      - [Down](#down)
    - [Lift Engine](#lift-engine)
  - [Lift CLI](#lift-cli)
    - [`prisma2 lift --help`](#prisma2-lift---help)
    - [`lift save --help`](#lift-save---help)
    - [`lift save`](#lift-save)
    - [`prisma2 lift up --help`](#prisma2-lift-up---help)
    - [`prisma2 lift up`](#prisma2-lift-up)
    - [`prisma2 lift down --help`](#prisma2-lift-down---help)
    - [`prisma2 lift down`](#prisma2-lift-down)
    - [`prisma2 dev`](#prisma2-dev)
  - [FAQ](#faq)
    - [How can you rename a model in Lift?](#how-can-you-rename-a-model-in-lift)
  - [Open Questions](#open-questions)
    - [Will we generate high-level language clients for the hooks?](#will-we-generate-high-level-language-clients-for-the-hooks)
      - [Up & Down in migration scripts](#up--down-in-migration-scripts)
      - [Transactional/rollback behavior of migration scripts](#transactionalrollback-behavior-of-migration-scripts)
    - [Support migration squashing?](#support-migration-squashing)
    - [Locking the database during migration to prevent data corruption?](#locking-the-database-during-migration-to-prevent-data-corruption)
    - [How to solve Merge Conflicts?](#how-to-solve-merge-conflicts)
    - [Supporting the draft mode?](#supporting-the-draft-mode)
  - [Prior Migration Systems](#prior-migration-systems)
    - [Go](#go)
    - [Python](#python)
    - [PHP](#php)
    - [Java](#java)
    - [Node.js](#nodejs)
    - [Ruby](#ruby)
- [Unresolved questions](#unresolved-questions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## A Brief History

Migration systems are used to safely evolve your application's data model over time.

They often use a folder structure that looks like this:

```
migrations/
├── 001_setup.down.sql
├── 001_setup.up.sql
├── 002_convo.down.sql
├── 002_convo.up.sql
├── 003_tempo.down.sql
├── 003_tempo.up.sql
├── 004_eventids.down.sql
├── 004_eventids.up.sql
├── 005_update_pricing.down.sql
├── 005_update_pricing.up.sql
```

The numbers determine the order the migrations should be performed in. We first run `001`, then `002`, etc. The `up` and `down` determine the direction we're
migrating. If we're migrating up, we'll run the `up` scripts, if we're migrating down, we'll run the `down` scripts.

Traditionally, you write migrations by hand to migrate your database.

```sql
alter type report_status rename to report_status_old;
create type report_status as enum('ASKED','SKIP','COMPLETE','PENDING');
alter table reports alter column "status" drop default;
alter table reports alter column "status" type report_status using "status"::text::report_status;
alter table reports alter column "status" set default 'ASKED';
drop type report_status_old;
```

This is error-prone and stressful, especially when you're operating on your production data.

## The Lift Approach

Prisma's Lift works differently. While Lift still has a `migrations/` folder, the migrations are generated for you. With Lift, you just need to change your
`schema.prisma` file and run `lift save`. This will generate the necessary steps to transition your schema from A to B.

A result might look like this:

```diff
model Blog {
  id         Int      @id
+  website    String   @unique
  posts      Post[]
  created_at DateTime
}

model Post {
  id         Int       @id
-  title      String
+  slug      String
  author_id  User?
  blog_id    Blog?
  comments   Comment[]
  created_at DateTime
}

+model Comment {
+  id         Int      @id
+  post_id    Post?
+  comment    String
+  created_at DateTime
+}
```

## Concepts

Lift has the following concepts: projects, migrations, steps, and hooks.

- A _project_ has many _migrations_
- A _migration_ has many _steps_
- A _migration_ has many _hooks_

### Project

Your application project contains a `migrations/` that has many migrations.

### Schema

Every Project contains a Schema. This schema describes the structure of your datasource. Often you will find the project's Schema in the `schema.prisma` file,
but the Schema may be named differently or spread over many files.

### Migration

A Migration is a grouping of one or more Steps. Each migration lives in it's own folder. Migrations run in a transaction if the datasource allows it.

### Step

Steps are actions that resolves into zero or more database commands. Steps generically describe models, fields and relationships, so they can be easily
translated to datasource-specific migration commands.

<details>
<summary>CreateModel</summary>

<pre>
type CreateModel = {
    model: string
}
</pre>

</details>
<details>
<summary>UpdateModel</summary>

<pre>
type UpdateModel = {
    model: string

    new_name?: string
}
</pre>


</details>
<details>
<summary>DeleteModel</summary>

<pre>
type DeleteModel = {
    model: string
}
</pre>


</details>
<details>
<summary>CreateDirective</summary>

<pre>
type DirectiveArgument = {
    name: string
    // a prisma schema expression serialized as a string
    value: string 
}

type CreateDirective = {
    // One of `model` or `enum` is always present.
    model?: string
    field?: string
    enum?: string
    directive: string
    // The arguments of the directive are required to match directives that can be repeated,
    // like `@@unique` on a model. This field is omitted when matching can be done without comparing
    // the arguments, and present when a directive should be matched exactly.
    arguments?: Array<DirectiveArgument>
}
</pre>

</details>
<details>
<summary>DeleteDirective</summary>

<pre>
type DirectiveArgument = {
    name: string
    // a prisma schema expression serialized as a string
    value: string
}

type DeleteDirective {
    // One of `model` or `enum` is always present.
    model?: string
    field?: string
    enum?: string
    directive: string
    // The arguments of the directive are required to match directives that can be repeated,
    // like `@@unique` on a model. This field is omitted when matching can be done without comparing
    // the arguments, and present when a directive should be matched exactly.
    arguments?: Array<DirectiveArgument>
}
</pre>

</details>
<details>
<summary>CreateDirectiveArgument</summary>

<pre>
type CreateDirectiveArgument = {
    // One of `model` or `enum` is always present.
    model?: string
    field?: string
    enum?: string
    directive: string
    argument: string,
    // a prisma schema expression serialized as a string
    value: string
}
</pre>

</details>
<details>
<summary>UpdateDirectiveArgument</summary>

<pre>
type UpdateDirectiveArgument = {
    // One of `model` or `enum` is always present.
    model?: string
    field?: string
    enum?: string
    directive: string
    argument: string,

    // a prisma schema expression serialized as a string
    new_value: string
}
</pre>

</details>
<details>
<summary>DeleteDirectiveArgument</summary>

<pre>
type DeleteDirectiveArgument = {
    // One of `model` or `enum` is always present.
    model?: string
    field?: string
    enum?: string
    directive: string
    argument: string,
}
</pre>

</details>
<details>
<summary>CreateField</summary>

<pre>
type CreateField = {
    model: string
    field: string
    type: string
    arity: "required" | "optional" | "list"
}
</pre>

</details>
<details>
<summary>DeleteField</summary>

<pre>
type DeleteField = {
    model: string
    field: string
}
</pre>

</details>
<details>
<summary>UpdateField</summary>

<pre>
type UpdateField = {
    model: string
    field: string

    new_name?: string
    type?: string
    arity?: "required" | "optional" | "list"
}
</pre>


</details>
<details>
<summary>CreateEnum</summary>

<pre>
type CreateEnum = {
    enum: string
    values: Array<string>
}
</pre>

</details>
<details>
<summary>UpdateEnum</summary>

<pre>
type UpdateEnum = {
    enum: string

    new_name?: string
    created_values?: Array<string>
    deleted_values?: Array<string>
}
</pre>


</details>

<details>
<summary>DeleteEnum</summary>

<pre>
type DeleteEnum = {
    enum: string
}
</pre>

</details>

### Hook

> ⚠ This is not implemented yet. See [tracking issue](https://github.com/prisma/prisma2/issues/817)

A hook is a custom shell script that runs either before or after the migration. They are defined by `before.sh` and `after.sh`. Hooks give you more control over
your migrations. You can write hooks to:

- Ensure the data follows new constraints like `unique` or `non null`.
- Add specific database primitives like functions in Postgres, which are not yet supported by Prisma.
- Seed the database with data after a migration has been executed.

### Destructive Changes

Destructive changes occur when a migration **will** cause data loss. We will warn you first about destructive changes. This can happen when you:

- remove a table that contains data
- remove a field that contains data
- alter a field that contains a data

By "alter a field", we mean any of the following cases:

- The type of the field changed
- The nullability of the field changed
- An index was added, removed or changed on the field

## Migration History

When a migration is running or has been executed successfully, Prisma writes this information into a table or collection in the database. This table is known as
the **Migration History**. It includes all successful and failed migrations of the specific Prisma Project. We store the migration history so that Prisma can:

- Make sure that the local migrations are in sync with the databases migrations
- Ensure that migrations don't get run twice
- Give an overview in a GUI interface about the currently running migration and migrations that already have been running
- Rollback migrations when there has been an error

## Architecture

Lift has 2 parts: a **Lift Client** and a **Lift Engine**. By default, the Lift Engine runs locally as a
[sidecar process](https://blog.davemdavis.net/2018/03/13/the-sidecar-pattern/). This makes it easy to get started. As your team's data requirements become more
complex, you may prefer to handle your migrations on a remote host where you have fine-grained access control over migrations. We will make this possible in the
future.

```
┌──────────────────┐       ┌──────────────────┐      ┌──────────────┐
│                  │       │                  │      │   Postgres   │
│   Lift Client    │       │   Lift Engine    │     ┌┴────────────┬─┘
│                  │       │                  │     │    MySQL    │
└──────────────────┘       └──────────────────┘     └────────┬────┘
          │          save            │                     │ │
          ├────────────┐             │        infer        │ │
          │            └────────────▶│──────────┬┐         │ │
          │                          │          └┼────────▶│ │
          │                          │           └─────────┼▶│
          │                          │      migration      │ │
          │        migration         │          ┌──────────┤ │
          │            ┌─────────────│◀─────────┴──────────┼─┤
          │◀───────────┘             │                     │ │
          │                          │                     │ ▼
          ▼                          ▼                     ▼
```

### Lift Client

The Lift Client is built into the Prisma 2 CLI but is also accessible programmatically in the Prisma SDK. The Lift Client has 3 methods:

#### Save

Save method takes the difference of your schema file with the current state of your datasources and creates a migration folder. This migration folder contains
the steps to sync your datasources with your schema file. The template of the migration folder is `${current_timestamp}-${migration-name}/`

```
migrations/
  └─ 20190920142118-initial/
    └─ steps.json
    └─ schema.prisma
    └─ README.md
```

A migration folder contains 3 files:

- **steps.json:** contains a JSON list of steps to run against the database. Steps contains only the up steps, the down steps are calculated on the fly.
- **schema.prisma:** contains a snapshot of your `schema.prisma` file at a specific point in time after the migration has occurred.
- **README.md:** contains information about the migration. Includes the underlying raw commands (e.g. SQL) that run against the datasource.
- **before.sh:** optional [hook](#hook) you can run before migrating your schema.
- **after.sh:** optional [hook](#hook) you can run after migrating your schema.

**Note:** Save does not run migrations, it simply creates them.

#### Up

Up runs your outstanding migrations against the datasources, synchronizing the datasources with your schema file. Up depends on the migrations generated by the
Save method.

Up runs the unapplied `up` scripts in ascending order by the migration's timestamp. For example, if we have the following migrations directory:

```
migrations/
  └─ 20190920142118-initial/
    └─ steps.json
    └─ schema.prisma
    └─ README.md
    └─ before.sh
    └─ after.sh
  └─ 20190920142120-add-user/
    └─ steps.json
    └─ schema.prisma
    └─ README.md
    └─ before.sh
    └─ after.sh
```

The order of execution is the following:

1. `20190920142118-initial/before.sh`
2. `20190920142118-initial/steps.json`
3. `20190920142118-initial/after.sh`
4. `20190920142120-add-user/before.sh`
5. `20190920142120-add-user/steps.json`
6. `20190920142120-add-user/after.sh`

If the project schema and the remote database are in sync, then we will inform the reader that no changes need to be made. If there are changes that need to be
made, we'll provide a visual diff of the changes to the user and ask for confirmation before proceeding.

#### Down

Down rolls back the migrations you've applied against your datasources.

Down runs the `down` scripts in descending order by the migration's timestamp. For example, if we have the following migrations directory:

```
migrations/
  └─ 20190920142118-initial/
    └─ steps.json
    └─ schema.prisma
    └─ README.md
    └─ before.sh
    └─ after.sh
  └─ 20190920142120-add-user/
    └─ steps.json
    └─ schema.prisma
    └─ README.md
    └─ before.sh
    └─ after.sh
```

The order of execution is the following:

1. `20190920142120-add-user/after.sh`
2. `20190920142120-add-user/steps.json`
3. `20190920142120-add-user/before.sh`
4. `20190920142118-initial/after.sh`
5. `20190920142118-initial/steps.json`
6. `20190920142118-initial/before.sh`

If the project schema and the remote database are in sync, then we will inform the reader that no changes need to be made. If there are changes that need to be
made, we'll provide a visual diff of the changes to the user and ask for confirmation before proceeding.

### Lift Engine

The Lift Engine is a low-level interface that the Lift Client communicates with. Currently the client communicates to the migration engine in the JSONRPC format
over stdio. In the future, we'll provide an HTTP API to communicate with the Lift Engine.

## Lift CLI

The Lift CLI is a subcommand of the `prisma2` CLI.

### `prisma2 lift --help`

Shows the help menu for `lift`

```sh
Migrate your database with confidence

Usage

  prisma2 lift [command] [options]

Options

  -h, --help   Display this help message

Commands

    save   Create a new migration
    docs   Open documentation in the browser
    down   Migrate your database down
      up   Migrate your database up

Examples

  Create new migration
  $ prisma2 lift save

  Migrate up to the latest datamodel
  $ prisma2 lift

  Preview the next migration without migrating
  $ prisma2 lift up --preview

  Rollback a migration
  $ prisma2 lift down 1

  Get more help on a lift up
  $ prisma2 lift up -h
```

### `lift save --help`

Shows the help menu for `lift save`

```sh
Save a migration

Usage

  prisma migrate save [options]

Options

  -h, --help       Displays this help message
  -n, --name       Name the migration
  -c, --create-db  Create the database in case it doesn't exist

Examples

  Create a new migration
  $ prisma2 lift save

  Create a new migration by name
  $ prisma2 lift save --name "add unique to email"
```

### `lift save`

Saves a snapshot of the schema as a migration

```sh
? Name of migration › <readline>

Local schema Changes:

  model User {
    id Int @id
    createdAt DateTime @map("created_at")
    email String @unique
  - firstName String @map("first_name")
  + givenName String @map("given_name")
    lastName String @map("last_name")
    location String
    posts Post[]

    @@map("users")
  }

Lift just created your migration:

  migrations/
    └─ 20190930142541-init/
      └─ steps.json
      └─ schema.prisma
      └─ README.md

Run `prisma2 lift up` to apply the migration
```

You may lose data if you delete a model or delete a field. Sometimes this is an accident. In these cases, we will try to warn the user about data loss.

⚠️ You are about to drop the table User, which is not empty (11 rows).

To get this row count (e.g. "11 rows"), we need to query the data. On large databases, this can be slow. To handle this, we set a timeout. If the timeout
expires before we get the row count back, we cancel the query and warn with:

⚠️ You are about to drop the table User which will lead to data loss.

### `prisma2 lift up --help`

Shows the help message for `lift up`

```
Migrate your database up to a specific state.

Usage

  prisma2 lift up [<inc|name|timestamp>]

Arguments

  [<inc>]   go up by an increment [default: latest]

Options

  --auto-approve   Skip interactive approval before migrating
  -h, --help       Displays this help message
  -p, --preview    Preview the migration changes

Examples

  Save a new migration, then migrate up
  $ prisma2 lift save --name "add unique to email"
  $ prisma2 lift up

  Preview a migration without migrating
  $ prisma2 lift up --preview

  Go up by one migration
  $ prisma2 lift up 1

  Go up by to a migration by timestamp
  $ prisma2 lift up 20190605204907

  Go up by to a migration by name
  $ prisma2 lift up "add first_name field"
```

### `prisma2 lift up`

Applies the migrations against the datasources. The following example shows how renaming a field, adding a model and removing a model would look:

```
  model User {
    id Int @id
    createdAt DateTime @map("created_at")
    email String @unique
-   firstName String @map("first_name")
    givenName String @map("given_name")
    lastName String @map("last_name")
    location String
    posts Post[]
    @@map("users")
  }

+ model Post {
+   id Int @id
+   author User
+   title String
+  }

- model Comment {
-  id Int @id
-  comment Text
- }

Checking the datasource for potential data loss...

⚠️ You are about to drop the Comment table, which is not empty (11 rows).

Are you sure you want to apply this change? [y/N]: y

Applying your changes...

|----------|---------------------|--------------------------|
| Status   | Migration           | Raw Commands             |
|----------|---------------------|--------------------------|
| Complete | 20190930142541-init | ALTER TABLE User     ... |
|          |                     | CREATE TABLE Post    ... |
|          |                     | DROP TABLE Comment   ... |
|----------|---------------------|--------------------------|

You can get more information about the migrations with
`prisma2 lift up --verbose` or read about them in
`migrations/20190930142541-init/README.md`.

Done with 1 migration in 250ms.
```

Up will always ask you to confirm a migration. You can use `lift up --auto-approve` to accept the changes non-interactively.

### `prisma2 lift down --help`

Display a help message for lift down.

```
Migrate your database down to a specific state.

Usage

  prisma lift down [<dec|name|timestamp>]

Arguments

  [<dec>]   go down by an amount [default: 1]

Options

  --auto-approve   Skip interactive approval before migrating
  -h, --help       Displays this help message
  -p, --preview    Preview the migration changes

Examples

  Preview a migration without migrating
  $ prisma migrate down --preview

  Rollback a migration
  $ prisma migrate down 1

  Go down to a migration by timestamp
  $ prisma migrate down 20190605204907

  Go down to a migration by name
  $ prisma migrate down "add first_name field"
```

### `prisma2 lift down`

Rollback the previous migration

```
Rolling back `20190930142541-init`

  model User {
    id Int @id
    createdAt DateTime @map("created_at")
    email String @unique
  - givenName String @map("given_name")
  + firstName String @map("first_name")
    lastName String @map("last_name")
    location String
    posts Post[]
    @@map("users")
  }

Database Changes:

|----------|---------------------|--------------------------|
| Status   | Migration           | Raw Commands             |
|----------|---------------------|--------------------------|
| Complete | 20190930142541-init | ALTER TABLE users    ... |
|          |                     | ALTER TABLE comments ... |
|----------|---------------------|--------------------------|

You can get more information about the migrations with
`prisma2 lift down --verbose` or read about them in
`migrations/20190930142541-init/README.md`.

Rolled back with 1 migration in 88ms.
```

### `prisma2 dev`

Prisma also ships with a development command that makes developing an application with Prisma easier.

`prisma2 dev` is responsible for schema watching, auto-migrating and photon code generation. In this section we'll just cover migrations.

Migrating your data during development is cumbersome and breaks your flow. To make this workflow more convenience, migrations during development are
automatically saved under the `./migrations/dev/` subfolder:

```
migrations/
├── 20190930142202-init
│   ├── README.md
│   ├── schema.prisma
│   └── steps.json
├── 20190930142232-add-more
│   ├── README.md
│   ├── schema.prisma
│   └── steps.json
├── 20190930142257-rename
│   ├── README.md
│   ├── schema.prisma
│   └── steps.json
├── 20190930142541-init
│   ├── README.md
│   ├── schema.prisma
│   └── steps.json
├── dev
│   ├── watch-20191010154550
│   │   ├── README.md
│   │   ├── schema.prisma
│   │   └── steps.json
│   └── watch-20191010154559
│       ├── README.md
│       ├── schema.prisma
│       └── steps.json
└── lift.lock
```

In addition to saving the migration steps, migrations during development are applied automatically with `lift up --auto-approve`. Data loss may occur during
this step, but during development it is not a big problem.

Next, when you run `lift save`, it will collapse the `./migrations/dev/watch-*` migrations into 1 migration and remove the `dev` folder.

## FAQ

### How can you rename a model in Lift?

To rename a field, you'll add an `UpdateModel` step in your **steps.json** file directly.

## Open Questions

Unimplemented sections from the previous spec that I think we'll want to revisit after some time away.

### Will we generate high-level language clients for the hooks?

Let's say that after Prisma has migrated the database to the datamodel defined in `migrate/20190322092247-my-initial-migration/`, you want to insert some seed
data. The way you can do this, is by either defining a shell script or an executable, either called `before.EXT`, while EXT is your favorite file extension as
`.sh` or `.js` or `after.EXT`. A file just called `before` or `after` is also valid.

Which file will be executed when is decided by a convention. When the Prisma CLI opens a migration folder, it will perform the following actions:

1. Check if there is only maximum one file with the `after` prefix and only maximum one file with the `before` prefix.
2. Check for the existence of a before file and try to execute it. The following filenames are valid:

| Filename    | Action         |
| ----------- | -------------- |
| before.sh   | sh before.sh   |
| before.bash | bash before.sh |
| before      | ./before       |
| before.js   | ./before.js    |
| before.ts   | ./before.ts    |

3. Migrate the datamodel
4. Check for the existence of an after file and try to execute it. The following filenames are valid:

| Filename   | Action        |
| ---------- | ------------- |
| after.sh   | sh after.sh   |
| after.bash | bash after.sh |
| after      | ./after       |
| after.js   | ./after.js    |
| after.ts   | ./after.ts    |

#### Up & Down in migration scripts

In order to revert a migration in the case of a rollback, we need to distinguish between `up` (applying the migration) and `down` (reverting the migration). We
call this the **Migration Direction**. The direction of a migration is being passed in to a migration script using the env var `DIRECTION`. This can then e.g.
be accessed from a bash script with `echo $DIRECTION`.

#### Transactional/rollback behavior of migration scripts

The main question is this: If a migration script fails (exists with a non-zero exit code) after the datamodel has been migrated, should the datamodel be rolled
back to the state before? The answer is yes. If you don't want the datamodel migration to be rolled back, make sure, that your migration script will not return
a non-zero exit code, by e.g. using `try` `catch` in Node.js or adding an `|| echo ""` behind the potentially failing command.

### Support migration squashing?

Let's say you use the migrations system for a couple of years and you accumulated over 1000 migrations. All your Prisma instances already include these changes,
so there is no point of storing migrations that are years old. If you decide that you don't need the first 500 migrations, you can simply delete these folders.
Note that you can't delete folders in between migrations, it always has to happen right from the beginning.

### Locking the database during migration to prevent data corruption?

**TODO** Clarify the current state of this with Tim and Marcus

While performing a migration like turning an optional relational into a required one, it may be beneficial to apply a lock on the database to prevent data
corruption. We need to find out here if this should run on Prisma application level or in the individual database. It should be configurable to add this lock.
Probably it's something Prisma will provide in the future with the Prisma server but not with the Prisma binary.

### How to solve Merge Conflicts?

Let's say Alice and Bob start developing in their own branches based on the following datamodel:

```graphql
model User {
  id: ID! @id
  name: String
  address: String
}
```

And these migrations:

```bash
.
└── migrate
    ├── 1
    │   └── datamodel.mdl
    └── 2
        └── datamodel.mdl
```

`1` and `2` are just used for illustration, we're using timestamps in the real world.

Alice removes the `address` field and creates a new migration `4`.

```graphql
model User {
  id: ID @id
  name: String
}
```

```bash
.
└── migrate
    ├── 1
    │   └── datamodel.mdl
    ├── 2
    │   └── datamodel.mdl
    └── 4
        └── datamodel.mdl
```

Her changes get deployed to production. Bob now pulls her changes and finds a merge conflict.

His `migrate` folder will look like this:

```bash
.
└── migrate
    ├── 1
    │   └── datamodel.mdl
    ├── 2
    │   └── datamodel.mdl
    ├── 3
    │   └── datamodel.mdl
    └── 4
        └── datamodel.mdl
```

The main `datamodel.mdl` file will look like this:

```graphql
model User {
  id: ID @id
  name: String
  address: String?
  posts: [Post]
}

model Post {
  id: ID @id
  title: String
}
```

He now can clearly see, that in the `master` branch the field `posts` has been removed. Git is pointing him here to the merge conflict. Another important
conflict, where Git doesn't help us are the migration folders `3` and `4`.

The right way to solve this conflict is the following:

```
$ prisma migrate rollback # rollbacks 3
```

Now he renames `3` to `5`, so that his changes comes after `4`. He can confirm locally with a `prisma migrate` to his local machine that the change works and
push to production. The production system will now pick up the new `5` migration and apply it.

There is an infinite amount of conflict scenarios, so we're stopping here and won't go deeper into them. What matters is this: Prisma will be able to help
developers solving migration conflicts based on the _local migration history_ and the _remote migration history_.

### Supporting the draft mode?

In the previous scenario it was quite easy to reason about the conflict resolution, as we just had to look into one migration from Alice and one from Bob. Let's
say that Alice had pushed 10 new migrations and the same for Bob, he also performed 10 migrations. This would be a very complicated situation to reason about.
In order to circumvent this issue, we strongly advice users to do two things:

1. Name your migrations. This will help your team to understand what happened in there
2. Group all your changes into as few migrations as possible. This way conflict resolution is way easier.

In order to make "grouping" or accumulating multiple schema changes into one migration, we introduce the `prisma migrate draft` command. With this command,
changes will be applied to the database without creating a new migration. As soon as you're happy with all the changes, you can execute `prisma migrate`, which
empties the draft and puts all accumulated changes into one new migration.

## Prior Migration Systems

### Go

- [Go Migrate](https://github.com/golang-migrate/migrate) Up & Down migrations
- [Goose](https://github.com/pressly/goose) Up & Down migrations
- [Go PG Migrations](https://github.com/robinjoseph08/go-pg-migrations) Mix between [go-pg/migrations](https://github.com/go-pg/migrations) and
  [Knex](https://knexjs.org/)
- [Gormigrate](https://github.com/go-gormigrate/gormigrate) Programmatic API with structs

### Python

- [Django](https://docs.djangoproject.com/en/2.1/topics/migrations/) Django style fixtures
- [Alembic](https://pypi.org/project/alembic/) Belongs to SQLAlchemy

### PHP

- [CakePHP - Phinx](https://github.com/cakephp/phinx) Belongs to CakePHP
- [Doctrine](https://www.doctrine-project.org/projects/doctrine-migrations/en/2.0/reference/managing-migrations.html#managing-migrations) Mix between PHP and
  SQL
- [Laravel Database: Migrations](https://laravel.com/docs/5.8/migrations)

### Java

- [Flyway](https://flywaydb.org/) Standalone migration tool, enterprise-grade. Up & Down.

### Node.js

- [Knex](https://knexjs.org/#Migrations)
- [Sequelize](http://docs.sequelizejs.com/manual/migrations.html)

### Ruby

- [Active Record](https://edgeguides.rubyonrails.org/active_record_migrations.html)

# Unresolved questions

- [ ] Transaction behavior (also when running scripts)
- [ ] Spec out how migration "hooks" are working (e.g. `before.up.sql`) as it's depending on individual connectors
- [ ] Spec out CLI output of each migration related command
- [ ] 3 migration modes (1. delete all data, 2. keep data + downtime, 3. keep data + zero downtime)
  - [ ] How to simplify renames for local development. Ideas:
    - `prisma dev`: interactive double list select?
    - Prisma Admin feature
- [ ] How do migrations work from a SDK perspective
  - [ ] Is there a programmatic abstraction that works without files? (Might be needed for TypeGraphQL)
