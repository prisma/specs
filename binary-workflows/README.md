# Binary Workflows

We need our rust binaries to work on a variety of operating systems and workflows.

The workflows are powered by the `prisma2 generate` command, which runs the following operations:

- detect our current environment
- check to see if the binary exists
- download the binary if it doesn't exist
- generate the photon code

## Query Engine

| **Done?** | **Docs?** |                 **Issue?**                 |       **Target**       |  **Platform**   |          **Notes**           |
| :-------: | :-------: | :----------------------------------------: | :--------------------: | :-------------: | :--------------------------: |
|     ✓     |     ✓     |                     ✓                      |          Mac           |       mac       |                              |
|           |           | https://github.com/prisma/prisma2/issues/6 |         Lambda         | linux-musl (?)  |                              |
|           |           | https://github.com/prisma/prisma2/issues/5 |        Zeit Now        | linux-musl (?)  |                              |
|           |           | https://github.com/prisma/prisma2/issues/2 |         Ubuntu         |   linux-glibc   |                              |
|           |           | https://github.com/prisma/prisma2/issues/2 |         Centos         |   linux-glibc   |                              |
|           |           | https://github.com/prisma/prisma2/issues/2 |         Alpine         |   linux-musl    |                              |
|           |           | https://github.com/prisma/prisma2/issues/4 |        Windows         |                 |                              |
|     ✓     |     ✓     |                     ✓                      |      Code Sandbox      |   linux-glibc   | Uses: `node:10.16.0-stretch` |
|           |           |                                            |         Heroku         |   linux-glibc   |                              |
|           |           |                                            |      Netlify Fns       | linux-musl (?)  |                              |
|           |           |                                            | Google Cloud Functions | linux-glibc (?) |                              |

To download the binary, replace `${platform}` with the **Platform** above:

https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/${platform}/prisma

### Development Installation

#### OSX, Windows

- Installed via `yarn add prisma2`.
- `postinstall` hook runs, calling `prisma2 generate`
- No configuration needed

### Production Installation

#### Lambda, Serverless, Apex, Netlify Functions, rsync

- Some configuration needed
- Installed manually by calling `prisma2 generate` before deploying

We'll provide some high-level targets for common targets:

```groovy
generator photon {
  provider = "photonjs"
  target = "lambda"
}
```

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

#### Now, Heroku, Deploy from CI

- Installed via `yarn add prisma2`.
- `postinstall` hook runs, calling `prisma2 generate`
- No configuration needed

We can use the configuration above to override our default settings.

## CLI (migration-engine + introspection binaries)

Currently **migration-engine**, soon also **introspection**.

| **Done?** | **Docs?** |                 **Issue?**                 |       **Target**       |  **Platform**   |          **Notes**           |
| :-------: | :-------: | :----------------------------------------: | :--------------------: | :-------------: | :--------------------------: |
|     ✓     |     ✓     |                     ✓                      |          Mac           |       mac       |                              |
|           |           | https://github.com/prisma/prisma2/issues/6 |         Lambda         | linux-musl (?)  |                              |
|           |           | https://github.com/prisma/prisma2/issues/5 |        Zeit Now        | linux-musl (?)  |                              |
|           |           | https://github.com/prisma/prisma2/issues/2 |         Ubuntu         |   linux-glibc   |                              |
|           |           | https://github.com/prisma/prisma2/issues/2 |         Centos         |   linux-glibc   |                              |
|           |           | https://github.com/prisma/prisma2/issues/2 |         Alpine         |   linux-musl    |                              |
|           |           | https://github.com/prisma/prisma2/issues/4 |        Windows         |                 |                              |
|     ✓     |     ✓     |                     ✓                      |      Code Sandbox      |   linux-glibc   | Uses: `node:10.16.0-stretch` |
|           |           |                                            |         Heroku         |   linux-glibc   |                              |
|           |           |                                            |      Netlify Fns       | linux-musl (?)  |                              |
|           |           |                                            | Google Cloud Functions | linux-glibc (?) |                              |

To download the binary, replace `${platform}` with the Platform above:

https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/${platform}/migration-engine

### Installation

#### yarn/npm

`yarn add prisma2` runs a `install` (or `postinstall`) scripts which should detect our current environment, check if we already have the binary, and download
the prebuilt binaries.

#### curl

We can modify this script to fit our needs: https://github.com/apex/apex/blob/master/install.sh.
