# Detailed design

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
  author User
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

## Basic Queries

```ts
// Find single record by @id field
const alice: User = await photon.user.find('user-id')

// Find single record by other unique field
const alice: User = await photon.user.find({ email: 'alice@prisma.io' })

// Find using composite/multi-field unique indexes
// Note: This example is not compatible with the example schema above.
const john: User = await photon.user.find({
  name: { firstName: 'John', lastName: 'Doe' },
})

// Find using unique relation
const bob: User = await photon.user.find({
  bestFriend: { email: 'alice@prisma.io' },
})

// Get many nodes
const allUsers: User[] = await photon.user.findMany()
const first100Users: User[] = await photon.user.findMany({ first: 100 })

// Ordering
const usersByEmail = await photon.user.findMany({ orderBy: { email: 'ASC' } })
const usersByEmailAndName = await photon.user.findMany({
  orderBy: { email: 'ASC', name: 'DESC' },
})
const usersByProfile = await photon.user.findMany({
  orderBy: { profile: { imageSize: 'ASC' } },
})

// Where / filtering
await photon.user.findMany({ where: { email: { contains: '@gmail.com' } } })
await photon.user.findMany({
  where: { email: { containsInsensitive: '@gmail.com' } },
})

// Exists
const userFound: boolean = await photon.user.find('bobs-id').exists()
const foundAtLeastOneUser: boolean = await photon.user
  .findMany({ email: { containsInsensitive: '@gmail.com' } })
  .exists()
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
| `updateMany`          | Yes            | No                 |
| `replace`             | Yes            | No                 |
| `replaceMany`         | Yes            | No                 |
| `delete`              | Yes            | Yes                |
| `deleteMany`          | Yes            | Yes                |

#### Fluent Write API

- Single record
  - `create`
  - `orCreate`
  - `update`
  - `replace`
  - `delete`
- Collection of records
  - `updateMany`
  - `deleteMany`
  - `replaceMany`

```ts
const newUser: User = await photon.user
  .create({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })
  .load()

const updatedUser: User = await photon.user
  .find('bobs-id')
  .update({ firstName: 'Alice' })
  .load()

const updatedUserByEmail: User = await photon.user
  .find({ email: 'bob@prisma.io' })
  .update({ firstName: 'Alice' })
  .load()

// Like `update` but replaces entire record. Requires all required fields like `create`.
// Resets all connections.
const replacedUserByEmail: User = await photon.user
  .find({ email: 'bob@prisma.io' })
  .replace({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })
  .load()

const maybeNewUser: User = await photon.user
  .find('alice-id')
  .orCreate({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })
  .load()

const upsertedUser: User = await photon.user
  .find('alice-id')
  .update({ firstName: 'Alice' })
  .orCreate({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })
  .load()

const upreplacedUser: User = await photon.user
  .find('alice-id')
  .replace({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })
  .orCreate({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })
  .load()

// Note: Delete operation sends query BEFORE record is deleted
const result: undefined = await photon.user.find('bobs-id').delete()
```

### Nested writes

- how many records were affected
-

```ts
// Nested create
await photon.user.create({
  firstName: 'Alice',
  posts: {
    create: { title: 'New post', body: 'Hello world', published: true },
  },
})

// TODO: How to return data from nested writes
// xxx
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

// How to get newly created posts?
await photon.user.find('bobs-id').update({
  posts: {
    create: { title: 'New post', body: 'Hello world', published: true },
  },
})

// await photon.user
//   .find('bobs-id')
//   .post()
//   .update({
//     create: { title: 'New post', body: 'Hello world', published: true },
//   })
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

## Fluent API

- TODO: Spec out different between chainable vs terminating
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

const updatedPosts: Post[] = await photon.post
  .find('id')
  .comments({ where: { text: { startsWith: 'Hello' } } })
  .media({ where: { url: 'exact-url' }, first: 100 })
  .updateMany({ uploaded: true })
  .load()

