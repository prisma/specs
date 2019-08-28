# Prisma 2 Repositories

Prisma obviously uses GitHub for hosting our git repositories. This document specifies which repositories we consider part of our main offering, and how we decide when to create an additional repository.

## Repositories in use

Repositories used for Prisma 2:

### Main

#### External

- https://github.com/prisma/prisma2 - Prisma 2: CLI and Docs
- https://github.com/prisma/specs - Specification of Prisma 2
- https://github.com/prisma/photonjs - PhotonJS
- https://github.com/prisma/lift - Lift
- https://github.com/prisma/studio - Studio
- https://github.com/prisma/vscode-prisma - VSCode Extension for Prisma

#### Internal

- https://github.com/prisma/prisma-engine - Prisma Engine (Rust)
- https://github.com/prisma/prisma-sdk-js - Prisma SDK (JS)
- https://github.com/prisma/prisma-query - Query Abstraction
- https://github.com/prisma/studio-code (private) - Studio Codebase
- https://github.com/prisma/engine-build-cli - Build CLI for `prisma-engine`
- https://github.com/prisma/prisma-test-utils - genererator for test utilities used to generate fake dbs with fake data for writing unit/integration tests
- https://github.com/prisma/typescript-pipelines - CLI/TypeScript release tooling

### Additional

- https://github.com/prisma/prisma2-private (private) - Sensitive information and issues
- https://github.com/prisma/prisma-examples/tree/prisma2/ - Examples using Prisma 2
- https://github.com/prisma/database-schema-examples - Database Schema Examples (to be supported by Prisma 2)

### Meta

- https://github.com/prisma/prisma-label-sync - GitHub Label automation

## Guidelines

- In theory everything could live in one big, happy repo
- Split if clearly defined separate product (è.g. `photonjs`, `lift`)
- Split if issues should be collected in separate location (e.g. `prisma-engine`)
- Split if separation necessary for technical reasons (CI, commits)  (e.g. `prisma-engine`)
