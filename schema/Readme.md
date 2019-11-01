# Prisma Schema Language (PSL)

- Owner: @matthewmueller
- Stakeholders: @schickling @mavilein
- State:
  - Spec: Outdated 🚨
  - Implementation: Unknown ❔

The Prisma Schema declaratively describes the structure of your data sources. We use the Prisma Schema to generate Photon libraries for data access, migrate
your datasources with Lift and administer your data using Studio.```

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Datasource Block](#datasource-block)
  - [Supported fields](#supported-fields)
- [Generator Block](#generator-block)
  - [Supported fields](#supported-fields-1)
  - [Binary Configuration](#binary-configuration)
- [Model Block](#model-block)
  - [Field Names](#field-names)
  - [Data Types](#data-types)
    - [Core Data Type to Connector](#core-data-type-to-connector)
    - [Core Data Type to Generator](#core-data-type-to-generator)
    - [List Types](#list-types)
    - [Optional Types](#optional-types)
    - [Relations](#relations)
      - [One-to-One (1:1) Relationships](#one-to-one-11-relationships)
      - [One-to-Many (1:N) Relationships](#one-to-many-1n-relationships)
        - [Implicit Has-Many](#implicit-has-many)
        - [Implicit Has-One](#implicit-has-one)
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
      - [@map(\_ name: String)](#map%5C_-name-string)
      - [@default(\_ expr: Expr)](#default%5C_-expr-expr)
      - [@relation(\_ name?: String, references?: Identifier[], onDelete?: CascadeEnum)](#relation%5C_-name-string-references-identifier-ondelete-cascadeenum)
        - [Named relations](#named-relations)
        - [Ambiguous relations](#ambiguous-relations)
        - [Arguments](#arguments)
        - [Validation](#validation)
      - [@updatedAt](#updatedat)
    - [Block Attributes](#block-attributes)
    - [Core Block Attributes](#core-block-attributes)
    - [Type Specifications](#type-specifications)
  - [Why do we enforce the Core Prisma Primitive Type, even when there is a type specification?](#why-do-we-enforce-the-core-prisma-primitive-type-even-when-there-is-a-type-specification)
- [Comments](#comments)
- [Type Mapping](#type-mapping)
  - [Terminology](#terminology)
    - [Application Schema](#application-schema)
    - [Connector Schema](#connector-schema)
    - [Connector Type Definitions](#connector-type-definitions)
    - [Root Types](#root-types)
    - [Standard Types](#standard-types)
  - [Type Mapping Example](#type-mapping-example)
    - [postgresql.prisma (generated)](#postgresqlprisma-generated)
    - [mysql.prisma (generated)](#mysqlprisma-generated)
    - [schema.prisma](#schemaprisma)
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
  - [Merging Models](#merging-models)
- [Auto Formatting](#auto-formatting)
  - [Formatting Rules](#formatting-rules)
    - [Configuration blocks are align by their `=` sign.](#configuration-blocks-are-align-by-their--sign)
    - [Field definitions are aligned into columns separated by 2 or more spaces.](#field-definitions-are-aligned-into-columns-separated-by-2-or-more-spaces)
- [FAQ](#faq)
  - [Why not support @id for multiple blocks?](#why-not-support-id-for-multiple-blocks)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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
  - `sqlite`
- `url` Connection url including auth info. Each datasource provider documents the url syntax. most providers use the syntax provided by the database
- `enabled` Use environment variables to enable/disable a datasource

Connectors may bring their own attributes to allow users to tailor their schemas according to specific features of their connected datasources.

## Generator Block

Generator blocks configure what clients are generated and how they're generated. Language preferences and binary configuration will go in here:

```groovy
generator js {
  provider = "photonjs"
  target   = "es3"
  output   = "./client"
}

generator ts {
  target   = "photonjs"
  provider = "./path/to/custom/generator"
}

