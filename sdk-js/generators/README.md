<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Summary](#summary)
- [Motivation](#motivation)
- [Detailed design](#detailed-design)
  - [Generator configuration from `prisma.yml`](#generator-configuration-from-prismayml)
  - [Generator resolution](#generator-resolution)
  - [Generator interface](#generator-interface)
    - [TypeScript](#typescript)
    - [Non-TypeScript](#non-typescript)
  - [Official Generators](#official-generators)
  - [Installing 3rd party generators](#installing-3rd-party-generators)
  - [Inclusion in the Prisma SDK](#inclusion-in-the-prisma-sdk)
  - [Generating the client into `node_modules`](#generating-the-client-into-node_modules)
    - [New Client generation output](#new-client-generation-output)
  - [How client generation hooks in to migrate](#how-client-generation-hooks-in-to-migrate)
    - [`prisma generate`](#prisma-generate)
- [Drawbacks](#drawbacks)
- [Alternatives](#alternatives)
- [Adoption strategy](#adoption-strategy)
- [How we teach this](#how-we-teach-this)
- [Unresolved questions](#unresolved-questions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

🚨 **NOTE: This spec is outdated**

- Start Date: 2019-01-18
- RFC PR:
- Prisma Issue:

# Summary

An important part of the Prisma developer experience is code generation. With code generation we're able to generate clients for different languages, that
ensure typesafe access to the Prisma API.

In this spec we propose how we can provide an easy to use generator API both for TypeScript and other languages to generate clients and how these generators can
be plugged in into the Prisma workflow.

<!-- toc -->

- [Motivation](#motivation)
- [Detailed design](#detailed-design)
  * [Generator configuration from `prisma.yml`](#generator-configuration-from-prismayml)
  * [Generator resolution](#generator-resolution)
  * [Generator interface](#generator-interface)
    + [TypeScript](#typescript)
    + [Non-TypeScript](#non-typescript)
  * [Official Generators](#official-generators)
  * [Installing 3rd party generators](#installing-3rd-party-generators)
  * [Inclusion in the Prisma SDK](#inclusion-in-the-prisma-sdk)
  * [Generating the client into `node_modules`](#generating-the-client-into-node_modules)
    + [New Client generation output](#new-client-generation-output)
  * [How client generation hooks in to migrate](#how-client-generation-hooks-in-to-migrate)
    + [`prisma generate`](#prisma-generate)
- [Drawbacks](#drawbacks)
- [Alternatives](#alternatives)
- [Adoption strategy](#adoption-strategy)
- [How we teach this](#how-we-teach-this)
- [Unresolved questions](#unresolved-questions)

<!-- tocstop -->

# Motivation

Prisma provides a higher abstraction level to connect to databases. While the core part of Prisma is the query engine, which transforms GraphQL queries into
database queries, the other big part is the Prisma Client, which sends queries to the query engine.

The client consists of two major parts: The code generation and the runtime. The runtime is very individual to the client API and has to be implemented based on
the data access pattern that the client exposes. The active record pattern for example needs a completely different implementation than the data mapper pattern.
However, both need code generation in order to provide type safety.

The input for these generators will be defined in the `prisma.yml` under the `generate` property. These inputs are then converted from YAML to JSON and passed
in into the generators.

While having this generator API, it's important to notice, that we not only need to support generators written in TypeScript, but also generators written in
languages like Go, Java, Python, Ruby, etc.

While you still can write a Java generator in TypeScript, many of these languages bring individual tools like [jennifer](https://github.com/dave/jennifer) for
Go, that make code generation easier. In order to be able to leverage these tools, it must be possible to implement these generators in the target language.

We also discuss, where the generated files will end up. At the time of writing, we generate the client into a `generated` folder. However, this adds tremendous
clutter in the users project. The goal is to move these files to the ecosystem specific library paths as `node_modules` for Node.js.

# Detailed design

While we both want to support TypeScript and other languages as generator implementations, it's clear that we can't provide the same convenience for other
languages as for TypeScript. As our CLI is also implemented in TypeScript, we can e.g. directly pass in a `graphql-js` schema object to the specific generator.
This is not possible for the other languages, where we need to find a language agnostic format, which will be SDL. However, as TypeScript is a major use-case,
it still makes sense to provide a dedicated TypeScript API while having a language-agnostic API as a fallback.

In the following we discuss how generators are being **configured** from the `prisma.yml` and how the **generator resolution** works. We will also explore, how
the **interface ** of a generator looks like, how a generator can be **packaged and installed** and how **arguments** can be passed in to a generator.

Until now, generators have only been responsible for generating the code, but not saving it to the filesystem. Non-TypeScript generators will be responsible for
writing to the filesystem on their own. The TypeScript-based generators however will just need to return a Map of file name and file content, which will be
written to the file system.

## Generator configuration from `prisma.yml`

Generators are being configured by the property `generate` in the `prisma.yml`.

This is how the `prisma.yml` for `generate` looks like at the time of this writing:

```yaml
endpoint: http://localhost:4466
datamodel: datamodel.prisma

generate:
  - generator: typescript-client
    output: ./src/generated/client
```

The advantage of this syntax is, that one generator could be referenced to multiple times. The disadvantage however is, that we have redundancy and we need to
keep the indentation for the objects in the array in check. For the use-case that only one generator will be used, we optionally allow the inlining of the first
generator:

```yaml
endpoint: http://localhost:4466
datamodel: datamodel.prisma

generate:
  generator: typescript-client
  output: ./src/generated/client
```

## Generator resolution

When referring to `typescript-client` as in the above `prisma.yml` example, the Prisma CLI now needs to decide in runtime how to resolve the generator
implementation. This is the proposed order of resolution:

1. Try to find the generator in the list of **predefined generators** (including `typescript-client`), which are shipped with the Prisma SDK
2. Try to find a **node module** with the name of the generator, take as the base directory the directory of the `prisma.yml`
3. Try to **spawn a new process** which runs the generator as a command. This means that generator names like `./generator/java-generator --run` should be
   possible. Note, that yaml keys with spaces are even possible without quotes:

```yaml
generate:
  ./generators/java-generator --run:
    output: ./src/generated/client
    flavor: redundant
  "./with-quotes/it-may/be-easier/to --read":
    output: ./src/generated/client
    flavor: generics
```

## Generator interface

The following information should be communicated from the generator to the CLI:

- **Reserved names**, which are not allowed as model names in the datamodel. These can e.g. be names like `Prisma` or `AtLeastOne` for the TypeScript generator.
- **Accepted arguments**, which the generator knows to handle

When the generators then are called, this needs to be communicated from the CLI to the generator:

- The **GraphQL API Schema**
- The **env var strings** for the `secret` and the `endpoint` defined in the `prisma.yml`, because these values need to be substituted in runtime by the
  specific generator.
- **Prisma-specific model information**, which can't be expressed with a GraphQL Schema. This could for example be the information, if a type is an embedded
  type or not.
- The **parameters** provided by in the `prisma.yml`

### TypeScript

A generator, which is implemented in TypeScript, has to adhere to the following convention:

The generator name equals the npm package name. That means if the generator is called `my-typescript-generator` in the `prisma.yml`, then that's the name of the
npm package that this generator has to live in.

The package should have a default export of a class, that extends the `Generator` class of the `prisma-generator` package, which will be a package including the
default generators and some other useful utility functions.

The basic `Generator` class looks like this:

```ts
import { GraphQLSchema } from "graphql";
import { IGQLType } from "prisma-datamodel";
import * as fs from "fs";

export interface GeneratorInput<Parameters = any> {
  /**
   * The graphql-js schema instance. The schema is the generated API Schema, that is
   * being generated based on the datamodel.
   */
  schema: GraphQLSchema;
  /**
   * The ast representation of all models, including information like `isEmbedded`
   */
  internalTypes: IGQLType[];
  /**
   * The raw string of the endpoint as provided in the prisma.yml.
   * This may contain env var interpolation statements like ${env:PRISMA_ENDPOINT}
   */
  endpoint: string;
  /**
   * The raw string of the secret as provided in the prisma.yml.
   * This may contain env var interpolation statements like ${env:PRISMA_SECRET}
   */
  secret: string;
  /**
   * The parameters provided in the prisma.yml for this generator, converted from yaml to json.
   */
  parameters: Parameters;
}

/**
 * FileMap is a mapping from file name to file content.
 * Folders will automatically be created when they don't exist already.
 * The paths of files will be created relative to the prisma.yml
 */
export interface FileMap {
  [fileName: string]: string;
}

export type RenderOutput = FileMap | string;

export abstract class Generator {
  protected input: GeneratorInput;

  public static reservedTypes = ["Prisma"];

  constructor(input: GeneratorInput) {
    this.input = input;
  }

  public abstract render(): RenderOutput;
  public saveToFS(output: RenderOutput) {
    //...
  }
}
```

A concrete user implementation of a generator could look like this:

```ts
import { Generator, GeneratorInput } from "./Generator";
import { print } from "graphql";

export interface Parameters {
  output: string;
}

export default class ExampleGenerator extends Generator {
  constructor(input: GeneratorInput<Parameters>) {
    super(input);
  }
  render() {
    return print(this.input.schema);
  }
}
```

The CLI could help generators to check the input. This could be done with a convention, that the parameters provided in the `prisma.yml` will be checked against
the exported type `Parameters`. This could for example be achieved with [`typescript-json-schema`](https://github.com/YousefED/typescript-json-schema), which
can convert a TypeScript type definition into a json schema.

The reserved names for models can be expressed through the static property `reservedTypes` as an array.

### Non-TypeScript

In order to inject the JSON data for the generators, we propose to inject one line of JSON via stdin.

This is a standard protocol, that every programming language can handle.

As the non-TypeScript generators can potentially be binary based so that no information can be read from them, the only way to communicate information from the
binary to the CLI would be via an API that is being agreed on. However, the two use-cases of having **reserved words** and **arguments typed** are optional and
nice to have. The easier approach is, that the generators handle these cases on their own.

The JSON format will look like this:

```ts
export interface GeneratorInput {
  /**
   * The schema SDL string representing the API Schema, which is being generated based on the datamodel.
   */
  schema: string;
  /**
   * The ast representation of all models, including information like `isEmbedded`
   */
  internalTypes: IGQLType[];
  /**
   * The raw string of the endpoint as provided in the prisma.yml.
   * This may contain env var interpolation statements like ${env:PRISMA_ENDPOINT}
   */
  endpoint: string;
  /**
   * The raw string of the secret as provided in the prisma.yml.
   * This may contain env var interpolation statements like ${env:PRISMA_SECRET}
   */
  secret: string;
  /**
   * The parameters provided in the prisma.yml for this generator, converted from yaml to json.
   */
  parameters: any;
}
```

## Official Generators

The official generators supported by Prisma and by default shipped with the Prisma CLI are:

- TypeScript
- JavaScript
- Go

## Installing 3rd party generators

If you want to install a custom generator, which is not by default shipped by Prisma, you can just use the package manager of the given ecosystem like `npm` in
Node.js. By pointing to the generator binary in the `prisma.yml`, you can include it into your project:

```yaml
generate:
  "node_modules/my-generator":
    flavor: generics
```

## Inclusion in the Prisma SDK

A feature, that more and more users have requested, is the possibility to access the functionality exposed by the Prisma CLI from a programmatic API.

This section outlines how the generator API fits into the SDK and how the SDK will roughly look like. As soon as we have the SDK specced out in more detail, we
will update this section.

The current assumption is, that the CLI will ship the Prisma native image binary, which right now is about 91mb in size, 27mb zipped. The Prisma CLI will still
be available with under the `prisma` package name. One possibility could be to let this npm package also expose all SDK functionality, including the generator
class and utilities needed to implement a TypeScript-based generator. However, as this would add an unnecessary, tremendous overhead to the package size of each
generator, it probably makes more sense to package SDK-related code in a separate package. While it's not yet clear, if the Prisma binary should be part of the
SDK, one thing is clear, which is that we can package all generator related logic into one package, for example `prisma-generate`. This package still could be a
dependency of the Prisma SDK and eventually re-exposed, if it makes sense.

## Generating the client into `node_modules`

In the new [Migrations Spec](https://github.com/prisma/rfcs/blob/migrations2/text/0000-migrations.md) we propose the introduction of migrations, which are
stored in migration folders. In each migration folder you may want to use a Prisma Client that is representing the datamodel of the specific migration. At time
of writing, we have the convention of generating the client into a folder called `./generated`, therefore the generated code ending up in the source code of the
project. However, if we now want an individual client per migration, this can get cluttered very quickly. If there are 200 migrations, we would also generate
200 clients into the source directory. While one could add this files to `.gitignore`, the part of the project structure, which the user "owns" still gets quite
cluttered. In order to keep the project structure clean, we will generate these individual Prisma Clients into the `node_modules` directory instead of
`./generated`.

However, there is a caveat with generating code into the `node_modules` folder. The two major package managers in the Node ecosystem want to take
[full responsibility](https://github.com/yarnpkg/yarn/issues/5709) over the content of `node_modules` in order to ensure that installing packages is always
deterministic. To make that possible, commands like `yarn install`, `yarn add` or `npm install` delete everything from the `node_modules` directory, which it
doesn't know. To fix this problem, the users `package.json` needs an [`install` hook](https://docs.npmjs.com/misc/scripts), which will run `prisma generate`
every time an installation happened to regenerate the prisma client into that folder:

`package.json`

```json
{
  "scripts": {
    "install": "prisma generate"
  }
}
```

### New Client generation output

The folder content of both the TypeScript and the JavaScript client are identical:

```bash
.
├── browser.d.ts    # Exposes browser typings
├── browser.js      # Instantiates Prisma, browser build without `fetch` polyfill
├── index.d.ts      # Exposes main typings together with JSDoc
├── index.js        # Instantiates Prisma, injects env vars
├── lib.d.ts        # Not really needed, will be generated by tsc -d though and doesn't hurt in node_modules
├── lib.js          # Includes the client runtime and all runtime dependencies ncc'ed
├── meta.d.ts       # Also not really needed, artifact of tsc -d
├── meta.js         # Include the Datamodel meta format needed for the runtime
├── node-lib.d.ts   # Typings for fetch polyfill
├── node-lib.js     # Includes a minimal `fetch` polyfill for node.js
└── package.json    # Includes "browser" and "main" field
```

The `package.json` is useful to provide a separate `browser` and `node` build in the same manner as
[cross fetch](https://github.com/lquixada/cross-fetch/blob/master/package.json).

## How client generation hooks in to migrate

When [`prisma migrate`](https://github.com/prisma/rfcs/blob/migrations2/text/0000-migrations.md) is being called, it will call `prisma generate` once
`prisma migrate` is done, in a similar fashion as the `post-deploy` hook triggered after `prisma deploy` is done with its business.

### `prisma generate`

Until now `prisma generate` had a look in the `prisma.yml` and executed the generators defined there, which generate the output into their `output` directories.

While `generate` will still loop through all generators (`TS`, `Go`, ...) defined in the `prisma.yml`, it will also generate a specific client built for each
migration into the `node_modules/prisma-client/MIGRATION_ID` directory.

If we e.g. have a few migrations like this:

```bash
.
└── migrate
    ├── 20190322092247
    │   └── datamodel.mdl
    └── 20190325092247
        └── datamodel.mdl
```

The output in `node_modules/prisma-client` will look like this:

```bash
.
├── 20190322092247
│  ├── browser.d.ts
│  ├── browser.js
│  ├── index.d.ts
│  ├── index.js
│  ├── lib.d.ts
│  ├── lib.js
│  ├── meta.d.ts
│  ├── meta.js
│  ├── node-lib.d.ts
│  ├── node-lib.js
│  └── package.json
├── 20190522092247
│  ├── browser.d.ts
│  ├── browser.js
│  ├── index.d.ts
│  ├── index.js
│  ├── lib.d.ts
│  ├── lib.js
│  ├── meta.d.ts
│  ├── meta.js
│  ├── node-lib.d.ts
│  ├── node-lib.js
│  └── package.json
├── browser.d.ts
├── browser.js
├── index.d.ts
├── index.js
├── lib.d.ts
├── lib.js
├── meta.d.ts
├── meta.js
├── node-lib.d.ts
├── node-lib.js
└── package.json
```

# Drawbacks

- There is an inconsistency between TypeScript and non-TypeScript generators in the spec, in that the TypeScript generators are able to communicate reserved
  words and typings for the arguments. Thus the TypeScript generators don't have the responsibility to check for the resulting error cases, while the
  non-TypeScript generators have to.

# Alternatives

- A declarative API always is more limited than an imperative one. We could for example provide a .js or .ts config file, in which users can create generator
  statements more dynamic. Right now there is no reason to do so, as the prisma.yml already allows injection of env vars, which gives some level of flexibility.

# Adoption strategy

The proposal itself is a non-breaking change for the core generators. While the internal implementation while change significantly, users will not see any
difference.

# How we teach this

The usage of generators has already great resources. The part, that needs more attention is the new possibility for developers to create their on clients. This
needs examples and tutorials both for TypeScript and non-TypeScript languages, which implement simplified versions of the current client API.

# Unresolved questions

- [x] Official generators (see [PR comment](https://github.com/prisma/rfcs/pull/4#issuecomment-462790202))
- [x] Output location for generated files should be in `node_modules` (`$GOPATH` or similar) by default
- [ ] The Prisma SDK still needs to be specced out, but as already discussed in `Inclusion in Prisma SDK`, it is very unlikely that there will be any
      significant findings from the Prisma SDK, which will change this spec, as this area is fairly isolated.
- [ ] We should come up with better terminology instead of "TypeScript" and "Non-TypeScript" for the different ways of implementing a generator.
- [ ] Should we have configuration for casing? For example, allow snake_casing in the datamodel but render it as CamelCase in the client.
- [ ] Rethink embedding credentials during generation.
- [ ] Raw DB access should be disabled by default
