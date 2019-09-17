# Prisma Framework

The Prisma Framework is a suite of independent tools and workflows to make working with data easier. The Prisma Framework is built to work across a variety of
databases and programming languages.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Terminology

Before we get started, it's important to align on the terminology:

- **Schema:** The structure of your application's data. A schema contains datasources, generators, models, fields, and relationhips.
- **Prisma Schema Language:** A syntax for describing your application's Schema. You'll find the Prisma Schema Language in files with the `.prisma` extension.
- **schema.prisma:** The default file that holds your application's schema. This file is written in the Prisma Schema Language.
- **Datasource:** A resource that contains state. It could be a Postgres database or a workbook in Google Sheets.
- **Model:** A collection of related data. It could be a table in Postgres, a collection in Mongo, or a worksheet in Google Sheets.
- **Field:** A set of data of a specific type. Fields may contain strings, numbers, booleans and even binary data. These are the columns in SQL and NoSQL
  databases.
- **Record:** A single slice of data in a Model. Records are called rows in Postgres and Documents in Mongo.
- **One-to-One:** A connection between two fields of a model, where one record may be linked with only one other record.
- **One-to-Many:** A single connection between two fields of a model, where one record may be linked with many other records.
- **Many-to-Many:** A single connection between two fields of a model, where many records may be linked with many other records.
- **Connector:** A plugin that connect Prisma with the datasource's underlying stateful resource. Connectors enable the workflows described below.
- **Capability Map:** Each datasource has it's own set of unique features. The capability map is a tree of features provided by the connector to tell Prisma
  what the given datasource can do.
- **Generator:** A plugin that reads a Prisma schema and outputs code to access the datasources. Currently we have generators for Typescript and Go.
- **Brownfield:** Brownfield refers to applications that already have existing infrastructure and design constraints. An example of brownfield application is
  Google Search.
- **Greenfield:** Greenfield refers to applications that are starting new without constraints. An example of a greenfield application is your next startup.
- **AST:** AST stands for an abstract syntax tree. An abstract syntax tree is

## Core Structures

Core structures describe the format of the shared data structures across workflows.

### Schema

The Schema is an AST representation of your Prisma Schema Language files. Workflows will instead work with this structured representation of the `*.prisma`
files rather than the file data itself.

<details>
<summary>Schema AST Structure</summary>

```typescript
export type Schema = {
  type: 'schema'
  blocks: Block[]
}

export type Block = DataSource | Generator | Model | Enum

export type DataSource = {
  type: 'datasource'
  name: string
  assignments: Assignment[]
}

export type Generator = {
  type: 'generator'
  name: string
  assignments: Assignment[]
}

export type Model = {
  type: 'model'
  name: string
  properties: Property[]
}

export type Property = Field | Attribute

export type Assignment = {
  type: 'assignment'
  key: string
  value: Value
}

export type Enum = {
  type: 'enum'
  name: string
  enumerator: Enumerator[]
  attributes: Attribute[]
}

export type Enumerator = {
  type: 'enumerator'
  name: string
}

export type Field = {
  type: 'field'
  name: string
  datatype: DataType
  attributes: Attribute[]
}

export type DataType = OptionalType | ListType | NamedType

export type OptionalType = {
  type: 'optional_type'
  inner: ListType | NamedType
}

export type ListType = {
  type: 'list_type'
  inner: DataType
}

export type NamedType = {
  type: 'named_type'
  name: 'String' | 'Boolean' | 'DateTime' | 'Int' | 'Float'
}

export type Attribute = {
  type: 'attribute'
  group?: string
  name: string
  arguments: AttributeArgument[]
}

export type AttributeArgument = {
  type: 'attribute_argument'
  name: string
  value: Value
}

export type Value = ListValue | MapValue | StringValue | IntValue | BooleanValue | DateTimeValue | FloatValue

export type ListValue = {
  type: 'list_value'
  values: Value[]
}

export type MapValue = {
  type: 'map_value'
  map: { [key: string]: Value }
}

export type StringValue = {
  type: 'string_value'
  value: string
}

export type IntValue = {
  type: 'int_value'
  value: number
}

export type BooleanValue = {
  type: 'boolean_value'
  value: boolean
}

export type DateTimeValue = {
  type: 'datetime_value'
  value: Date
}

export type FloatValue = {
  type: 'float_value'
  value: number
}
```

</details>

### Lift Migration

### Capability Map

## Core Workflows

## Introspect

Introspection is the process of understanding and reconstructing a datasource's models, fields and relationships from an existing datasource. Introspection
works. Introspection allows brownfield applications to get started with the Prisma Framework with minimal hassle.

To enable introspection on a datasource, a connector must implement the following interface:

```

```

### Postgres

### Mongo

## Generate

Generation is the process of

## Access

## Migrate

## Manage

## Schema
