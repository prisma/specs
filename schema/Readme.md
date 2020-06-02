# Prisma Schema Language (PSL)

- Owner: @matthewmueller
- Stakeholders: @schickling @mavilein
- State:
  - Spec: In Progress 🚧
  - Implementation: In Progress 🚧

The Prisma Schema declaratively describes the structure of your data sources. We use the Prisma Schema to generate Prisma Client libraries for data access, migrate
your datasources with Lift and administer your data using Studio.

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
          - [Implied Has-Many](#implied-has-many)
          - [Implied Has-One](#implied-has-one)
        - [Implicit Many-to-Many (M:N) Relationships](#implicit-many-to-many-mn-relationships)
        - [Explicit Many-to-Many (M:N) Relationships With or Without Extra Columns](#explicit-many-to-many-mn-relationships-with-or-without-extra-columns)
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
  - [Comments](#comments)
    - [// comment](#-comment)
    - [/// comment](#-comment)
    - [Example with Comments](#example-with-comments)
  - [Enum Block](#enum-block)
  - [Env Function](#env-function)
    - [Env Function Behavior](#env-function-behavior)
  - [Function](#function)
  - [Auto Formatting](#auto-formatting)
    - [Formatting Rules](#formatting-rules)
      - [Configuration blocks are aligned by their `=` sign.](#configuration-blocks-are-aligned-by-their--sign)
      - [Field definitions are aligned into columns separated by 2 or more spaces.](#field-definitions-are-aligned-into-columns-separated-by-2-or-more-spaces)
- [FAQ](#faq)
  - [Why not support @id for multiple blocks?](#why-not-support-id-for-multiple-blocks)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Datasource Block

The datasource block tells the schema where the models are backed.

```prisma
datasource pg {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Supported fields

- `provider` Can be one of the following built in datasource providers:
  - `postgresql`
  - `mysql`
  - `sqlite`
- `url` Connection URL including authentication info. Each datasource provider documents the URL syntax. Most providers use the syntax provided by the database. (more information see [Datasource URLs](datasource_urls.md))

Connectors may bring their own attributes to allow users to tailor their schemas according to specific features of their connected datasources.

## Generator Block

Generator blocks configure which clients are generated and how they're generated. Language preferences and binary configuration will go in here:

```prisma
generator js {
  provider = "prisma-client-js"
  target   = "es3"
  output   = "./client"
}

generator ts {
  target   = "prisma-client-js"
  provider = "./path/to/custom/generator"
}

generator go {
  provider  = "prisma-client-go"
}
```

### Supported fields

- `provider` Can be a path or one of the following built in datasource providers:
  - `prisma-client-js`
  - `prisma-client-go` (⚠ This is not implemented yet.)
- `output` Path for the generated client

Generators may bring their own attributes.

### Binary Configuration

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-glibc-libssl1.0.2"]
  pinnedBinaryTarget = env("BINARY_TARGET") // On local, "native" and in production, "linux-glibc-libssl1.0.2"
}
```

| Field                | Description                                                                                                                           | Behavior                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `binaryTargets`      | _(optional)_ An array of binaries that are required by the application, string for known binary targets and path for custom binaries. | Declarative way to download the required binaries. |
| `pinnedBinaryTarget` | _(optional)_ A string that points to the name of an object in the `binaryTargets` field, usually an environment variable              | Declarative way to choose the runtime binary       |

- Both `binaryTargets` and `pinnedBinaryTarget` fields are optional, **however** when a custom binary is provided the `pinnedBinaryTarget` is required.

You can find more information about the binary configuration in the [binary spec](../binaries/Readme.md).

## Model Block

Models are the high-level entities of our business. They are the nouns: the User, the Comment, the Post and the Tweet.

Here's an example of the Model block:

```prisma
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
| DateTime | Timestamp             |

Here's how some of the databases we're tracking map to the core types:

#### Core Data Type to Connector

| Type     | Postgres  | MySQL     | SQLite  |
| -------- | --------- | --------- | ------- |
| String   | text      | TEXT      | TEXT    |
| Boolean  | boolean   | BOOLEAN   | _N/A_   |
| Int      | integer   | INT       | INTEGER |
| Float    | real      | FLOAT     | REAL    |
| Datetime | timestamp | TIMESTAMP | _N/A_   |

**N/A:** here means no perfect equivalent, but we can probably get pretty close.

#### Core Data Type to Generator

| Type     | JS / TS | Go        |
| -------- | ------- | --------- |
| String   | string  | string    |
| Boolean  | boolean | bool      |
| Int      | number  | int       |
| Float    | number  | float64   |
| DateTime | Date    | time.Time |

#### List Types

Lists are denoted with `[]` at the end of a type. Whether they are supported by a given datasource depends on the type being used in the list:

- Lists are supported for relations and embeds by every connector.
- Lists are supported for primitive types and enums by a connector if the value can be stored within the record. This means that a retrieval of this field in a query must not incur any additional lookups in the database. This is not the case for every datasource. For example Postgres does support this but SQLite does not.

```prisma
model User {
  names    String[]
  ages     Int[]
  heights  Float[]
}
```

The default value for a required list is an empty list.

If a connector does not support lists for primitive types it is possible to work around this limitation through relations. This makes the overhead of a query using this field transparent.

```prisma
model User {
  names UserName[]
}

model UserName {
  name String
}
```

#### Optional Types

Most field types also support optional fields. By default, fields are required, but if you want to make them optional, you add a `?` at the end. Currently, the
only field type that is not nullable is the [List Type](#list-types).

```prisma
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

The default output for a nullable field is `null`.

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

```prisma
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

| **user** |         |
| -------- | ------- |
| id       | integer |
| name     | text    |

| **customer** |         |
| ------------ | ------- |
| id           | integer |
| user         | integer |
| address      | text    |

You **may** omit either `User.customer` or `Customer.user` and the relationship will remain intact. This makes either the back-relation or the forward-relation
optional. If one side of the relation is missing, Prisma implies the field name based on the name of the model it is pointing to.

If you're introspecting an existing database and the foreign key does not follow the alphanumeric convention, then we'll use the
`@relation(_ name: String?, references: Identifier[]?, onDelete: OnDeleteEnum?)` attribute to clarify.

```prisma
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

```prisma
model Writer {
  id     Int     @id
  blog   Blog[]
}

model Blog {
  id      Int     @id
  author  Writer
}
```

- `Blog.author`: points to the primary key on writer

Connectors for relational databases will implement this as two tables with a foreign-key constraint on the `blog` table:

| **writer** |         |
| ---------- | ------- |
| id         | integer |

| **blog** |         |
| -------- | ------- |
| id       | integer |
| author   | integer |

###### Implied Has-Many

You **may** omit `Blog.author` or `Writer.blog` and the relationship will remain intact.

```prisma
model Writer {
  id Int @id
}

model Blog {
  id     Int    @id
  author Writer
}
```

For an **implied has-many**, a required list is added to `Writer`. In this case `blog Blog[]`. If a `blog` field already exists, there is an error and you
must explicitly name the relation.

###### Implied Has-One

```prisma
model Writer {
  id   Int    @id
  blog Blog[]
}

model Blog {
  id      Int     @id
}
```

For an **implied has-one**, an optional relation is added to `Blog`. In this case `writer Writer?`. If a `writer` field already exists, there is an error and
you must explicitly name the relation.

##### Implicit Many-to-Many (M:N) Relationships

Blogs can have multiple writers and a writer can write many blogs. Prisma supports implicit join tables as a low-syntax way to get started.

```prisma
model Blog {
  id       Int       @id
  author  Writer[]
}

model Writer {
  id     Int     @id
  blog   Blog[]
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

For implicit many-to-many relations, you **must** include both `Blog.author` and `Writer.blog`. If one of these fields is missing, Prisma will assume it's a
**One-to-Many (1:N)** relationship.

##### Explicit Many-to-Many (M:N) Relationships With or Without Extra Columns

Many-to-many relationships are simply 2 one-to-many relationships.

```prisma
model Blog {
  id           Int           @id
  blogWriter   BlogWriter[]
}

model Writer {
  id           Int           @id
  blogWriter   BlogWriter[]
}

// many to many
model BlogWriter {
  blog      Blog
  author    Writer
  is_owner  Boolean
  @@id([author, blog])
}
```

| **Blog** |         |
| -------- | ------- |
| id       | integer |

| **Writer** |         |
| ---------- | ------- |
| id         | integer |

| **BlogWriter** |         |
| -------------- | ------- |
| blog_id        | integer |
| author_id      | integer |
| is_owner       | boolean |

Note that the join table, in this case, `BlogWriter` may contain extra fields like `is_owner`.

##### Self-Referential Relationships

Prisma supports self-referential relationships:

```prisma
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

```prisma
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

You can also have relationships to composite primary keys

```prisma
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

The `@id` attribute marks the primary identifier of a model. If a model does not have a primary identifier or you want to reference another field, you can
specify the field using `references` in the `@relation` attribute

```prisma
model Document {
  projectID  String   @default('')
  revision   Int      @default(1)
  blocks     Block[]
  @@unique([projectID, revision])
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

```prisma
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

```prisma
// compiler error
@attribute(key: "a", key: "b")
```

For arrays with a single parameter, you **may** omit the surrounding brackets:

```prisma
@attribute([item], key: [item]) // is the same as
@attribute(item, key: item)
```

#### Field Attributes

Field attributes are marked by an `@` prefix placed at the end of the field definition. You can have as many field attributes as you want and they may also span
multiple lines:

```prisma
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

Specifies and disambiguates relationships when needed. Where possible on relational databases, the `@relation` annotation will translate to a foreign key constraint, but not an index.

###### Named relations

When a model contains a single relation to another model or itself, giving a name to the relation is optional and the `@relation` directive can be completely
omitted.

There can be multiple distinct relationships between two models, or between a model and itself ("self relation"). When this is the case, the relationships must
be named, so they can be distinguished.

###### Ambiguous relations

Relation fields that do not clearly belong to a specific relationship constitute an _ambiguous relation_.

This is an example ambiguous relation on the schema of an imaginary simplified blogging platform:

```prisma
model Blog {
    id         Int @id
    author     User[]
    subscriber User[]
}

model User  {
    id           Int @id
    authorOf     Blog[]
    subscribedTo Blog[]
}
```

There are two relationships between `Blog` and `User`, so we need to name them to tell them apart. A valid version of this schema could look like this:

```prisma
model Blog {
    id         Int @id
    author     User[] @relation("Authorship")
    subscriber User[] @relation("Subscription")
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

Prisma supports the following core block attributes. Block attributes may be used in `model` and `embed` blocks. These attributes **must** be implemented by
every connector with a **best-effort implementation**:

- `@@map(_ name: String)`: Define the name of the underlying table or collection name
- `@@id(_ fields: Identifier[])`: Defines a composite primary key across fields
- `@@unique(_ fields: Identifier[], name: String?)`: Defines a composite unique constraint across fields
- `@@index(_ fields: Identifier[], name: String?)`: Defines an index for multiple fields

## Comments

There are 2 types of comments that are supported in the schema:

### // comment

This comment is for the reader's clarity and is not present in the AST.

### /// comment

> ⚠ This is not implemented yet.

These comments as either field comments, model comments or as free-floating comments. Instrospection will pull comments on fields or models from the database.
Lift will also update these comments in datasources that support them.

### Example with Comments

Here are some different examples:

```prisma
/// This comment will get attached to the User model
model User {
  /// This comment will get attached to the id field as a comment
  id      Int
  // This comment is just for you
  weight  Float /// This comment gets attached to the weight field
}

// This comment is just for you. This comment will not
// show up in the AST.

/// This is a free-floating comment that will show up
/// in the AST as a Comment node, but is not attached
/// to any other node. We can use these for documentation
/// in the same way that godoc.org works.

model Customer {}
```

## Enum Block

```prisma
enum Color {
  Red
  Teal
}
```

Enums can include their corresponding value to determine what is stored by the datasource:

> ⚠ This is not implemented yet. See [tracking issue](https://github.com/prisma/prisma2/issues/273)

```prisma
enum Color {
  Red  = "RED"
  Teal = "TEAL"
}
```

PSL only supports `String` enum value types.

## Env Function

The schema can require certain environment expectations to be met. The purpose of the `env` function is to:

- Keeps secrets out of the schema
- Improve portability of the schema

```prisma
datasource pg {
  provider = "postgres"
  url      = env("DATABASE_URL")
}
```

### Env Function Behavior

Only functionality that actually requires the environment variable to be set will fail if it is missing. E.g. `generate` will **not** require the environment variable:

```sh
$ prisma generate
```

But runtime will:

```js
import { PrismaClient } from '@prisma/client'
const client = new PrismaClient()
// Thrown: required `DATABASE_URL` variable not found
```

## Function

Prisma core provides a set of functions that **must** be implemented by every connector with a **best-effort implementation**. Functions only work inside field
and block attributes that accept them.

- `uuid()` - generates a fresh UUID
- `cuid()` - generates a fresh cuid
- `now()` - current date and time

Default values using a dynamic generator can be specified as follows:

```prisma
model User {
  id        String   @default(uuid()) @id
  createdAt DateTime @default(now())
}
```

Functions will always be provided at the Prisma level by the query engine.

The data types that these functions return will be defined by the connectors. For example, `now()` in Postgres will return a `timestamp with time zone`, while
`now()` with a JSON connector would return an `ISOString`.

## Auto Formatting

Following the lead of [gofmt](https://golang.org/cmd/gofmt/) and [prettier](https://github.com/prettier/prettier), our syntax ships with a formatter for
`.prisma` files.

Like `gofmt` and unlike `prettier`, we offer no options for configurability here. **There is one way to format a prisma file**.

This strictness serves two benefits:

1. No bikeshedding. There's a saying in the Go community that, "Gofmt's style is nobody's favorite, but gofmt is everybody's favorite."
2. No pull requests with different spacing schemes.

### Formatting Rules

#### Configuration blocks are aligned by their `=` sign.

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

# FAQ

## Why not support @id for multiple blocks?

```prisma
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

```prisma
model RecipeIngredient {
  recipe                  Recipe @unique
  ingredient              Ingredient @unique
  amount                  Float
  quantitativeDisclosures String
  comment                 String
}
```

Means those are unique across the table, while `@unique([recipe, ingredient])` would mean that the combination of fields must be unique in the table:

```prisma
model RecipeIngredient {
  recipe                  Recipe
  ingredient              Ingredient
  amount                  Float
  quantitativeDisclosures String
  comment                 String
  @@unique([recipe, ingredient])
}
```
