# The Prisma Binary

<!-- toc -->

- [Prisma Binary CLI](#prisma-binary-cli)
- [Capability Map (for Schema Validation)](#capability-map-for-schema-validation)
- [Schema Validation](#schema-validation)
  - [How `check` works](#how-check-works)
- [Client Generation](#client-generation)
  - [Capability Map for Client Generation](#capability-map-for-client-generation)
    - [Generic Schema](#generic-schema)
    - [Connector Schema](#connector-schema)
    - [Capabilities as a Spreadsheet](#capabilities-as-a-spreadsheet)
    - [QueryGenerate(User Schema, Connector Schema): DMMF](#querygenerateuser-schema-connector-schema-dmmf)
- [Query Validation](#query-validation)
- [Query Execution](#query-execution)
- [Connector Interface](#connector-interface)
- [Appendix: Schema AST](#appendix-schema-ast)

<!-- tocstop -->

The Prisma Binary is the driving force behind Prisma's products. We use this to generate photon clients, typecheck schemas, and execute queries on our
datasources.

Prisma uses _connectors_ talks to different datasources. Postgres, MongoDB, and even Google Sheets can be a connector. The Prisma Binary is designed to work
with multiple connectors at once. Connectors are written in Rust, but may be higher-level in the future.

The following is a high-level diagram of how different clients connect to the Prisma Binary and how they relate to the connectors.

```
┌─────────────────────────┐┌─────────────────────────┐┌────────────────────────┐
│                         ││                         ││                        │
│  schema.prisma inside   ││    Generate a Photon    ││    Photon inside an    │
│         VSCode          ││          Client         ││      Application       │
│                         ││                         ││                        │
└─────────────────────────┘└─────────────────────────┘└────────────────────────┘
             ▲                          ▲                          ▲
             │ typecheck                │ generate                 │ execute
             ▼                          ▼                          ▼
┌─────────────────┬────────────────────────────────────────────────────────────┐
│  Prisma Binary  │                                                            │
├─────────────────┘                                                            │
│ ┌──────────────┐┌───────────────┐┌───────────────┐┌────────────────┐         │
│ │              ││               ││               ││                │         │
│ │    Parser    ││    Checker    ││   Generator   ││    Executer    │         │
│ │              ││               ││               ││                │         │
│ └──────────────┘└───────────────┘└───────────────┘└────────────────┘         │
│ ┌─────────────────────┐┌─────────────────────┐┌────────────────────┐         │
│ │                     ││                     ││                    │         │
│ │ Postgres Connector  ││   MySQL Connector   ││ MongoDB Connector  │  •••    │
│ │                     ││                     ││                    │         │
│ └─────────────────────┘└─────────────────────┘└────────────────────┘         │
└──────────────────────────────────────────────────────────────────────────────┘
```

A more in-depth version of the Prisma Binary:

```
                         ┌───────────────┐   ┌─────────────────┐
                         │ vscode "save" │   │ prisma generate │
                         │     event     │   └─────────────────┘
                         └───────────────┘            │
                                 │                    │
                   ┌ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┌─────────────┐
                                 │                    │                             │Prisma Binary│
                   │  ┌──────────┴────────────────────┴─────────────┐               └─────────────┘
                      │                                             │                             │
                   │  │                Schema Parser                │
                      │                                             │                             │
                   │  └──────────┬────────────────────┬─────────────┘
                                 │ schema AST         │ schema AST      static   ┌───────────┐    │
                   │  ┌──────────┴────────────────────┴─────────────┐ capability │           ├─┐
                      │                                             │    map     │           │ │  │
                   │  │                  Validate                   │◀───────────│           │ │
                      │                                             │            │           │ │  │
                   │  └──────────┬────────────────────┬─────────────┘            │           │ │
                                 │                    │                          │           │ │  │
┌────────────┐     │             │                    │                          │           │ │
│   Prisma   │                   │                    │                          │           │ │  │
│   VSCode   │◀────┼─────────────┘                    │                          │ Postgres  │ │
│ Extension  │ errors, warnings   ┌───────────────────┤                          │ Connector │ │  │
└────────────┘     │              │                   │ schema AST               │           │ │
                                  │                   ▼                          │           │ │  │
┌────────────┐     │              │            ┌────────────┐            static  │           │ │
│ Prisma CLI │        errors      │            │            │          capability│           │ │  │
│   Output   │◀────┼──────────────┘            │   Query    │             map    │           │ │
└────────────┘                                 │ Generator  │◀───────────────────┤           │ │  │
                   │                           │            │                    │           │ │
                                               └────────────┘                    │           │ │  │
                   │                                  │                          │           │ │
                                                      │ DMMF                     └─┬─────────┘ │  │
                   │                    ┌─────────────┼─────────────┐              └───────────┘
                                        ▼             ▼             ▼                             │
                   │             ┌────────────┐┌────────────┐┌────────────┐
                                 │            ││            ││            │                       │
                   │             │  PhotonJS  ││   Nexus    ││ Photon Go  │
                                 │ Generator  ││ Generator  ││ Generator  │                       │
                   │             │            ││            ││            │
                                 └────────────┘└────────────┘└────────────┘                       │
                   │                    │             │             │
                    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
                                        │             │             │
                                        │ js code     │ nexus code  │ go code
                                        ▼             ▼             ▼
                             ┌─────────────────────────────────────────────────┐
                             │                                                 │
                             │                  ./app/prisma                   │
                             │                                                 │
                             └─────────────────────────────────────────────────┘
```

- **TODO** add query execution (`photon.users.find`) to this diagram
- **TODO** decide how deep we want to go in the introduction
- **TODO** add formatting to the mix

# Prisma Binary CLI

The entrypoint to the Prisma Binary is a CLI. This CLI can run one-off `check` commands or use `serve` to start a long-running server that will serve query
requests.

```
$ prisma -h

Usage:

  prisma [<flags>] <command> [<args> ...]

Flags:

  -h, --help  Output usage information.

Commands:

  help                 Show help for a command.
  check                Check a schema for errors.
  serve                Start the prisma service.
```

# Capability Map (for Schema Validation)

The capability map tells us what the connector supports. It's a declarative structure written into the code that we've crafted by hand. The format of the
capability map is the following:

```ts
type Capabilities = {
  types: Object<string, string>
  relations: Object<string, boolean>
  embeds: Object<string, boolean>
  attributes: Object<string, string>
}
```

Example for Postgres:

```go

var postgres = &Postgres{
	// type map
	types: map[string]bool{
		// core
		"String":    true,
		"String?":   true,
		"String[]":  true,
		"String[]?": true,

		// custom type
    "Citext": true,
    "Numeric(precision: Int, scale: Int)": true

		// integers
		"Integer":    true,
		"Integer?":   true,
		"Integer[]":  true,
		"Integer[]?": true,

		// floats
		"Float":    true,
		"Float?":   true,
		"Float[]":  true,
		"Float[]?": true,

		// datetime
		"DateTime":    true,
		"DateTime?":   true,
		"DateTime[]":  true,
		"DateTime[]?": true,

		// boolean
		"Boolean":    true,
		"Boolean?":   true,
		"Boolean[]":  true,
		"Boolean[]?": true,
	},

	// relation support
	relations: map[string]bool{
		"one-to-one":  true,
		"one-to-many": true,
	},

	// embed support
	embeds: map[string]bool{
		"one-to-one":  false,
		"one-to-many": false,
	},

	// field attributes
	fieldAttrs: map[string]bool{
		"id()":     true,
		"unique()": true,
	},

	// model attributes
	modelAttrs: map[string]bool{
		"id":     true,
		"unique(fields: Field[])": true,
	},
}
```

**TODO** Double-back on this. This is overly simplistic and already breaks down in some cases. We'll rather want to use "AST fragments" that we can walk over
and check if all the arguments match up.

**Sidenote** To deal with schema changes, we should interact with these capibility maps using visitor pattern to pick out only the fields we care about. This
will minimize breakage as we add more things to the map.

# Schema Validation

Schema validation is used by editors like VSCode to for autocompletion and typechecking. Schema checking works in the following way:

```
         ┌───────────────┐
         │ schema.prisma │
         │  with VSCode  │
         │   extension   │
         └───────────────┘
                 │
    ┌───────────┐│     /bin/prisma check ./schema.prisma   ┌────────────┐
    │ save file │├───────────────────┐                     │   Prisma   │
    └───────────┘│                   └────────────────────▶│   Binary   │
                 │                                         └────────────┘
                 │                                                │
                 │                                                │┌───────┐
                 │                        ┌───────────────────────┤│ check │
                 │◀───────────────────────┘                       │└───────┘
                 │                                                │
                 │            {                                   │
                 │              errors: Error[],                  ▼
                 │              warnings: Warning[]           exit: 0
                 │            }
                 │
                 │
─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                 │                                         ┌────────────┐
    ┌───────────┐│     /bin/prisma check ./schema.prisma   │   Prisma   │
    │ save file │├────────────────────────────────────────▶│   Binary   │
    └───────────┘│                                         └────────────┘
                 │                                                │
                 │                                                │┌───────┐
                 │                        ┌───────────────────────┤│ check │
                 │                        │                       │└───────┘
                 │◀───────────────────────┘                       │
                 │                                                │
                 │            {                                   │
                 │              errors: Error[],                  ▼
                 │              warnings: Warning[]           exit: 0
                 ⋮            }
                 │
                 ▼
```

```ts
type ValidateInput = {
  schema: string
}

type ValidateOutput = {
  errors: Error[]
  warnings: Warning[]
}

type Warning = {
  code: string
  message: string
  start: Int
  end: Int
}

type Error = {
  code: string
  message: string
  stack: string
  start: Int
  end: Int
}
```

These errors will contain line and column information that the plugin will use to show warnings and errors to the developer.

## How `check` works

```
                                         ┌────────────┐                  ┌────────────┐
                                         │  Postgres  │                  │  MongoDB   │
                                         │ Connector  │                  │ Connector  │
                                         └────────────┘                  └────────────┘
                                                │        capabilityMap          │
                                                └────────────────────────┬──────┘
                                                                         ▼
┌──────────────┐              ┌───────────────┐                 ┌─────────────────┐
│schema.prisma │   schema     │               │                 │check(           │
│ with VSCode  │   string     │     Parse     │  schemaAST      │  schemaAST,     │
│  extension   │─────────────▶│    Schema     │────────────────▶│  capabilityMap  │
│              │              │               │                 │)                │
└──────────────┘              └───────────────┘                 └─────────────────┘
        ▲                                                                │
        │                       errors, warnings                         │
        └────────────────────────────────────────────────────────────────┘
```

We'll parse the schema generating a schema AST. The Schema AST is defined below in [Appendix: Schema AST](#Appendix:-Schema-AST). We'll also pull the
`capabilityMap` from the connectors and merge them together.

The format of the `capabilityMap` is described in [Capability Map](#Capability-Map).

`check(schemaAST, capabilityMap)` runs the following operations:

1. Walk the merged capability map of the connectors building an index of the available types, available attributes and relationship support.
2. Walk the schema comparing against this index. If there are errors or warnings, we'll add them to the list and continue traversing each node.

**TODO** describe the capability map merge.

# Client Generation

Client generation describes taking the a connector's capability map and merging it with the user's schema AST to generate an intermediate representation,
internally called the DMMF. The Query Generator loops over the capability map with the schema AST.

```
                         │ schema AST
                         ▼
                  ┌────────────┐      static    ┌───────────┐
                  │            │    capability  │           ├┐
                  │   Query    │       map      │ Postgres  ││
                  │ Generator  │◀───────────────│ Connector ││
                  │            │                │           ││
                  └────────────┘                └┬──────────┘│
                         │                       └───────────┘
                         │ DMMF
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    ┌────────────┐┌────────────┐┌────────────┐
    │            ││            ││            │
    │  PhotonJS  ││   Nexus    ││ Photon Go  │
    │ Generator  ││ Generator  ││ Generator  │
    │            ││            ││            │
    └────────────┘└────────────┘└────────────┘
           │ js code     │ nexus code  │ go code
           ▼             ▼             ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│                  ./app/prisma                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Capability Map for Client Generation

For client generation the capability map needs to be able to switch off expressions based on connector support.

### Generic Schema

First, we start with a generic schema of all possible Prisma features. You can think of this like a coloring book, the structure is in place, but it's up to you
to fill in what you need.

```ts
// Root node. A list of datasources and their capabilities
type Capabilities = {
  type: 'Capabilities'
  datasources: Datasource[]
}

// datasource, postgres, mysql, sqlite
type Datasource = {
  type: 'Datasource'
  name: string
  queries: Query[]
}

// queries, findOne, findMany, create, etc.
type Query = {
  type: 'Query'
  name: string
  conditions: Condition[]
}

type Condition = InputCondition | OutputCondition | FilterCondition

// inserting data, { data: ... }
type InputCondition = {
  type: 'input'
  properties: Property[]
}

// returning data, { select: ... }
type OutputCondition = {
  type: 'output'
  properties: Property[]
}

// filtering data, { where: ... }
type FilterCondition = {
  type: 'filter'
  expressions: BooleanExpression[]
}

// a key value mapping between a field and an expression
// e.g. { full_name: concat(first_name, last_name) }
type Property = {
  type: 'Property'
  key: FieldType
  value: TypeExpression
}

type FieldType = BooleanFieldType | StringFieldType | IntegerFieldType | FloatFieldType | DateTimeFieldType
type TypeExpression = BooleanExpression | StringExpression | IntegerExpression | FloatExpression | DateTimeExpression
type StringExpression = StringFieldType | StringLiteralType | StringFunction
type BooleanExpression = BooleanFieldType | BooleanLiteralType | BooleanFunction
type IntegerExpression = IntegerFieldType | IntegerLiteralType | IntegerFunction
type FloatExpression = FloatFieldType | FloatLiteralType | FloatFunction
type DateTimeExpression = DateTimeFieldType | DateTimeLiteralType | DateTimeFunction

// accepts a field that is a string type, "first_name"
type StringFieldType = {
  type: 'StringFieldType'
}

// accepts a string literal, "hi"
type StringLiteralType = {
  type: 'StringLiteralType'
}

// function that returns a string, lower(string): string
type StringFunction = {
  type: 'StringFunction'
  name: string
  args: TypeExpression[]
}

// accepts an integer field type, "age"
type IntegerFieldType = {
  type: 'IntegerFieldType'
}

// accepts an integer type, 5
type IntegerLiteralType = {
  type: 'IntegerLiteralType'
}

// function that returns an integer, add(5, 1): int
type IntegerFunction = {
  type: 'IntegerFunction'
  name: string
  args: TypeExpression[]
}

// accepts a boolean field, "active"
type BooleanFieldType = {
  kind: 'BooleanFieldType'
}

// accepts a boolean value, true
type BooleanLiteralType = {
  kind: 'BooleanLiteralType'
}

// a function that returns a boolean, equals(first_name, "alice"): boolean
type BooleanFunction = {
  kind: 'BooleanFunction'
  name: string
  args: TypeExpression[]
}

// accepts a datetime type, "created_at"
type DateTimeFieldType = {
  kind: 'DateTimeFieldType'
}

// accepts a datetime value, "6/10/19"
type DateTimeLiteralType = {
  kind: 'DateTimeLiteralType'
}

// a function that returns a datetime, "now()"
type DateTimeFunction = {
  kind: 'DateTimeFunction'
  name: string
  args: TypeExpression[]
}
```

### Connector Schema

Now for each connector, we'll define a new schema in such a way that it's specific to the connector, but still follows the structure of the schema above.

The following shows that Postgres supports `Create` and `FindOne` functions:

- Create accepts Strings, Integers, Booleans, DateTime, etc. It even supports passing an integer into a float field. It also maps out the outputs, what can be
  returned via `select`.
- FindOne shows what types of filters we can pass in. We can pass in a boolean literal (e.g. `where: true`), but we can also pass in complex functions like
  `{ where: { first_name: "lower(bob)" } }`.

```ts
const ast: t.Capabilities = {
  kind: 'Capabilities',

  datasources: [
    // postgres datasource
    {
      kind: 'Datasource',
      name: 'Postgres',
      queries: [
        // create query
        {
          kind: 'Query',
          name: 'create',
          input: {
            kind: 'Input',
            properties: [
              {
                kind: 'Property',
                key: {
                  kind: 'StringFieldType',
                },
                value: {
                  kind: 'StringLiteralType',
                },
              },
              {
                kind: 'Property',
                key: {
                  kind: 'IntegerFieldType',
                },
                value: {
                  kind: 'IntegerLiteralType',
                },
              },
              {
                kind: 'Property',
                key: {
                  kind: 'BooleanFieldType',
                },
                value: {
                  kind: 'BooleanLiteralType',
                },
              },
              {
                kind: 'Property',
                key: {
                  kind: 'DateTimeFieldType',
                },
                value: {
                  kind: 'DateTimeLiteralType',
                },
              },
              // e.g. { data: { amount: 5 } }
              {
                kind: 'Property',
                key: {
                  kind: 'FloatFieldType',
                },
                value: {
                  kind: 'IntegerLiteralType',
                },
              },
              // { data: { first_name: "lower('MATT')" } }
              {
                kind: 'Property',
                key: {
                  kind: 'StringFieldType',
                },
                value: {
                  kind: 'StringFunction',
                  name: 'lower',
                  args: [
                    {
                      kind: 'StringLiteralType',
                    },
                  ],
                },
              },
            ],
          },
          output: {
            kind: 'Output',
            properties: [
              {
                kind: 'Property',
                key: {
                  kind: 'StringFieldType',
                },
                value: {
                  kind: 'StringLiteralType',
                },
              },
              {
                kind: 'Property',
                key: {
                  kind: 'IntegerFieldType',
                },
                value: {
                  kind: 'IntegerLiteralType',
                },
              },
              {
                kind: 'Property',
                key: {
                  kind: 'BooleanFieldType',
                },
                value: {
                  kind: 'BooleanLiteralType',
                },
              },
              {
                kind: 'Property',
                key: {
                  kind: 'DateTimeFieldType',
                },
                value: {
                  kind: 'DateTimeLiteralType',
                },
              },
              {
                kind: 'Property',
                key: {
                  kind: 'FloatFieldType',
                },
                value: {
                  kind: 'FloatLiteralType',
                },
              },
              // e.g. { select: first_name: "lower(first_name)" }
              {
                kind: 'Property',
                key: {
                  kind: 'StringFieldType',
                },
                value: {
                  kind: 'StringFunction',
                  name: 'lower',
                  args: [
                    {
                      kind: 'StringLiteralType',
                    },
                  ],
                },
              },
            ],
          },
          filter: {
            kind: 'Filter',
            expressions: [
              // boolean filters
              {
                kind: 'BooleanFieldType',
              },
              {
                kind: 'BooleanLiteralType',
              },
              // e.g. and(boolean, boolean): boolean
              {
                kind: 'BooleanFunction',
                name: 'and',
                args: [
                  {
                    kind: 'BooleanFieldType',
                  },
                  {
                    kind: 'BooleanFieldType',
                  },
                  // TODO: spread support
                ],
              },
              // e.g. or(boolean, boolean): boolean
              {
                kind: 'BooleanFunction',
                name: 'or',
                args: [
                  {
                    kind: 'BooleanFieldType',
                  },
                  {
                    kind: 'BooleanFieldType',
                  },
                  // TODO: spread support
                ],
              },
              // e.g. xor(boolean, boolean): boolean
              {
                kind: 'BooleanFunction',
                name: 'xor',
                args: [
                  {
                    kind: 'BooleanFieldType',
                  },
                  {
                    kind: 'BooleanFieldType',
                  },
                  // TODO: spread support
                ],
              },

              // string filters
              // e.g. equal(stringField, string): boolean
              {
                kind: 'BooleanFunction',
                name: 'equals',
                args: [
                  {
                    kind: 'StringFieldType',
                  },
                  {
                    kind: 'StringLiteralType',
                  },
                ],
              },
              // e.g. notEqual(stringField, string): boolean
              {
                kind: 'BooleanFunction',
                name: 'notEquals',
                args: [
                  {
                    kind: 'StringFieldType',
                  },
                  {
                    kind: 'StringLiteralType',
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    // sqlite datasource
    {
      kind: 'Datasource',
      name: 'SQLite',
      queries: [],
    },
  ],
}
```

### Capabilities as a Spreadsheet

In the future, we may want to use Excel and map this tree out visually. In Excel, this would look somethign like this:

```
| Capabilities                       | Postgres  |  SQLite  |  HTTP   |
| :--------------------------------: | :------:  |  :----:  | :----:  |
| findOne                            |   true    |   true   |  true   |
|   output                           |   true    |   true   |  true   |
|     concat(String, String): String |   true    |   true   |  true   |
|   filter                           |   true    |   true   |  false  |
|     equal(String, String): Boolean |   true    |   true   |  false  |
|     gt(String, String): Boolean    |   false   |   false  |  false  |
| create                             |   true    |   true   |  true   |
|   input                            |   true    |   true   |  true   |
|     concat(String, String): String |   true    |   false  |  true   |
```

- **Note** When you put `false` on a parent node, it should disable the whole subtree

- **TODO** It's still a bit unclear to me how many combinations we'll need to map out, it's recursive so it can't be all of them otherwise it'd be infinity
  combinations.
  - **ANSWER:** Use `$ref`
- **TODO** Merge with the capability map above.

### QueryGenerate(User Schema, Connector Schema): DMMF

Now that we have a subset of the generic schema that's specific to Postgres, we can loop over our schema and generate the DMMF. The DMMF is then passed into the
generators.

- **TODO** I still haven't figured out how to do this. I want to talk to Tim next week to try and figure this out.

# Query Validation

**TODO**

# Query Execution

**TODO**

# Connector Interface

Connectors have an interface with 4 methods:

1. `Capabilities(): Capabilities` Returns a list of the connector's capabilities
2. `Connect(): error`: Connects to the given data source. If this datasource is stateless, connect may be empty.
3. `Execute(query: string, variables: map[string]interface{}): RecordSet` Executes a query with the given parameters and returns a `RecordSet`.
4. `Close(): error`: Closes the datasource. If the datasource is stateless, close may be empty.

# Appendix: Schema AST

The schema AST currently looks like this.

**TODO** Translate into english.

```go
package schema

// Datamodel struct
type Datamodel struct {
	Declarations []Declaration
}

// Declaration interface
type Declaration interface{ declaration() }

// Declaration Compliance
func (*ModelDeclaration) declaration() {}
func (*SourceBlock) declaration()      {}
func (*GeneratorBlock) declaration()   {}
func (*EnumDeclaration) declaration()  {}

// ModelDeclaration struct
type ModelDeclaration struct {
	Name       *Identifier
	Fields     []*Field
	Directives []*Directive
}

// SourceBlock struct
type SourceBlock struct {
	Name       *Identifier
	Properties []*Argument
}

// GeneratorBlock struct
type GeneratorBlock struct {
	Name       *Identifier
	Properties []*Argument
}

// EnumDeclaration struct
type EnumDeclaration struct {
	Name       *Identifier
	Values     []*EnumValue
	Directives []*Directive
}

// Field struct
type Field struct {
	FieldType *Identifier
	Name      *Identifier
	Arity     FieldArity
	Directive []*Directive
}

// FieldArity type
type FieldArity int

// Arity
const (
	Required FieldArity = 0
	Optional            = 1
	List                = 2
)

// EnumValue struct
type EnumValue struct {
	Name string
}

// Directive struct
type Directive struct {
	Name      *Identifier
	Arguments []*Argument
}

// Argument struct
type Argument struct {
	Name  *Identifier
	Value Value
}

// Identifier struct
type Identifier struct {
	Name string
}

// Value interface
type Value interface{ value() }

// Value compliance
func (*Number) value()   {}
func (*String) value()   {}
func (*Boolean) value()  {}
func (*Constant) value() {}
func (*Function) value() {}
func (*Array) value()    {}

// Number struct
type Number struct {
	Value string
}

// String struct
type String struct {
	Value string
}

// Boolean struct
type Boolean struct {
	Value string
}

// Constant struct
type Constant struct {
	Name      string
	Arguments []Argument
}

// Function struct
type Function struct {
	Name      string
	Arguments []Argument
}

// Array struct
type Array struct {
	Elements []Value
}

```

**TODO** this is how we do it currently, we might want to revisit the design.
