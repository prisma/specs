# Binaries

<!-- toc -->

Currently, we download the binary for the platform being used right now without a public API to change the binary to target a different platform or use a custom
binary.

This spec documents the ideas on how such a feature can be provided. Roughly, the requirements are:

- Minimal configuration, simple mental model.
- Easy setup of development/deployment workflows.
- Possibility of a deterministic binary resolution both locally and production setup.

One approach to add this feature is to add two fields to the `generator` block in the Prisma schema file.

| Field            | Description                                                                                                                    | Behavior                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `platforms`      | (Optional) An array of binaries that are required by the application, string for known platforms and path for custom binaries. | Declarative way to download the required binaries.       |
| `pinnedPlatform` | (Optional) A string that points to the name of an object in the `platforms` field, usually an environment variable             | Declarative way to define which binary to use at runtime |

Both `platforms` and `pinnedPlatform` fields are optional, examples are available further in this document.

Note: Whenever a custom binary is provided, `pinnedPlatform` becomes mandatory.

### Terminology:

**Platform**: A managed environment like `lambda`, `google cloud functions` or an operating system. A `platform` represents the environment i.e. the OS and
installed packages.

# Basic Example

When the development machine is Mac but the deployment platform is AWS lambda.

```
generator photon {
    provider = "photonjs"
    platforms = ["native", "lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "native" and in production, "lambda"
}
```

# Motivation

Use cases:

- When deploying to platforms like `lambda`, `google cloud functions`, `netlify` etc. Even custom deploy pipelines without a CI where development and deployment
  platforms are different can benefit from this feature.

- When running tests in a CI that has a different platform than local development.

- When development is on a machine for which we do not have a pre-compiled binary and using a custom compiled binary is required.

# Detailed Design

### Scenarios

Example: when the development machine is Mac but the deployment platform is AWS lambda.

##### Approach 1:

```
generator photon {
    provider = "photonjs"
    platforms = ["mac", "lambda"]
}
```

Since we do not pin the platform here using `pinnedPlatform`, we need to resolve the binary at runtime, see "Runtime binary resolution" for more details.

##### Approach 2

```
generator photon {
    provider = "photonjs"
    platforms = ["mac", "lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "mac" and in production, "lambda"
}
```

We define the platforms and pin one of the platforms.

Example: when the development machine is mac but we need a custom binary in production

```
generator photon {
    provider = "photonjs"
    platforms = ["mac", "./custom-prisma-binary"]
    pinnedPlatform = env("PLATFORM") // On local, "mac" and in production, "./custom-prisma-binary"
}
```

### Configuration

Both `platforms` and `pinnedPlatform` fields are optional, scenarios:

1. Both `platforms` and `pinnedPlatform` are not provided.

```
generator photon {
    provider = "photonjs"
}
```

We download and use the binary for the current platform.

2. Field `platforms` provided with multiple values and `pinnedPlatform` is not provided.

```
generator photon {
    provider = "photonjs"
    platforms = ["mac", "lambda"]
}
```

Since we do not pin the platform here using `pinnedPlatform`, we need to resolve the binary at runtime, see "Runtime binary resolution" for more details.

3. Field `platforms` provided with multiple values and `pinnedPlatform` is also provided.

```
generator photon {
    provider = "photonjs"
    platforms = ["mac", "lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "mac" and in production, "lambda"
}
```

```
generator photon {
    provider = "photonjs"
    platforms = ["mac", "lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "mac" and in production, "lambda"
}
```

We use the `pinnedPlatform` field to pin one of the downloaded binaries at runtime.

Note: In production setups with a dedicated CI, we can configure platforms to only include the required binaries: `platforms = ["lambda"]`

A configuration like `platforms = ["mac", "lambda"]` is only needed when the development machine is also the machine responsible to build for production but the
platform in production is different, like `AWS lambda`, `now`, etc.

### Runtime

##### Runtime binary resolution

In the scenario where `platforms` field is defined but no `pinnedPlatform` field is defined, we resolve the binary at runtime by detecting the platform. This
can be achieved by generating code similar to this pseudo-code in Photon.

