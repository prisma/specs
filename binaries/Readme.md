# Binaries

<!-- toc -->

- [Motivation](#motivation)
- [Requirements](#requirements)
- [Configuration API](#configuration-api)
- [Basic Example](#basic-example)
- [Scenarios](#scenarios)
    + [1. Development machine is Mac but the deployment platform is AWS lambda.](#1-development-machine-is-mac-but-the-deployment-platform-is-aws-lambda)
    + [2. Deterministically choose the binary-based a runtime environment variable](#2-deterministically-choose-the-binary-based-a-runtime-environment-variable)
    + [3. Development machine is Mac but we need a custom binary in production](#3-development-machine-is-mac-but-we-need-a-custom-binary-in-production)
    + [4. Development machine is a Raspberry Pi and the deployment platform is AWS Lambda](#4-development-machine-is-a-raspberry-pi-and-the-deployment-platform-is-aws-lambda)
    + [5. We are using CLI in a build system from a provider for which we do not have a working pre-compiled binary](#5-we-are-using-cli-in-a-build-system-from-a-provider-for-which-we-do-not-have-a-working-pre-compiled-binary)
- [Configuration](#configuration)
    + [1. Both `platforms` and `pinnedPlatform` are not provided.](#1-both-platforms-and-pinnedplatform-are-not-provided)
    + [2. Field `platforms` provided with multiple values and `pinnedPlatform` is not provided.](#2-field-platforms-provided-with-multiple-values-and-pinnedplatform-is-not-provided)
    + [3. Field `platforms` provided with multiple values and `pinnedPlatform` is also provided.](#3-field-platforms-provided-with-multiple-values-and-pinnedplatform-is-also-provided)
- [Binary Resolution Error Handling](#binary-resolution-error-handling)
- [Binary Naming Convention](#binary-naming-convention)
- [Runtime Binary Resolution](#runtime-binary-resolution)
- [Table of Binaries](#table-of-binaries)
  * [URL Scheme](#url-scheme)
  * [Common Cloud Platforms](#common-cloud-platforms)
    + [Tier 1](#tier-1)
    + [Tier 2](#tier-2)
- [Binary Process Management](#binary-process-management)
  * [Connect](#connect)
      - [Find Free Port](#find-free-port)
      - [Binary Spawn](#binary-spawn)
      - [Waiting for the Binary to be Ready](#waiting-for-the-binary-to-be-ready)
      - [Error Handling](#error-handling)
  * [Photon in FaaS environment (Like AWS Lambda)](#photon-in-faas-environment-like-aws-lambda)
  * [Disconnect](#disconnect)
- [Drawbacks](#drawbacks)
- [How we teach this](#how-we-teach-this)
- [Unresolved questions](#unresolved-questions)

<!-- tocstop -->

# Motivation

- Deploy to platforms without a CI like Lambda, Google Cloud Functions, Netlify Functions, etc.
- When running tests in CI where CI has a different platform than local development.
- When development is on a machine that we do not have a pre-compiled binary and using a custom compiled binary is required.

# Requirements

Binaries (query engine binary and migration engine binary) are at the core of Photon, Lift and Prisma CLI. They are, however compiled for a specific platform, that leads to the following requirements:

- Minimal configuration, simple mental model.
- Possibility of a deterministic binary resolution both locally and production setup.
- Easy setup of development and deployment workflows.
- Predictable runtime characteristics of the binary process.

**Binaries in the context:**

Query engine binary has the following use cases:

Photon

- Uses this binary to run queries against a data source (at runtime of generated code).
- Binary is downloaded when Photon is generated.

CLI

- Generation uses this binary to fetch internal schema representation (at the time of running `generate` CLI command).
- Binary is downloaded when the CLI is installed.

Migration engine binary has the following use cases:

A generator like `prisma-test-utils`

- Uses this binary to perform migrations (at runtime of generated code)
- Binary is downloaded when `prisma-test-utils` is generated.

CLI

- Lift commands use the binary to perform migrations or calculate pending migrations (at the time of running various `lift` commands like `up`, `save` etc).
- Binary is downloaded when the CLI is installed.

# Configuration API

Fields on the `generator` block to configure the availability of binaries for generators (like Photon, nexus, etc):

| Field            | Description                                                                                                                      | Behavior                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `platforms`      | _(optional)_ An array of binaries that are required by the application, string for known platforms and path for custom binaries. | Declarative way to download the required binaries. |
| `pinnedPlatform` | _(optional)_ A string that points to the name of an object in the `platforms` field, usually an environment variable             | Declarative way to choose the runtime binary       |

- Both `platforms` and `pinnedPlatform` fields are optional, **however** when a custom binary is provided the `pinnedPlatform` is required.

- Custom binary path points Photon to use the path.

- Known binary path downloads a known binary to a OS cache path and copies it to generator path on `generate`.

- Not all generators require all the binaries, the generator spec (it will be linked once it is ready) outlines the generator API that defines which binaries are needed.

Environment variable to configure the binary for CLI (like `prisma2 lift` or `prisma2 generate`):

| Environment Variable      | Description                                                                               | Behavior                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `PRISMA_MIGRATION_ENGINE_BINARY` | (optional) Overrides the resolution path for migration engine binary for `Lift` commands. | Can be a relative (from CWD) or an absolute path to the binary |
| `PRISMA_QUERY_ENGINE_BINARY`     | (optional) Overrides the resolution path for query engine binary for `generate` command.  | Can be a relative (from CWD) or an absolute path to the binary |

- CLI binaries can only be overridden by a path to a custom compiled or provided binary. It does not alter download behavior, it simply overrides the binary to use path for respective commands.

# Basic Example

When the development machine is Mac but the deployment platform is AWS lambda.

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "linux-glibc-libssl1.0.2"]
    pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "linux-glibc-libssl1.0.2"
}
```

- `"native"` is a special keyword for your local development platform. `native` may be different for different developers, depending on their machine. If you're on OSX, this would be `mac`. If you're on a common Linux distro, it would detect the appropriate binary for your environment. See the [Table of Binaries](#table-of-binaries) below for a reference.
- `env("PLATFORM")` allows you to switch between the platforms via `PLATFORM` environment variable. This environment variable will be generated into code as an environment variable to be used at runtime. In Node, this statement would look like this: `process.env.PLATFORM`.

# Scenarios

### 1. Development machine is Mac but the deployment platform is AWS lambda.

We can use `platforms` **without** a `pinnedPlatform`. `pinnedPlatform` will be resolved at runtime, see [Runtime binary resolution](#runtime-binary-resolution)
for more details.

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "linux-glibc-libssl1.0.2"]
}
```

### 2. Deterministically choose the binary-based a runtime environment variable

We can use `platforms` **and** `pinnedPlatform`. We set an environment variable

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "linux-glibc-libssl1.0.2"]
    pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "linux-glibc-libssl1.0.2"
}
```

We define the platforms and pin one of the platforms.

### 3. Development machine is Mac but we need a custom binary in production

In `platforms`, we can use a custom path to `./custom-prisma-binary`.

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "./custom-prisma-binary"]
    pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "./custom-prisma-binary"
}
```

### 4. Development machine is a Raspberry Pi and the deployment platform is AWS Lambda

As we do not have precompiled binaries for ARM architecture yet, the user would compile binaries manually for query-engine and migration-engine.

```sh
export PRISMA_MIGRATION_ENGINE_BINARY=<path to compiled migration engine binary>
export PRISMA_QUERY_ENGINE_BINARY=<path to compiled query engine binary>
```

Then `prisma2 lift` and `prisma2 generate` would use the respective compiled binaries.

For development and deployment

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["./custom-query-engine-binary", "linux-glibc-libssl1.0.2"]
    pinnedPlatform = env("PLATFORM") // On local, "./custom-query-engine-binary" and in production, "linux-glibc-libssl1.0.2"
}
```

### 5. We are using CLI in a build system from a provider for which we do not have a working pre-compiled binary

Since overriding CLI binary is an environment variable and these providers might [not always allow](https://github.com/prisma/prisma2/issues/157#issuecomment-520501500) compiling a binary. There will be no workaround such a situation except us making the default downloaded binary for that provider work. We want to support all major providers out of the box and this use case should be rare.

[Examples for other deployment scenarios](https://github.com/prisma/prisma-examples/tree/prisma2/deployment-platforms)

# Configuration

Both `platforms` and `pinnedPlatform` fields are optional, scenarios:

### 1. Both `platforms` and `pinnedPlatform` are not provided.

```groovy
generator photon {
    provider = "photonjs"
}
```

We download and use the binary for the current platform.

### 2. Field `platforms` provided with multiple values and `pinnedPlatform` is not provided.

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "linux-glibc-libssl1.0.2"]
}
```

Since we do not pin the platform here using `pinnedPlatform`, we need to resolve the binary at runtime, see [Runtime binary resolution] for more details.

### 3. Field `platforms` provided with multiple values and `pinnedPlatform` is also provided.

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "linux-glibc-libssl1.0.2"]
    pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "linux-glibc-libssl1.0.2"
}
```

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "linux-glibc-libssl1.0.2"]
    pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "linux-glibc-libssl1.0.2"
}
```

We use the `pinnedPlatform` field to pin one of the downloaded binaries at runtime.

Note: In production setups with a dedicated CI, we can configure platforms to only include the required binaries: `platforms = ["linux-glibc-libssl1.0.2"]`

A configuration like `platforms = ["native", "linux-glibc-libssl1.0.2"]` is only needed when the development machine is also the machine responsible to build
for production but the platform in production is different, like `AWS lambda`, `now`, etc.

# Binary Resolution Error Handling

For fields on the `generator` block:

- If the pinned binary is not found during the generation, generation should fail.

- If the pinned binary is not found during the generated code's runtime, it should throw.

- If the pinned binary is a known binary but does not work for the current platform, try other known binaries from `platforms`. This would make the use cases work where build machine is different from deploy machine, like in the case of zeit's now.

- If the pinned binary is a custom binary but does not work for the current platform, generated code's runtime should throw.

For environment variables used to override the binary used by the CLI:

- If the environment variable path to a custom binary is not found, the respective generate command should throw.

- If the environment variable path to a custom binary exists but the binary is incompatible with the current platform, the respective generate command should throw.

# Binary Naming Convention

All downloaded binaries must follow the naming convention outlined by the [Table of Binaries](#table-of-binaries).

This includes both binaries downloaded for a generator and downloaded for CLI commands.

# Runtime Binary Resolution

In the scenario where `platforms` field is defined but no `pinnedPlatform` field is defined, we resolve the binary at runtime by detecting the platform. This
can be achieved by generating code similar to this pseudo-code in Photon.

```ts
function detectPlatform(): string { ... }

const binaries = {
  'mac': <path>,
  'lambda': <path>,
}
let binaryPath
if (!config.pinnedPlatform) {
  const inferredPlatform = detectPlatform()
  binaryPath = binaries[inferredPlatform]
} else {
  binaryPath = binaries[config.pinnedPlatform]
}
```

For custom binaries, this pseudo-code will fail but `pinnedPlatform` can be used to choose the correct binary.

# Table of Binaries

|       **Package**       | **Known Platforms** | **Needs `libssl`?** |                                                          **Query Engine**                                                           | **Migration Engine**                                                                                                                        | **Prisma Format**                                                                                                 |
| :---------------------: | :-----------------: | :-----------------: | :---------------------------------------------------------------------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
|         darwin          | (Local development) |                     |         [prisma-query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/prisma-query-engine.gz)          | [prisma-migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/prisma-migration-engine.gz)                  | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/prisma-fmt.gz)                  |
|         windows         | (Local development) |                     |         [prisma-query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/windows/prisma-query-engine.gz)         | [prisma-migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/windows/prisma-migration-engine.gz)                 | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/windows/prisma-fmt.gz)                 |
| linux-glibc-libssl1.0.1 | Lambda Node 8, ZEIT |          ✓          | [prisma-query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.1/prisma-query-engine.gz) | [prisma-migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.1/prisma-migration-engine.gz) | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.1/prisma-fmt.gz) |
| linux-glibc-libssl1.0.2 |  Lambda (Node 10)   |          ✓          | [prisma-query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.2/prisma-query-engine.gz) | [prisma-migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.2/prisma-migration-engine.gz) | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.2/prisma-fmt.gz) |
| linux-glibc-libssl1.1.0 |          ?          |          ✓          | [prisma-query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.0/prisma-query-engine.gz) | [prisma-migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.0/prisma-migration-engine.gz) | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.0/prisma-fmt.gz) |
| linux-glibc-libssl1.1.1 |          ?          |          ✓          | [prisma-query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.1/prisma-query-engine.gz) | [prisma-migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.1/prisma-migration-engine.gz) | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.1/prisma-fmt.gz) |
| linux-musl-libssl1.0.1  |       Alpine        |          ✓          | [prisma-query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.1/prisma-query-engine.gz)  | [prisma-migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.1/prisma-migration-engine.gz)  | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.1/prisma-fmt.gz)  |
| linux-musl-libssl1.0.2  |       Alpine        |          ✓          | [prisma-query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.2/prisma-query-engine.gz)  | [prisma-migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.2/prisma-migration-engine.gz)  | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.2/prisma-fmt.gz)  |
| linux-musl-libssl1.1.0  |       Alpine        |          ✓          | [prisma-query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.0/prisma-query-engine.gz)  | [prisma-migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.0/prisma-migration-engine.gz)  | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.0/prisma-fmt.gz)  |
| linux-musl-libssl1.1.1  |       Alpine        |          ✓          | [prisma-query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.1/prisma-query-engine.gz)  | [prisma-migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.1/prisma-migration-engine.gz)  | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.1/prisma-fmt.gz)  |

## URL Scheme

To download the binary, replace `${package}` with a package (e.g. `darwin`) and `${name}` with the name of the binary above (e.g. `query-engine`):

- https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/${package}/${name}
- E.g. https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/migration-engine

From photon's perspective, we'll download the binaries to `./node_modules/@generated/photon/${package}`.

## Common Cloud Platforms

### Tier 1

- Lambda (Node 8)
- Lambda (Node 10)
- ZEIT
- Netlify
- Heroku
- Google Cloud Functions
- Azure Functions
- CodeSandbox

### Tier 2

- Cloudflare workers
- Raspberry Pi (ARM)

# Binary Process Management

Note: "binary" in this section refers to the query engine binary used by Photon to execute queries against a data source.

Photon provides `connect`, `disconnect` methods for binary process management and if needed, also lazily connects, when a request is received.

## Connect

`connect` function is where Photon spawns a binary and the following sequence of events happen

#### Find Free Port

Photon finds a free port by binding to port 0 with a light-weight TCP server (using node net -> createServer), this makes the OS allocate a random (albeit,
pseudo serial) port to this server, then this server is closed and `Photon` saves the port in memory.

#### Binary Spawn

Photon then spawns the binary as a child process and provide it the environment variables including the detected port

This port is then provided to the binary as an environment variable and the binary starts an HTTP server on this port.

#### Waiting for the Binary to be Ready

In this workflow, Photon polls the binary's HTTP server for its stats at an interval. This can be optimized further by reducing the interval or relying on a
simple TCP protocol.

#### Error Handling

Photon throws if the engine ready polling does not yield success after N attempts. There may be several reasons why preparing a process with the required
context might fail, including but not limited to:

| Potential Error                            | Handling Strategy |
| ------------------------------------------ | ----------------- |
| Unable to bind to a free port              | Throw error       |
| Binary is not compatible with the platform | Throw error       |
| Binary fails to acquire a DB connection    | Throw error       |

Error handling has a separate spec [here](https://github.com/prisma/specs/tree/master/errors).

## Photon in FaaS environment (Like AWS Lambda)

**DB Connection Handling**

Nuances around handling DB connections in Lambda are not new and most of those nuances also apply to Photon.

Lambda has the concept of [reusing a container](https://aws.amazon.com/blogs/compute/container-reuse-in-lambda/) which means that for subsequent invocations of
the same function it may use an already existing container that has the allocated processes, memory, file system (`/tmp` is writable in Lambda), and even DB
connection still available.

Any piece of code [outside the handler](https://docs.aws.amazon.com/lambda/latest/dg/programming-model-v2.html) remains initialized. This is a great place for
`Photon` to call "connect" or at least call `Photon` constructor so that subsequent invocations can share a connection. There are some implications though they
are not directly related to Photon but any system that would require a DB connection from Lambda:

| Implication                                                                                                                                                                                                                                                                                                                           | Potential Solution                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| It is not guaranteed that subsequent nearby invocations of a function will hit the same container. AWS can choose to create a new container at any time.                                                                                                                                                                              | Code should assume the container to be stateless and create a connection only if it does not exist. Photon already implements that logic.                        |
| The containers that are marked to be removed and are not being reused still keep a connection open and can stay in that state for some time (unknown and not documented from AWS), this can lead to a sub-optimal utilization of the DB connections                                                                                   | One potential solution is to use a lower idle connection timeout. Another solution can be to clean up the idle connections in a separate service<sup>1, 2</sup>. |
| Concurrent requests might spin up separate containers i.e. new connections. This makes connection pooling a bit difficult to manage because if there is a pool of size N and C concurrent containers, the effective number of connections is N \* C. It is very easy to exhaust `max_connection` limits of the underlying data source | Photon does not implement connection pooling right now. This can also be handled by limiting the concurrency levels of a Lambda function.                        |

<pre>
1. Note that these are recommendations and not best practices. These would vary from system to system.
2. [`serverless-mysql`](https://github.com/jeremydaly/serverless-mysql) is a library that implements this idea.
</pre>

**Cold Starts**

A serverless function container may be recycled at any point. There is no official documented amount of time on when that happen but running a function warmer
does not work, containers are recycled regardless.

## Disconnect

Calling the `disconnect` method is where Photon waits for any pending request promise to resolve and then kills the spawned process and the DB connection is
released.

# Drawbacks

- We download binaries specified by the `platforms` when bundling the app, this may lead to (with multiple platforms) unused binaries being bundled increasing the bundle size. This can be resolved by documenting the "bundle ignore" mechanics of various platforms like `.upignore` for `apex/up`. Some platforms also respect the `.gitignore` file.

- We still need some (albeit minimal) configuration before we can deploy to Lambda. This might be a non-issue as it is common to write some configuration (to
  switch the DB to production for example) when deploying.

# How we teach this

- We can generate commended code with a link to docs in init flow to make users aware about the deployment workflows

```groovy
generator photon {
    provider = "photonjs"

    // Want to deploy? Docs: <link>
    // platforms = ["linux-glibc-libssl1.0.2"]
    // pinnedPlatform = env("PLATFORM")
}
```

# Unresolved questions

- Some platforms [tally `package.json` with the actual contents of `node_modules`](https://github.com/prisma/photonjs/issues/117), this spec does not address
  that issue.

- Possible New Dimension: Is libssl built for specific distros? E.g. does libssl1.0.1 built on centos not work for ubuntu? https://github.com/prisma/prisma2/issues/157
