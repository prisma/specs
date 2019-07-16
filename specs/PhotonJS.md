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
}

type Profile = {
  imageUrl: string
  imageSize: number
}
```

## Basic Queries

```ts
// Find single record by @id field
const alice: User = await photon.user('user-id')

// Find single record by other unique field
const alice: User = await photon.user({ email: 'alice@prisma.io' })

// Find using composite/multi-field unique indexes
// Note: This example is not compatible with the example schema above.
const john: User = await photon.user({
  name: { firstName: 'John', lastName: 'Doe' },
})

// Find using unique relation
const bob: User = await photon.user({
  bestFriend: { email: 'alice@prisma.io' },
})

// Get many nodes
const allUsers: User[] = await photon.users()
const first100Users: User[] = await photon.users({ first: 100 })

// Ordering
const usersByEmail = await photon.users({ orderBy: { email: 'ASC' } })
const usersByEmailAndName = await photon.users({
  orderBy: [{ email: 'ASC' }, { name: 'DESC' }],
})
const usersByProfile = await photon.users({
  orderBy: { profile: { imageSize: 'ASC' } },
})

// Where / filtering
await photon.users({ where: { email: { contains: '@gmail.com' } } })
await photon.users({
  where: { email: { containsInsensitive: '@gmail.com' } },
})

// Exists
const userFound: boolean = await photon.user('bobs-id').exists()
const foundAtLeastOneUser: boolean = await photon
  .users({ email: { containsInsensitive: '@gmail.com' } })
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
  - `upsert`
  - `delete`
- Collection of records
  - `updateMany`
  - `deleteMany`
  - `replaceMany`

```ts
const newUser: User = await photon
  .userCreate({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })
  .load()

const updatedUser: User = await photon
  .user('bobs-id')
  .update({ firstName: 'Alice' })
  .load()

const updatedUserByEmail: User = await photon
  .user({ email: 'bob@prisma.io' })
  .update({ firstName: 'Alice' })
  .load()

// Like `update` but replaces entire record. Requires all required fields like `create`.
// Resets all connections.
const replacedUserByEmail: User = await photon
  .user({ email: 'bob@prisma.io' })
  .replace({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })
  .load()

const maybeNewUser: User = await photon
  .user('alice-id')
  .orCreate({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })
  .load()

const upsertedUser: User = await photon
  .user('alice-id')
  .update({ firstName: 'Alice' })
  .orCreate({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@prisma.io',
    profile: { imageUrl: 'http://...', imageSize: 100 },
  })
  .load()

const upreplacedUser: User = await photon
  .user('alice-id')
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

// Delete operation doesn't support `.load()`
const result: undefined = await photon.user('bobs-id').delete()
```

### Nested writes

- how many records were affected
-

