- Start Date: 2019-07-17
- RFC PR: (leave this empty)
- Prisma Issue: (leave this empty)

# Summary

Currently, we download the binary for the platform being used right now without a public API to change the binary to target a different platform or use a custom binary.

This spec documents the ideas on how such a feature can be provided. Roughly, the requirements are:

- Minimal configuration, simple mental model.
- Easy setup of development/deployment workflows.
- Possibility of a deterministic binary resolution both locally and production setup.

One approach to add this feature is to add two fields to the `generate` block in the Prisma schema file.

| Field                 | Description                                                                                                           | Behavior                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `additionalPlatforms` | An array of binaries that are required by the application, string for known platforms and object for custom binaries. | Declarative way to download the required binaries.       |
| `pinnedPlatform`      | A string that points to the name of an object in the `additionalPlatforms` field, usually an environment variable     | Declarative way to define which binary to use at runtime |

Both `additionalPlatforms` and `pinnedPlatform` fields are optional, examples are available further in this document.

### Terminology:

**Platform**: A managed environment like `lambda`, `google cloud functions` or an operating system. A `platform` represents the environment i.e. the OS and installed packages.

**Default binary (aka global binary)**: Binary specific to the platform currently in use. The original idea was for this to live in global cache directory but since Photon is a library, we want to move this to `node_modules`, this leads to an unresolved question, please see the unresolved questions section for details.

# Basic Example

Names of fields/values are subjected to change. See the unresolved questions section.

Example: when the development machine is Mac but the deployment target is AWS lambda.

```
generator photon {
    provider = "photonjs"
    additionalPlatforms = ["mac", "lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "mac" and in production, "lambda"
}
```

# Motivation

Use cases:

- When deploying to platforms like `lambda`, `google cloud functions`, `netlify` etc. Even custom deploy pipelines without a CI where development and deployment platforms are different can benefit from this feature.

- When running tests in a CI that has a different platform than local development.

- When development is on a machine for which we do not have a pre-compiled binary and using a custom compiled binary is required.

# Detailed Design

### Scenarios

Example: when the development machine is Mac but the deployment target is AWS lambda.

##### Approach 1:

```
generator photon {
    provider = "photonjs"
    additionalPlatforms = ["lambda"]
}
```

Please see the "default binary" unresolved question.

##### Approach 2

```
generator photon {
    provider = "photonjs"
    additionalPlatforms = ["mac", "lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "mac" and in production, "lambda"
}
```

We define the platforms deterministically and pin one of the platforms.

Example: when the development machine is mac but we need a custom binary in production

```
generator photon {
    provider = "photonjs"
    additionalPlatforms = [{name: "custom", "path": "./custom-prisma-binary"}]
    pinnedPlatform = env("PLATFORM") // On local, "mac" and in production, "custom"
}
```

This API makes the `additionalPlatforms` hold an object as a value in the case of custom binaries.

### Configuration

Both `additionalPlatforms` and `pinnedPlatform` fields are optional, following are some scenarios involding these fields:

1. Both `additionalPlatforms` and `pinnedPlatform` are not provided.

```
generator photon {
    provider = "photonjs"
}
```

We download and use the binary for the current platform.

2. Field `additionalPlatforms` provided with one value and `pinnedPlatform` is not provided.

```
generator photon {
    provider = "photonjs"
    additionalPlatforms = ["lambda"]
}
```

Please see the "default binary" unresolved question.

3. Field `additionalPlatforms` provided with multiple values and `pinnedPlatform` is not provided.

```
generator photon {
    provider = "photonjs"
    additionalPlatforms = ["lambda", "google-cloud-functions"]
}
```

Use case: When the application is being deployed to multiple cloud platforms. In this scenario, we don't want to do runtime heuristics to find the "correct" binary, as this is a fairly advanced use case, we make `pinnedPlatform` field required and fail if it is not provided.

4. Field `additionalPlatforms` provided with one (or multiple) value and `pinnedPlatform` is also provided.

```
generator photon {
    provider = "photonjs"
    additionalPlatforms = ["lambda"]
    pinnedPlatform = env("PLATFORM") // On local, "mac" and in production, "lambda"
}
```

```
generator photon {
    provider = "photonjs"
    additionalPlatforms = ["lambda", "google-cloud-functions"]
    pinnedPlatform = env("PLATFORM") // On local, "mac" and in production, "lambda"
}
```

We download the binary for the current platform and additionally we download the binaries specified in `additionalPlatforms` field. We use the `pinnedPlatform` field to pin one of the downloaded binaries at runtime.

# Drawbacks

- We download binaries specified by the `additionalPlatforms` when bundling the app, this may lead to (with multiple targets) unused binaries being bundled increasing the bundle size. This can be resolved by documenting the "bundle ignore" mechanics of various platforms like `.upignore` for `apex/up`. Some platforms also respect the `.gitignore` file.

- We still need some (albeit minimal) configuration before we can deploy to Lambda. This might be a non-issue as it is common to write some configuration (to switch the DB to production for example) when deploying.

# How we teach this

- In the case of not specifying `additionalPlatforms` and `pinnedPlatform`, we do what we do day and resolve the default binary.

- In the case of an `additionalPlatforms` field with one value for the target platform, we rely on runtime check for default binary before using the binary from `additionalPlatforms`. We can inform the users about `pinnedPlatform` as a DEBUG log.

- We can generate commended code with a link to docs in init flow to make users aware about the deployment workflows

```
generator photon {
    provider = "photonjs"

    // Want to deploy? Docs: <link>
    // additionalPlatforms = ["lambda"]
    // pinnedPlatform = env("PLATFORM")
}
```

# Unresolved questions

- A non-global default binary (like `prisma-mac` always in `node_modules` irrespective of `additionalPlatforms`) gets bundled and makes `pinnedPlatform` required.

```
On local, we use the "default binary". In production, we use the "correct" binary. There are two cases here:

Default binary is global, this case works both locally and in production.

Default binary is in `node_modules`, this would break in bundled function in production because for example, the mac binary will also be bundled in case it is in the `node_modules`, we can resolve this by

1. Finding the working binary at runtime (Ugly solution)
2. Make `pinnedPlatform` field required when `additionalPlatforms` field is provided.
```

- Naming of `additionalPlatforms`, `pinnedPlatforms` and other configuration fields.

- Naming of platforms/targets as per the [binary workflows spec](https://github.com/prisma/specs/tree/master/binary-workflows). This spec uses simpler names like `lambda` for now.

- Value for custom binaries vs known binaries in `additionalPlatforms`, currently, we have a string for known binaries like `["lambda"]` and object with this structure for custom binaries `[{name: "custom", path: "./custom binary"}]`

- Some platforms [tally `package.json` with the actual contents of `node_modules`](https://github.com/prisma/photonjs/issues/117), this spec does not address that issue.

- Should we think of having separate terminology for a `platform`? Currently, in this spec, the word `Platform` covers both managed providers and operating systems.
