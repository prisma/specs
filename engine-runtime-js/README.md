# Prisma Engine Runtime (for JavaScript/TypeScript)

## Query Engine

- NPM Package: `@prisma/query-engine-runtime`
- Binary env var: `PRISMA_QUERY_ENGINE_BINARY`
- Examples: Photon.js, Studio, ...
- Process Management
- RPC API

## Migration Engine

- NPM Package: `@prisma/migration-engine-runtime`
- Binary env var: `PRISMA_MIGRATION_ENGINE_BINARY`
- Examples: Lift, `prisma-test-utils`, ...
- Process Management
- RPC API

## Future

This entire topic is expected to improve a lot with the advent of WebAssembly.

## Open Questions

- [ ] How does the Rust-based "Utils CLI" factor into this? (Static: Doesn't require connections)
