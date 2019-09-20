# Prisma Engine Runtime (for JavaScript/TypeScript)

- Owner: @schickling
- Stakeholders: @Weakky @timsuchanek
- State: 
  - Spec: Unknown ❔
  - Implementation: Unknown ❔

TODO Introduction

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Motivation](#motivation)
- [Packages](#packages)
- [Prisma Query Engine](#prisma-query-engine)
  - [Environment](#environment)
  - [Process Management](#process-management)
    - [Start](#start)
      - [Find Free Port](#find-free-port)
      - [Binary Spawn](#binary-spawn)
      - [Waiting for the Binary to be Ready](#waiting-for-the-binary-to-be-ready)
    - [Stop](#stop)
  - [Examples](#examples)
    - [Photon.js](#photonjs)
    - [CLI `generate` Command](#cli-generate-command)
  - [API](#api)
- [Prisma Migration Engine](#prisma-migration-engine)
  - [Environment](#environment-1)
  - [Process Management](#process-management-1)
  - [Examples](#examples-1)
    - [Prisma Test Utils](#prisma-test-utils)
    - [CLI `lift` command](#cli-lift-command)
  - [API](#api-1)
- [Error Handling](#error-handling)
- [Future](#future)
- [Open Questions](#open-questions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Motivation

![Architecture of how tools like Photon use the Prisma binaries via the Prisma SDK](https://figma-image-proxy.prisma.now.sh/?id=15:1&file=syRJTHIabeqK69mKHBwSlP)

Prisma SDK provides primitives to manage the [binaries](../../binaries). This can be used by both CLI commands and generators.

## Packages

Currently, SDK is spread out across packages, the following packages are considered SDK

- [`@prisma/engine-core`](https://github.com/prisma/photonjs/tree/master/packages/engine-core)

- [`@prisma/engine`](https://github.com/prisma/photonjs/tree/master/packages/engine)

- [`@prisma/fetch-engine`](https://github.com/prisma/photonjs/tree/master/packages/fetch-engine)

- [`@prisma/get-platform`](https://github.com/prisma/photonjs/tree/master/packages/get-platform)

- [LiftEngine](https://github.com/prisma/lift/blob/master/src/LiftEngine.ts)

## Prisma Query Engine

### Environment

To provide a custom query engine binary, the fixed environment variable name is `PRISMA_QUERY_ENGINE_BINARY`.

This applies to both CLI runtime and generator runtime that are using the Prisma SDK and want to swap the query engine binary.

### Process Management

The Prisma SDK provides the primitives (like, `start`, `stop`) for generators/CLI tools to perform binary process management for the Prisma query engine binary.

#### Start

`start` function is where Prisma query engine spawns and the following sequence of events happen to do so

##### Find Free Port

SDK finds a free port by binding to port 0 with a light-weight TCP server (using `createServer` from node's `net` library), this makes the OS allocate a random (albeit, pseudo serial) port to this server, then this server is closed and the generator can retain the port number on which the spawned binary will run HTTP server.

##### Binary Spawn

SDK then spawns the binary as a child process and provide it the environment variables including the detected port and the binary starts an HTTP server on this port.

##### Waiting for the Binary to be Ready

SDK polls the query engine binary's HTTP server for its status at an interval. This can be optimized further by reducing the interval or relying on a simple TCP protocol.

#### Stop

`stop` function is where Prisma SDK waits for any pending request promise to resolve and then kills the spawned process and the DB connection is released.

### Examples

#### Photon.js

Photon.js uses the Prisma SDK for binary process management during its runtime. It uses `start` and `stop` functions as described. Additionally, Photon can lazily `start` the binary when a request is received without an existing connection.

#### CLI `generate` Command

The `prisma2 generate` command uses the Prisma SDK to convert the Prisma schema file, output of which is then used by it for generating code using generators like Photon.

Unlike, Photon.js CLI doesn't use `start` and `stop` functions but uses the query engine binary as a spawned process to parse the schema prisma file and get its serialized JSON (DMMF) over stdio.

### API

[Engine commands](https://github.com/prisma/photonjs/blob/6b9af564fe87abde137ba1175f7ff31d6809e76b/packages/photon/src/engineCommands.ts) for CLI

// TODO: Move the calls here and write description

## Prisma Migration Engine

### Environment

To provide a custom migration engine binary, the fixed environment variable name is `PRISMA_MIGRATION_ENGINE_BINARY`.

This applies to both CLI runtime and generator runtime that are using the Prisma SDK and want to swap the migration engine binary.

### Process Management

The Prisma SDK provides the primitives (like, `init`, `stop`) for generators/CLI tools to perform binary process management for the Prisma migration engine binary via the `LiftEngine` class.

The actual process management is similar to query engine binary. With the following noted differences:

1. Migration engine binary uses JSON RPC over stdio as the data protocol.

### Examples

#### Prisma Test Utils

Prisma test utils uses the `LiftEngine` to create multiple isolated databases and performs schema migration on them at its runtime for parallelizing testing with database state.

#### CLI `lift` command

The `prisma2 lift` command and its sub-commands use the Prisma migration engine binary to perform migrations on the database.

### API

RPC API is listed as its TS types here.
https://github.com/prisma/lift/blob/master/src/types.ts#L48-L136

// TODO: Move the calls here and write description

## Error Handling

Prisma SDK acts as the interface between the binaries and tooling like generators and CLI tools. This means most of the error handling responsibility around binary process management and a lot of error handling around data validation/network related errors must be handled in the SDK.

// TODO: Evolve this as error spec evolves.

## Future

This entire topic is expected to improve a lot with the advent of WebAssembly.

## Open Questions

- [ ] How does the Rust-based "Utils CLI" factor into this? (Static: Doesn't require connections)
- [ ] List out [upcoming generators](https://github.com/prisma/specs/issues/93)