generator go {
  provider  = "photongo"
  snakeCase = true
}
```

### Supported fields

> Note: these provider names are WIP

- `provider` Can be a path or one of the following built in datasource providers:
  - `photonjs`
  - `photongo`
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

### Binary Configuration

```groovy
generator photon {
  provider = "photonjs"
  snakeCase = true
  platforms = ["native", "linux-glibc-libssl1.0.2"]
  pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "linux-glibc-libssl1.0.2"
}
```

| Field            | Description                                                                                                                      | Behavior                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `platforms`      | _(optional)_ An array of binaries that are required by the application, string for known platforms and path for custom binaries. | Declarative way to download the required binaries. |
| `pinnedPlatform` | _(optional)_ A string that points to the name of an object in the `platforms` field, usually an environment variable             | Declarative way to choose the runtime binary       |

- Both `platforms` and `pinnedPlatform` fields are optional, **however** when a custom binary is provided the `pinnedPlatform` is required.

You can find more information about the binary configuration in the [binary spec](../binaries/Readme.md).

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

Prisma has several core primitive types. How these core types are defined may vary across connectors. Every connector **must** implement these core types. It's
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

#### List Types

All primitive `types`, `enums`, `relations` and `embeds` natively support lists. Lists are denoted with `[]` at the end of the type.

```groovy
model User {
  names    String[]
  ages     Int[]
  heights  Float[]
}
```

The default value for a required list is an empty list.

#### Optional Types

Most field types also support optional fields. By default, fields are required, but if you want to make them optional, you add a `?` at the end. Currently, the
only field type that is not nullable is the [List Type](#list-types).

```groovy
model User {
  names    String[]
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

#### Relations

Prisma provides a high-level syntax for defining relationships.

There are three kinds of relations: `1-1`, `1-m` and `m-n`. In relational databases `1-1` and `1-m` is modeled the same way, and there is no built-in support
for `m-n` relations.

Prisma core provides explicit support for all 3 relation types and connectors must ensure that their guarantees are upheld:

- `1-1` The return value on both sides is a single model, either optional or required. Prisma prevents accidentally storing multiple records in the relation.
- `1-m` The return value on one side is a single model, either optional or required. On the other side is a list that might be empty.
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

###### Implicit Has-Many

You **may** omit `Blog.author` or `Writer.blogs` and the relationship will remain intact.

```groovy
model Writer {
  id Int @id
}

model Blog {
  id     Int    @id
  author Writer
}
```

For an **implicit has-many**, a required list is added to `Writer`. In this case `blogs Blog[]`. If a `blogs` field already exists, there is an error and you
must explicitly name the relation.

###### Implicit Has-One

```groovy
model Writer {
  id    Int    @id
  blogs Blog[]
}

model Blog {
  id      Int     @id
}
```

For an **implicit has-one**, an optional relation is added to `Blog`. In this case `writer Writer?`. If a `writer` field already exists, there is an error and
you must explicitly name the relation.

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

> ⚠ This is not implemented yet.

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
  @@unique([author, blog])
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
  asked     Question[]  @relation("Question_User_Asked")
  answered  Question[]  @relation("Question_User_Answerered")
}

model Question {
  id        Int   @id
  asker     User  @relation("Question_User_Asked")
  answerer  User  @relation("Question_User_Answerered")
}
```

##### Referencing Primary Composite Keys

> ⚠ This is not implemented yet.

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

Underneath:

| **documents** |      |
| ------------- | ---- |
| project_id    | text |
| revision      | int  |

| **blocks**          |      |
| ------------------- | ---- |
| id                  | Int  |
| document_project_id | text |
| document_revision   | int  |

##### Referencing fields that are not @id

> ⚠ This is not implemented yet.

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

Disambiguates relationships when needed.

###### Named relations

When a model contains a single relation to another model or itself, giving a name to the relation is optional and the `@relation` directive can be completely
omitted.

There can be multiple distinct relationships between two models, or between a model and itself ("self relation"). When this is the case, the relationships must
be named, so they can be distinguished.

###### Ambiguous relations

Relation fields that do not clearly belong to a specific relationship constitute an _ambiguous relation_.

This is an example ambiguous relation on the schema of an imaginary simplified blogging platform:

```groovy
model Blog {
    id          Int @id
    authors     User[]
    subscribers User[]
}

model User  {
    id           Int @id
    authorOf     Blog[]
    subscribedTo Blog[]
}
```

There are two relationships between `Blog` and `User`, so we need to name them to tell them apart. A valid version of this schema could look like this:

```groovy
model Blog {
    id          Int @id
    authors     User[] @relation("Authorship")
    subscribers User[] @relation("Subscription")
}

