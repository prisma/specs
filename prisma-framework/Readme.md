# Prisma Framework

The Prisma Framework is a suite of independent tools and workflows to make working with data easier. The Prisma Framework is built to work across a variety of
databases and programming languages.

**Author's Note:** This specification is both a _draft_ and _forward-looking_. This spec was derived from an end-to-end prototype of throwaway code. Engineering
has not yet vetted the spec. The goals of this document are to start a constructive dialog between product and engineering, to provide a sharper picture of
where we see the product going and to spread information across the organization of how the components of the Prisma Framework fit together.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Core Structures](#core-structures)
  - [Schema](#schema)
  - [Migration](#migration)
  - [Capabilities](#capabilities)
- [Core Workflows](#core-workflows)
  - [Introspection](#introspection)
    - [Postgres](#postgres)
    - [Mongo](#mongo)
  - [Generation](#generation)
  - [Access](#access)
  - [Migration](#migration-1)
  - [Management](#management)
  - [Schema](#schema-1)
    - [parse](#parse)
    - [format](#format)
    - [generate](#generate)
- [Terminology](#terminology)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Core Structures

Core structures describe the format of the shared data structures across workflows.

### Schema

The Schema is an AST representation of your Prisma Schema Language files. Workflows will work with this structured representation of the `*.prisma` files rather
than the file data itself.

<details>
<summary>Schema Type</summary>

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

<details>
<summary>Schema Example</summary>

```json
{
  "type": "schema",
  "blocks": [
    {
      "type": "datasource",
      "name": "pg",
      "assignments": [
        {
          "type": "assignment",
          "key": "url",
          "value": {
            "type": "string_value",
            "value": "postgres://localhost:5432/prisma-blog"
          }
        }
      ]
    },
    {
      "type": "model",
      "name": "Blog",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "website",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    },
    {
      "type": "model",
      "name": "Comment",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "postId",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "comment",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    },
    {
      "type": "model",
      "name": "Migrate",
      "properties": [
        {
          "type": "field",
          "name": "version",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        }
      ]
    },
    {
      "type": "model",
      "name": "Post",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "blogId",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "authorId",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "title",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    },
    {
      "type": "model",
      "name": "User",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "email",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "location",
          "datatype": {
            "type": "list_type",
            "inner": {
              "type": "named_type",
              "name": "Int"
            }
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "firstName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "lastName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    }
  ]
}
```

**TODO:** add attributes

</details>

### Migration

**DRAFT**

A Migration is a sequence of steps to change a datasource's structure. Some changes may include adding a new model, changing a field name or removing a
relationship. Each step is a single command we run against the datasource. A migration runs the steps inside a transaction whenever possible.

<details>
<summary>Migration Type</summary>

```typescript
// Import the Schema type (written above)
import * as Schema from './schema'

export type Migration = {
  steps: Step[]
}

export type Step =
  | CreateDatasource
  | DeleteDatasource
  | CreateModel
  | UpdateModelName
  | DeleteModel
  | CreateField
  | UpdateFieldName
  | UpdateFieldType
  | DeleteField
  | CreateModelAttribute
  | UpdateModelAttribute
  | DeleteModelAttribute
  | CreateFieldAttribute
  | UpdateFieldAttribute
  | DeleteFieldAttribute

export type CreateDatasource = {
  type: 'create_datasource'
  name: string
}

export type DeleteDatasource = {
  type: 'delete_datasource'
  name: string
}

export type CreateModel = {
  type: 'create_model'
  model: Schema.Model
}

export type UpdateModelName = {
  type: 'update_model_name'
  from: Schema.Model
  to: Schema.Model
}

export type DeleteModel = {
  type: 'delete_model'
  model: Schema.Model
}

export type CreateModelAttribute = {
  type: 'create_model_attribute'
}

export type UpdateModelAttribute = {
  type: 'update_model_attribute'
}

export type DeleteModelAttribute = {
  type: 'delete_model_attribute'
}

export type CreateField = {
  type: 'create_field'
  model: Schema.Model
  field: Schema.Field
}

export type UpdateFieldName = {
  type: 'update_field_name'
  model: Schema.Model
  from: Schema.Field
  to: Schema.Field
}

export type UpdateFieldType = {
  type: 'update_field_type'
  model: Schema.Model
  field: Schema.Field
  from: Schema.DataType
  to: Schema.DataType
}

export type DeleteField = {
  type: 'delete_field'
  model: Schema.Model
  field: Schema.Field
}

export type CreateFieldAttribute = {
  type: 'create_field_attribute'
}

export type UpdateFieldAttribute = {
  type: 'update_field_attribute'
}

export type DeleteFieldAttribute = {
  type: 'delete_field_attribute'
}
```

</details>

<details>
<summary>Migration Example</summary>

**TODO** May not need to send the full Schema models and fields through

```json
[
  {
    "type": "create_model",
    "model": {
      "type": "model",
      "name": "Blog",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "website",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "title",
          "datatype": {
            "type": "group_type",
            "group": "pg",
            "name": "Citext"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    }
  },
  {
    "type": "create_model",
    "model": {
      "type": "model",
      "name": "Comment",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "postId",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "comment",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    }
  },
  {
    "type": "create_model",
    "model": {
      "type": "model",
      "name": "Migrate",
      "properties": [
        {
          "type": "field",
          "name": "version",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        }
      ]
    }
  },
  {
    "type": "create_model",
    "model": {
      "type": "model",
      "name": "Post",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "blogId",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "authorId",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "title",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    }
  },
  {
    "type": "create_field",
    "model": {
      "type": "model",
      "name": "User",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "email",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "location",
          "datatype": {
            "type": "list_type",
            "inner": {
              "type": "named_type",
              "name": "Int"
            }
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "firstName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "lastName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    },
    "field": {
      "type": "field",
      "name": "id",
      "datatype": {
        "type": "named_type",
        "name": "Int"
      },
      "attributes": []
    }
  },
  {
    "type": "create_field",
    "model": {
      "type": "model",
      "name": "User",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "email",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "location",
          "datatype": {
            "type": "list_type",
            "inner": {
              "type": "named_type",
              "name": "Int"
            }
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "firstName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "lastName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    },
    "field": {
      "type": "field",
      "name": "email",
      "datatype": {
        "type": "named_type",
        "name": "String"
      },
      "attributes": []
    }
  },
  {
    "type": "create_field",
    "model": {
      "type": "model",
      "name": "User",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "email",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "location",
          "datatype": {
            "type": "list_type",
            "inner": {
              "type": "named_type",
              "name": "Int"
            }
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "firstName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "lastName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    },
    "field": {
      "type": "field",
      "name": "location",
      "datatype": {
        "type": "list_type",
        "inner": {
          "type": "named_type",
          "name": "Int"
        }
      },
      "attributes": []
    }
  },
  {
    "type": "create_field",
    "model": {
      "type": "model",
      "name": "User",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "email",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "location",
          "datatype": {
            "type": "list_type",
            "inner": {
              "type": "named_type",
              "name": "Int"
            }
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "firstName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "lastName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    },
    "field": {
      "type": "field",
      "name": "firstName",
      "datatype": {
        "type": "named_type",
        "name": "String"
      },
      "attributes": []
    }
  },
  {
    "type": "create_field",
    "model": {
      "type": "model",
      "name": "User",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "email",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "location",
          "datatype": {
            "type": "list_type",
            "inner": {
              "type": "named_type",
              "name": "Int"
            }
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "firstName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "lastName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    },
    "field": {
      "type": "field",
      "name": "lastName",
      "datatype": {
        "type": "named_type",
        "name": "String"
      },
      "attributes": []
    }
  },
  {
    "type": "create_field",
    "model": {
      "type": "model",
      "name": "User",
      "properties": [
        {
          "type": "field",
          "name": "id",
          "datatype": {
            "type": "named_type",
            "name": "Int"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "email",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "location",
          "datatype": {
            "type": "list_type",
            "inner": {
              "type": "named_type",
              "name": "Int"
            }
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "firstName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "lastName",
          "datatype": {
            "type": "named_type",
            "name": "String"
          },
          "attributes": []
        },
        {
          "type": "field",
          "name": "createdAt",
          "datatype": {
            "type": "named_type",
            "name": "DateTime"
          },
          "attributes": []
        }
      ]
    },
    "field": {
      "type": "field",
      "name": "createdAt",
      "datatype": {
        "type": "named_type",
        "name": "DateTime"
      },
      "attributes": []
    }
  }
]
```

</details>

### Capabilities

## Core Workflows

### Introspection

Introspection is the process of understanding and reconstructing a datasource's models, fields and relationships from an existing datasource. Introspection
works. Introspection allows brownfield applications to get started with the Prisma Framework with minimal hassle.

To enable introspection on a datasource, a connector must implement the following interface:

```

```

#### Postgres

#### Mongo

### Generation

Generation is the process of

### Access

### Migration

### Management

### Schema

#### parse

#### format

#### generate

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
