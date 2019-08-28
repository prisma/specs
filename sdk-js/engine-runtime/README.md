# Prisma Engine Runtime (for JavaScript/TypeScript)

<!-- toc -->

- [Motivation](#motivation)
- [Packages](#packages)
- [Prisma Query Engine](#prisma-query-engine)
  * [Environment](#environment)
  * [Examples](#examples)
    + [Photon.js](#photonjs)
    + [CLI `generate` Command](#cli-generate-command)
  * [Process Management](#process-management)
    + [Use Case: Photon](#use-case-photon)
      - [Connect](#connect)
        * [Find Free Port](#find-free-port)
        * [Binary Spawn](#binary-spawn)
        * [Waiting for the Binary to be Ready](#waiting-for-the-binary-to-be-ready)
      - [Disconnect](#disconnect)
    + [Use Case: Studio](#use-case-studio)
    + [Use Case: CLI `generate` Command](#use-case-cli-generate-command)
  * [Error Handling](#error-handling)
    + [Use Case: Photon](#use-case-photon-1)
  * [API](#api)
- [Prisma Migration Engine](#prisma-migration-engine)
  * [Environment](#environment-1)
  * [Examples](#examples-1)
  * [Process Management](#process-management-1)
    + [Use Case: CLI `lift` command](#use-case-cli-lift-command)
    + [Use Case: Prisma Test Utils](#use-case-prisma-test-utils)
  * [Error Handling](#error-handling-1)
    + [Use Case: CLI `lift` command](#use-case-cli-lift-command-1)
  * [API](#api-1)
- [Prisma Format](#prisma-format)
- [Future](#future)
- [Open Questions](#open-questions)

<!-- tocstop -->

# Motivation

![Architecture of how tools like Photon use the Prisma binaries via the Prisma SDK](https://figma-image-proxy.prisma.now.sh/?id=15:1&file=syRJTHIabeqK69mKHBwSlP)

Prisma SDK provides primitives to manage the [binaries](../../binaries). This can be used by both CLI commands and generators.

# Packages

Currently, SDK is spread out across packages, the following packages are considered SDK

- [`@prisma/engine-core`](https://github.com/prisma/photonjs/tree/master/packages/engine-core)

- [`@prisma/engine`](https://github.com/prisma/photonjs/tree/master/packages/engine)

- [`@prisma/fetch-engine`](https://github.com/prisma/photonjs/tree/master/packages/fetch-engine)

- [`@prisma/get-platform`](https://github.com/prisma/photonjs/tree/master/packages/get-platform)

- [LiftEngine](https://github.com/prisma/lift/blob/master/src/LiftEngine.ts)

# Prisma Query Engine

## Environment

To provide a custom query engine binary, the fixed environment variable name is `PRISMA_QUERY_ENGINE_BINARY`.

This applies to both CLI runtime and generator runtime that are using the Prisma SDK and want to swap the query engine binary.

## Examples

### Photon.js

Photon.js uses the Prisma SDK for binary process management during its runtime. See (#use-case-photon)

### CLI `generate` Command

The `prisma2 generate` command uses the Prisma SDK to convert the Prisma schema file into DMMF which is then used by it for generating code using generators like Photon.

## Process Management

The Prisma SDK provides the primitives (like, `connect`, `disconnect`) for generators to perform binary process management.

### Use Case: Photon

Prisma SDK provides Photon with `connect`, `disconnect` methods for binary process management. If needed, Photon can lazily connect, when a request is received.

#### Connect

`connect` function is where Photon spawns the query engine binary and the following sequence of events happen

##### Find Free Port

Photon finds a free port by binding to port 0 with a light-weight TCP server (using node net -> createServer), this makes the OS allocate a random (albeit, pseudo serial) port to this server, then this server is closed and `Photon` saves the port in memory.

##### Binary Spawn

Photon then spawns the binary as a child process and provide it the environment variables including the detected port

This port is then provided to the binary as an environment variable and the binary starts an HTTP server on this port.

##### Waiting for the Binary to be Ready

In this workflow, Photon polls the query engine binary's HTTP server for its stats at an interval. This can be optimized further by reducing the interval or relying on a simple TCP protocol.

#### Disconnect

Calling the `disconnect` method is where Photon waits for any pending request promise to resolve and then kills the spawned process and the DB connection is
released.

### Use Case: Studio

Prisma studio uses Photon for accessing a database and hence shares the same process management characteristics.

### Use Case: CLI `generate` Command

`prisma2 generate` command uses the query engine binary as a spawned process to parse the schema prisma file and get its serialized JSON (DMMF) over stdio.

## Error Handling

### Use Case: Photon

Photon throws if the engine ready polling does not yield success after N attempts. There may be several reasons why preparing a process with the required context might fail, including but not limited to:

| Potential Error                            | Handling Strategy |
| ------------------------------------------ | ----------------- |
| Unable to bind to a free port              | Throw error       |
| Binary is not compatible with the platform | Throw error       |
| Binary fails to acquire a DB connection    | Throw error       |

Detailed error handling behavior is specified in the [PhotonJS spec](https://github.com/prisma/specs/tree/master/photonjs#figured-out-but-needs-spec).

## API

TODO: Add the API exposed by Prisma query engine binary (for example, CLI command to fetch DMMF)

# Prisma Migration Engine

## Environment

To provide a custom migration engine binary, the fixed environment variable name is `PRISMA_MIGRATION_ENGINE_BINARY`.

This applies to both CLI runtime and generator runtime that are using the Prisma SDK and want to swap the migration engine binary.

## Examples

## Process Management

The Prisma SDK provides the primitives for CLI commands to perform binary process management.

### Use Case: CLI `lift` command

Prisma SDK provides a similar API for migration engine binary management via the class `LiftEngine`. The actual process management is similar to query engine binary. With the following noted differences:

1. Migration engine binary uses JSON RPC over stdio as the data protocol.

### Use Case: Prisma Test Utils

Prisma test utils uses the `LiftEngine` to create multiple isolated databases and performs schema migration on them at its runtime for parallelizing testing with database state.

## Error Handling

### Use Case: CLI `lift` command

Error handling has a separate detailed spec [here](../../errors). The following briefs on error handling but is not exhaustive.

| Potential Error                    | Handling Strategy |
| ---------------------------------- | ----------------- |
| Database credentials are incorrect | Notify user       |
| Database is not reachable          | Notify user       |
| Prisma schema is not valid         | Throw error       |

## API

TODO: Add the RPC API exposed by Prisma migration engine binary

# Prisma Format

TODO: Add this

# Future

This entire topic is expected to improve a lot with the advent of WebAssembly.

# Open Questions

- [ ] How does the Rust-based "Utils CLI" factor into this? (Static: Doesn't require connections)
- [ ] List out [upcoming generators](https://github.com/prisma/specs/issues/93)
