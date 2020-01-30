# CLI

- Owner: @janpio
- Stakeholders: @timsuchanek @nikolasburk
- State:
  - Spec: In Progress 🚧
  - Implementation: In Progress 🚧

Prisma CLI offers essential functionality to Prisma Framework users.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Problem, Idea, Concept](#problem-idea-concept)
- [Use Cases](#use-cases)
- [Installation](#installation)
- [Commands](#commands)
  - [Setup Prisma](#setup-prisma)
  - [Create datamodel based on existing database](#create-datamodel-based-on-existing-database)
  - [Iterate on datamodel](#iterate-on-datamodel)
    - [Interactive](#interactive)
    - [Non-Interactive](#non-interactive)
  - [Migrate datamodel](#migrate-datamodel)
  - [Generate Photon](#generate-photon)
  - [Convert Prisma 1.x service configuration to Prisma Framework schema file](#convert-prisma-1x-service-configuration-to-prisma-framework-schema-file)
- [Error Handling](#error-handling)
- [Other Functionality](#other-functionality)
  - [Help](#help)
  - [Proxy Support](#proxy-support)
- [Design Document](#design-document)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Problem, Idea, Concept

Prisma CLI offers essential functionality to Prisma users.

- Interactive commands
- Non Interactive commands (scriptable, automation, CI)

## Use Cases

1. Install Prisma Framework
1. Create a new project using Prisma Framework
1. Set up Prisma Framework in an existing project with an existing database
1. Iterate on Datamodel
1. Generate Prisma Client JS
1. Use Prisma Migrate to migrate your database

## Installation

TODO

- npm/yarn default
- All other options as fallback/alternative: Homebrew, curl, chocolatey, ...

## Commands

### Setup Prisma

`prisma2 init`

TODO

### Create datamodel based on existing database

`prisma2 introspect`

See [introspection specs](../introspection).

### Iterate on datamodel

TODO watch mode

#### Interactive

`prisma2 dev`

TODO

#### Non-Interactive

TODO

### Migrate datamodel

`prisma2 lift x`

See [Lift specs](../lift).

### Generate Photon

`prisma2 generate`

TODO

See [Photon specs](../photon).

### Convert Prisma 1.x service configuration to Prisma Framework schema file

`prisma2 convert`

TODO

## Error Handling

When there's an unexpected error in the CLI it crashes. In order for us to learn about the cause of the crash, we catch the error and before the CLI process terminates, we trigger an interactive prompt to the user where they can decide whether or not an error report should be submitted.

## Other Functionality

### Help

TODO

### Proxy Support

If the `HTTPS_PROXY` or `HTTP_PROXY` environment variables are set, proxy settings will be honored by the CLI.

## Design Document

- This lives over at https://github.com/prisma/spec-cli
- View Online: https://prisma-cli-spec.netlify.com/
