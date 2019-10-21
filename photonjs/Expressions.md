# Expressions

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Filtering

### By two different scalars

#### Expressions

```ts
await photon.users.findMany({
  where: e => {
    e.email.endsWith('@gmail.com') // and or or by default? Probably and, as we already used to have that
    e.name.startsWith('Bob')
  },
})

await photon.users.findMany({
  where: e => e.and(e.email.endsWith('@gmail.com'), e.name.startsWith('Bob')),
})

await photon.users.findMany({
  where: e => e.email({ endsWith: '@gmail.com' }).name({ startsWith: 'Bob' }),
})

await photon.users.findMany({
  where: e => e.email.endsWith('@gmail.com').name.startsWith('Bob'),
})
```

#### Object-based baseline

```ts
await photon.users.findMany({
  where: {
    email: {
      endsWith: '@gmail.com',
    },
    name: {
      startsWith: 'Bob',
    },
  },
})
```

### By one scalar two times

#### Expressions

```ts
await photon.users.findMany({
  where: e => {
    e.email.endsWith('@gmail.com').not.contains('bad-word')
  },
})

await photon.users.findMany({
  where: e =>
    e.and(e.email.endsWith('@gmail.com'), e.email.not.contains('bad-word')),
})
```

#### Object-based baseline

```ts
await photon.users.findMany({
  where: {
    email: {
      endsWith: '@gmail.com'
      not: {
        contains: 'bad-word'
      }
    },
  }
})
```

### Relation

#### Expressions

```ts
await photon.users.findMany({
  where: e => {
    e.posts.some(p => p.published.equals(false))
  },
})
```

#### Object-based baseline

```ts
await photon.users.findMany({
  where: {
    posts: {
      some: {
        published: false,
      },
    },
  },
})
```

## Nested Mutations
