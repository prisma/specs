# Prisma Schema

<!-- toc -->

- [Datasource Block](#datasource-block)
  - [Supported fields](#supported-fields)
- [Generator Block](#generator-block)
  - [Supported fields](#supported-fields-1)
- [Model Block](#model-block)
  - [Field Names](#field-names)
  - [Data Types](#data-types)
    - [Core Data Type to Connector](#core-data-type-to-connector)
    - [Core Data Type to Generator](#core-data-type-to-generator)
    - [Optional Types](#optional-types)
    - [List Types](#list-types)
    - [Relations](#relations)
      - [One-to-One (1:1) Relationships](#one-to-one-11-relationships)
      - [One-to-Many (1:N) Relationships](#one-to-many-1n-relationships)
      - [Implicit Many-to-Many (M:N) Relationships](#implicit-many-to-many-mn-relationships)
      - [Explicit Many-to-Many (M:N) Relationships](#explicit-many-to-many-mn-relationships)
      - [Self-Referential Relationships](#self-referential-relationships)
      - [Multiple-Reference Relationships](#multiple-reference-relationships)
      - [Referencing Primary Composite Keys](#referencing-primary-composite-keys)
      - [Referencing fields that are not @id](#referencing-fields-that-are-not-id)
  - [Attributes](#attributes)
    - [Case 1. No arguments](#case-1-no-arguments)
    - [Case 2. One positional argument](#case-2-one-positional-argument)
    - [Case 3. Many named arguments](#case-3-many-named-arguments)
    - [Field Attributes](#field-attributes)
    - [Core Field Attributes](#core-field-attributes)
      - [@id](#id)
      - [@unique](#unique)
      - [@map(\_ name: String)](#map_-name-string)
      - [@default(\_ expr: Expr)](#default_-expr-expr)
      - [@relation(\_ name?: String, references?: Identifier[], onDelete?: CascadeEnum)](#relation_-name-string-references-identifier-ondelete-cascadeenum)
      - [@updatedAt](#updatedat)
    - [Block Attributes](#block-attributes)
    - [Core Block Attributes](#core-block-attributes)
    - [Type Specifications](#type-specifications)
  - [Why do we enforce the Core Prisma Primitive Type, even when there is a type specification?](#why-do-we-enforce-the-core-prisma-primitive-type-even-when-there-is-a-type-specification)
- [Comments](#comments)
- [Type Definition](#type-definition)
- [Enum Block](#enum-block)
- [Embed Block](#embed-block)
  - [Inline Embeds](#inline-embeds)
- [Env Function](#env-function)
  - [Introspect Behavior](#introspect-behavior)
  - [Migrate Behavior](#migrate-behavior)
  - [Generate Behavior](#generate-behavior)
  - [Switching Datasources based on Environments](#switching-datasources-based-on-environments)
- [Function](#function)
- [Importing schemas](#importing-schemas)
  - [Importing from other endpoints](#importing-from-other-endpoints)
  - [Conflict Resolution](#conflict-resolution)
- [Auto Formatting](#auto-formatting)
  - [Formatting Rules](#formatting-rules)
    - [Configuration blocks are align by their `=` sign.](#configuration-blocks-are-align-by-their--sign)
    - [Field definitions are aligned into columns separated by 2 or more spaces.](#field-definitions-are-aligned-into-columns-separated-by-2-or-more-spaces)

<!-- tocstop -->

## Datasource Block

Datasource blocks tell the schema where the models are backed. You can have multiple datasources with different connectors.

```groovy
datasource pg {
  provider = "postgresql"
  url      = env.POSTGRES_URL
  enabled  = true
}

datasource mgo {
  provider = "mongodb"
  url      = env.MONGO_URL
}

datasource mgo2 {
  provider = "mongodb"
  url      = env.MONGO2_URL
}
```

### Supported fields

- `provider` Can be one of the following built in datasource providers:
  - `postgresql`
  - `mongodb`
  - `mysql`
- `url` Connection url including auth info. Each datasource provider documents the url syntax. most providers use the syntax provided by the database
- `enabled` Use environment variables to enable/disable a datasource

Connectors may bring their own attributes to allow users to tailor their schemas according to specific features of their connected datasources.

## Generator Block

Generator blocks configure what clients are generated and how they're generated. Language preferences and configuration will go in here:

```groovy
generator js {
  target   = "es3"
  provider = "javascript"
  output   = "./client"
}

generator ts {
  target   = "es5"
  provider = "./path/to/custom/generator"
}

generator go {
  snakeCase = true
  provider  = "go"
}
```

### Supported fields

> Note: these provider names are WIP

- `provider` Can be a path or one of the following built in datasource providers:
  - `javascript`
  - `typescript`
  - `golang`
- `output` Path for the generated client

Generators may brign their own attributes

Generator blocks also generate a namespace. This namespace allows fine-grained control over how a model generates it's types:

```groovy
generate go {
  snakeCase = true
  provider  = "go"
}

type UUID String @go.type("uuid.UUID")

model User {
  id     UUID    @id
  email  String  @go.bytes(100)
}
```

This namespace is determined by the capabilities of the generator. The generator will export a schema of capabilities we'll plug into.

## Model Block

Models are the high-level entities of our business. They are the nouns: the User, the Comment, the Post and the Tweet.

Models may be backed by different datasources:

- In postgres, a model is a table
- In mongodb, a model is a collection
- In REST, a model is a resource

Here's an example of the Model block:

```groovy
model User {
  id         Int       @id
  email      String    @unique
  posts      Post[]
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

model Post {
  id          Int        @id
  title       String
  draft       Boolean
  categories  String[]
  slug        String
  author      User
  comments    Comment[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@unique([ title, slug ])
}

model Comment {
  id         Int       @id
  email      String?
  comment    String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

### Field Names

Field names are the first column of identifier inside the model block.

```
model _ {
  id         _
  email      _
  comment    _
  createdAt  _
  updatedAt  _
}
```

Field names are:

- Display name for the field
  - Affects the UI in studio, lift, etc.
- Not opinionated on casing
  - camel, snake, pascal are fine
- Name of the underlying field in the data source
  - Unless there's a handwritten `@map` override
  - If introspected, exactly always the same
- Basis for client generation
  - Generators may adjust casing depending on the language though

### Data Types

Prisma has a couple core primitive types. How these core types are defined may vary across connectors. Every connector **must** implement these core types. It's
part of the connectors interface to Prisma. If a connector doesn't have a core type, it should provide a **best-effort implementation**.

| Type     | Description           |
| -------- | --------------------- |
| String   | Variable length text  |
| Boolean  | True or false value   |
| Int      | Integer value         |
| Float    | Floating point number |
| Datetime | Timestamp             |

Here's how some of the databases we're tracking map to the core types:

#### Core Data Type to Connector

| Type     | Postgres  | MySQL     |
| -------- | --------- | --------- |
| String   | text      | TEXT      |
| Boolean  | boolean   | BOOLEAN   |
| Int      | integer   | INT       |
| Float    | real      | FLOAT     |
| Datetime | timestamp | TIMESTAMP |

| Type     | SQLite  | Mongo  | Raw JSON |
| -------- | ------- | ------ | -------- |
| String   | TEXT    | string | string   |
| Boolean  | _N/A_   | bool   | boolean  |
| Int      | INTEGER | int32  | number   |
| Float    | REAL    | double | number   |
| Datetime | _N/A_   | date   | _N/A_    |

**\_N/A:** here means no perfect equivalent, but we can probably get pretty close.

#### Core Data Type to Generator

| Type     | JS / TS | Go        |
| -------- | ------- | --------- |
| String   | string  | string    |
| Boolean  | boolean | bool      |
| Int      | number  | int       |
| Float    | number  | float64   |
| Datetime | Date    | time.Time |

#### Optional Types

All field types support optional fields. By default, fields are required, but if you want to make them optional, you add a `?` at the end.

```groovy
model User {
  names    String[]?
  ages     Int?
  heights  Float?
  card     Card?
}

enum Card {
  Visa        = "VISA"
  Mastercard  = "MASTERCARD"
}
```

The default output for a nullable field is null.

#### List Types

All primitive `types`, `enums`, `relations` and `embeds` natively support lists. Lists are denoted with `[]` at the end of the type.

```groovy
model User {
  names    String[]
  ages     Int[]
  heights  Float[]
}
```

Lists can also be optional and will give the list a 3rd state, null:

- `Blog[]`: empty list or non-empty list of blogs (default: [])
- `Blog[]?`: null, empty list or non-empty list of blogs (default: null)

The default value for a required list is an empty list. The default value for an optional list is null.

For `Blog[]?`, we'll plan for this from an implementation perspective, but not expose it publicly for now.

#### Relations

Prisma provides a high-level syntax for defining relationships.

There are three kinds of relations: `1-1`, `1-m` and `m-n`. In relational databases `1-1` and `1-m` is modeled the same way, and there is no built-in support
for `m-n` relations.

Prisma core provides explicit support for all 3 relation types and connectors must ensure that their guarantees are upheld:

- `1-1` The return value on both sides is a nullable single value. Prisma prevents accidentally storing multiple records in the relation.
- `1-m` The return value on one side is a optional single value, on the other side a list that might be empty.
- `m-n` The return value on both sides is a list that might be empty. This is an improvement over the standard implementation in relational databases that
  require the application developer to deal with implementation details such as an intermediate table / join table. In Prisma, each connector will implement
  this concept in the way that is most efficient on the given storage engine and expose an API that hides the implementation details.

##### One-to-One (1:1) Relationships

```groovy
model User {
  id        Int           @id
  customer  Customer?
  name      String
}

model Customer {
  id       Int     @id
  user     User?
  address  String
}
```

For 1:1 relationships, it doesn't matter which side you store the foreign key. Therefore Prisma has a convention that the foreign key is added to the model who
appears first alphanumerically. In the example above, that's the `Customer` model.

Under the hood, the models looks like this:

| **users** |         |
| --------- | ------- |
| id        | integer |
| name      | text    |

| **customers** |         |
| ------------- | ------- |
| id            | integer |
| user          | integer |
| address       | text    |

You **may** omit either `User.customer` or `Customer.user` and the relationship will remain intact. This makes either the back-relation or the forward-relation
optional. If one side of the relation is missing, Prisma implies the field name based on the name of the model it is pointing to.

If you're introspecting an existing database and the foreign key does not follow the alphanumeric convention, then we'll use the
`@relation(_ name: String?, references: Identifier[]?, onDelete: OnDeleteEnum?)` attribute to clarify.

```groovy
model User {
  id        Int        @id
  customer  Customer?  @relation(references: id)
  name      String
}

model Customer {
  id       Int     @id
  user     User?
  address  String
}
```

##### One-to-Many (1:N) Relationships

A writer can have multiple blogs.

```groovy
model Writer {
  id      Int     @id
  blogs   Blog[]
}

model Blog {
  id      Int     @id
  author  Writer
}
```

- `Blog.author`: points to the primary key on writer

Connectors for relational databases will implement this as two tables with a foreign-key constraint on the blogs table:

| **writers** |         |
| ----------- | ------- |
| id          | integer |

| **blogs** |         |
| --------- | ------- |
| id        | integer |
| author    | integer |

You **may** omit `Blog.author` and the relationship will remain intact. If one side of the relation is missing, Prisma implies the field name based on the name
of the model it is pointing to. If you omitted `Writer.blogs`, Prisma would add an implicit `Writer.blog` field, making the relation `1-1` instead of `1-m`

You may also map to composite primary keys:

```groovy
model Writer {
  first_name  String  @id
  last_name   String
  blogs       Blog[]

  @@id([ first_name, last_name ])
}

model Blog {
  id         Int @id
  title      String
  author     Writer
}
```

Underneath:

| **writers** |      |
| ----------- | ---- |
| first_name  | text |
| last_name   | text |

| **blogs**         |      |
| ----------------- | ---- |
| id                | Int  |
| title             | text |
| author_first_name | text |
| author_last_name  | text |

##### Implicit Many-to-Many (M:N) Relationships

Blogs can have multiple writers and a writer can write many blogs. Prisma supports implicit join tables as a low-syntax way to get started.

```groovy
model Blog {
  id       Int       @id
  authors  Writer[]
}

model Writer {
  id      Int     @id
  blogs   Blog[]
}
```

Connectors for relational databases should implement this as two data tables and a single join table. For data sources that support composite primary keys,
we'll use `primary key(blog, writer)` to ensure that there can't be no more than one unique association.

| **Blog** |         |
| -------- | ------- |
| id       | integer |

| **Writer** |         |
| ---------- | ------- |
| id         | integer |

| **\_BlogtoWriter** |         |
| ------------------ | ------- |
| blog               | integer |
| writer             | integer |

For implicit many-to-many relations, you **must** include both `Blog.authors` and `Writer.blogs`. If one of these fields is missing, Prisma will assume it's a
**One-to-Many (1:N)** relationship.

##### Explicit Many-to-Many (M:N) Relationships

Many-to-many relationships are simply 2 one-to-many relationships.

```groovy
model Blog {
  id       Int       @id
  authors  Writer[]
}

model Writer {
  id      Int     @id
  blogs   Blog[]
}

// many to many
model BlogsWriters {
  blog      Blog
  author    Writer
  is_owner  Boolean
  @@unique(author, blog)
}
```

| **Blog** |         |
| -------- | ------- |
| id       | integer |

| **Writer** |         |
| ---------- | ------- |
| id         | integer |

| **BlogsWriters** |         |
| ---------------- | ------- |
| blog_id          | integer |
| author_id        | integer |
| is_owner         | boolean |

##### Self-Referential Relationships

Prisma supports self-referential relationships:

```groovy
model Employee {
  id         Int       @id
  reportsTo  Employee
}
```

| **Employee** |         |
| ------------ | ------- |
| id           | integer |
| reports_to   | integer |

##### Multiple-Reference Relationships

Models may have multiple references to the same model. To prevent ambiguities, we explicitly name the foreign key field using a `@relation` attribute:

```groovy
model User {
  id        Int         @id
  asked     Question[]  @relation("asker")
  answered  Question[]  @relation("answerer")
}

model Question {
  id        Int   @id
  asker     User  @relation("asker")
  answerer  User  @relation("answerer")
}
```

##### Referencing Primary Composite Keys

You can also have relationships to composite primary keys

```groovy
model Document {
  @@id([ projectID, revision ])

  projectID  String   @default('')
  revision   Int      @default(1)
  blocks     Block[]
}

model Block {
  id        Int       @id
  document  Document
}
```

##### Referencing fields that are not @id

The `@id` attribute marks the primary identifyer of a model. If a model does not have a primary identifier or you want to reference another field, you can
specify the field using the `@relation` attribute

```groovy
model Document {
  projectID  String   @default('')
  revision   Int      @default(1)
  blocks     Block[]
}

model Block {
  id       Int      @id
  document Document @relation(references: [projectID, revision])
}
```

### Attributes

Attributes modify the behavior of a field or block. Field attributes are prefixed with a `@`, while block attributes are prefixed with `@@`.

Depending on their signature, attributes may be called in the following cases:

#### Case 1. No arguments

`@attribute`: parenthesis **must** be omitted. Examples:

- `@id`
- `@unique`
- `@updatedAt`

#### Case 2. One positional argument

`@attribute(_ p0: T0, p1: T1, ...)`: There may be up to one positional argument that doesn't need to be named.

- `@field("my_column")`
- `@default(10)`

For arrays with a single parameter, you **may** omit the surrounding brackets:

```groovy
@attribute([email]) // is the same as
@attribute(email)
```

#### Case 3. Many named arguments

`@attribute(p1: T1, p2: T2, _: T3, ...)`: There may be any number of named arguments. If there is a positional argument, then it **may** appear anywhere in the
function signature, but if it's present and required, the caller **must** place it before any named arguments. Named arguments may appear in any order:

- `@@pg.index([ email, first_name ], name: "my_index", partial: true)`
- `@@pg.index([ first_name, last_name ], unique: true, name: "my_index")`
- `@@check(a > b, name: "a_b_constraint")`
- `@pg.numeric(precision: 5, scale: 2)`

You **must not** have multiple arguments with the same name:

```groovy
// compiler error
@attribute(key: "a", key: "b")
```

For arrays with a single parameter, you **may** omit the surrounding brackets:

```groovy
@attribute([item], key: [item]) // is the same as
@attribute(item, key: item)
```

#### Field Attributes

Field attributes are marked by an `@` prefix placed at the end of the field definition. You can have as many field attributes as you want and they may also span
multiple lines:

```
model _ {
  _ _ @attribute
}

embed _ {
  _ _ @attribute @attribute2
}

type _ _ @attribute("input")
         @attribute2("input", key: "value", key2: "value2")
         @attribute3
```

#### Core Field Attributes

Prisma supports the following core field attributes. Field attributes may be used in `model` and `embed` blocks as well as `type` definitions. These attributes
**must** be implemented by every connector with a **best-effort implementation**:

##### @id

Defines the primary key. There **must** be exactly one field `@id` or block `@id`

##### @unique

Defines the unique constraint

##### @map(\_ name: String)

Defines the raw column name the field is mapped to

##### @default(\_ expr: Expr)

Specifies a default value if null is provided

##### @relation(\_ name?: String, references?: Identifier[], onDelete?: CascadeEnum)

Disambiguates relationships when needed

- name: _(optional)_ defines the name of the relationship
- references: _(optional)_ list of field names to reference
- onDelete: _(optional)_ defines what we do when the referenced relation is deleted
  - **CASCADE**: also delete this entry
  - **SET_NULL**: set the field to null. This is the default

##### @updatedAt

Updates the time to `now()` whenever the model is updated

#### Block Attributes

Field attributes are marked by an `@@` prefix placed anywhere inside the block. You can have as many block attributes as you want and they may also span
multiple lines:

```

model \_ { @@attribute0

---

@@attribute1("input") @attribute2("input", key: "value", key2: "value2")

---

@@attribute3 }

embed \_ { @@attribute0

---

@@attribute1 @@attribute2("input") }

```

#### Core Block Attributes

Prisma supports the following core block attributes. Block attributes may be used in `model` and `embed` blocks. These attributes **must** be implemented by
every connector with a **best-effort implementation**:

- `@@map(_ name: String)`: Define the name of the underlying table or collection name
- `@@id(_ fields: Identifier[])`: Defines a composite primary key across fields
- `@@unique(_ fields: Identifier[], name: String?)`: Defines a composite unique constraint across fields

#### Type Specifications

In order to live up to our promise of not tailoring Prisma to the lowest-common database feature-set, connectors may bring their own attributes to the schema.

The connector can bring all of its own specific types into the schema. This will make your schema less universal, but more capable for the datasource you're
using. Connectors will export a schema of capabilities that you can apply to your schema field and blocks.

```groovy
datasource pg {
  provider = "postgres"
  url      = "postgres://localhost:5432/jack?sslmode=false"
}

datasource ms {
  provider = "mysql"
  url      = "mysql://localhost:5522/jack"
}

type PGCitext String @pg.Citext
type PGUUID String @pg.UUID

embed Point2D {
  X Int
  Y Int
  @@pg.Point
  @@ms.Point
}

embed Point3D {
  X Int
  Y Int
  Z Int
  @@pg.Point
  @@ms.Point
}

model User {
  id         UUID
  email      Citext
  location1  Point2D
  location2  Point3D
}
```

Additionally, a generator might choose to implement dedicated support for all or some Type Specifications.

For example, a ts generator might choose to interpret the type of the `name` field as `ArrayBuffer(8)` instead of `String` for performance reasons

```groovy
model User {
	name  String  @pg.varchar(8)
}
```

This mapping is not declarative, so the generator is free to take all aspects of the schema into account when making this decision, including collation settings
for the table and so on.

### Why do we enforce the Core Prisma Primitive Type, even when there is a type specification?

Generators are guaranteed that they can always fall back to the Core Prisma Primitive Type. This way they can implement special enhancements for certain Type
Specifications of certain databases but still work reasonably well for all the types and databases that they don't have dedicated support for.

This is especially important for connectors and generators implemented by the community.

## Comments

There are 2 types of comments that are supported in the schema:

1. `// comment`: This comment is for the reader's clarity and is not present in the AST.
2. `/// comment`: These comments will show up in the AST, either as descriptions to AST nodes or as free-floating comments. Tools can then use these comments to
   provide additional information to the user.

Here are some different examples:

```groovy
/// This comment will get attached to the User node
model User {
  /// This comment will get attached to the id node
  id      Int
  // This comment is just for you
  weight  Float /// This comment gets attached to the weight node
}

// This comment is just for you. This comment will not
// show up in the AST.

/// This is a free-floating comment that will show up
/// in the AST as a Comment node, but is not attached
/// to any other node. We can use these for documentation
/// in the same way that godoc.org works.

model Customer {}
```

## Type Definition

Type definitions can be used to consolidate various type specifications into one type.

```groovy
type Numeric Float @pg.numeric(precision: 5, scale: 2)
                   @ms.decimal(precision: 5, scale: 2)

model User {
  id       Int      @id
  weight   Numeric
}
```

You can attach any field attribute to a type definition.

## Enum Block

```groovy
enum Color {
  Red
  Teal
}
```

Enums can include their corresponding value to determine what is stored by the datasource:

```groovy
enum Color {
  Red  = "RED"
  Teal = "TEAL"
}
```

For now, we'll only support `String` enum value types.

## Embed Block

Embeds are supported natively by Prisma. There are 2 types of embeds: named embeds (just called embeds) and inline embeds.

Unlike relations, embed tells the clients that this data \_comes with the record. How the data is actually stored (co-located or not) is not a concern of the
data model.

```groovy
model User {
  id        String
  customer  StripeCustomer?
}

embed StripeCustomer {
  id     String
  cards  Source[]
}

enum Card {
  Visa        = "VISA"
  Mastercard  = "MASTERCARD"
}

embed Sources {
  type Card
}
```

### Inline Embeds

There's another way to use embeds.

When you don't need to reuse an embed, inline embeds are handy. Inlines embeds are supported in `model` and `embed` blocks. They can be nested as deep as you
want. Please don't go too deep though.

```groovy
model User {
  id        String
  customer  embed {
    id     String
    cards  embed {
      type Card
    }[]
  }?
}

enum Card {
  Visa        = "VISA"
  Mastercard  = "MASTERCARD"
}
```

## Env Function

The schema can require certain environment expectations to be met. The purpose of the `env` function is to:

- Keeps secrets out of the schema
- Improve portability of the schema

````groovy
datasource pg {
  provider = "postgres"
  url      = env("POSTGRES_URL")
}
```

In this case `env` represents the outside environment. Tools will be expected to
provide this environment variable when they perform operations based on the
schema. For example:

```sh
$ prisma deploy
! required POSTGRES_URL variable not provided

$ POSTGRES_URL="postgres://user:secret@rds.amazon.com:4321/db" prisma deploy
````

### Introspect Behavior

Environment variables will most often be used to connect to a datasource.

Therefore, we check and resolve environment variables before connecting and running introspection algorithms.

### Migrate Behavior

Environment variables will most often be used to connect to a datasource.

Therefore, we check and resolve environment variables before connecting and running our migrations.

### Generate Behavior

Environment variables will most often be used to connect to a datasource. When we're generating source code, we don't need to connect to the datasource, but
rather when we run the source code.

Therefore, we will detect the use of an environment variable in the connector's configuration and copy it into the generated code. The generators will decide
how to generate these environment variable entrypoints.

Here's an example:

```groovy
datasource pg {
  url = env("POSTGRES_URL")
}
```

```ts
childProcess.spawn("./query_engine", {
  env: {
    url: process.env.POSTGRES_URL
  }
});
```

### Switching Datasources based on Environments

Sometimes it's nice to get started with an SQLite database and migrate to Postgres or MySQL for production. We support this workflow:

```groovy
datasource db {
  enabled   = bool(env("SQLITE_URL"))
  provider  = "sqlite"
  url       = env("SQLITE_URL")
}

datasource db {
  // we can probably automatically cast without bool(...)
  enabled   = bool(env("POSTGRES_URL"))
  provider  = "postgresql"
  url       = env("POSTGRES_URL")
}

model User {
  id         Int    @id @db.int
  first_name String @unique
}
```

When two different datasources share the same name, their exported capabilities are the intersection of the two datasources. This makes it safe to use the
attributes depending on the runtime environment variable switch.

Intersecting capabilities also provide a way to switch to a new data source and see how portable your datasource is.

If two datasources of the same name are enabled, we will throw a runtime-time error.

## Function

Prisma core provides a set of functions that **must** be implemented by every connector with a **best-effort implementation**. Functions only work inside field
and block attributes that accept them.

- `uuid()` - generates a fresh UUID
- `cuid()` - generates a fresh cuid
- `between(min, max)` - generates a random int in the specified range
- `now()` - current date and time

Default values using a dynamic generator can be specified as follows:

```groovy
model User {
  age        Int       @default(between([ 1, 5 ]))
  height     Float     @default(between([ 1, 5 ]))
  createdAt  Datetime  @default(now())
}
```

Functions will always be provided at the Prisma level by the query engine.

The data types that these functions return will be defined by the connectors. For example, `now()` in Postgres will return a `timestamp with time zone`, while
`now()` with a JSON connector would return an `ISOString`.

## Importing schemas

A team may have a lot of configuration or many different models. They may also have many environments they need to deploy to. We support an `import <string>`
function that will concatenate schemas together and join their contents.

**schema.prisma**

```groovy
import "./post.prisma"

model User {
	posts Post[]
}
```

**post.prisma**

```groovy
model Post {
	title String @pg.varchar(42)
	body  String
}
```

Resolves to:

```groovy
model Post {
	title String @pg.varchar(42)
	body  String
}

model User {
	posts Post[]
}
```

### Importing from other endpoints

We also support fetching schemas from Github, NPM, HTTP and can add more as desired. We were inspired by Hashicorp's
[go-getter](https://github.com/hashicorp/go-getter).

Here are some possibilities:

```
import "https://Aladdin:OpenSesame@www.example.com/index.html"
import "github://prisma/project/post.schema"
import "npm://prisma/app/comments.schema"
```

### Conflict Resolution

Often times you'll import a schema that has conflicting models. In this case we take the union of all fields and attributes:

**post.prisma**

```groovy
model Post {
  id    Int    @id
	title String @pg.varchar(42)
	body  String
  @@unique([id,title])
}
```

**schema.prisma**

```groovy
import "./post.prisma"

model User {
	posts: Post[]
}

model Post {
	title String @unique
}
```

Resolves to:

```groovy
model User {
	posts: Post[]
}

model Post {
  id    Int    @id
	title String @pg.varchar(42)
	body  String
  @@unique([id,title])
}
```

- **Open Question:** What happens if the field types differ?
- **Open Question:** Do we want to take the union? Is there some other approach that's more clear?

## Auto Formatting

Following the lead of [gofmt](https://golang.org/cmd/gofmt/) and [prettier](https://github.com/prettier/prettier), our syntax ships with a formatter for
`.prisma` files.

Like `gofmt` and unlike `prettier`, we offer no options for configurability here. **There is one way to format a prisma file**.

This strictness serves two benefits:

1. No bikeshedding. There's a saying in the Go community that, "Gofmt's style is nobody's favorite, but gofmt is everybody's favorite."
2. No pull requests with different spacing schemes.

### Formatting Rules

#### Configuration blocks are align by their `=` sign.

```
block _ {
  key      = "value"
  key2     = 1
  long_key = true
}
```

Formatting may be reset up by a newline.

```
block _ {
  key   = "value"
  key2  = 1
  key10 = true

  long_key   = true
  long_key_2 = true
}
```

Multiline objects follow their own nested formatting rules:

```
block _ {
  key   = "value"
  key2  = 1
  key10 = {
    a = "a"
    b = "b"
  }
  key10 = [
    1,
    2
  ]
}
```

#### Field definitions are aligned into columns separated by 2 or more spaces.

```
block _ {
  id          String       @id
  first_name  LongNumeric  @default
}
```

Multiline field attributes are properly aligned with the rest of the field attributes:

```
block _ {
  id          String       @id
                           @default
  first_name  LongNumeric  @default
}
```

Formatting may be reset by a newline.

```
block _ {
  id  String  @id
              @default

  first_name  LongNumeric  @default
}
```

Inline embeds add their own nested formatting rules:

```groovy
model User {
  id        String
  name      String
  customer  embed {
    id         String
    full_name  String
    cards   embed {
      type  Card
    }[]
  }?
  age   Int
  email String
}
```
