# Prisma Repositories

Prisma obviously uses GitHub for hosting our git repositories. This document specifies which repositories we consider part of our main offering, and how we decide when to create an additional repository.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Repositories in use](#repositories-in-use)
  - [Prisma](#prisma)
    - [Main](#main)
    - [Internal parts](#internal-parts)
  - [Additional](#additional)
  - [Meta](#meta)
- [Repository Creation Guidelines](#repository-creation-guidelines)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Repositories in use

Repositories used for Prisma Framwork:

### Prisma

#### Main

- https://github.com/prisma/prisma - Prisma
- https://github.com/prisma/prisma-client-js - Prisma Client JS
- https://github.com/prisma/migrate - Prisma Migrate
- https://github.com/prisma/studio - Prisma Studio
- https://github.com/prisma/vscode - VSCode Extension for Prisma
- https://github.com/prisma/specs - Specification of Prisma
- https://github.com/prisma/docs - Prisma Documentation
- https://github.com/prisma/prisma-examples - Examples using Prisma

#### Internal parts

- https://github.com/prisma/prisma-engines - Prisma Engines (Rust)
- https://github.com/prisma/prisma-sdk-js - Prisma SDK (JS)
- https://github.com/prisma/prisma2-e2e-tests - Prisma E2E Tests
- https://github.com/prisma/quaint - SQL Query AST and Visitor for Rust
- https://github.com/prisma/studio-code (🔒 private) - Prisma Studio Codebase
- https://github.com/prisma/engine-build-cli - Build CLI for `prisma-engines`
- https://github.com/prisma/typescript-pipelines - CLI/TypeScript release tooling
- https://github.com/prisma/prisma2-development-environment - Prisma Framework Development Environment
- https://github.com/prisma/error-reporting-gui - A GUI for the CLI error reports

### Additional

- https://github.com/prisma/prisma-test-utils - Genererator for test utilities used to generate fake DBs with fake data for writing unit/integration tests
- https://github.com/prisma/prisma2-private (🔒 private) - Sensitive information and issues
- https://github.com/prisma/database-schema-examples - Database Schema Examples (to be supported by Prisma Framework)

### Meta

- https://github.com/prisma/prisma-labelsync - GitHub Label automation

## Repository Creation Guidelines

- In theory everything could live in one big, happy repo 🎅
- Split if clearly defined separate tool (e.g. `prisma-client-js`, `migrate`)
- Split if issues should be collected in separate location (e.g. `prisma-engines`)
- Split if separation necessary for technical reasons (CI, commits) (e.g. `prisma-engines`)
- Split if usage outside of Prisma could be useful (e.g. `quaint`)
- That being said, the current split and guidelines are somewhat arbitary and might change in the future 🤷🚀
