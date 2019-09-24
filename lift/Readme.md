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
    - [Migration](#migration)
    - [Step](#step)
    - [Hook](#hook)
  - [Architecture](#architecture)
    - [Lift Client](#lift-client)
      - [Save](#save)
      - [Up](#up)
      - [Down](#down)
    - [Lift Engine](#lift-engine)
      - [`inferMigrationSteps`](#infermigrationsteps)
      - [`applyMigration`](#applymigration)
      - [`unapplyMigration`](#unapplymigration)
      - [`calculateDatamodel`](#calculatedatamodel)
      - [`calculateDatabaseSteps`](#calculatedatabasesteps)
      - [`listMigrations`](#listmigrations)
      - [`migrationProgress`](#migrationprogress)
  - [Open Questions](#open-questions)
    - [How can you rename a model in Lift?](#how-can-you-rename-a-model-in-lift)
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

### Migration

A Migration is a grouping of one or more Steps. Each migration lives in it's own folder. Migrations run in a transaction if the datasource allows it.

### Step

A Step is a single command that we'll run against the database. Steps describe models, fields and relationships generically, so they can be easily translated to
datasource-specific migration commands.

<details>
<summary>CreateModel</summary>

**TODO**

</details>
<details>
<summary>UpdateModel</summary>

**TODO**

</details>
<details>
<summary>DeleteModel</summary>

**TODO**

</details>
<details>
<summary>CreateField</summary>

**TODO**

</details>
<details>
<summary>DeleteField</summary>

**TODO**

</details>
<details>
<summary>UpdateField</summary>

**TODO**

</details>
<details>
<summary>CreateEnum</summary>

**TODO**

</details>
<details>
<summary>UpdateEnum</summary>

**TODO**

</details>
<details>
<summary>DeleteEnum</summary>

**TODO**

</details>

### Hook

> ⚠ This is not implemented yet.

A hook is a custom shell script that runs either before or after the migration. They are defined by `before.sh` and `after.sh`. Hooks give you full control over
your migrations. You can write hooks to:

- Ensure the data follows new constraints like `unique` or `non null`.
- Add specific database primitives like functions in Postgres, which are not yet supported by Prisma.
- Seed the database with data after a migration has been executed.

## Architecture

Lift has 2 parts: a **Lift Client** and a **Lift Engine**. By default, the Lift Engine runs locally as a
[sidecar process](https://blog.davemdavis.net/2018/03/13/the-sidecar-pattern/). This makes it easy to get started. As your team's data requirements become more
complex, you may prefer to handle your migrations on a remote machine where you have fine-grained access control over migrations.

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
- **before.sh:** optional hook you can run before migrating your schema.
- **after.sh:** optional hook you can run after migrating your schema.

**Note:** `migrate save` does not run migrations, it simply creates them.

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

### Lift Engine

The Lift Engine is a low-level interface that the Lift Client communicates with. Currently the client communicates to the migration engine in the JSONRPC format
over stdio. In the future, we'll migrate this to REST or JSONRPC over HTTP.

> ⚠ **Note** This API is subject to change

#### `inferMigrationSteps`

Calculates the Steps needed to transition the datasources from the current state to the next state. This is called by the Save method in the Lift Client.

#### `applyMigration`

Applies the Steps we inferred. This is called by the Up method in the Lift Client.

#### `unapplyMigration`

Unapplies the previous Step in the migrations folder. This is called by the Down method in the Lift Client.

#### `calculateDatamodel`

Used to render the resulting datamodel into the Readme of the migration folder

**TODO:** Double-check with Tim to see if this is still necessary

#### `calculateDatabaseSteps`

Calculate the database steps when a certain migration has not been executed yet. It answers the question:

- What would the database steps be if the we assume that the migration steps have been applied already? This can happen when you have multiple unapplied
  migrations after calling the Save method multiple times before calling Up.

**TODO:** Double-check with Tim to see if this is still necessary. This may not be needed anymore as lots of assumed steps is also available in
`inferMigrationSteps` now.

#### `listMigrations`

Lists the migrations we've currently applied to the datasources.

#### `migrationProgress`

Migrations can take a long time to complete. `migrationProgress` returns the progress of the currently running migration.

## Open Questions

Unimplemented sections from the previous spec that I think we'll want to revisit after some time away.

### How can you rename a model in Lift?

The very nature of the declarative datamodel introduces ambiguities for transitions between two datamodels. One of these ambiguities is renaming a field.

If we have the following datamodel:

```graphql
model User {
  id: ID @id
  name: String
  address: String
}
```

And want to rename the `name` field, it's not clear if it should be renamed based on the `address` field or the `name` field:

```graphql
model User {
  id: ID @id
  name2: String
  address2: String
}
```

For the reader it's very clear what should happen, whereas it's not trivial to detect this programmatically as we can't rely on the order of fields in the
datamodel. The migration engine doesn't know, if it should rename `name` to `name2` or `name` to `address2` and vise versa. Maybe we even want to delete the
`name` field with all its data and create a new field called `name2`? Information for this transition between datamodels is needed.

One way to solve this is using the `@db` directive:

```graphql
model User {
  id: ID @id
  name: String @db(name: "name2")
  address: String @db(name: "address2")
}
```

This however may not be the desired outcome, because the underlying column still has the same name. The solution for this is, that the user manually edits the
`datamodel.prisma` file in the migration folder like this:

```graphql
model User {
  id: ID @id
  name: String @rename(oldName: "name2")
  address: String @rename(oldName: "address2")
}
```

There is another information, which the user may want to attach to a specific migration, which is the migration value. When already having 100 nodes in the
database and introducing a new field, you may want to define a value, which all of these nodes will have as a default, that is different from the default for
all new nodes that will be created. In order to address that, you can do the following change in the `datamodel.prisma` file in the migration folder.

```graphql
model User {
  id: ID @id
  firstName: String!
  lastName: String!
  fullName: String! @migrationValue(value: "Name unavailable")
}
```

If you want all existing nodes to have a specific precalculated value, you could now define a `post.ts` script like this:

```ts
#!/usr/bin/env ts-node

import client from '@prisma/client/201912121314'

async function main() {
  for await (const user of client.users()) {
    await client.updateUser({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
    })
  }
}
```

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
