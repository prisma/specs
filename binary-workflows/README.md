- Start Date: 2019-03-22
- RFC PR: (leave this empty)
- Prisma Issue: (leave this empty)

# Summary

We need our rust binaries to work on a variety of operating systems and workflows.

The workflows are powered by the `prisma2 generate` command, which runs the following operations:

- detect our current environment
- check to see if the binary exists
- download the binary if it doesn't exist
- generate the photon code

<!-- toc -->

## Query Engine

| **Working?** | **Docs?** |                 **Issue?**                  |       **Target**       | **Platform** |          **Notes**           |
| :----------: | :-------: | :-----------------------------------------: | :--------------------: | :----------: | :--------------------------: |
|      ✓       |     ✓     |                      ✓                      |          Mac           |    darwin    |                              |
|              |           | https://github.com/prisma/prisma2/issues/6  |         Lambda         | linux-lambda |                              |
|              |           | https://github.com/prisma/prisma2/issues/5  |        Zeit Now        |  linux-zeit  |                              |
|              |           | https://github.com/prisma/prisma2/issues/86 |   Netlify Functions    |              |                              |
|              |           | https://github.com/prisma/prisma2/issues/2  |         Ubuntu         |              |                              |
|              |           | https://github.com/prisma/prisma2/issues/2  |         Centos         |              |                              |
|              |           | https://github.com/prisma/prisma2/issues/2  |         Alpine         |              |                              |
|              |           | https://github.com/prisma/prisma2/issues/4  |        Windows         |              |                              |
|      ✓       |     ✓     |                      ✓                      |      Code Sandbox      | linux-glibc  | Uses: `node:10.16.0-stretch` |
|              |           | https://github.com/prisma/prisma2/issues/84 |         Heroku         |              |                              |
|              |           | https://github.com/prisma/prisma2/issues/85 |   Cloudflare Workers   |              |                              |
|              |           | https://github.com/prisma/prisma2/issues/87 | Google Cloud Functions |              |                              |

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

We'll provide high and low-level targets for common platforms:

```groovy
generator photon {
  provider = "photonjs"
  target = "lambda"
}
```

As examples of high-level targets, some of these targets will include:

- lambda
- zeit
- netlify functions
- cloudflare workers

##### Currently Available Platforms

- darwin: https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/prisma
- linux-lambda: https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-lambda/prisma
- linux-zeit: https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-zeit/prisma
- linux-glibc: https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc/prisma
- linux-musl: https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl/prisma

**Open Question**: we may run into issues over time if we don't version these and they change their underlying platform (zeit / netlify)

We can also provide low-level targets, either

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

| **Working?** | **Docs?** |                 **Issue?**                 |       **Target**       | **Platform** |          **Notes**           |
| :----------: | :-------: | :----------------------------------------: | :--------------------: | :----------: | :--------------------------: |
|      ✓       |     ✓     |                     ✓                      |          Mac           |     mac      |                              |
|              |           | https://github.com/prisma/prisma2/issues/6 |         Lambda         | linux-lambda |                              |
|              |           | https://github.com/prisma/prisma2/issues/5 |        Zeit Now        |  linux-zeit  |                              |
|              |           | https://github.com/prisma/prisma2/issues/2 |         Ubuntu         |              |                              |
|              |           | https://github.com/prisma/prisma2/issues/2 |         Centos         |              |                              |
|              |           | https://github.com/prisma/prisma2/issues/2 |         Alpine         |              |                              |
|              |           | https://github.com/prisma/prisma2/issues/4 |        Windows         |              |                              |
|      ✓       |     ✓     |                     ✓                      |      Code Sandbox      | linux-glibc  | Uses: `node:10.16.0-stretch` |
|              |           |                                            |         Heroku         |              |                              |
|              |           |                                            |      Netlify Fns       |              |                              |
|              |           |                                            | Google Cloud Functions |              |                              |

To download the binary, replace `${platform}` with the Platform above:

https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/${platform}/migration-engine

### Currently Available Platforms

- darwin: https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/darwin/migration-engine
- linux-glibc: https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-glibc/migration-engine
- linux-musl: https://s3-eu-west-1.amazonaws.com/prisma-native/alpha/latest/linux-musl/migration-engine

### Installation

#### yarn/npm

`yarn add prisma2` runs a `install` (or `postinstall`) scripts which should detect our current environment, check if we already have the binary, and download
the prebuilt binaries.

#### curl

We can modify this script to fit our needs: https://github.com/apex/apex/blob/master/install.sh.
