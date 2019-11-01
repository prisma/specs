<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Archived ideas](#archived-ideas)
  - [Alternative `.replace()` API](#alternative-replace-api)
  - [Write operations on relations via Fluent API](#write-operations-on-relations-via-fluent-api)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Archived ideas

## Alternative `.replace()` API

```ts
// Like `update` but replaces entire record. Requires all required fields like `create`.
// Resets all connections.
// Returns Promise<void>
await photon.user.find({ email: 'bob@prisma.io' }).replace({
  firstName: 'Alice',
  lastName: 'Doe',
  email: 'alice@prisma.io',
  profile: { imageUrl: 'http://...', imageSize: 100 },
})
```

## Write operations on relations via Fluent API

Consideration: Redundant with nested writes API

```ts
await photon.user
  .find('bobs-id')
  .posts()
  .update({
    create: { title: 'New post', body: 'Hello world', published: true },
  })
```