model User  {
    id           Int @id
    authorOf     Blog[] @relation("Authorship")
    subscribedTo Blog[] @relation("Subscription")
}
```

###### Arguments

- name: _(optional, except when required for disambiguation)_ defines the name of the relationship. The name of the relation needs to be explicitly given to
  resolve amibiguities when the model contains two or more fields that refer to the same model (another model or itself).
- references: _(optional)_ list of field names to reference
- onDelete: _(optional)_ defines what we do when the referenced relation is deleted
  - **CASCADE**: also delete this entry
  - **SET_NULL**: set the field to null. This is the default

###### Validation

- Ambiguous relations: when one model contains two fields with an `@relation` directive pointing to another model, and both fields have the same relation name,
  or no relation name, the relation cannot be resolved and a validation error is emitted.
- Ambiguous self relations: when one model contains two fields referencing the model itself without relation name to disambiguate that they should be seen as
  the same relation, they are considered ambiguous.
- Named relations with more than two fields are rejected, because there is no way to interpret them that makes sense.

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

> ⚠ This is not implemented yet.

Prisma supports the following core block attributes. Block attributes may be used in `model` and `embed` blocks. These attributes **must** be implemented by
every connector with a **best-effort implementation**:

- `@@map(_ name: String)`: Define the name of the underlying table or collection name
- `@@id(_ fields: Identifier[])`: Defines a composite primary key across fields
- `@@unique(_ fields: Identifier[], name: String?)`: Defines a composite unique constraint across fields

#### Type Specifications

> ⚠ This is not implemented yet.

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
	name  pg.Varchar(n: 8)
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

## Type Mapping

> ⚠ This is not implemented yet.

Type mappings define how types are defined across the Prisma Framework. The example below provides an end-to-end type mapping from your application, to Photon,
to the Query Engine, to the database and back again.

```
 ┌─────┐
 │ App │
 ├─────┴──────────────┐
 │         Go         │
 │          ▲         │
 │          │ @go("decimal.Decimal")
 │          ▼         │
 │   ┌─────────────┐  │
 │   │             │  │
 │   │   Photon    │  │
 │   │             │  │
 └───┴─────────────┴──┘
            ▲
            │ @transport("float16")
            ▼
┌──────────────────────┐
│                      │
│     Query Engine     │
│                      │
└──────────────────────┘
            ▲
            │ @raw("numeric(5, 2)")
            ▼
  ┌───────────────────┐
  │                   │
  │                   │
  │     Database      │
  │                   │
  │                   │
  └───────────────────┘
```

### Terminology

#### Application Schema

The Application Schema is typically defined by your `schema.prisma`. This is where your application's models and relationships will live.

#### Connector Schema

The Connector Schema is a virtual file that is generated by the connectors. This file will be named after the connector, so if the connector is `postgresql`,
then the virtual file will be named `postgresql.schema`. This file contains Connector Type Definitions.

#### Connector Type Definitions

Connector types definitions declare a connector-specific type and how it maps to the underlying datasource.

```groovy
type BigInt @raw("bigint") @transport("int64")
```

Connector type definitions have 2 attributes:

- `@raw(_ name: String)` defines the type we map to in the datasource.
- `@transport(_ name: String)` defines how we transport this type over the network

There are 2 kinds of Connector Type Definitions: **Root Types** & **Standard Types**.

#### Root Types

Root types are connector-specific and provide an exhaustive mapping of all datatypes for the given datasource.

```groovy
type BigInt @raw("bigint") @transport("int64")
type BigSerial @raw("bigserial") @transport("int64")
type DoublePrecision @raw("double precision") @transport("float64")
type Integer @raw("integer") @transport("int32")
```

#### Standard Types

Standard types are aliases to Root Types that are common across most datasources. Standard Types always map to a lower-level Root Type

```groovy
type String = Text
type Boolean = Boolean
type Int = Integer
type Float = Real
type DateTime = Timestamp
```

We use the `=` to define an alias from one type to the other.

### Type Mapping Example

#### postgresql.prisma (generated)

```groovy
// standard types
type String = Text
type Boolean = Boolean
type Int = Integer
type Float = Real
type DateTime = Timestamp

