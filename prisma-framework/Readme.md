# Prisma Framework

The Prisma Framework is a suite of independent tools and workflows to make working with data easier. The Prisma Framework is built to work across a variety of
databases and programming languages.

**Editor's Note:** This specification is both a _draft_ and _forward-looking_. This spec was derived from an
[end-to-end prototype](https://github.com/prisma/reconnaissance). Engineering has not yet vetted the spec or the prototype.

The goals of this spec are to:

- Scout ahead of engineering with a spec and throwaway prototype that's grounded in reality
- Provide a sharper picture of where we see the product going
- Spread information across the organization of how the components of the Prisma Framework fit together

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

## Core Objects

Core objects describe the format of the shared data structures across workflows.

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
import { Schema } from 'prisma'

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

### Capability Map

The Capability Map is a structure that describes what Prisma features a datasource can perform. We decide these features. For example, we've decided that the
Capability Map has a `upsert` query. We've also decided that Capability Map includes features like functions, lists of strings, datetimes, etc.

Once we have this Capability Map, we then go to the datasource and see if we can perform this operation or properly store this type of data. If we can, it
appears in the datasource's Capability Map. If we can't, the capability is omitted. The structure of the Capability Map can be adjusted over time as we find new
features we'd like to add to Prisma.

<details>

<summary>Capability Map Type</summary>

```typescript
export type Map = {
  type: 'capability_map'
  datasources: DataSource[]
}

export type DataSource = {
  type: 'datasource_type'
  name: string
  datatypes: {
    [type: string]: DataType
  }
  queries: QueryType[]
}

export type QueryType = CreateType | FindType | UpdateType | DeleteType | UpsertType

export type CreateType = {
  type: 'create_type'
  inputs: InputType[]
  outputs: OutputType[]
}

export type FindType = {
  type: 'find_type'
  filters: FilterType[]
  outputs: OutputType[]
}

export type UpdateType = {
  type: 'update_type'
  inputs: InputType[]
  filters: FilterType[]
  outputs: OutputType[]
}

export type DeleteType = {
  type: 'delete_type'
  filters: FilterType[]
  outputs: OutputType[]
}

export type UpsertType = {
  type: 'upsert_type'
  inputs: InputType[]
  filters: FilterType[]
  outputs: OutputType[]
}

export type InputType = ExpressionType
export type FilterType = ExpressionType
export type OutputType = ExpressionType

export type ExpressionType = FunctionType | DataType

export type FunctionType = {
  type: 'function_type'
  name: string
  arguments: ArgumentType[]
  returns: DataType
}

export type ArgumentType = {
  type: 'argument_type'
  name: string
  datatype: DataType
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

export type QueryValue = CreateValue | FindValue | UpdateValue | DeleteValue | UpsertValue

export type CreateValue = {
  type: 'create_value'
  model: string
  inputs: InputValue[]
  outputs: OutputValue[]
}

export type FindValue = {
  type: 'find_value'
  model: string
  filters: FilterValue[]
  outputs: OutputValue[]
}

export type UpdateValue = {
  type: 'update_value'
  model: string
  inputs: InputType[]
  filters: FilterValue[]
  outputs: OutputValue[]
}

export type DeleteValue = {
  type: 'delete_value'
  model: string
  filters: FilterValue[]
  outputs: OutputValue[]
}

export type UpsertValue = {
  type: 'upsert_value'
  model: string
  inputs: InputType[]
  filters: FilterValue[]
  outputs: OutputValue[]
}

export type InputValue = {
  type: 'input_value'
  name: string
  value: Value
}

export type FilterValue = {
  type: 'filter_value'
  name: string
  value: Value
}

export type OutputValue = {
  type: 'filter_value'
  name: string
  value: Value
}

export type Value = FunctionValue | StringValue | IntValue | BooleanValue | DateTimeValue | FloatValue

export type FunctionValue = {
  type: 'function_value'
  name: string
  alias?: string
  arguments: Value[]
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
<summary>Capability Map Example</summary>

This is an incomplete capability map for Postgres:

```typescript
{
  "type": "capability_map",
  "datasources": [
    {
      "type": "datasource_type",
      "name": "postgres",
      "datatypes": {
        "integer": {
          "type": "named_type",
          "name": "Int"
        },
        "text": {
          "type": "named_type",
          "name": "String"
        },
        "bigint": {
          "type": "named_type",
          "name": "Int"
        },
        "boolean": {
          "type": "named_type",
          "name": "Boolean"
        },
        "timestamp without time zone": {
          "type": "named_type",
          "name": "DateTime"
        },
        "citext": {
          "type": "named_type",
          "name": "String"
        },
        "point": {
          "type": "list_type",
          "inner": {
            "type": "named_type",
            "name": "Int"
          }
        }
      },
      "queries": [
        {
          "type": "create_type",
          "inputs": [
            {
              "type": "named_type",
              "name": "String"
            },
            {
              "type": "named_type",
              "name": "Int"
            },
            {
              "type": "named_type",
              "name": "Float"
            },
            {
              "type": "named_type",
              "name": "Boolean"
            },
            {
              "type": "named_type",
              "name": "DateTime"
            },
            {
              "type": "list_type",
              "inner": {
                "type": "named_type",
                "name": "Int"
              }
            },
            {
              "type": "function_type",
              "name": "concat",
              "arguments": [
                {
                  "type": "argument_type",
                  "name": "first",
                  "datatype": {
                    "type": "named_type",
                    "name": "String"
                  }
                },
                {
                  "type": "argument_type",
                  "name": "second",
                  "datatype": {
                    "type": "named_type",
                    "name": "String"
                  }
                }
              ],
              "returns": {
                "type": "named_type",
                "name": "String"
              }
            }
          ],
          "outputs": []
        },
        {
          "type": "find_type",
          "filters": [],
          "outputs": []
        },
        {
          "type": "update_type",
          "inputs": [],
          "filters": [],
          "outputs": []
        },
        {
          "type": "delete_type",
          "filters": [],
          "outputs": []
        },
        {
          "type": "upsert_type",
          "inputs": [],
          "filters": [],
          "outputs": []
        }
      ]
    }
  ]
}
```

</details>

<details>
<summary>All Possible Capabilities</summary>

**TODO:** functions like `toLower(string) string`, `endsWith(string, string) boolean`. This will need to be a list of all the things the most capable datasource
can do. It's doubtful that any off the shelf database will fully comply with this list.

This will be a bit of an art in grouping features of different datasources together. We can start with the [OpenCRUD](https://github.com/opencrud/opencrud)
features and work from there. I'll be filling this in once we have a few working connectors.

</details>

## Core Workflows

### Introspect

Introspection is the process of understanding and reconstructing a datasource's models, fields and relationships from an existing datasource. Introspection
allows brownfield applications to get started with the Prisma Framework with minimal hassle.

To enable introspection on a datasource, a connector must implement the `Instrospecter` interface:

```typescript
// Schema core object is defined above
import * as Prisma from 'prisma'

interface Introspecter {
  introspect(): Promise<Prisma.Schema>
}
```

#### Postgres

Postgres supports rich introspection capabilities. Each postgres database comes with an internal schema called `information_schema`. This is where you'll find
information on the structure of the data. Introspecting Postgres requires

<details>
<summary>Introspection Example</summary>

This is an incomplete example based on the following code: https://github.com/prisma/reconnaissance/blob/master/datasources/postgres.ts

```typescript
async introspect(): Promise<Prisma.Schema> {
  const schema: Prisma.Schema = {
    type: 'schema',
    blocks: [
      {
        type: 'datasource',
        name: 'pg',
        assignments: [
          {
            type: 'assignment',
            key: 'url',
            value: {
              type: 'string_value',
              value: this.url,
            },
          },
        ],
      },
    ],
  }

  const tableResult = await this.client.query(
    `
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = $1
    -- Views are not supported yet
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `,
    // TODO: this would normally come from parsing the URL in dial(url)
    ['public']
  )

  for (let i = 0; i < tableResult.rows.length; i++) {
    const tableName = tableResult.rows[i].table_name
    const model: Prisma.Model = {
      type: 'model',
      name: casing.pascal(pluralize.singular(tableName)),
      properties: [],
    }

    const columnResult = await this.client.query(
      `
        SELECT
        a.attnum,
        a.attname as column_name,
        format_type(a.atttypid, a.atttypmod) as data_type,
        a.attnotnull,
        d.description,
        pg_get_expr(ad.adbin, ad.adrelid),
        COALESCE(ct.contype = 'p', false)
        FROM pg_attribute a
        JOIN ONLY pg_class c ON c.oid = a.attrelid
        JOIN ONLY pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_constraint ct ON ct.conrelid = c.oid AND a.attnum = ANY(ct.conkey) AND ct.contype IN('p', 'u')
        LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
        LEFT JOIN pg_description d ON d.objoid = a.attrelid AND d.objsubid = a.attnum
        WHERE a.attisdropped = false AND n.nspname = $1 AND c.relname = $2 AND a.attnum > 0
        ORDER BY a.attnum
    `,
      ['public', tableName]
    )

    for (let j = 0; j < columnResult.rows.length; j++) {
      const column = columnResult.rows[j]
      const columnName = column.column_name
      const coreType = Postgres.capabilities.datatypes[column.data_type]
      if (!coreType) {
        throw new Error(`Postgres connector: unable to map "${tableName}"."${columnName}" datatype "${column.data_type}" to a core prisma type`)
      }

      const field: Prisma.Field = {
        type: 'field',
        name: casing.camelCase(columnName),
        datatype: coreType,
        // TODO: fill in field attributes
        attributes: [],
      }
      model.properties.push(field)
    }

    schema.blocks.push(model)
  }

  return schema
}
```

</details>

#### Mongo

### Generate

Generation is the process of taking a Prisma Schema and a capability map and generating a datasource client. We call a generated datasource client **Photon**.
The API of these clients will depend on the datasource's capabilities. For example, the Postgres client will be a lot more capable than the Redis client.

To generate datasource clients, Generators must implement the `generate` interface:

```ts
import * as Capability from '../ast/capability'
import * as Schema from '../ast/prisma'

interface Generator {
  generate(capabilities: Capability.Map, schema: Prisma.Schema): string
}
```

<details>
<summary>Example Generator for Typescript</summary>

Full example available at: https://github.com/prisma/reconnaissance/blob/master/generators/typescript.ts

```typescript
generate(capabilities: Capability.Map, schema: Prisma.Schema): string {
  const stmts: string[] = []
  const models: Prisma.Model[] = []

  for (let i = 0; i < schema.blocks.length; i++) {
    const block = schema.blocks[i]
    if (block.type === 'model') {
      models.push(block)
    }
  }

  const modelTypes = models.map(model => {
    return `public readonly ${casing.lower(pluralize.plural(model.name))}: ${model.name}API;`
  })
  const modelInstances = models.map(model => {
    return `this.${casing.lower(pluralize.plural(model.name))} = new ${model.name}API(queryer);`
  })

  stmts.push(`
    import { Runtime } from './generators/typescript'
    import * as Capability from './ast/capability'
    import { Queryer } from './datasources/index'

    export default class Photon {
      ${modelTypes.join('\n')}
      constructor(queryer: Queryer) {
        ${modelInstances.join('\n')}
      }
    }
  `)

  stmts.push(...models.map(model => this.generateModel(capabilities, model)))

  const code = stmts.join('\n\n')
  return Prettier.format(code, { parser: 'typescript' })
}
```

</details>

### Access

Access is the how Photon builds up queries to send to the datasources. Data access has a client-server relationship.

#### Client

The Access Client is a simple HTTP client that's embedded inside Photon. The HTTP client implements the `Queryer` interface:

```ts
interface Queryer {
  query(query: Capabilities.QueryValue): Promise<QueryResult>
}
```

**TODO** properly define `QueryResult`

#### Server

**Editor's Note:** This is currently called the query engine.

The Access Server responds to HTTP requests from the Access Client. The Access Server is a long-running service that's either run as a local "sidecar" process
alongside your application or as a remote HTTP server. Typically when you're just getting started, you'll run the Access Server as a sidecar and later, as your
business grows, you'll transition to a multi-tiered architecture with a remote HTTP server.

The Access Server will try to connect to the provided datasources **on launch**. In order to do this, the Access Server needs to know the connection strings.
For this we'll need to pass in a path to the `schema.prisma` file: `./access-server --schema ./schema.prisma`.

**TODO** better understand the implications of this configuration dependency. How we will deploy this configuration, etc.

The Access Server is precompiled with common Connectors like Postgres, MySQL, SQLite and MongoDB. The Access Server will delegate establishing the datasource
connection to the connectors. Once the connections have been established, the Access Server is ready for queries from the Access Client.

<details>
<summary>Access Server Example Implementation</summary>

Live Implementation: https://github.com/prisma/reconnaissance/blob/master/prisma/access/server.ts#L4

**TODO** align code example with the writing above

</details>

In order for a Connector to be queryable, it must implement the `Queryer` interface:

```ts
interface Queryer {
  query(query: Capabilities.QueryValue): Promise<QueryResult>
}
```

You'll notice that the connector's Queryer interface is as the Access Client.

<details>
<summary>Connector Example Implementation</summary>

Live implementation in the prototype: https://github.com/prisma/reconnaissance/blob/master/datasources/postgres.ts

```typescript
export default class Postgres implements Queryer {
  async query(query: Capability.QueryValue): Promise<QueryResult> {
    const pgQuery = this.serialize(query)
    const result = await this.client.query(pgQuery)
    return {
      rowCount: result.rowCount,
      result: result.rows,
    }
  }

  // serialize the query AST into a Postgres query
  // TODO: we probably want to return a query string & parameters
  // to better avoid SQL injections
  private serialize(query: Capability.QueryValue): string {
    switch (query.type) {
      case 'create_value':
        return this.serializeCreate(query)
      // case 'find':
      //   return this.find(this.expression)
      default:
        throw new Error(`unhandled query: ${query.type}`)
    }
  }

  // serialize the query AST into a Postgres query
  private serializeCreate(query: Capability.CreateValue): string {
    const sql = []

    if (query.inputs) {
      const inputs: string[][] = []
      for (let i = 0; i < query.inputs.length; i++) {
        const input = query.inputs[i]
        inputs.push([this.serializeField(input.name), this.serializeValue(input.value)])
      }
      const fields = inputs.map(input => input[0])
      const values = inputs.map(input => input[1])
      // Note: schema would come from parsing the URL
      const schema = 'public'
      sql.push(`INSERT INTO "${schema}"."${query.model}" (${fields.join(', ')}) VALUES (${values.join(', ')})`)
    }

    // handle outputs
    let outputs: string[] = ['*']
    if (query.outputs.length) {
      // TODO: support custom returns
    }
    sql.push(`RETURNING ${outputs.join(', ')}`)

    return sql.join(' ') + ';'
  }

  private serializeField(name: string): string {
    return `"${name}"`
  }

  private serializeValue(value: Capability.Value): string {
    switch (value.type) {
      case 'string_value':
        return `'${value.value}'`
      case 'int_value':
        return `${value.value}`
      case 'boolean_value':
        return `${value.value}`
      case 'function_value':
        return value.alias ? this.serializeFunctionWithAlias(value) : this.serializeFunction(value)
      case 'datetime_value':
        return `${value.value.toISOString()}`
      case 'float_value':
        return `${value.value}`
    }
  }

  private serializeFunctionWithAlias(fn: Capability.FunctionValue): string {
    return `${this.serializeFunction(fn)} as "${fn.alias}"`
  }

  private serializeFunction(fn: Capability.FunctionValue): string {
    switch (fn.name) {
      case 'ternary':
        return this.serializeTernary(fn)
      case 'equals':
        return this.serializeEquals(fn)
      case 'or':
        return this.serializeOr(fn)
      case 'starts_with':
        return this.serializeStartsWith(fn)
      case 'concat':
        return this.serializeConcat(fn)
      default:
        throw new Error(`unhandled postgres function ${fn.name}`)
    }
  }

  private serializeTernary(fn: Capability.FunctionValue): string {
    const args = fn.arguments
    return `case when ${this.serializeValue(args[0])} then ${this.serializeValue(args[1])} else ${this.serializeValue(args[2])} end`
  }

  private serializeEquals(fn: Capability.FunctionValue): string {
    const args = fn.arguments
    return `${this.serializeValue(args[0])} = ${this.serializeValue(args[1])}`
  }

  private serializeOr(fn: Capability.FunctionValue): string {
    return fn.arguments.map(arg => this.serializeValue(arg)).join(' or ')
  }

  private serializeStartsWith(fn: Capability.FunctionValue): string {
    const args = fn.arguments
    return `${this.serializeValue(args[0])} LIKE ${this.serializeValue(args[1])} || '%'`
  }

  private serializeConcat(fn: Capability.FunctionValue): string {
    const args = fn.arguments.map(arg => this.serializeValue(arg))
    return `concat(${args})`
  }
}
```

</details>

### Migrate

Migrate is the process of safely changing the structure of one or more datasources. Migrate has a client-server relationship.

#### Client

The Migrate Client is a runtime library that lives inside the Prisma CLI.

#### Server

The Migrate Server can run either locally as a sidecar process or remotely as a coordination server. While the Migrate Server does support HTTP for triggering
commands, it has different requirements than the Access Server. Unlike data access, migrating your data may take hours or even days to complete. We can't expect
to have a reliable connection for the duration of these long-running processes. So additional to HTTP, the Migrate server also supports websocket for
subscribing to update events.

### Manage

### Schema

We provide a couple workflows for interacting with the Prisma Schema Language.

#### Parse

Parse takes a `schema.prisma` file and turns it into an AST.

The schema implements the `Parser` interface:

```typescript
interface Parser {
  parse(input: string): Prisma.Schema
}
```

<details>
<summary>PegJS Parser Definition</summary>

```
Schema = blocks:BlockList* _ {
  return {
    type:"schema",
    blocks: blocks
  }
}

BlockList = _ block:Block {
  return block
}

Block = Model / Datasource / Generator / Enum

Model = "model" sp name:Identifier sp "{" _ properties:PropertyList* _ "}" {
  return {
    type: "model",
    name: name,
    properties: properties
  }
}

PropertyList = _ property:Property {
  return property
}

Property = GroupedModelAttribute / ModelAttribute / Field

Datasource = "datasource" sp name:Identifier sp "{" _ assignments:DatasourceList* _ "}" {
  return {
    type: "datasource",
    name: name,
    assignments: assignments
  }
}

Generator = "generator" sp name:Identifier sp "{" _ assignments:GeneratorList* _ "}" {
  return {
    type: "generator",
    name: name,
    assignments: assignments
  }
}

Enum = "enum" sp name:Identifier sp "{" _ enumerators:EnumeratorList* _ "}"{
  return {
    type: "enum",
    name: name,
    enumerators: enumerators,
    attributes: []
  }
}

GroupedModelAttribute = "@@" group:Identifier "." name:Identifier args:AttributeArguments? {
  return {
    type: "attribute",
    group: group,
    name: name,
    arguments: args || []
  }
}

ModelAttribute = "@@" name:Identifier args:AttributeArguments? {
  return {
    type: "attribute",
    name: name,
    arguments: args || []
  }
}

DatasourceList = AssignmentList
GeneratorList = AssignmentList

EnumeratorList = name:Identifier sp {
  return {
    type: "enumerator",
    name: name
  }
}

Enumerator = name:Identifier

AssignmentList = _ assignment:Assignment {
  return assignment
}

Assignment = key:Identifier _ "=" _ value:Value {
  return {
    type: "assignment",
    key: key,
    value: value
  }
}

Field = name:Identifier sp datatype:DataType attributes:AttributeList* {
  return {
    type: "field",
    name: name,
    datatype: datatype,
    attributes: attributes
  }
}

Identifier = head:[A-Za-z] tail:[_A-Za-z0-9]* {
  return [head].concat(tail).join('')
}

DataType = GroupType / OptionalType / ListType / NamedType

GroupType = group:Identifier "." name:Identifier {
  return {
    type: "group_type",
    group: group,
    name: name,
  }
}

OptionalType = inner:(ListType / NamedType) "?" {
  return {
    type: "optional_type",
    inner: inner
  }
}

ListType = inner:NamedType "[]" {
  return {
    type: "list_type",
    inner: inner
  }
}

NamedType = name:("String" / "Float" / "Int" / "DateTime" / "Boolean") {
  return {
    type: "named_type",
    name: name
  }
}

ReferenceType = Identifier

AttributeList = sp attr:(GroupedAttribute / Attribute) {
  return attr
}

GroupedAttribute = "@" group:Identifier "." name:Identifier args:AttributeArguments? {
  return {
    type:"attribute",
    group: group,
    name: name,
    arguments: args || []
  }
}

Attribute = "@" name:Identifier args:AttributeArguments? {
  return {
    type:"attribute",
    name: name,
    arguments: args || []
  }
}

AttributeArguments = "(" args:AttributeArgumentList* ")" {
  return args
}

AttributeArgumentList = _ argument:AttributeArgument _ ","? _ {
  return argument
}

AttributeArgument = name:Identifier _ ":" _ value:Value {
  return {
    type: "attribute_argument",
    name: name,
    value: value
  }
}

Value = ListValue / StringValue / FloatValue / IntValue / BooleanValue / DateTimeValue / FunctionValue
ValueList = _ Value _ ","? _

ListValue = "[" ValueList* "]"

StringValue = value:string {
  return {
    type: "string_value",
    value: value
  }
}

IntValue = literal:[0-9]+ {
  return {
    type: "int_value",
    value: parseInt(literal.join(""), 10)
  }
}

FloatValue = literal:[0-9]+ "." decimal:[0-9]+ {
  return {
    type: "float_value",
    value: parseFloat(literal.join("") + "."+decimal.join(""), 10)
  }
}

BooleanValue = boolean:("true" / "false") {
  return {
    type:"boolean_type",
    value: boolean === "true" ? true : false
  }
}

DateTimeValue = "1/1/19" {
  return {
    type: "datetime_value",
    value: new Date()
  }
}

FunctionValue = name:Identifier "(" parameters:FunctionParamList* ")" {
  return {
    type: "function_value",
    name: name,
    parameters: parameters
  }
}

FunctionParamList = _ Value _ "," _

sp = [ \t\n\r]+

_ "whitespace"
  = [ \t\n\r]*

string "string"
  = quotation_mark chars:char* quotation_mark { return chars.join(""); }

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape
  = "\\"

quotation_mark
  = '"'

unescaped
  = [^\0-\x1F\x22\x5C]

// ----- Core ABNF Rules -----

// See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4234).
DIGIT  = [0-9]
HEXDIG = [0-9a-f]i
```

</details>

#### Format

Formatter takes a `schema.prisma` as a string input and returns a string.

The schema implements the `Formatter` interface:

```typescript
interface Formatter {
  format(input: string): string
}
```

Why does `Formatter` takes a string and not a `Prisma.Schema`? It takes a string because the formatter needs to be whitespace-aware. The Prisma Schema does not
store whitespace information.

#### Diff

Diff finds the differences between two Prisma Schemas. We use Diff in Lift to generate a sequence of steps to migrate from one schema to the next.

The schema implements the `Differ` interface:

```typescript
interface Differ {
  diff(one: Prisma.Schema, two: Prisma.Schema): Migration.Step[]
}
```

Diff returns a Migration object which contains the sequence of steps to take schema one to schema two.

<details>
<summary>Example Differ implementation</summary>

**TODO** align the implementation with the writing above.

Live implementation available here: https://github.com/prisma/reconnaissance/blob/master/prisma/schema/index.ts

```typescript
function diff(current: Prisma.Schema, next: Prisma.Schema): Lift.Step[] {
  return diffBlocks(current.blocks, next.blocks)
}

function diffBlocks(currents: Prisma.Block[], nexts: Prisma.Block[]): Lift.Step[] {
  const steps: Lift.Step[] = []
  let currentDatasources: Prisma.DataSource[] = []
  let nextDatasources: Prisma.DataSource[] = []
  let currentGenerators: Prisma.Generator[] = []
  let nextGenerators: Prisma.Generator[] = []
  let currentModels: Prisma.Model[] = []
  let nextModels: Prisma.Model[] = []
  let currentEnums: Prisma.Enum[] = []
  let nextEnums: Prisma.Enum[] = []

  // currents
  for (let i = 0; i < currents.length; i++) {
    const current = currents[i]
    switch (current.type) {
      case 'datasource':
        currentDatasources.push(current)
        break
      case 'generator':
        currentGenerators.push(current)
        break
      case 'model':
        currentModels.push(current)
        break
      case 'enum':
        currentEnums.push(current)
        break
    }
  }

  // nexts
  for (let i = 0; i < nexts.length; i++) {
    const next = nexts[i]
    switch (next.type) {
      case 'datasource':
        nextDatasources.push(next)
        break
      case 'generator':
        nextGenerators.push(next)
        break
      case 'model':
        nextModels.push(next)
        break
      case 'enum':
        nextEnums.push(next)
        break
    }
  }

  steps.push(...diffModels(currentModels, nextModels))

  return steps
}

function diffModels(currents: Prisma.Model[], nexts: Prisma.Model[]): Lift.Step[] {
  const steps: Lift.Step[] = []
  const deleteModels: { [model: string]: Prisma.Model } = {}
  const commonModels: Prisma.Model[][] = []

  // index the current models
  for (let i = 0; i < currents.length; i++) {
    deleteModels[currents[i].name] = currents[i]
  }

  // compare with the next models
  for (let i = 0; i < nexts.length; i++) {
    // found the model
    const name = nexts[i].name
    if (deleteModels[name]) {
      commonModels.push([deleteModels[name], nexts[i]])
      delete deleteModels[name]
      continue
    }
    // didn't find the model, we'll need to add it
    steps.push({
      type: 'create_model',
      model: nexts[i],
    })
  }

  // turn the remaining deleted models into delete operations
  for (let model in deleteModels) {
    steps.push({
      type: 'delete_model',
      model: deleteModels[model],
    })
  }

  for (let i = 0; i < commonModels.length; i++) {
    const models = commonModels[i]
    steps.push(...diffModel(models[0], models[1]))
  }

  return steps
}

function diffModel(current: Prisma.Model, next: Prisma.Model): Lift.Step[] {
  const steps: Lift.Step[] = []
  if (current.name !== next.name) {
    steps.push({
      type: 'update_model_name',
      from: current,
      to: next,
    })
  }
  steps.push(...diffProperties(next, current.properties, next.properties))
  return steps
}

function diffProperties(model: Prisma.Model, currents: Prisma.Property[], nexts: Prisma.Property[]): Lift.Step[] {
  const steps: Lift.Step[] = []
  let currentFields: Prisma.Field[] = []
  let nextFields: Prisma.Field[] = []
  let currentAttributes: Prisma.Attribute[] = []
  let nextAttributes: Prisma.Attribute[] = []

  // currents
  for (let i = 0; i < currents.length; i++) {
    const current = currents[i]
    switch (current.type) {
      case 'field':
        currentFields.push(current)
        break
      case 'attribute':
        currentAttributes.push(current)
        break
    }
  }

  // nexts
  for (let i = 0; i < nexts.length; i++) {
    const next = nexts[i]
    switch (next.type) {
      case 'field':
        nextFields.push(next)
        break
      case 'attribute':
        nextAttributes.push(next)
        break
    }
  }

  steps.push(...diffFields(model, currentFields, nextFields))
  steps.push(...diffModelAttributes(model, currentAttributes, nextAttributes))

  return steps
}

function diffFields(model: Prisma.Model, currents: Prisma.Field[], nexts: Prisma.Field[]): Lift.Step[] {
  const steps: Lift.Step[] = []
  const deleteFields: { [name: string]: Prisma.Field } = {}
  const commonFields: Prisma.Field[][] = []

  // index the current fields
  for (let i = 0; i < currents.length; i++) {
    deleteFields[currents[i].name] = currents[i]
  }
  // compare with the next fields
  for (let i = 0; i < nexts.length; i++) {
    // found the model
    const name = nexts[i].name
    if (deleteFields[name]) {
      commonFields.push([deleteFields[name], nexts[i]])
      delete deleteFields[name]
      continue
    }
    // didn't find the model, we'll need to add it
    steps.push({
      type: 'create_field',
      model: model,
      field: nexts[i],
    })
  }
  // turn the remaining deleted fields into delete operations
  for (let field in deleteFields) {
    steps.push({
      type: 'delete_field',
      model: model,
      field: deleteFields[field],
    })
  }
  for (let i = 0; i < commonFields.length; i++) {
    const fields = commonFields[i]
    steps.push(...diffField(model, fields[0], fields[1]))
  }
  return steps
}

function diffField(model: Prisma.Model, current: Prisma.Field, next: Prisma.Field): Lift.Step[] {
  const steps: Lift.Step[] = []
  if (current.name !== next.name) {
    steps.push({
      type: 'update_field_name',
      model: model,
      from: current,
      to: next,
    })
  }
  steps.push(...diffDataType(model, next, current.datatype, next.datatype))
  steps.push(...diffFieldAttributes(model, next, current.attributes, next.attributes))
  return steps
}

function diffDataType(model: Prisma.Model, field: Prisma.Field, current: Prisma.DataType, next: Prisma.DataType): Lift.Step[] {
  const steps: Lift.Step[] = []

  if (current.type !== next.type) {
    steps.push({
      type: 'update_field_type',
      model: model,
      field: field,
      from: current,
      to: next,
    })
    return steps
  }

  if (current.type === 'named_type' && next.type === 'named_type' && current.name !== next.name) {
    steps.push({
      type: 'update_field_type',
      model: model,
      field: field,
      from: current,
      to: next,
    })
    return steps
  }

  if (current.type === 'list_type' && next.type === 'list_type') {
    steps.push(...diffDataType(model, field, current.inner, next.inner))
    return steps
  }

  if (current.type === 'optional_type' && next.type === 'optional_type') {
    steps.push(...diffDataType(model, field, current.inner, next.inner))
    return steps
  }

  return steps
}

// TODO
function diffModelAttributes(model: Prisma.Model, current: Prisma.Attribute[], next: Prisma.Attribute[]): Lift.Step[] {
  return []
}

function diffFieldAttributes(model: Prisma.Model, field: Prisma.Field, current: Prisma.Attribute[], next: Prisma.Attribute[]): Lift.Step[] {
  return []
}
```

</details>

**TODO** Feels like Diff shouldn't be tied to `Migration`

#### Patch

Patch applies the steps returned from a `Differ` to migrate schema one to schema two.

The schema implements the `Patcher` interface:

```typescript
interface Patcher {
  patch(one: Prisma.Schema, steps: Migration.Step[]): Prisma.Schema
}
```

<details>
<summary>Example Patch Implementation</summary>

Live implementation available here: https://github.com/prisma/reconnaissance/blob/master/prisma/schema/index.ts

**TODO** Finish the implementation

```typescript
function patch(current: Prisma.Schema, steps: Lift.Step[]): Prisma.Schema {
  let next = current
  for (let i = 0; i < steps.length; i++) {
    next = patchStep(next, steps[i])
  }
  return next
}

function patchStep(current: Prisma.Schema, step: Lift.Step): Prisma.Schema {
  switch (step.type) {
    case 'create_model':
      current.blocks.push(step.model)
      return current
    case 'create_field':
      for (let i = 0; i < current.blocks.length; i++) {
        const block = current.blocks[i]
        if (block.type !== 'model' || block.name !== step.model.name) {
          continue
        }
        block.properties.push(step.field)
      }
      return current
    case 'create_datasource':
      throw new Error(`unhandled "create_datasource"`)
    case 'delete_datasource':
      throw new Error(`unhandled "delete_datasource"`)
    case 'update_model_name':
      throw new Error(`unhandled "update_model_name"`)
    case 'delete_model':
      throw new Error(`unhandled "delete_model"`)
    case 'create_model_attribute':
      throw new Error(`unhandled "create_model_attribute"`)
    case 'update_model_attribute':
      throw new Error(`unhandled "update_model_attribute"`)
    case 'delete_model_attribute':
      throw new Error(`unhandled "delete_model_attribute"`)
    case 'update_field_name':
      throw new Error(`unhandled "update_field_name"`)
    case 'update_field_type':
      throw new Error(`unhandled "update_field_type"`)
    case 'delete_field':
      throw new Error(`unhandled "delete_field"`)
    case 'create_field_attribute':
      throw new Error(`unhandled "create_field_attribute"`)
    case 'update_field_attribute':
      throw new Error(`unhandled "update_field_attribute"`)
    case 'delete_field_attribute':
      throw new Error(`unhandled "delete_field_attribute"`)
    default:
      throw new Error(`unhandled patch step ${step}`)
  }
}
```

</details>

**TODO** Patching at this level has nothing to do with migrations, we should update the types here.

#### Assemble

Assemble takes a Schema AST and generates a string.

The schema implements the `Assembler` interface:

```typescript
interface Assembler {
  assemble(schema: Prisma.Schema): string
}
```

<details>
<summary>Example Assembler implementation</summary>

**TODO** align prototype code with this interface

```ts
export function serialize(schema: Prisma.Schema): string {
  const strings: string[] = []
  for (let i = 0; i < schema.blocks.length; i++) {
    const block = schema.blocks[i]
    switch (block.type) {
      case 'datasource':
        strings.push(serializeDataSource(block))
        break
      case 'generator':
        strings.push(serializeGenerator(block))
        break
      case 'model':
        strings.push(serializeModel(block))
        break
      case 'enum':
        strings.push(serializeEnum(block))
        break
      default:
        throw new Error('unhandled block type')
    }
  }
  return strings.join('\n')
}

function serializeDataSource(datasource: Prisma.DataSource): string {
  const assignments: string[] = []
  for (let i = 0; i < datasource.assignments.length; i++) {
    const assignment = datasource.assignments[i]
    assignments.push(serializeAssignment(assignment))
  }
  return `datasource ${datasource.name} {\n  ${assignments.join('\n  ')}\n}`
}

function serializeGenerator(generator: Prisma.Generator): string {
  throw new Error('TODO: finish generator')
}

function serializeModel(model: Prisma.Model): string {
  const properties: string[] = []
  for (let i = 0; i < model.properties.length; i++) {
    const property = model.properties[i]
    properties.push(serializeProperty(property))
  }
  return `model ${model.name} {\n  ${properties.join('\n  ')}\n}`
}

function serializeEnum(enumerable: Prisma.Enum): string {
  throw new Error('TODO: finish enums')
}

function serializeAssignment(assignment: Prisma.Assignment): string {
  return `${assignment.key} = ${serializeValue(assignment.value)}`
}

function serializeValue(value: Prisma.Value): string {
  switch (value.type) {
    case 'boolean_value':
      return String(value.value)
    case 'datetime_value':
      return `"${value.value.toISOString()}"`
    case 'float_value':
      return String(value.value)
    case 'int_value':
      return String(value.value)
    case 'list_value':
      throw new Error('serializeValue: map unimplemented')
    case 'map_value':
      throw new Error('serializeValue: map unimplemented')
    case 'string_value':
      return `"${value.value}"`
  }
}

function serializeProperty(property: Prisma.Property): string {
  switch (property.type) {
    case 'field':
      return serializeField(property)
    case 'attribute':
      return serializeModelAttribute(property)
  }
}

function serializeField(field: Prisma.Field): string {
  const dataType = serializeDataType(field.datatype)
  const attributes = field.attributes.map(serializeFieldAttribute).join(' ')
  return `${field.name} ${dataType} ${attributes}`
}

function serializeDataType(dataType: Prisma.DataType): string {
  switch (dataType.type) {
    case 'optional_type':
      return serializeOptionalType(dataType)
    case 'list_type':
      return serializeListType(dataType)
    case 'named_type':
      return serializeNamedType(dataType)
  }
}

function serializeFieldAttribute(attribute: Prisma.Attribute): string {
  const name = attribute.group ? `${attribute.group}.${attribute.name}` : attribute.name
  const args = attribute.arguments.map(argument => serializeArgument(argument)).join(', ')
  return `@${name}(${args})`
}

function serializeModelAttribute(attribute: Prisma.Attribute): string {
  const name = attribute.group ? `${attribute.group}.${attribute.name}` : attribute.name
  const args = attribute.arguments.map(argument => serializeArgument(argument)).join(', ')
  return `@@${name}(${args})`
}

function serializeArgument(argument: Prisma.AttributeArgument): string {
  return ''
}

function serializeOptionalType(optionalType: Prisma.OptionalType): string {
  return `${serializeDataType(optionalType.inner)}?`
}

function serializeListType(listType: Prisma.ListType): string {
  return `${serializeDataType(listType.inner)}[]`
}

function serializeNamedType(namedType: Prisma.NamedType): string {
  return namedType.name
}
```

</details>

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
- **Brownfield Applications:** Brownfield refers to applications that already have existing infrastructure and design constraints. An example of brownfield
  application is Google Search.
- **Greenfield Applications:** Greenfield refers to applications that are starting new without constraints. An example of a greenfield application is your next
  startup.
- **AST:** AST stands for an abstract syntax tree. An abstract syntax tree is
- **Prisma CLI:** A commandline interface that bundles Prisma's workflows into one tool
- **Prisma SDK:** The programmatic API to Prisma's tools.
