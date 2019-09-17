# Introspection

- Owner: @matthewmueller 
- Stakeholders: @do4gr 
- State: 
  - Spec: In Progress 🚧
  - Implementation: Unknown ❔

When a user gets started with Prisma in a brownfield project, they can let Prisma introspect their database to generate the initial Prisma data model definition.

---

<!-- START doctoc -->
<!-- END doctoc -->

## Motivation

For greenfield projects, we offer a selection of starter kits to the user that they can select during prisma2 init. For brownfield projects, we eventually want to get to a similar level of sophistication and e.g. offer a to auto-generate a GraphQL server that's based on the existing database schema of the user.

## Implementation

### Current

- JavaScript/TypeScript somehow

### Future 👽

- Introspection Engine somehow