// root type definitions
type BigInt @raw("bigint") @transport("int64")
type Int8 = BigInt
type BigSerial @raw("bigserial") @transport("int64")
type Serial8 = BigSerial
type DoublePrecision @raw("double precision") @transport("float64")
type Float8 = DoublePrecision
type Integer @raw("integer") @transport("int32")
type Int = Integer
type Int4 = Integer
type Numeric(precision Int, scale Int) @raw("numeric($precision, $scale)") @transport("[]byte")
type Decimal = Numeric
type Real @raw("real") @transport("int16")
type Float4 = Real
type SmallInt @raw("smallint") @transport("int4")
type Int2 = SmallInt
type SmallSerial @raw("smallserial") @transport("int4")
type Serial2 = SmallSerial
type Serial @raw("serial") @transport("int32")
type Serial4 = Serial
type Money @raw("money") @transport("int64")
type Character(length Int?) @raw("character($length)") @transport("[$length]byte")
type Char = Character
type CharacterVarying(length Int?) @raw("character varying($length)") @transport("[]byte")
type VarChar = CharacterVarying
type Text @raw("text") @transport("[]byte")
type Char @raw("char") @transport("byte")
type Name @raw("name") @internal @transport("int512")
type ByteA @raw("bytea") @transport("[]byte")
type Timestamp(precision Int) @raw("timestamp ($p)") @transport("int64")
type TimestampWithTimeZone(precision Int) @raw("timestamp ($p)") @transport("int64")
type TimestampTZ = TimestampWithTimeZone
type Date @raw("date") @transport("int")
type Time(p Int) @raw("time($p)") @transport("int")
type TimeTZ @raw("timetz") @transport("int")
type Time(p Int) @raw("time($p)") @transport("int")
type Interval(fields String, p Int) @raw("interval($fields, $p)") @transport("int")
type Boolean @raw("boolean") @transport("boolean")
type Bool = Boolean
type Point @raw("point") @transport("int128")
type Line @raw("line") @transport("int256")
type LSeg @raw("lseg") @transport("int256")
type Box @raw("box") @transport("int256")
type Path @raw("path") @transport("[]int")
type Polygon @raw("polygon") @transport("[]int")
type CIDR @raw("cidr") @transport("[]int")
type INet @raw("inet") @transport("[]int")
type Macaddr @raw("macaddr") @transport("int48")
type Bit(n Int) @raw("bit($n)") @transport("int($n)")
type BitVarying @raw("bit varying($n)") @transport("[]int")
type VarBit = BitVarying
type TSVector @raw("tsvector") @transport("[]int")
type TSQuery @raw("tsquery") @transport("[]int")
type UUID @raw("uuid") @transport("int128")
type XML @raw("xml") @transport("[]int")
type JSON @raw("json") @transport("[]int")
type JSONB @raw("jsonb") @transport("[]int")
type Int4Range @raw("int4range") @transport("int32")
type Int8Range @raw("int8range") @transport("int64")
type NumRange @raw("numrange") @transport("[]int")
type TSRange @raw("tsrange") @transport("int128")
type TSTZRange @raw("tstzrange") @transport("int96")
type DateRange @raw("daterange") @transport("int32")
type PGLSN @raw("pg_lsn") @transport("int64")
type TXIDSnapshot @raw("txid_snapshot") @transport("[]byte")
```

#### mysql.prisma (generated)

```groovy
// standard types
type String = Text
type Boolean = Boolean
type Int = Int
type Float = Float
type Timestamp = Timestamp

// root type definitions
type TinyInt @raw("tinyint") @transport("int1")
type SmallInt @raw("smallint") @transport("int2")
type MediumInt @raw("mediumint") @transport("int3")
type Int @raw("int") @transport("int4")
type BigInt @raw("bigint") @transport("int8")
type Float @raw("float") @transport("float32")
type Double @raw("double") @transport("float64")
type Timestamp @raw("timestamp") @transport("") // TODO transport
type Text @raw("text") @transport("[]byte")
type Boolean @raw("boolean") @transport("boolean")
type VarChar(length Int) @raw("varchar($length)") @transport("[]byte")
```

#### schema.prisma

```groovy
datasource pg {
  provider = "postgresql"
  url      = "postgresql://localhost:5432/db?sslmode=disable"
  default  = true
}

datasource ms {
  provider = "mysql"
  url      = "mysql://localhost:3306/db"
}

