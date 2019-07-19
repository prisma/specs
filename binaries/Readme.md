# Binaries

<!-- toc -->

- [Motivation](#motivation)
- [Requirements](#requirements)
- [API Additions](#api-additions)
- [Basic Example](#basic-example)
- [Scenarios](#scenarios)
    + [1. Development machine is Mac but the deployment platform is AWS lambda.](#1-development-machine-is-mac-but-the-deployment-platform-is-aws-lambda)
    + [2. Deterministically choose the binary based a runtime environment variable](#2-deterministically-choose-the-binary-based-a-runtime-environment-variable)
    + [3. Development machine is Mac but we need a custom binary in production](#3-development-machine-is-mac-but-we-need-a-custom-binary-in-production)
- [Configuration](#configuration)
    + [1. Both `platforms` and `pinnedPlatform` are not provided.](#1-both-platforms-and-pinnedplatform-are-not-provided)
    + [2. Field `platforms` provided with multiple values and `pinnedPlatform` is not provided.](#2-field-platforms-provided-with-multiple-values-and-pinnedplatform-is-not-provided)
    + [3. Field `platforms` provided with multiple values and `pinnedPlatform` is also provided.](#3-field-platforms-provided-with-multiple-values-and-pinnedplatform-is-also-provided)
- [Runtime binary resolution](#runtime-binary-resolution)
- [Table of Binaries](#table-of-binaries)
  * [URL Scheme](#url-scheme)
  * [Common Cloud Platforms](#common-cloud-platforms)
    + [Tier 1](#tier-1)
    + [Tier 2](#tier-2)
- [Drawbacks](#drawbacks)
- [How we teach this](#how-we-teach-this)
- [Unresolved questions](#unresolved-questions)

<!-- tocstop -->

Currently, we download the binary for the platform being used right now without a public API to change the binary to target a different platform or use a custom
binary.

# Motivation

- Deploy to platforms without a CI like Lambda, Google Cloud Functions, Netlify Functions, etc.
- When running tests in CI where CI has a different platform than local development.
- When development is on a machine that we do not have a pre-compiled binary and using a custom compiled binary is required.

# Requirements

- Minimal configuration, simple mental model.
- Possibility of a deterministic binary resolution both locally and production setup.
- Easy setup of development and deployment workflows.

# API Additions

This spec introduces two new fields on the `generator` block:

| Field            | Description                                                                                                                      | Behavior                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `platforms`      | _(optional)_ An array of binaries that are required by the application, string for known platforms and path for custom binaries. | Declarative way to download the required binaries. |
| `pinnedPlatform` | _(optional)_ A string that points to the name of an object in the `platforms` field, usually an environment variable             | Declarative way to choose the runtime binary       |

- Both `platforms` and `pinnedPlatform` fields are optional, however when a custom binary is provided, `pinnedPlatform` is required.

# Basic Example

When the development machine is Mac but the deployment platform is AWS lambda.

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "lambda"
}
```

- `"native"` is a special keyword for your local development platform. `native` may be different for different developers, depending on their machine. If you're
  on OSX, this would be `mac`. If you're on a common linux distro, it would detect the appropriate binary for your environment. See the
  [Table of Binaries](#table-of-binaries) below for a reference.
- `env("PLATFORM")` allows you to switch between the platforms via `PLATFORM` environment variable. So depending on if you're

# Scenarios

### 1. Development machine is Mac but the deployment platform is AWS lambda.

We can use `platforms` **without** a `pinnedPlatform`. `pinnedPlatform` will be resolved at runtime, see [Runtime binary resolution](#runtime-binary-resolution)
for more details.

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "lambda"]
}
```

### 2. Deterministically choose the binary based a runtime environment variable

We can use `platforms` **and** `pinnedPlatform`. We set an environment variable

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "lambda"
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
    platforms = ["native", "lambda"]
}
```

Since we do not pin the platform here using `pinnedPlatform`, we need to resolve the binary at runtime, see [Runtime binary resolution] for more details.

### 3. Field `platforms` provided with multiple values and `pinnedPlatform` is also provided.

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "lambda"
}
```

```groovy
generator photon {
    provider = "photonjs"
    platforms = ["native", "lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "lambda"
}
```

We use the `pinnedPlatform` field to pin one of the downloaded binaries at runtime.

Note: In production setups with a dedicated CI, we can configure platforms to only include the required binaries: `platforms = ["lambda"]`

A configuration like `platforms = ["native", "lambda"]` is only needed when the development machine is also the machine responsible to build for production but
the platform in production is different, like `AWS lambda`, `now`, etc.

# Runtime binary resolution

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

# Drawbacks

- We download binaries specified by the `platforms` when bundling the app, this may lead to (with multiple platforms) unused binaries being bundled increasing
  the bundle size. This can be resolved by documenting the "bundle ignore" mechanics of various platforms like `.upignore` for `apex/up`. Some platforms also
  respect the `.gitignore` file.

- We still need some (albeit minimal) configuration before we can deploy to Lambda. This might be a non-issue as it is common to write some configuration (to
  switch the DB to production for example) when deploying.

# How we teach this

- We can generate commended code with a link to docs in init flow to make users aware about the deployment workflows

```groovy
generator photon {
    provider = "photonjs"

    // Want to deploy? Docs: <link>
    // platforms = ["lambda"]
    // pinnedPlatform = env("PLATFORM")
}
```

# Unresolved questions

- Some platforms [tally `package.json` with the actual contents of `node_modules`](https://github.com/prisma/photonjs/issues/117), this spec does not address
  that issue.

- Possible New Dimension: Is libssl built for specific distros? E.g. does libssl1.0.1 built on centos not work for ubuntu?