```ts
// Nested create
await photon.userCreate({
  firstName: 'Alice',
  posts: {
    create: { title: 'New post', body: 'Hello world', published: true },
  },
})

// TODO: How to return data from nested writes
// xxx
// await photon.users
//   .create({
//     firstName: 'Alice',
//     posts: {
//       create: { title: 'New post', body: 'Hello world', published: true },
//     },
//   })
//   .load({ select: { posts: { newOnly: true } } })

// Nested write with connect
await photon.userCreate({
  firstName: 'Alice',
  lastName: 'Doe',
  email: 'alice@prisma.io',
  profile: { imageUrl: 'http://...', imageSize: 100 },
  posts: { connect: 'post-id' },
})

// How to get newly created posts?
await photon.user('bobs-id').update({
  posts: {
    create: { title: 'New post', body: 'Hello world', published: true },
  },
})

// await photon.users
//   .find('bobs-id')
//   .posts()
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

const userWithPostsAndFriends: DynamicResult1 = await photon
  .user('bobs-id')
  .load({ select: { posts: { select: { comments: true } }, friends: true } })

type DynamicResult2 = (User & {
  posts: (Post & { comments: Comment[] })[]
  friends: User[]
})[]

const userWithPostsAndFriends: DynamicResult2 = await photon
  .user('bobs-id')
  .load({ include: { posts: { include: { comments: true } }, friends: true } })

await photon
  .posts({ where: { published: true } })
  .updateMany({ comments: { connect: 'comment-id' } })
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
const bobsPosts: Post[] = await photon.user('bobs-id').posts({ first: 50 })

// Nested arrays are flat-mapped
const comments: Comment[] = await.photon
  .user('bobs-id')
  .posts()
  .comments()

type DynamicResult3 = (Post & { comments: Comment[] })[]

const bobsPosts: DynamicResult3 = await photon
  .user('bobs-id')
  .posts({ first: 50 })
  .load({ include: { comments: true } })

const updatedPosts: Post[] = await photon
  .post('id')
  .comments({ where: { text: { startsWith: 'Hello' } } })
  .media({ where: { url: 'exact-url' }, first: 100 })
  .updateMany({ uploaded: true })
  .load()

// Supports chaining multiple write operations
const updatedPosts2: Post[] = await photon
  .user('user-id')
  .update({ email: 'new@email.com' })
  .posts({ where: { published: true } })
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
await photon.user('bob-id').update({
  email: 'new@email.com',
  posts: {
    updateMany: {
      where: { published: true },
      data: { comments: { connect: 'comment-id' } },
    },
  },
})

// Fluent
await photon
  .user('user-id')
  .update({ email: 'new@email.com' })
  .posts({ where: { published: true } })
  .updateMany({ comments: { connect: 'comment-id' } })

// await photon.users
//   .find('user-id')
//   .update({ email: 'new@email.com' })
//   .posts({ where: { published: true } })
//   .comments()
//   .connect('comment-id')
```

## TODO: `withPageInfo`

```ts
// PageInfo
const bobsPostsWithPageInfo: PageInfo<Post> = await photon
  .user('bobs-id')
  .posts({ first: 50 })
  .loadWithPageInfo()

type PageInfo<Data> = {
  data: Data[]
  hasNext: boolean
  hasPrev: boolean
}

const [bobsPosts, meta]: [Post[], Meta] = await photon
  .user('bobs-id')
  .posts({ first: 50 })
  .loadWithMeta({ pageInfo: true })
```

- Meta
  - pageinfo
  - traces/performance
- Strategies

  - By extending load API + return object
  - Return extra meta object

- Can be applied to every paginable list and stream

<!--
## Operation/Query optimization

## Aggregations

- distinct
- related: select, sort, filtering, groupBy, ...
- big question: completely separate feature or integrated?
  - if separate: enable simple things in query API

```ts
type DynamicResult2 = (User & { aggregate: { age: { avg: number } } })[]
const dynamicResult2: DynamicResult2 = await photon.users({
  select: { aggregate: { age: { avg: true } } },
})

type DynamicResult3 = User & {
  posts: (Post & { aggregate: { count: number } })[]
}
const dynamicResult3: DynamicResult3 = await photon.user({
  where: 'bobs-id',
  select: { posts: { select: { aggregate: { count: true } } } },
})

const deletedCount: number = await photon.users.deleteMany()
```

## Implicit back relations

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

## Optimistic Concurrency Control / Optimistic Offline Lock

```ts
const updatedUserOCC: User = await photon.users.update({
  where: 'bobs-id',
  if: { version: 12 },
  data: { firstName: 'Alice' },
})

const upsertedUserOCC: User = await photon.users.upsert({
  where: 'bobs-id',
  if: { version: 12 },
  update: { firstName: 'Alice' },
  create: { id: '...', firstName: 'Alice' },
})

const deletedUserOCC: User = await photon.users.delete({
  if: { version: 12 },
  where: 'bobs-id',
})

// Ensure that user with name Bob has been created successfully
// If not, roll back the first step
await photon.batch([
  photon.createUser({ name: 'Bob' }),
  {
    checkCurrent: [
      {
        User: {
          name: 'Bob',
        },
      },
    ],
  },
])
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
const groupByResult: DynamicResult4 = await photon.users.groupBy({
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
const groupByResult2: DynamicResult5 = await photon.users.groupBy({
  raw: { key: 'firstName || lastName', having: 'AVG(age) > 50' },
  select: {
    records: { $first: 100 },
    aggregate: { age: { avg: true } },
  },
})
```

