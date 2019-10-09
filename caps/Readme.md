<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Capabilities](#capabilities)
  - [Query Capabilities](#query-capabilities)
    - [Inputables](#inputables)
    - [Filterables](#filterables)
    - [Outputables](#outputables)
    - [Query Capability AST](#query-capability-ast)
      - [Generating Photon clients](#generating-photon-clients)
      - [Validating Queries](#validating-queries)
    - [Spreadsheet Frontend](#spreadsheet-frontend)
  - [Schema Capabilities](#schema-capabilities)
    - [Schema Capability AST](#schema-capability-ast)
      - [Validating the user's Prisma Schema](#validating-the-users-prisma-schema)
        - [Prisma Language Server](#prisma-language-server)
        - [Migration Engine](#migration-engine)
    - [Spreadsheet Frontend](#spreadsheet-frontend-1)
  - [Terminology](#terminology)
  - [Additional Resources](#additional-resources)
  - [Unanswered Questions](#unanswered-questions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Capabilities

<!-- toc -->

- [Query Capabilities](#query-capabilities)
  - [Inputables](#inputables)
  - [Filterables](#filterables)
  - [Outputables](#outputables)
  - [Query Capability AST](#query-capability-ast)
    - [Generating Photon clients](#generating-photon-clients)
    - [Validating Queries](#validating-queries)
  - [Spreadsheet Frontend](#spreadsheet-frontend)
- [Schema Capabilities](#schema-capabilities)
  - [Schema Capability AST](#schema-capability-ast)
    - [Validating the user's Prisma Schema](#validating-the-users-prisma-schema)
      - [Prisma Language Server](#prisma-language-server)
      - [Migration Engine](#migration-engine)
  - [Spreadsheet Frontend](#spreadsheet-frontend-1)
- [Terminology](#terminology)
- [Additional Resources](#additional-resources)
- [Unanswered Questions](#unanswered-questions)

<!-- tocstop -->

We want to be able to take full advantage of the query and schema capabilities of each provided data source. To do this we'll build a static map of a data
source's capabilities.

There are 2 properties of the capability map: **query capabilities** & **schema capabilities**.

## Query Capabilities

Query capabilities describe what types of queries we can perform on the data source. They also define what functions, expressions and relational queries are
available to us for each query.

Query capabilities are grouped into one of 3 sub-categories:

1. [Inputables](#)
2. [Filterables](#)
3. [Outputables](#)

A query may contain one or more of these categories. In [PhotonJS for Postgres](https://github.com/prisma/prisma2/blob/master/docs/photon/api.md#api-reference),
we have the following queries:

1. `create({ data: Inputable, select?: Outputable })`
1. `find({ where: Filterable, select?: Outputable })`
1. `findMany({ where: Filterable, select?: Outputable })`
1. `update({ data: Inputable, where: Filterable, select?: Outputable })`
1. `updateMany({ data: Inputable[], where: Filterable, select?: Outputable })`
1. `upsert({ create: Inputable, update: Inputable, where: Filterable, select?: Outputable })`
1. `delete({ where: Filterable, select?: Outputable })`
1. `deleteMany({ where: Filterable, select?: Outputable })`

### Inputables

An Inputable is the range of acceptable inputs that data source **natively supports**. For example, in Postgres an Inputable is all the acceptable inputs for
the `values` clause:

```sql
insert into users ("id", "first_name", "full_name", "active")
values (gen_random_uuid(), 'Alice', 'Alice' || ' ' || 'Prismo', TRUE);
```

> In the future, this may be split into **natively supported** and **prisma supported**.

### Filterables

A Filterable is the range of acceptable filters that data source **natively supports**. For example, in Postgres a Filterable is all the acceptable filters for
the `where` clause:

```sql
update users set active = false
where customer_id is null and created_at <= now() - interval '14 days';
```

> In the future, this may be split into **natively supported** and **prisma supported**.

### Outputables

An Outputable is the range of acceptable outputs that data source **natively supports**. For example, in Postgres an Outputable is all the acceptable outputs
for the `select` and `returning` clauses:

```sql
select id, first_name || ' ' || last_name, coalesce(updated_at, created_at, now()) from users;
```

> In the future, this may be split into **natively supported** and **prisma supported**.

### Query Capability AST

The Query Capability AST is a **tree structure** that defines all possible inputables, filterables, and outputables for each query in each data source.

```ts
type Capabilities = {
  type: 'capabilities'
  datasources: DataSource[]
}

type DataSources = {
  type: 'datasource'
  name: string
  queries: Query[]
}

type Query = {
  type: 'query'
  name: string
  inputables?: Inputable[]
  filterables?: Filterable[]
  outputables?: Outputable[]
}

type Inputable = Expression
type Filterable = Expression
type Outputable = Expression

type Expression = Function | DataType

type Function = {
  type: 'function'
  name: string
  arguments: Argument[]
  returns: DataType
}

type Argument = {
  type: 'argument'
  name: string
  datatype: DataType
}

type DataType = OptionalType | ListType | NamedType

type OptionalType = {
  type: 'optional_type'
  inner: ListType | NamedType
}

type ListType = {
  type: 'list_type'
  inner: DataType
}

type NamedType = {
  type: 'named_type'
  name: 'String' | 'Boolean' | 'DateTime' | 'Integer' | 'Float'
}
```

Combined with the user's Prisma Schema, the tree is used in 2 ways:

1. [Generating Photon clients](#)
1. [Validating Queries](#)

#### Generating Photon clients

Paired with the user's Prisma Schema AST, we'll use the Query Capability AST to generate type-safe Photon clients that adapt their API based on the capabilities
of the data source.

> TODO: provide a minimal example of how this will work

#### Validating Queries

Inbound queries must also be validated by Prisma's Query Engine before they're executed against the data sources. We'll use the Query Capability AST and the
user's Prisma Schema AST to validate these queries.

> TODO: provide a minimal example of how this will work

### Spreadsheet Frontend

We can visualize the query capabilities in a spreadsheet in the following way:

|  Data Types  | Postgres | SQLite | MongoDB |
| :----------: | :------: | :----: | :-----: |
|   `String`   |    IO    |   IO   |   IO    |
|  `String?`   |    IO    |   IO   |   IO    |
|  `String[]`  |    IO    |   –    |   IO    |
| `String[]?`  |    IO    |   –    |   IO    |
|  `Boolean`   |    IO    |   IO   |   IO    |
|  `Boolean?`  |    IO    |   IO   |   IO    |
| `Boolean[]`  |    IO    |   –    |   IO    |
| `Boolean[]?` |    IO    |   –    |   IO    |

|                     Functions                     | Postgres | SQLite | MongoDB |
| :-----------------------------------------------: | :------: | :----: | ------- |
|           `lower(text: String): String`           |    IO    |   IO   | –       |
| `starts_with(text: String, sub: String): Boolean` |   IFO    |  IFO   | F       |
|      `and(a: Boolean, b: Boolean): Boolean`       |   IFO    |  IFO   | F       |
|      `concat(a: String, b: String): String`       |    IO    |   IO   | F       |
|     `equal(a: Integer, b: Integer): Boolean`      |   IFO    |  IFO   | F       |
|        `not(condition: Boolean): Boolean`         |   IFO    |  IFO   | F       |

- **I** is an inputable
- **F** is a filterable
- **O** is an outputable

**Example**: IFO means that this expression can be an inputable, filterable and an outputable. If there is a dash (**–**), it means that this capability isn't
supported at all by the data source.

## Schema Capabilities

Schema capabilities define the structural possibilities of a data source. Schema capabilities are grouped into the following sub-categories:

1. [Data Types](#)
2. [Field Attributes](#)
3. [Model Attributes](#)
4. [Enums](#)

These categories describe what values can be placed where. A capability may have one or more of these categories. In
[PhotonJS for Postgres](https://github.com/prisma/prisma2/blob/master/docs/photon/api.md#api-reference), we have the following queries:

### Schema Capability AST

The Schema Capability AST is a tree structure that defines the acceptable data types, constraints,

```ts
// TODO
```

Combined with the user's Prisma Schema AST, the tree is used in following way:

1. [Validating the user's Prisma Schema](#)

#### Validating the user's Prisma Schema

We'll use the Schema capabilities to validate schemas in the **Prisma Language Server** and in the **Migration Engine**.

##### Prisma Language Server

> TODO: provide a minimal example of how this will work

##### Migration Engine

> TODO: provide a minimal example of how this will work

### Spreadsheet Frontend

We can visualize the schema capabilities in a spreadsheet in the following way:

> TODO: finish me

## Terminology

- **Prisma Schema:** Your `schema.prisma` file and it's dependencies
- **Prisma Schema AST:** The AST tree representation of a resolved (fully imported) `schema.prisma`
- **Capability Map:** Static tree representation comprising of the Query and Schema capabilities
- **Query Compatibility AST**: The tree representation of a data source's query capabilities
- **Schema Compatibility AST**: The tree representation of a data source's schema capabilities

## Additional Resources

- [Query Capabilities Part I](https://www.dropbox.com/preview/recordings/Prisma/Capabilities%201.mp4)
- [Query Capabilities Part II](https://www.dropbox.com/preview/recordings/Prisma/Capabilities%202.mp4)

## Unanswered Questions

- Handle relationships
- How to handle `ORDER BY`
- How to handle Postgres extensions
