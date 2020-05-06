# Prisma Framework Repositories

- Owner: @janpio
- Stakeholders: @schickling, @dpetrick
- State:
  - Spec: Stable ✅
  - Implementation: Fully implemented ✅

Prisma obviously uses GitHub for hosting our git repositories. This document specifies which repositories we consider part of our main offering, and how we decide when to create an additional repository.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Repositories in use](#repositories-in-use)
  - [Framework](#framework)
    - [Tools](#tools)
    - [Internal parts](#internal-parts)
  - [Additional](#additional)
  - [Meta](#meta)
- [Repository Creation Guidelines](#repository-creation-guidelines)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Repositories in use

Repositories used for Prisma Framwork:

### Framework

#### Tools

- https://github.com/prisma/prisma2 - Prisma Framework: CLI and Docs
- https://github.com/prisma/specs - Specification of Prisma Framework
- https://github.com/prisma/prisma-client-js - Prisma Client JS
- https://github.com/prisma/migrate - Prisma Migrate
- https://github.com/prisma/studio - Studio
- https://github.com/prisma/vscode-prisma - VSCode Extension for Prisma

#### Internal parts

- https://github.com/prisma/prisma-engines - Prisma Engines (Rust)
- https://github.com/prisma/prisma-sdk-js - Prisma SDK (JS)
- https://github.com/prisma/quaint - SQL Query AST and Visitor for Rust
- https://github.com/prisma/studio-code (🔒 private) - Studio Codebase
- https://github.com/prisma/engine-build-cli - Build CLI for `prisma-engines`
- https://github.com/prisma/typescript-pipelines - CLI/TypeScript release tooling
- https://github.com/prisma/prisma2-development-environment - Prisma Framework Development Environment

### Additional

- https://github.com/prisma/prisma-test-utils - Genererator for test utilities used to generate fake DBs with fake data for writing unit/integration tests
- https://github.com/prisma/prisma2-private (🔒 private) - Sensitive information and issues
- https://github.com/prisma/prisma-examples/tree/prisma2 - Examples using Prisma Framework
- https://github.com/prisma/database-schema-examples - Database Schema Examples (to be supported by Prisma Framework)

### Meta

- https://github.com/prisma/prisma-label-sync - GitHub Label automation

## Repository Creation Guidelines

- In theory everything could live in one big, happy repo 🎅
- Split if clearly defined separate tool (e.g. `photonjs`, `lift`)
- Split if issues should be collected in separate location (e.g. `prisma-engines`)
- Split if separation necessary for technical reasons (CI, commits) (e.g. `prisma-engines`)
- Split if usage outside of Prisma could be useful (e.g. `prisma-query`)
- That being said, the current split and guidelines are somewhat arbitary and might change in the future
