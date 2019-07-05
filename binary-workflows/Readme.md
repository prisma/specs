- Start Date: 2019-03-22
- RFC PR: (leave this empty)
- Prisma Issue: (leave this empty)

---

<!-- toc -->

- [Summary](#summary)
- [Query Engine](#query-engine)
  - [Development Installation](#development-installation)
    - [OSX, Windows](#osx-windows)
  - [Production Installation](#production-installation)
    - [Lambda, Serverless, Apex, Netlify Functions, rsync](#lambda-serverless-apex-netlify-functions-rsync)
      - [Platforms and their URLs](#platforms-and-their-urls)
    - [Now, Heroku, Deploy from CI](#now-heroku-deploy-from-ci)
- [CLI (migration-engine + introspection binaries)](#cli-migration-engine--introspection-binaries)
  - [Platforms and their URLs](#platforms-and-their-urls-1)
  - [Installation](#installation)
    - [yarn/npm](#yarnnpm)
    - [curl](#curl)

<!-- tocstop -->

# Summary

We need our rust binaries to work on a variety of operating systems and workflows.

The workflows are powered by the `prisma2 generate` command, which runs the following operations:

- detect our current environment
- check to see if the binary exists
- download the binary if it doesn't exist
- generate the photon code

# Query Engine

|        **Name**        |       **Package**       | **Working?** | **Docs?** |                 **Issue?**                  |
| :--------------------: | :---------------------: | :----------: | :-------: | :-----------------------------------------: |
|          Mac           |         darwin          |      ✓       |     ✓     |                      ✓                      |
|     Lambda Node 8      | linux-glibc-libssl1.0.1 |              |           | https://github.com/prisma/prisma2/issues/6  |
|     Lambda Node 10     | linux-glibc-libssl1.0.2 |              |           | https://github.com/prisma/prisma2/issues/6  |
|        Zeit Now        | linux-glibc-libssl1.0.1 |              |           | https://github.com/prisma/prisma2/issues/5  |
|   Netlify Functions    |            ?            |              |           | https://github.com/prisma/prisma2/issues/86 |
|         Ubuntu         |       linux-glibc       |      ✓       |           | https://github.com/prisma/prisma2/issues/2  |
|         Centos         |       linux-glibc       |      ✓       |           | https://github.com/prisma/prisma2/issues/2  |
|         Alpine         |       linux-musl        |      ✓       |           | https://github.com/prisma/prisma2/issues/2  |
|        Windows         |         windows         |              |           | https://github.com/prisma/prisma2/issues/4  |
|      Code Sandbox      |       linux-glibc       |      ✓       |           |                      ✓                      |
|         Heroku         |            ?            |              |           | https://github.com/prisma/prisma2/issues/84 |
|   Cloudflare Workers   |            ?            |              |           | https://github.com/prisma/prisma2/issues/85 |
| Google Cloud Functions |      user's choice      |              |           | https://github.com/prisma/prisma2/issues/87 |

To download the binary, replace `${package}` with the **Package** above:

https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/${package}/prisma

- By excluding `_libsslx.x.x`, we're assuming the latest build. `linux_musl` means `linux_musl_libssl-latest`.

## Development Installation

### OSX, Windows

- Installed via `yarn add prisma2`.
- `postinstall` hook runs, calling `prisma2 generate`
- No configuration needed

## Production Installation

### Lambda, Serverless, Apex, Netlify Functions, rsync

- Some configuration needed
- Installed manually by calling `prisma2 generate` before deploying

We'll provide high and low-level targets for common platforms:

```groovy
generator photon {
  provider = "photonjs"
  target = "linux_musl_libssl1.0.1"
}
```

#### Platforms and their URLs

|      **Platform**       | **Status**  |                                 **URL or Issue**                                  |
| :---------------------: | :---------: | :-------------------------------------------------------------------------------: |
|         darwin          |      ✓      |    https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/prisma    |
|      linux-lambda       | todo remove | https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-lambda/prisma |
|       linux-zeit        | todo remove |  https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-zeit/prisma  |
|       linux-glibc       |      ✓      | https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc/prisma  |
|       linux-musl        |      ✓      |  https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl/prisma  |
|         windows         |             |                    https://github.com/prisma/prisma2/issues/4                     |
| linux-glibc-libssl1.0.1 |             |                    https://github.com/prisma/prisma2/issues/97                    |
| linux-glibc-libssl1.0.2 |             |                    https://github.com/prisma/prisma2/issues/97                    |

Alternatively, this can be done via an environment variable:

```groovy
generator photon {
  provider = "photonjs"
  target = env("PRISMA_GENERATOR_TARGET")
}
```

We can also provide a path to a custom binary:

```groovy
generator photon {
  provider = "photonjs"
  target = "./custom-query-engine"
}
```

After, we can install the binary via `prisma generate`

### Now, Heroku, Deploy from CI

- Installed via `yarn add prisma2`.
- `postinstall` hook runs, calling `prisma2 generate`
- No configuration needed

We can use the configuration above to override our default settings.

# CLI (migration-engine + introspection binaries)

Currently **migration-engine**, soon also **introspection**.

| **Name** | **Package** | **Working?** | **Docs?** |                 **Issue?**                 |
| :------: | :---------: | :----------: | :-------: | :----------------------------------------: |
|   Mac    |   darwin    |      ✓       |     ✓     |                     ✓                      |
|  Ubuntu  | linux-glibc |      ✓       |           | https://github.com/prisma/prisma2/issues/2 |
|  Centos  | linux-glibc |      ✓       |           | https://github.com/prisma/prisma2/issues/2 |
|  Alpine  | linux-musl  |      ✓       |           | https://github.com/prisma/prisma2/issues/2 |
| Windows  |   windows   |              |           | https://github.com/prisma/prisma2/issues/4 |

To download the binary, replace `${package}` with the Package above:

https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/${package}/migration-engine

## Platforms and their URLs

| **Package** | **Status** |                                      **URL or Issue**                                      |
| :---------: | :--------: | :----------------------------------------------------------------------------------------: |
|   darwin    |     ✓      |   https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/migration-engine    |
| linux-glibc |     ✓      | https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc/migration-engine |
| linux-musl  |     ✓      | https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl/migration-engine  |
|   windows   |            |                         https://github.com/prisma/prisma2/issues/4                         |

## Installation

### yarn/npm

`yarn add prisma2` runs a `install` (or `postinstall`) scripts which should detect our current environment, check if we already have the binary, and download
the prebuilt binaries.

### curl

We can modify this script to fit our needs: https://github.com/apex/apex/blob/master/install.sh.