model User {
  id        UUID   @id
  firstName String
  settings  JSONB
}

model Post {
  id        Int             @id
  title     VarChar(255)
  wordCount SmallInt

  @@datasource(ms)
}
```

`User` has implicit PostgreSQL scoping due to `default = true`. For non-default datasources, `@@datasource` is required to select the scope of the model. In our
case, the types that are in scope are defined in the `mysql.prisma` file.

## Enum Block

```groovy
enum Color {
  Red
  Teal
}
```

Enums can include their corresponding value to determine what is stored by the datasource:

> ⚠ This is not implemented yet.

```groovy
enum Color {
  Red  = "RED"
  Teal = "TEAL"
}
```

For now, we'll only support `String` enum value types.

## Embed Block

> ⚠ This is not implemented yet.

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

> ⚠ This is not implemented yet.

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

```groovy
datasource pg {
  provider = "postgres"
  url      = env("POSTGRES_URL")
}
```

You can also provide a default if the environment variable is not specified:

> ⚠ This is not implemented yet.

```groovy
  provider = "sqlite"
  url      = env("SQLITE_PATH", default: "file.db")
```

The `provider` must be static and cannot be an environment variable. Our general philosophy is that you want to generate environment variables **as late as
possible**. The sections below describe this behavior.

### Introspect Behavior

> ⚠ This is not implemented yet.

Introspection time will require the environment variable to be present:

```sh
$ prisma instrospect
! required POSTGRES_URL variable not found

$ export POSTGRES_URL="postgres://user:secret@rds.amazon.com:4321/db"
$ prisma introspect
```

### Migrate Behavior

> ⚠ This is not implemented yet.

Migration time will require the environment variable to be present:

```sh
$ prisma lift up
! required POSTGRES_URL variable not found

$ export POSTGRES_URL="postgres://user:secret@rds.amazon.com:4321/db"
$ prisma lift up
```

### Generate Behavior

Generation time will **not** require the environment variable:

```sh
$ prisma generate
```

But runtime will:

```js
import Photon from '@generated/photon'
const photon = new Photon()
// Thrown: required `POSTGRES_URL` variable not found
```

### Switching Datasources based on Environments

> ⚠ This is not implemented yet.

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
- `between(min, max)` - generates a random int in the specified range (⚠ This is not implemented yet)
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

> ⚠ This is not implemented yet.

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
	title pg.Varchar(n: 42)
	body  String
}
```

Resolves to:

```groovy
model Post {
	title pg.Varchar(n: 42)
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

### Merging Models

This is based on our [Research into Cue](https://github.com/prisma/specs/blob/cue/cue/Readme.md#application-2-safe-merging-of-models-with-the-same-name). We
want to safely merge models in a clear way.

Often times you'll import a schema that has conflicting models. In this case we take the union of all fields and attributes:

**post.prisma**

```groovy
model Post {
  id    Int    @id
	title pg.Varchar(n: 42)
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
	title pg.Varchar(n: 42)
	body  String
  @@unique([id,title])
}
```

Since our [type definitions are provided by connectors](#type-definitions-provided-by-connectors) we can use a constraint system to safely merge two datatypes
and take the intersection of those two types.

**Open Question:** How will this work for non data-type related attributes like `@unique`?

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

# FAQ

## Why not support @id for multiple blocks?

```groovy
model RecipeIngredient {
  recipe                  Recipe     @id
  ingredient              Ingredient @id
  amount                  Float
  quantitativeDisclosures String
  comment                 String
}
```

With this syntax, the `@id` ordering is unclear and the
[order of primary keys matters](https://stackoverflow.com/questions/16713233/why-does-primary-key-order-matter). Additionally, while it looks nice it doesn't
work for the other composite types. For example, `@unique` twice:

```groovy
model RecipeIngredient {
  recipe                  Recipe @unique
  ingredient              Ingredient @unique
  amount                  Float
  quantitativeDisclosures String
  comment                 String
}
```

Means those are unique across the table, while `@unique([recipe, ingredient])` would mean that the combination of fields must be unique in the table:

```groovy
model RecipeIngredient {
  recipe                  Recipe
  ingredient              Ingredient
  amount                  Float
  quantitativeDisclosures String
  comment                 String
  @@unique([recipe, ingredient])
}
```