// Supports chaining multiple write operations
const updatedPosts2: Post[] = await photon.user
  .find('user-id')
  .update({ email: 'new@email.com' })
  .post({ where: { published: true } })
  .updateMany({ comments: { connect: 'comment-id' } })
  .load()
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
    updateMany: {
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
  .updateMany({ comments: { connect: 'comment-id' } })

// await photon.user
//   .find('user-id')
//   .update({ email: 'new@email.com' })
//   .post({ where: { published: true } })
//   .comments()
//   .connect('comment-id')
```

## Mental model: Graph traversal

## TODO: `withPageInfo`

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
- `updateMany`
- `replaceMany`
- `deleteMany`

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
  .delete({ if: { version: 12 } })
  .if([{ model: 'User', where: 'bobs-id', if: { name: 'Bob' } }])
```

## Distinct

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

## Design decisions

- Choose boolean-based nested object syntax instead of array

## Aggregations

- distinct
  - count each distinct value
- related: select, sort, filtering, groupBy, ...
- big question: completely separate feature or integrated?
  - if separate: enable simple things in query API
- expressions DSL

```ts
type DynamicResult2 = (User & { aggregate: { age: { avg: number } } })[]
const dynamicResult2: DynamicResult2 = await photon.user
  .findMany()
  .load({ select: { aggregate: { age: { avg: true } } } })

type DynamicResult3 = User & {
  posts: (Post & { aggregate: { count: number } })[]
}
const dynamicResult3: DynamicResult3 = await photon.user
  .find('bobs-id')
  .load({ select: { posts: { select: { aggregate: { count: true } } } } })

// ???
const deletedCount: number = await photon.user.deleteMany().count()
```

- total or record level

### Expressions

- raw API
- optionally type-safe response

```ts
const result = myFn<{ sel1: number; sel2: string }>({
  sel1: ``,
  sel2: ``,
  title: true,
})
```

- fluent based shortcuts

```ts
const someAgg: number = await photon.post.findMany().agg<number>(`SUM(*)`)
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
    updateMany: {
      where: { text: { startsWith: '...' } },
      update: {
        media: {
          updateMany: {
            where: { url: 'exact-url' },
            update: { uploaded: true },
          },
        },
      },
    },
  },
})
```

## Group By

```ts
type DynamicResult4 = {
  lastName: string
  records: User[]
  aggregate: { age: { avg: number } }
}
const groupByResult: DynamicResult4 = await photon.user.groupBy({
  key: 'lastName',
  having: { age: { avgGt: 10 } },
  where: { isActive: true },
  first: 100,
  orderBy: { lastName: 'ASC' },
  select: {
    records: { first: 100 },
    aggregate: { age: { avg: true } },
  },
})

type DynamicResult5 = {
  raw: any
  records: User[]
  aggregate: { age: { avg: number } }
}
const groupByResult2: DynamicResult5 = await photon.user.groupBy({
  raw: { key: 'firstName || lastName', having: 'AVG(age) > 50' },
  select: {
    records: { $first: 100 },
    aggregate: { age: { avg: true } },
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

## Constructor

- data sources
- query engine binary
- debug

## Batching

```ts
// Batching, don't get the results with $noData
const m1 = photon.user.create({ firstName: 'Alice' }).select(false)
const m2 = photon.post.create({ title: 'Hello world' }).select(false)
const [u1, p1]: [User, Post] = await photon.batch([m1, m2])

// Batching with "check consistent" or "check current"
const [u2, p2]: [User, Post] = await photon.batch([
  m1,
  {
    checkCurrent: [
      {
        User: {
          id: 'bobs-id',
          name: 'Bob',
        },
      },
    ],
  },
  m2,
])

// Batching with transaction
await photon.batch([m1, m2], { transaction: true })
```

## Options arg

See `options` at https://docs.mongodb.com/manual/reference/method/db.collection.aggregate/#db.collection.aggregate

- request
  - timeout
  - debug / explain
  - transaction boundary
  - geolocation
  - force index / hints
- response
  - performance (via debug/explain)


## Pagination / Streaming

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

If any error should occur, Prisma client will throw. The resulting error instance will have a `.code` property.
You can find the possible error codes that we have in Prisma 1 [here](https://github.com/prisma/prisma/blob/master/server/connectors/api-connector/src/main/scala/com/prisma/api/schema/Errors.scala)

### Where

```ts
photon.user.deleteMany('id')
photon.user.deleteMany(['id1', 'id2'])

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

## Connection management

```ts
const photon = new Photon()
await photon.connect()

await photon.disconnect()
```

- TODO: Will credentials be passed in here?

# Drawbacks

- Name clashes and confusion of schema-based methods vs Photon methods

# Alternatives

- `$nested` API

# Adoption strategy

# How we teach this

-->

# Unresolved questions

- distinct
  - select/include

## Figured out but needs spec

- [ ] Error handling
- [ ] OCC (also for nested operations)
- [ ] Implicit back relations
- [ ] Name clashes / `$` pre-fixing
- [ ] Pluralization
- [ ] Criteria API
- [ ] File layout of generated node package

## Bigger todos

- [ ] Aggregrations
- [ ] Binary copying
- [ ] Group by
- [ ] Rethink raw API fallbacks
- [ ] Jump to definition
- [ ] Meta responses
  - [ ] How to query records that were "touched" during nested writes
- [ ] edge concept in schema
- [ ] Operation Expressions
  - [ ] API for atomic operations
  - [ ] Update(many) API to use existing values
- [ ] Validate API with planned supported data sources
- [ ] Modifiers
- [ ] Batching and Unit of work
- [ ] Photon usage with Prisma server/cluster
- [ ] Union queries
- [ ] Real-time API (subscriptions/live queries)
- [ ] Usage in browser

## Small & self-contained

- [ ] Distinct
- [ ] Force indexes
- [ ] `Photon` constructor API
- [ ] API when using with Prisma server
- [ ] Generator/binary versioning
- [ ] Options argument
- [ ] Exec
- [ ] Rename `where` to Criteria (filter/unique criteria)
- [ ] Streaming
- [ ] Fluent API: Null behavior https://github.com/prisma/photonjs/issues/89#issuecomment-508509486
  - [ ] Should we have `photon.user.find('bob').
- [ ] Connection handling

## Ugly parts

- [x] Select/Include API: Chainable `.select()` vs nested `{ select: { } }` API
- [x] Upsert, findOrCreate, ...
- [ ] Line between main arg vs options arg

## Related

- [ ] OCC needs triggers

## Future topics

- [ ] Non-CRUD API operations
- [ ] Silent mutations [prisma/prisma#4075](https://github.com/prisma/prisma/issues/4075)
