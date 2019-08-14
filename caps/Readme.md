# The Prisma Binary

<!-- toc -->

- [Prisma Binary CLI](#prisma-binary-cli)
- [Capability Map](#capability-map)
- [Schema Validation](#schema-validation)
  * [How `check` works](#how-check-works)
- [Client Generation](#client-generation)
- [Query Validation](#query-validation)
- [Query Execution](#query-execution)
- [Connector Interface](#connector-interface)
- [Appendix: Schema AST](#appendix-schema-ast)

<!-- tocstop -->

The Prisma Binary is the driving force behind Prisma's products. We use this to
generate photon clients, typecheck schemas, and execute queries on our
datasources.

Prisma uses _connectors_ talks to different datasources. Postgres, MongoDB, and
even Google Sheets can be a connector. The Prisma Binary is designed to work
with multiple connectors at once. Connectors are written in Rust, but may be
higher-level in the future.

The following is a high-level diagram of how different clients connect to the
Prisma Binary and how they relate to the connectors.

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

# Prisma Binary CLI

The entrypoint to the Prisma Binary is a CLI. This CLI can run one-off `check`
commands or use `serve` to start a long-running server that will serve query
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

# Capability Map

The capability map is a static structure written into the code that we've
crafted by hand. The format of the capability map is the following:

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
	types: map[string]string{
		// core
		"String":    "text",
		"String?":   "text?",
		"String[]":  "text[]",
		"String[]?": "text[]?",

		// custom type
		// TODO: numeric(n, p)
		"Citext": "String",

		// integers
		"Integer":    "int",
		"Integer?":   "int?",
		"Integer[]":  "int[]",
		"Integer[]?": "int[]?",

		// floats
		"Float":    "float4",
		"Float?":   "float4?",
		"Float[]":  "float4[]",
		"Float[]?": "float4[]?",

		// datetime
		"DateTime":    "timestamp",
		"DateTime?":   "timestamp?",
		"DateTime[]":  "timestamp[]",
		"DateTime[]?": "timestamp[]?",

		// boolean
		"Boolean":    "boolean",
		"Boolean?":   "boolean?",
		"Boolean[]":  "boolean[]",
		"Boolean[]?": "boolean[]?",
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
		"id":     true,
		"unique": true,
	},

	// model attributes
	modelAttrs: map[string]bool{
		"id":     true,
		"unique": true,
	},
}
```

**TODO** Double-back on this. This is overly simplistic and already breaks down
in some cases. We'll rather want to use "AST fragments" that we can walk over
and check if all the arguments match up.

**Side Note** To deal with schema changes, we should interact with these
capibility maps using visitor pattern to pick out only the fields we care about.
This will minimize breakage as we add more things to the map.

# Schema Validation

Schema validation is used by editors like VSCode to for autocompletion and
typechecking. Schema checking works in the following way:

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

These errors will contain line and column information that the plugin will use
to show warnings and errors to the developer.

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

We'll parse the schema generating a schema AST. The Schema AST is defined below
in [Appendix: Schema AST](#Appendix:-Schema-AST). We'll also pull the
`capabilityMap` from the connectors and merge them together.

The format of the `capabilityMap` is described in
[Capability Map](#Capability-Map).

`check(schemaAST, capabilityMap)` runs the following operations:

1. Walk the merged capability map of the connectors building an index of the
   available types, available attributes and relationship support.
2. Walk the schema comparing against this index. If there are errors or
   warnings, we'll add them to the list and continue traversing each node.

**TODO** describe the capability map merge.

# Client Generation

**TODO**

# Query Validation

**TODO**

# Query Execution

**TODO**

# Connector Interface

Connectors have an interface with 4 methods:

1. `Capabilities(): Capabilities` Returns a list of the connector's capabilities
2. `Connect(): error`: Connects to the given data source. If this datasource is
   stateless, connect may be empty.
3. `Execute(query: string, variables: map[string]interface{}): RecordSet`
   Executes a query with the given parameters and returns a `RecordSet`.
4. `Close(): error`: Closes the datasource. If the datasource is stateless,
   close may be empty.

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
