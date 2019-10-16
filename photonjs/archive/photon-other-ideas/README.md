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

## Alternatives to `.load()`

### Split up into `.select()` and `.include()`

```ts
await photon.user
  .find('bobs-id')
  .select({ posts: { select: { comments: true } }, friends: true })
```

Cons:

- Weird asymmetry for `.select` and nested `select: {}`
- When user wants to retrieve data for writes a simple `.load()` is enough. No good equivalent here expect `.select(true)`.

### Move selection set into 2nd parameter

Cons:

- Inconsistent behavior in regards to the chaining API.

### Expressions based API

```ts
const userWithPostsAndFriends: DynamicResult2 = await photon.user
  .find('bobs-id')
  .load(u =>
    u
      .reset()
      .posts(p => p.comments({ first: 10 }))
      .friends({ first: 10 })
      .exclude('bigField'),
  )

const result = await photon.user.find('my-user').load(u => u.posts())

const result = await photon.user.find('my-user').load(u =>
  u
    .reset()
    .firstName()
    .lastName(),
)

// - [ ] include
// - [ ] select / unselect fields
// - [ ] programatic api

// pros:
// - remove `true` map
// - co-locate arguments (e.g. first)
// cons:
// - minor: ruins our semantic meaning of an operation
// - prettier messes up formatting
// - ? more complicated programatic API
```
