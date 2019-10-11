# Photon.js

- Owner: @schickling
- Stakeholders: @timsuchanek
- State:
  - Spec: Outdated 🚨
  - Implementation: Unknown ❔

This spec describes the Photon Javascript API

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


  - [Prisma Schema](#prisma-schema)
  - [Types](#types)
  - [Terminology](#terminology)
  - [Basic Queries](#basic-queries)
  - [Field-level Primary Key constraint](#field-level-primary-key-constraint)
    - [Field-level unique constraint](#field-level-unique-constraint)
    - [Model-level composite constraint (unnamed)](#model-level-composite-constraint-unnamed)
    - [Naming the composite constraint](#naming-the-composite-constraint)
  - [Writing Data](#writing-data)
    - [Write operations](#write-operations)
      - [Nested Write API](#nested-write-api)
      - [Fluent Write API](#fluent-write-api)
    - [Many operations](#many-operations)
    - [Nested writes](#nested-writes)
  - [Load: Select / Include API](#load-select--include-api)
    - [Default selection set](#default-selection-set)
  - [Advanced Fluent API](#advanced-fluent-api)
    - [Null narrowing](#null-narrowing)
    - [Expressing the same query using fluent API syntax and nested writes](#expressing-the-same-query-using-fluent-api-syntax-and-nested-writes)
  - [Mental model: Graph traversal](#mental-model-graph-traversal)
  - [Working with types](#working-with-types)
  - [Expressions](#expressions)
    - [Criteria Filters](#criteria-filters)
    - [Order By](#order-by)
    - [Write Operations (Update/Atomic)](#write-operations-updateatomic)
    - [Aggregations](#aggregations)
    - [Group by](#group-by)
    - [Distinct](#distinct)
  - [Experimental: Meta response](#experimental-meta-response)
  - [Optimistic Concurrency Control / Optimistic Offline Lock](#optimistic-concurrency-control--optimistic-offline-lock)
    - [Supported operations](#supported-operations)
  - [Batching](#batching)
  - [Criteria API](#criteria-api)
  - [Design decisions](#design-decisions)
  - [Constructor](#constructor)
  - [Connection management](#connection-management)
- [Error Handling](#error-handling)
  - [Error Character Encoding](#error-character-encoding)
- [Unresolved questions](#unresolved-questions)
    - [Figured out but needs spec](#figured-out-but-needs-spec)
    - [Bigger todos](#bigger-todos)
    - [Small & self-contained](#small--self-contained)
    - [Ugly parts](#ugly-parts)
    - [Related](#related)
    - [Future topics](#future-topics)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Prisma Schema

The example code below assumes the following Prisma schema:

```prisma
// datasource config ...

type ID = String @id @default(cuid())

model Post {
  id        ID
  title     String
  body      String
  published Boolean
  comments  Comment[]
  author    User
}

model Comment {
  id     ID
  text   String
  post   Post
  media  Media[]
  author User
}

embed Media {
  url      String
  uploaded Boolean
}

model User {
  id           ID
  firstName    String
  lastName     String
  email        String
  posts        Post[]
  comments     Comment[]
  friends      User[]    @relation("friends")
  profile      Profile
  bestFriend   User?     @relation("bestFriend") @unique
  version      Int
}

embed Profile {
  imageUrl  String
  imageSize String
}
```

## Types

```ts
// NOTE the following types are auto-generated
type Post = {
  id: string
  title: string
  body: string
  published: boolean
}

type Comment = {
  id: string
  text: string
  media: Media[]
}

type Media = {
  url: string
  uploaded: boolean
}

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  profile: Profile
  version: number
}

type Profile = {
  imageUrl: string
  imageSize: number
}
```

## Terminology

- To be defined
  - Query
  - Operation
  - Write
  - Read
  - Selection set
  - Query builder
  - Terminating/chainable operation
  - Graph selection: Travesal vs operate
  - ...

## Basic Queries

```ts
// Find single record by @id field. Returns nullable result
const alice: User | null = await photon.user.find('user-id')

// Find single record by other unique field
const alice: User | null = await photon.user.find({
  email: 'alice@prisma.io',
})

// Find using composite/multi-field unique indexes
// Note: This example is not compatible with the example schema above.
const john: User | null = await photon.user.find({
  firstName_lastName: {
    firstName: 'John',
    lastName: 'Doe',
  },
})

// Find using named unique relation
const bob: User | null = await photon.user.find({
  bestFriend: { email: 'alice@prisma.io' },
})

// Get many nodes
const allUsers: User[] = await photon.user.findMany()
const first100Users: User[] = await photon.user.findMany({ first: 100 })

// Find by (non-)unique field and return first found record
const firstDoe: User | null = await photon.user
  .findMany({ where: { lastName: 'Doe' } })
  .first()

// Alternative
const firstDoe: User | null = await photon.user.findFirst({
  where: { lastName: 'Doe' },
})

// Ordering
const usersByEmail: User[] = await photon.user.findMany({
  orderBy: { email: 'ASC' },
})
const usersByEmailAndName: User[] = await photon.user.findMany({
  orderBy: { email: 'ASC', name: 'DESC' },
})
const usersByProfile: User[] = await photon.user.findMany({
  orderBy: { profile: { imageSize: 'ASC' } },
})

// Where / filtering
await photon.user.findMany({ where: { email: 'alice@gmail.com' } })
await photon.user.findMany({ where: { email: { contains: '@gmail.com' } } })
await photon.user.findMany({
  where: { email: { containsInsensitive: '@gmail.com' } },
})

// Exists
const userFound: boolean = await photon.user.find('bobs-id').exists()
const foundAtLeastOneUser: boolean = await photon.user
  .findMany({ email: { containsInsensitive: '@gmail.com' } })
  .exists()

// Simple aggregation short
// TODO more examples
const deletedCount: number = await photon.user.delete().count()
```

## Field-level Primary Key constraint

Different unique constraints will change Photon's `where` blocks:

```groovy
model User {
    id String @id
    firstName String
    lastName String
    email String
}
```

```ts
photon.user.find({ id: 10 })
```

### Field-level unique constraint

```groovy
model User {
    id String @id
    firstName String
    lastName String
    email String  @unique
}
```

```ts
// allowed
photon.user.find({ id: 10 })
photon.user.find({ email: 'alice@prisma.io' })
// compiler error
photon.user.find({ id: 10, email: 'alice@prisma.io' })
```

### Model-level composite constraint (unnamed)

```groovy
model User {
    id String @id
    firstName String
    lastName String
    email String @unique
    @@unique([ firstName, lastName ])
}
```

```ts
// allowed
photon.user.find({ id: 10 })
photon.user.find({ email: 'alice@prisma.io' })
photon.user.find({
  firstName_lastName: {
    firstName: 'Alice',
    lastName: 'Prisma',
  },
})
// compiler error
photon.user.find({
  email: 'alice@prisma.io',
  firstName_lastName: {
    firstName: 'Alice',
    lastName: 'Prisma',
  },
})
photon.user.find({
  id: 10,
  firstName_lastName: {
    firstName: 'Alice',
    lastName: 'Prisma',
  },
})
```

### Naming the composite constraint

```groovy
model User {
    id String @id
    firstName String
    lastName String
    email String @unique
    @@unique([ firstName, lastName ], alias: "fullName")
}
```

```ts
// allowed
photon.user.find({ id: 10 })
photon.user.find({ email: 'alice@prisma.io' })
photon.user.find({
  fullName: {
    firstName: 'Alice',
    lastName: 'Prisma',
  },
})
// compiler error
photon.user.find({
  email: 'alice@prisma.io',
  fullName: {
    firstName: 'Alice',
    lastName: 'Prisma',
  },
})
photon.user.find({
  id: 10,
  fullName: {
    firstName: 'Alice',
    lastName: 'Prisma',
  },
})
```

## Writing Data

### Write operations

#### Nested Write API

| Operation             | Touches Record | Touches Connection |
| --------------------- | -------------- | ------------------ |
| `connect`             | No             | Yes                |
| `disconnect`          | No             | Yes                |
| ??? `resetAndConnect` | No             | Yes                |
| `connectOrCreate`     | Yes            | Yes                |
| `create`              | Yes            | Yes                |
| `update`              | Yes            | No                 |
| `replace`             | Yes            | No                 |
| `delete`              | Yes            | Yes                |

#### Fluent Write API

- `create`
- `orCreate`
- `update`
- `replace`
- `delete`

```ts
// Returns Promise<void>
await photon.user.create({
  firstName: 'Alice',
  lastName: 'Doe',
  email: 'alice@prisma.io',
  profile: { imageUrl: 'http://...', imageSize: 100 },
})

// Returns Promise<void>
await photon.user.find('bobs-id').update({ firstName: 'Alice' })

// Returns Promise<void>
await photon.user
  .find({ email: 'bob@prisma.io' })
  .update({ firstName: 'Alice' })

// Like `update` but replaces entire record. Requires all required fields like `create`.
// Resets all connections.
// Returns Promise<void>
await photon.user.find({ email: 'bob@prisma.io' }).update(
  {
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  },
  { replace: true },
)

// Returns Promise<void>
await photon.user.find('alice-id').orCreate({
  firstName: 'Alice',
  lastName: 'Doe',
  email: 'alice@prisma.io',
  profile: { imageUrl: 'http://...', imageSize: 100 },
})

// Returns Promise<void>
await photon.user
  .find('alice-id')
  .update({ firstName: 'Alice' })
  .orCreate({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })

// Note: Delete operation sends query BEFORE record is deleted -> no .load() possible
await photon.user.find('bobs-id').delete()

// Write operations can be chained with the `.load()` API
const updatedUser: User = await photon.user
  .find('bobs-id')
  .update({ firstName: 'Alice' })
  .load()
```

### Many operations

```ts
await photon.user
  .findMany({ where: { email: { endsWith: '@gmail.com' } } })
  .update({ lastName: 'Doe' })

await photon.user
  .findMany({ where: { email: { endsWith: '@gmail.com' } } })
  .delete()
```

### Nested writes

```ts
// Nested create
await photon.user.create({
  firstName: 'Alice',
  posts: {
    create: { title: 'New post', body: 'Hello world', published: true },
  },
})

// TODO: How to return data from nested writes
// - how many records were affected (e.g. nested update many)
// await photon.user
//   .create({
//     firstName: 'Alice',
//     posts: {
//       create: { title: 'New post', body: 'Hello world', published: true },
//     },
//   })
//   .load({ select: { posts: { newOnly: true } } })

// Nested write with connect
await photon.user.create({
  firstName: 'Alice',
  lastName: 'Doe',
  email: 'alice@prisma.io',
  profile: { imageUrl: 'http://...', imageSize: 100 },
  posts: { connect: 'post-id' },
})

// Create a post and connect it to the author with a unique constraint
await photon.post.create({
  title: 'My cool blog post',
  author: {
    connect: {
      firstName_lastName: {
        firstName: 'John',
        lastName: 'Doe',
      },
    },
  },
})

// How to get newly created posts?
await photon.user.find('bobs-id').update({
  posts: {
    create: { title: 'New post', body: 'Hello world', published: true },
  },
})

```

## Load: Select / Include API

- Implicit load: Read operations
- Explicit load:
  - After write operations
  - Custom selection set via include/select

```ts
// Select API
type DynamicResult1 = {
  posts: { comments: Comment[] }[]
  friends: User[]
}[]

const userWithPostsAndFriends: DynamicResult1 = await photon.user
  .find('bobs-id')
  .load({ select: { posts: { select: { comments: true } }, friends: true } })

type DynamicResult2 = (User & {
  posts: (Post & { comments: Comment[] })[]
  friends: User[]
})[]

const userWithPostsAndFriends: DynamicResult2 = await photon.user
  .find('bobs-id')
  .load({ include: { posts: { include: { comments: true } }, friends: true } })
```

### Default selection set

- TODO
  - Scalars
  - Relations
  - ID
  - Embeds

## Advanced Fluent API

- TODO: Spec out difference between chainable vs terminating
  - Chainable: schema-based fields (e.g. relations), find, update, upsert, create,
  - Terminating: select, include, delete, count, scalar field, exists, aggregates?
- TODO: Spec out return behavior
  - read traversal
  - write operation: single vs multi-record operation
  - Alternative: explicit fetch/query
- TODO: tradeoff multi-record-operations -> return count by default but can be adjusted to return actual data -> how?
- TODO: Document transactional behavior

```ts
const bobsPosts: Post[] = await photon.user.find('bobs-id').post({ first: 50 })

// Nested arrays are flat-mapped
const comments: Comment[] = await.photon.user
  .find('bobs-id')
  .post()
  .comments()

type DynamicResult3 = (Post & { comments: Comment[] })[]

const bobsPosts: DynamicResult3 = await photon.user
  .find('bobs-id')
  .post({ first: 50 })
  .load({ include: { comments: true } })

const media: Media[] = await photon.post
  .find('id')
  .comments({ where: { text: { startsWith: 'Hello' } } })
  .media({ where: { url: 'exact-url' }, first: 100 })
  .update({ uploaded: true })
  .load()

// Supports chaining multiple write operations
await photon.user
  .find('user-id')
  .update({ email: 'new@email.com' })
  .post({ where: { published: true } })
  .update({ comments: { connect: 'comment-id' } })
```

### Null narrowing

- Single-record `find` queries return `null` by default
- `update` and `delete` as well as field traversal queries will fail if record is `null`

### Expressing the same query using fluent API syntax and nested writes

- TODO
- Add to spec: Control execution order of nested writes

```ts
// Declarative
await photon.user.find('bob-id').update({
  email: 'new@email.com',
  posts: {
    update: {
      where: { published: true },
      data: { comments: { connect: 'comment-id' } },
    },
  },
})

// Fluent
await photon.user
  .find('user-id')
  .update({ email: 'new@email.com' })
  .post({ where: { published: true } })
  .update({ comments: { connect: 'comment-id' } })

// await photon.user
//   .find('user-id')
//   .update({ email: 'new@email.com' })
//   .post({ where: { published: true } })
//   .comments()
//   .connect('comment-id')
```

## Mental model: Graph traversal

- Idea: Select one or multiple records. Then read and/or write them.

## Working with types

- Use cases
  - Constructing arguments
  - Return types (e.g. select/include results -> `typeof` ?)
  - Fluent API

## Expressions

- Kinds
  - Criteria filters (`where`)
  - Order by
  - Write operations
  - Select (aggregations)
  - Group by

### Criteria Filters

```ts
// Find one
await photon.user.find(u => u.email.eq('alice@prisma.io'))

// Find many
await photon.user.findMany({
  where: u => u.firstName.subString(1, 4).eq('arl'),
})
await photon.user.findMany({ where: u => u.email.contains('@gmail.com') })
await photon.user.findMany({
  where: u => u.email.insensitive.contains('@gmail.com'),
})
await photon.user.findMany({
  where: u => u.email.toLowerCase().contains('@gmail.com'),
})
```

### Order By

```ts
await photon.user.findMany({ orderBy: u => u.email.asc() })
await photon.user.findMany({
  orderBy: (u, e) => e.and(u.email.asc(), u.firstName.desc()),
})
await photon.user.findMany({ orderBy: u => u.profile.imageSize.asc() })
```

### Write Operations (Update/Atomic)

Set:

```ts
await photon.users
  .findMany()
  .update({ email: u => u.email.set('bob@gmail.com') })
```

Type specific:

See:

- Mongo API https://docs.mongodb.com/manual/reference/operator/update/
- Dgraph https://docs.dgraph.io/query-language/#math-on-value-variables

```ts
// String
await photon.users.findMany().update({ email: u => u.email.concat('-v2') })
await photon.users.findMany().update({ email: u => u.email.toLowerCase() })
await photon.users.findMany().update({ email: u => u.email.subString(1, 4) })
// ...

// Numbers: Int, Float, ...
await photon.users.findMany().update({ version: u => u.version.inc(5) })
await photon.users.findMany().update({ version: u => u.version.dec(5) })
await photon.users.findMany().update({ version: u => u.version.mul(5) })
await photon.users.findMany().update({ version: u => u.version.div(5) })
await photon.users.findMany().update({ version: u => u.version.mod(5) })
await photon.users.findMany().update({ version: u => u.version.pow(5, 10) })
await photon.users.findMany().update({ version: u => u.version.min(5, 10) })
await photon.users.findMany().update({ version: u => u.version.max(5, 10) })

// Boolean

// Arrays
```

Top level callback

```ts
await photon.users.findMany().update(u => ({
  firstName: u.firstName.toLowerCase(),
  lastName: u.lastName.toLowerCase(),
}))
```

### Aggregations

- count
- sum
- avg
- median
- max
- min

```ts
await photon.users.findMany({ where: { version: 5 } }).load({
  include: { aggr: u => ({ postCount: u.posts.count() }) },
})

await photon.users
  .findMany({ where: { version: 5 } })
  .load({ include: { postCount: u => u.posts.count() } })

await photon.users.findMany({ where: { version: 5 } }).load({
  select: {
    id: true,
    postCount: u => u.posts({ where: { p => p.comments().count().gt(10) } }).count(),
  },
})
```

### Group by

```ts
type DynamicResult4 = {
  key: string
  records: User[]
}
const groupByResult: DynamicResult4 = await photon.user
  .findMany({
    where: { isActive: true },
    orderBy: { lastName: 'ASC' },
    first: 100,
  })
  .group({
    by: 'lastName',
    having: g => g.age.avg.gt(10),
    first: 10,
  })
  .load({ include: { avgAge: g => g.age.avg() } })

await photon.user
  .findMany({ where: u => u.age.lt(90) })
  .group({ by: u => u.version.div(10) })
  .load({ include: { versionSum: g => g.version.sum() } })

await photon.user.findMany().group({ by: u => u.email.toLowerCase() })
```

### Distinct

```ts
// TODO: Do we really need this API?
const values: string[] = await photon.post.findMany().title({ distinct: true })

const values: string[] = await photon.post
  .findMany()
  .distinct({ title: true })
  .title()

type SubSet = { published: boolean; title: string }
const values: SubSet[] = await photon.post
  .findMany()
  .distinct({ published: true, title: true })

const distinctCount: number = await photon.post
  .findMany()
  .distinct({ published: true, title: true })
  .count()

// TODO count distinctly grouped value -> see aggregations
```

## Experimental: Meta response

Note: This is a early draft for this feature and won't be implemented in the near future

```ts
// PageInfo
const bobsPostsWithPageInfo: PageInfo<Post> = await photon.user
  .find('bobs-id')
  .post({ first: 50 })
  .loadWithPageInfo()

type PageInfo<Data> = {
  data: Data[]
  hasNext: boolean
  hasPrev: boolean
}

const [bobsPosts, meta]: [Post[], Meta] = await photon.user
  .find('bobs-id')
  .post({ first: 50 })
  .loadWithMeta({ pageInfo: true })
```

- Meta
  - pageinfo
  - traces/performance
  - which records have been touched during a (nested) write
- Strategies

  - By extending load API + return object
  - Return extra meta object

- Can be applied to every paginable list and stream

## Optimistic Concurrency Control / Optimistic Offline Lock

- TODO Needs to be specced out for nested Graph API

### Supported operations

- `update`
- `replace`
- `delete`
- `update`
- `delete`

```ts
await photon.user
  .find('alice-id')
  .update({ firstName: 'Alice' }, { if: { version: 12 } })

await photon.user
  .find('alice-id')
  .update({ firstName: 'Alice' }, { if: { version: 12 } })
  .orCreate({
    /* ... */
  })

await photon.user.find('bobs-id').delete({ if: { version: 12 } })

// Global condition
await photon.user
  .find('bobs-id')
  .delete()
  .if([{ model: 'User', where: 'bobs-id', if: { name: 'Bob' } }])

// both can be combined
await photon.user
  .find('bobs-id')
  .delete({ if: { version: 12 } })
  .if([{ model: 'User', where: 'alices-id', if: { name: 'Alice' } }])
```

## Batching

Note: Combined with OCC (i.e. `if`) also known as "unit of work"

```ts
// Batching, don't get the results with $noData
const m1 = photon.user.create({ firstName: 'Alice' })
const m2 = photon.post.create({ title: 'Hello world' })
const [u1, p1]: [boolean, boolean] = await photon.batch([m1, m2])

// TODO
// - `if` API
// - error handling: throw on first error or batch errors

// Batching with transaction
await photon.batch([m1, m2], { transaction: true })
```

## Criteria API

- Filter generation per type
- Allow for empty objects
- Case sensitivity (https://github.com/prisma/prisma2/issues/258)
- Shortcuts
  - id
    - multi-column uniques (See slack thread https://prisma.slack.com/archives/CKQTGR6T0/p1564566886224500?thread_ts=1564552560.218200&cid=CKQTGR6T0)

## Design decisions

- Choose boolean-based nested object syntax instead of array
- language native DSL (Linq) vs string-based DSL (GraphQL)

## Constructor

- data source config
- query engine binary
- debug
- modifiers
- log colors https://github.com/prisma/specs/pull/151

## Connection management

- Lazy connect by default

```ts
const photon = new Photon()
await photon.connect()

await photon.disconnect()
```

<!--
## TODO: Operation/Query optimization

## TODO: Implicit back relations

- See https://github.com/prisma/prisma2/issues/81

## Top level query API

```ts
const nestedResult = await photon.query({
  users: {
    first: 100,
    select: {
      posts: { select: { comments: true } },
      friends: true,
    },
  },
})
```

## Embeds

```
datasource mydb {
  provider = "postgres"
  url      = "pg:/..."
}

generator photon {
  provider = "photonjs"
  platform = ""
}

type ID = String @id @default(uuid())

model Blog {
  id          ID
  name        String
  viewCount   Int
  isPublished Boolean
  newField    String
  posts       Post[]
  authors     Author[]
}

model Author {
  id    ID
  name  String?
  posts Post[]
  blog  Blog
  update String
}

model Post {
  id       Int       @id
  title    String
  tags     String[]
  blog     Blog
  comments Comment[]
}

embed Comment {
  text   String
  media  Media[]
  author Author
}

embed Media {
  url      String
  uploaded Boolean
}
```

```ts
await photon.post('id').update({
  comments: {
    update: {
      where: { text: { startsWith: '...' } },
      update: {
        media: {
          update: {
            where: { url: 'exact-url' },
            update: { uploaded: true },
          },
        },
      },
    },
  },
})
```

## `raw` fallbacks

```ts
await photon.user.findMany({
  where: { email: { contains: '@gmail.com' } },
  orderBy: {
    raw: 'age + postsViewCount DESC',
  },
})

const someEmail = 'bob@prisma.io'
await photon.user.findMany({
  orderBy: {
    raw: 'age + postsViewCount DESC',
  },
  where: {
    raw: ['email = $1', someEmail],
  },
})

// Raw: Knex & Prisma
const userWithPostsAndFriends1 = await photon.user.find({
  where: knex.whereBuilderInSelecet(
    knex.fields.User.name,
    knex.queryMany.Post({ title: 'Alice' }, kx.fields.Post.title),
  ),
  select: knex.select('*').from('User'),
})

// Raw: SQL & Prisma
const userWithPostsAndFriends2 = await photon.user.find({
  where: {
    raw: 'User.name != "n/a"',
  },
  select: {
    raw: {
      name: {
        query: 'User.firstName + User.lastName; DROP TABLE',
        type: 'string',
      },
      hobbies: {
        topLevelQuery: 'SELECT * from Hobbies where User.id = $id',
        type: {
          name: 'Hobby',
          fields: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
          },
        },
      },
    },
  },
})
```


## Query options arg

See `options` at https://docs.mongodb.com/manual/reference/method/db.collection.aggregate/#db.collection.aggregate

- request
  - timeout
  - debug / explain
  - transaction boundary
  - geolocation
  - force index / hints
- response
  - performance (via debug/explain)

### Tracing

- Request IDs
- Open tracing

## Pagination / Streaming

- streaming for writes?

```ts
for await (const post of photon.post().$stream()) {
  console.log(post)
}

const postStreamWithPageInfo = await prisma
  .post()
  .$stream()
  .$withPageInfo()

for await (const posts of photon.user.find('bobs-id')
  .post({ first: 50 })
  .batch({ batchSize: 100 })) {
  console.log(posts) // 100 posts
}

// Configure streaming chunkSize and fetchThreshold
photon
  .post({ first: 10000 })
  .$stream({ chunkSize: 100, fetchThreshold: 0.5 /*, tailable: true*/ })

// Buffering
const posts = await prisma
  .post({ first: 100000 })
  .$stream()
  .toArray()

// Shortcut for count
const userCount = await photon.user.count({
  where: {
    age: {
      gt: 18,
    },
  },
})
```

## Life-cycle hooks

### Middleware (blocking)

```ts
function beforeUserCreate(user: UserCreateProps): UserCreateProps {
  return {
    ...user,
    email: user.email.toLowerCase(),
  }
}

type UserCreateProps = { name: string }
type UserCreateCallback = (userStuff: UserCreateProps) => Promiselike<UserCreateProps>

const beforeUserCreateCallback: UserCreateCallback = user => ({
  name: 'Tim',
})

function afterUserCreate(user) {
  datadog.log(`User Created ${JSON.stringify(user)}`)
}

const prisma = new Photon({
  middlewares: { beforeUserCreate, afterUserCreate },
})
```

### Events (non.find('bobs-id')-blocking)

const photon = new Photon()
photon.on('User:beforeCreate', user => {
  stripe.user.create(user)
})
```

## Error Handling

- [ ] Needs to satisfy https://github.com/prisma/prisma/issues/3392#issuecomment-514999567
- [ ] https://github.com/prisma/photonjs/issues/195#issuecomment-524126404

If any error should occur, Prisma client will throw. The resulting error instance will have a `.code` property.
You can find the possible error codes that we have in Prisma 1 [here](https://github.com/prisma/prisma/blob/master/server/connectors/api-connector/src/main/scala/com/prisma/api/schema/Errors.scala)

### Where

```ts
photon.user.delete('id')
photon.user.delete(['id1', 'id2'])

photon.user.findMany({
  where: {
    id: ['id1', 'id2'], // instead of `_in` or `OR`
    email: { endsWith: '@gmail.com' },
  },
})

photon.user.findMany({
  where: {
    name: { contains: 'Bob' },
    email: { contains: ['photon.io', 'gmail.com'] }, // instead of `_in` or `OR`
  },
})
```

-->

# Error Handling

## Error Character Encoding

Photon generates pretty error messages with ANSI characters for features like color coding errors and warnings in queries and newlines that are very useful for
development as they usually pin point the issue.

However, when this data is serialized it contains a lot of unicode characters.

<details><summary>Serialized Photon error</summary>

<p>

```

Error: ^[[31mInvalid ^[[1m`const data = await photon.users.findMany()`^[[22m invocation in ^[[4m/Users/divyendusingh/Documents/prisma/p2-studio/index.js:8:37^[[24m^[[39m ^[[2m ^[[90m 4 ^[[39m^[[36mconst^[[39m photon = ^[[36mnew^[[39m Photon^[[38;2;107;139;140m(^[[39m^[[38;2;107;139;140m)^[[39m^[[22m ^[[2m ^[[90m 5 ^[[39m^[[22m ^[[2m ^[[90m 6 ^[[39m^[[36masync^[[39m ^[[36mfunction^[[39m ^[[36mmain^[[39m^[[38;2;107;139;140m(^[[39m^[[38;2;107;139;140m)^[[39m ^[[38;2;107;139;140m{^[[39m^[[22m ^[[2m ^[[90m 7 ^[[39m ^[[36mtry^[[39m ^[[38;2;107;139;140m{^[[39m^[[22m ^[[31m^[[1m→^[[22m^[[39m ^[[90m 8 ^[[39m ^[[36mconst^[[39m data = ^[[36mawait^[[39m photon^[[38;2;107;139;140m.^[[39musers^[[38;2;107;139;140m.^[[39m^[[36mfindMany^[[39m^[[38;2;107;139;140m(^[[39m{ ^[[91munknown^[[39m: ^[[2m'1'^[[22m^[[2m^[[22m ^[[91m~~~~~~~^[[39m ^[[2m^[[22m}^[[2m)^[[22m Unknown arg ^[[91m`unknown`^[[39m in ^[[1munknown^[[22m for type ^[[1mUser^[[22m. Did you mean `^[[92mskip^[[39m`? ^[[2mAvailable args:^[[22m ^[[2mtype^[[22m ^[[1m^[[2mfindManyUser^[[1m^[[22m ^[[2m{^[[22m ^[[2m^[[32mwhere^[[39m?: ^[[37mUserWhereInput^[[39m^[[22m ^[[2m^[[32morderBy^[[39m?: ^[[37mUserOrderByInput^[[39m^[[22m ^[[2m^[[32mskip^[[39m?: ^[[37mInt^[[39m^[[22m ^[[2m^[[32mafter^[[39m?: ^[[37mString^[[39m^[[22m ^[[2m^[[32mbefore^[[39m?: ^[[37mString^[[39m^[[22m ^[[2m^[[32mfirst^[[39m?: ^[[37mInt^[[39m^[[22m ^[[2m^[[32mlast^[[39m?: ^[[37mInt^[[39m^[[22m ^[[2m}^[[22m

```

</p>

</details>

There are two prominent use cases amongst others for disabling/better structuring the error logs:

1. In Production logs, one might want to read the error messages thrown by Photon.

2. In tools like Studio, it currently strips the ANSI characters (like [this](https://codesandbox.io/s/photon-pretty-errors-m4l77)) and displays the output as
   the error message.

To solve these two use case, Photon can do the following:

1. Use `NODE_ENV`. When `NODE_ENV` is set to `development` or is unset, Photon can emit logs with ANSI characters. However, when `NODE_ENV` is set to
   `production` Photon can omit ANSI characters and any additional newline characters from the logs.

2. Photon can additionally offer `prettyLogs` as a constructor argument (defaults to `true`) to switch off the pretty error logging.

# Unresolved questions

- distinct
  - select/include

### Figured out but needs spec

- [ ] Error handling
- [ ] OCC (also for nested operations)
- [ ] Implicit back relations
- [ ] Name clashes / `$` pre-fixing
- [ ] Pluralization
- [ ] Criteria API
- [ ] File layout of generated node package
- [ ] Type-mapping (default + custom)
- [ ] Generated type-names for implemenation (what's exported vs internal)

### Bigger todos

- [ ] Lazy fields (Related: https://github.com/prisma/nexus-prisma/issues/301 and https://github.com/prisma/photonjs/issues/254)
- [ ] Modifiers
- [x] Find one by non-unique fields
- [ ] Working with types
- [ ] transactions by default (e.g. high throughput operations)
- [ ] Expressions API/DSL
- [ ] Binary copying
- [ ] Type mapping (e.g. `DateTime` in Prisma schema to `Date` in JS) and how to overwrite default type-mapping behavior (e.g. using Moment.js)
- [ ] Raw API fallbacks
- [ ] Default selection set: Include ids of to-one relations (https://github.com/prisma/photonjs/issues/188)
- [ ] Jump to definition
- [ ] edge concept in schema
- [ ] `.replace()` vs `.update({}, { replace: true })` (alternative: `overwrite: true`, `reset: true`)
- [x] Batching
- [ ] Consideration: How do operations (e.g. specified via the fluent API) translate into underlying DB queries (e.g. SQL queries/transactions)
- [ ] Validate API with planned supported data sources
- [ ] Bulk API / Streaming (read / write)
  - [ ] Create many (https://github.com/prisma/prisma2/issues/284)

### Small & self-contained

- [ ] Decouple engine `connect` API from Photon instance (solves: https://github.com/prisma/photonjs/issues/153)
- [ ] Should we load data by default for create operations?
- [ ] "Dataloader"
- [ ] Query engine logging
- [x] Distinct
- [ ] Tracing
- [ ] `find` vs `findUnique` vs `get` ...
- [ ] Terminology: link vs connect (https://github.com/prisma/photonjs/issues/227 and https://github.com/prisma/specs/issues/140#issuecomment-530821669)
- [ ] Cascading deletes
- [ ] Force indexes
- [ ] `Photon` constructor API
- [ ] Generator/binary versioning
- [ ] Options argument
- [ ] Exec
- [ ] Rename `where` to Criteria (filter/unique criteria)
- [ ] Connection handling/config
- [ ] Composite models: field grouping for efficient look ups

### Ugly parts

- [x] Select/Include API: Chainable `.select()` vs nested `{ select: { } }` API
- [x] Upsert, findOrCreate, ...
- [ ] Line between main arg vs options arg

### Related

- [ ] OCC needs triggers

### Future topics

- [ ] Non-CRUD API operations
- [ ] Silent mutations [prisma/prisma#4075](https://github.com/prisma/prisma/issues/4075)
- [ ] Real-time API (subscriptions/live queries)
- [ ] Dependent batch writes (see GraphQL export directive https://github.com/graphql/graphql-js/issues/462)
- [ ] Usage in browser (depends on WASM)
- [ ] Photon usage with Prisma server/cluster
- [ ] Meta responses
  - [ ] How to query records that were "touched" during nested writes
  - [ ] (Nested) page info
- [ ] Union queries