```
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

In case of custom binaries, this pseudo-code would fail, `pinnedPlatform` can be used to resolve the correct binary in case a custom binary is supplied to
platforms.

# Drawbacks

- We download binaries specified by the `platforms` when bundling the app, this may lead to (with multiple platforms) unused binaries being bundled increasing
  the bundle size. This can be resolved by documenting the "bundle ignore" mechanics of various platforms like `.upignore` for `apex/up`. Some platforms also
  respect the `.gitignore` file.

- We still need some (albeit minimal) configuration before we can deploy to Lambda. This might be a non-issue as it is common to write some configuration (to
  switch the DB to production for example) when deploying.

# How we teach this

- We can generate commended code with a link to docs in init flow to make users aware about the deployment workflows

```
generator photon {
    provider = "photonjs"

    // Want to deploy? Docs: <link>
    // platforms = ["lambda"]
    // pinnedPlatform = env("PLATFORM")
}
```

# Table of Binaries

|       **Package**       | **Known Platforms** | **Needs `libssl`?** |                                                   **Query Engine**                                                    | **Migration Engine**                                                                                                          | **Prisma Format**                                                                                                 |
| :---------------------: | :-----------------: | :-----------------: | :-------------------------------------------------------------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
|         darwin          | (Local development) |                     |         [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/query-engine.gz)          | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/migration-engine.gz)                  | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/prisma-fmt.gz)                  |
|         windows         | (Local development) |                     |         [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/windows/query-engine.gz)         | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/windows/migration-engine.gz)                 | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/windows/prisma-fmt.gz)                 |
| linux-glibc-libssl1.0.1 | Lambda Node 8, ZEIT |          ✓          | [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.1/query-engine.gz) | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.1/migration-engine.gz) | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.1/prisma-fmt.gz) |
| linux-glibc-libssl1.0.2 |  Lambda (Node 10)   |          ✓          | [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.2/query-engine.gz) | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.2/migration-engine.gz) | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.0.2/prisma-fmt.gz) |
| linux-glibc-libssl1.1.0 |          ?          |          ✓          | [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.0/query-engine.gz) | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.0/migration-engine.gz) | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.0/prisma-fmt.gz) |
| linux-glibc-libssl1.1.1 |          ?          |          ✓          | [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.1/query-engine.gz) | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.1/migration-engine.gz) | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc-libssl1.1.1/prisma-fmt.gz) |
| linux-musl-libssl1.0.1  |       Alpine        |          ✓          | [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.1/query-engine.gz)  | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.1/migration-engine.gz)  | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.1/prisma-fmt.gz)  |
| linux-musl-libssl1.0.2  |       Alpine        |          ✓          | [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.2/query-engine.gz)  | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.2/migration-engine.gz)  | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.0.2/prisma-fmt.gz)  |
| linux-musl-libssl1.1.0  |       Alpine        |          ✓          | [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.0/query-engine.gz)  | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.0/migration-engine.gz)  | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.0/prisma-fmt.gz)  |
| linux-musl-libssl1.1.1  |       Alpine        |          ✓          | [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.1/query-engine.gz)  | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.1/migration-engine.gz)  | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl-libssl1.1.1/prisma-fmt.gz)  |
|        linux-dev        | (Local development) | (statically linked) |        [query-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-dev/query-engine.gz)        | [migration-engine](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-dev/migration-engine.gz)               | [prisma-fmt](https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-dev/prisma-fmt.gz)               |

## URL Scheme

To download the binary, replace `${package}` with a package (e.g. `darwin`) and `${name}` with the name of the binary above (e.g. `query-engine`):

- https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/${package}/${name}
- E.g. https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/migration-engine

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
- ARM

# Unresolved questions

- Some platforms [tally `package.json` with the actual contents of `node_modules`](https://github.com/prisma/photonjs/issues/117), this spec does not address
  that issue.

- Possible New Dimension: Is libssl built for specific distros? E.g. does libssl1.0.1 built on centos not work for ubuntu?