## `raw` fallbacks

```ts
await photon.users({
  where: { email: { contains: '@gmail.com' } },
  orderBy: {
    raw: 'age + postsViewCount DESC',
  },
})

const someEmail = 'bob@prisma.io'
await photon.users({
  orderBy: {
    raw: 'age + postsViewCount DESC',
  },
  where: {
    raw: ['email = $1', someEmail],
  },
})

// Raw: Knex & Prisma
const userWithPostsAndFriends1 = await photon.user({
  where: knex.whereBuilderInSelecet(
    knex.fields.User.name,
    knex.queryMany.Post({ title: 'Alice' }, kx.fields.Post.title),
  ),
  select: knex.select('*').from('User'),
})

// Raw: SQL & Prisma
const userWithPostsAndFriends2 = await photon.user({
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

## Batching

```ts
// Batching, don't get the results with $noData
const m1 = photon.users.create({ firstName: 'Alice' }).select(false)
const m2 = photon.posts.create({ title: 'Hello world' }).select(false)
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

- request
  - timeout
- response
  - performance (via debug)

## Pagination / Streaming

```ts
for await (const post of photon.posts().$stream()) {
  console.log(post)
}

const postStreamWithPageInfo = await prisma
  .posts()
  .$stream()
  .$withPageInfo()

for await (const posts of photon.user('bobs-id')
  .posts({ first: 50 })
  .batch({ batchSize: 100 })) {
  console.log(posts) // 100 posts
}

// Configure streaming chunkSize and fetchThreshold
photon
  .posts({ first: 10000 })
  .$stream({ chunkSize: 100, fetchThreshold: 0.5 /*, tailable: true*/ })

// Buffering
const posts = await prisma
  .posts({ first: 100000 })
  .$stream()
  .toArray()

// Shortcut for count
const userCount = await photon.users.count({
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

### Events (non-blocking)

```ts
const photon = new Photon()
photon.on('User:beforeCreate', user => {
  stripe.createUser(user)
})
```

## Error Handling

If any error should occur, Prisma client will throw. The resulting error instance will have a `.code` property.
You can find the possible error codes that we have in Prisma 1 [here](https://github.com/prisma/prisma/blob/master/server/connectors/api-connector/src/main/scala/com/prisma/api/schema/Errors.scala)

### Where

```ts
photon.users.deleteMany('id')
photon.users.deleteMany(['id1', 'id2'])

photon.users({
  where: {
    id: ['id1', 'id2'], // instead of `_in` or `OR`
    email: { endsWith: '@gmail.com' },
  },
})

photon.users({
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

- [ ] Force indexes
- [ ] `Photon` constructor API
- [ ] Options argument
- [ ] Exec
- [ ] Rename `where` to Criteria (filter/unique criteria)
- [ ] Streaming
- [ ] Fluent API: Null behavior https://github.com/prisma/photonjs/issues/89#issuecomment-508509486
  - [ ] Should we have `photon.user('bob').
- [ ] Connection handling

## Ugly parts

- [x] Select/Include API: Chainable `.select()` vs nested `{ select: { } }` API
- [x] Upsert, findOrCreate, ...
- [ ] Line between main arg vs options arg

# Future topics

- [ ] Non-CRUD API operations
- [ ] Silent mutations [prisma/prisma#4075](https://github.com/prisma/prisma/issues/4075)
