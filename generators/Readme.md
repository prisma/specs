# Generators

- Owner: @timsuchanek
- Stakeholders: @schickling
- State:
  - Spec: In Progress 🚧
  - Implementation: In Progress 🚧

An important mechanism in Prisma 2 is the generation of code based on the Prisma schema.
This spec describes, how the interface for such code generation in the individual languages like JavaScript and TypeScript looks like, and which protocol is used under the hood to achieve that interface.

---

<!-- START doctoc -->
<!-- END doctoc -->

## Generator architecture

A generator is a piece of software, which gets metadata of the Prisma Schema like the models passed in by the Generator SDK and generates code based on it.
The generator is responsible for saving that code to the filesystem.

```bash
┌────────────────┐
│ Generation SDK │
└─┬──────────────┘
  │
  │ passes schema meta data
  │
  ▼
┌─────────────────┐
│    Generator    │
└─┬───────────────┘
  │
  │ generates code
  │
  ▼
┌─────────────────┐
│   Filesystem    │
└─────────────────┘
```

## Information passed into a generator

A generator gets passed in a JSON blob including the following information:

1. Everything which is declared in the `schema.prisma` file:

- Models
- Enums
- Datasources
- Generators, including the configuration this generator points to

2. The available Query Schema of the Query Engine

The following TypeScript type definition `GeneratorOptions` describes the content of the JSON blob:

```ts
type GeneratorConfig = {
  output: string | null
  name: string
  provider: string
  config: Dictionary<string>
  platforms: string[]
  pinnedPlatform?: string | null
}

type ConnectorType = 'mysql' | 'mongo' | 'sqlite' | 'postgresql'

type Datasource = {
  name: string
  connectorType: ConnectorType
  url: EnvValue
  config: { [key: string]: string }
}

type GeneratorOptions = {
  generator: GeneratorConfig
  otherGenerators: GeneratorConfig[]
  schemaPath: string
  dmmf: DMMF.Document
  datasources: Datasource[]
  datamodel: string
}
```

<details>
  <summary>`DMMF` Types</summary>

```ts
export namespace DMMF {
  export interface Document {
    datamodel: Datamodel
    schema: Schema
    mappings: Mapping[]
  }

  export interface Enum {
    name: string
    values: string[]
    dbName?: string | null
  }

  export interface Datamodel {
    models: Model[]
    enums: Enum[]
  }

  export interface Model {
    name: string
    isEmbedded: boolean
    dbName: string | null
    fields: Field[]
  }

  export type FieldKind = 'scalar' | 'object' | 'enum'
  export type DatamodelFieldKind = 'scalar' | 'relation' | 'enum'

  export interface Field {
    kind: DatamodelFieldKind
    name: string
    isRequired: boolean
    isList: boolean
    isUnique: boolean
    isId: boolean
    type: string
    dbName: string | null
    isGenerated: boolean
    relationToFields?: any[]
    relationOnDelete?: string
    relationName?: string
  }

  export interface Schema {
    rootQueryType?: string
    rootMutationType?: string
    inputTypes: InputType[]
    outputTypes: OutputType[]
    enums: Enum[]
  }

  export interface QueryOutput {
    name: string
    isRequired: boolean
    isList: boolean
  }

  export type ArgType = string

  export interface SchemaArg {
    name: string
    inputType: {
      isRequired: boolean
      isList: boolean
      type: ArgType
      kind: FieldKind
    }
    isRelationFilter?: boolean
  }

  export interface OutputType {
    name: string
    fields: SchemaField[]
    isEmbedded?: boolean
  }

  export interface SchemaField {
    name: string
    outputType: {
      type: string // note that in the serialized state we don't have the reference to MergedOutputTypes
      isList: boolean
      isRequired: boolean
      kind: FieldKind
    }
    args: SchemaArg[]
  }

  export interface InputType {
    name: string
    isWhereType?: boolean // this is needed to transform it back
    isOrderType?: boolean
    atLeastOne?: boolean
    atMostOne?: boolean
    fields: SchemaArg[]
  }

  export interface Mapping {
    model: string
    findOne?: string
    findMany?: string
    create?: string
    update?: string
    updateMany?: string
    upsert?: string
    delete?: string
    deleteMany?: string
  }

  export enum ModelAction {
    findOne = 'findOne',
    findMany = 'findMany',
    create = 'create',
    update = 'update',
    updateMany = 'updateMany',
    upsert = 'upsert',
    delete = 'delete',
    deleteMany = 'deleteMany',
  }
}
```

</details>

## Interface for a generator

To add a generator to a Prisma project and run it, the following steps are needed:

1. Create an executable file, which handles the generation
2. Point to that file in the `schema.prisma`
3. Run `prisma2 generate`

### 1. Create an executable file

In the following we describe how this can be done in JavaScript or TypeScript. In section XXX you can read more about other languages.

To create a generator in TypeScript, create a new package, which needs two files: A executable generator file, e.g. `generator.ts` and a generator manifest, called `generator-manifest.json`.

A `generator.ts` file can use a helper function from the `@prisma/generator-helper` npm package to get a callback for when a generation is being requested:

`generator.ts`

```ts
#!/usr/bin/env ts-node

import { onGenerate, GeneratorOptions } from '@prisma/generator-helper'

onGenerate((options: GeneratorOptions) => {
  // implement generator here
})
```

Optionally, in the same folder as the `generator.ts`, there can be a `generator-manifest.json`, which includes the following information:

- `prettyName` (optional): The "pretty name" of the generator, e.g. "My beautiful Generator"
- `defaultOutput` (optional): The default output path of the generator, e.g. `node_modules/@generated/generator`
- `denylist` (optional): A list of models or enums which are not allowed to be used in the schema.

### 2. Point to the generator file in the `schema.prisma`

To add the generator to the `schema.prisma` file, the following block has to be added to the `schema.prisma` file:

```groovy
generator myGenerator {
  provider = "./node_modules/generator-package/generator.js"
}
```

Optionally additional configuration can be passed in to the generator:

```groovy
generator myGenerator {
  provider = "./node_modules/generator-package/generator.js"
  output   = "./custom-generated/my-generator"
  someArbitraryConfig = "some value"
}
```

### 3. Run `prisma2 generate`

As soon, as `prisma2 generate` is being executed, the provided generator file will executed by the `prisma2` CLI.

## Interface between Generator SDK and each language

A generator is being spawned as a subprocess. The `GeneratorOptions` JSON is being passed in over the following JSON-RPC protocol:

Over the `Stdin` of the spawned child process, the following json is being passed in:

```ts
{"jsonrpc": "2.0", "method": "generate", "params": {... GeneratorOptions}, "id": 1}
```

`Stderr` is being used to communicate back to the SDK:

```ts
{"jsonrpc": "2.0", "result": { error: "Could not find directory" }, "id": 1}
```

These are the available RPCs:

1. `generate` With the input `GeneratorOptions`. If the generator process crashes or returns an object containing an `error` property, the generator SDK can handle that error and show it to the user.
   If it simply returns an empty object `{}` for the result, it was a successful generation.
