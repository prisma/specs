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
  bestFriend   User      @relation("bestFriend") @unique
  bestFriendOf User      @relation("bestFriend")
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
// Find single node by @id field
const alice: User = await photon.users.find('user-id')

// Find single node by other unique field
const alice: User = await photon.users.find({ email: 'alice@prisma.io' })

// Find using composite/multi-field unique indexes
const john: User = await photon.users.find({
  name: { firstName: 'John', lastName: 'Doe' },
})

// Find using unique relation
const bob: User = await photon.users.find({
  bestFriend: { email: 'alice@prisma.io' },
})

// Get many nodes
const allUsers: User[] = await photon.users.findMany({ first: 100 })
const allUsersShortcut: User[] = await photon.users.findMany({ first: 100 })

// Ordering
const usersByEmail = await photon.users.findMany({ orderBy: { email: 'ASC' } })
const usersByEmailAndName = await photon.users.findMany({
  orderBy: [{ email: 'ASC' }, { name: 'DESC' }],
})
const usersByProfile = await photon.users.findMany({
  orderBy: { profile: { imageSize: 'ASC' } },
})

// Where / filtering
await photon.users.findMany({ where: { email: { contains: '@gmail.com' } } })
await photon.users.findMany({
  where: { email: { containsInsensitive: '@gmail.com' } },
})
await photon.users.findMany({})

// Exists
const userFound: boolean = await photon.users.find('bobs-id').exists()
const foundAtLeastOneUser: boolean = await photon.users
  .findMany({ email: { containsInsensitive: '@gmail.com' } })
  .exists()
```

## Writing Data

```ts
const newUser: User = await photon.users.create({ firstName: 'Alice' })

const updatedUser: User = await photon.users
  .find('bobs-id')
  .update({ firstName: 'Alice' })

const updatedUserByEmail: User = await photon.users
  .find({ email: 'bob@prisma.io' })
  .update({ firstName: 'Alice' })

const upsertedUser: User = await photon.users.find('bobs-id').upsert({
  update: { firstName: 'Alice' },
  create: { id: 'my-custom-id', firstName: 'Alice' },
})

// Delete operation doesn't return any data
const result: undefined = await photon.users.find('bobs-id').delete()

// Nested writes
const updatedUser: User = await photon.users.find('bobs-id').update({
  posts: {
    create: { title: 'New post', body: 'Hello world', published: true },
  },
})
```

## Select / Include API

```ts
// Select API
type DynamicResult1 = {
  posts: { comments: Comment[] }[]
  friends: User[]
}[]

const userWithPostsAndFriends: DynamicResult1 = await photon.users
  .find('bobs-id')
  .select({
    posts: { select: { comments: true } },
    friends: true,
  })

type DynamicResult2 = (User & {
  posts: (Post & { comments: Comment[] })[]
  friends: User[]
})[]

const userWithPostsAndFriends: DynamicResult2 = await photon.users
  .find('bobs-id')
  .include({
    posts: { include: { comments: true } },
    friends: true,
  })

// Omit return data if not needed
const result: undefined = await photon.posts
  .findMany({ where: { published: true } })
  .updateMany({ comments: { connect: 'comment-id' } })
  .select(false)
```

## Fluent API

- TODO: Spec out different between chainable vs terminating
  - Chainable: schema-based fields (e.g. relations), find, update, upsert, create,
  - Terminating: select, include, delete, count, scalar field, exists

```ts
const bobsPosts: Post[] = await photon.users
  .find('bobs-id')
  .posts({ first: 50 })

type DynamicResult3 = (Post & { comments: Comment[] })[]

const bobsPosts: DynamicResult3 = await photon.users
  .find('bobs-id')
  .posts({ first: 50 })
  .include({ comments: true })

const updatedPosts: Post[] = await photon.posts
  .find('id')
  .comments({ where: { text: { startsWith: 'Hello' } } })
  .media({ where: { url: 'exact-url' }, first: 100 })
  .updateMany({ uploaded: true })

// Supports chaining multiple write operations
// TODO: Is this a transaction? -> probably
const updatedPosts2: Post[] = await photon.users
  .find('user-id')
  .update({ email: 'new@email.com' })
  .posts({ where: { published: true } })
  .updateMany({ comments: { connect: 'comment-id' } })
```

<!--
## TODO: `withPageInfo`

```ts
// PageInfo
const bobsPostsWithPageInfo: PageInfo<Post> = await photon.users
  .find('bobs-id')
  .posts({ first: 50 })
  .withPageInfo()

type PageInfo<Data> = {
  data: Data[]
  hasNext: boolean
  hasPrev: boolean
}
```

- Can be applied to every paginable list and stream

## Aggregations

```ts
type DynamicResult2 = (User & { aggregate: { age: { avg: number } } })[]
const dynamicResult2: DynamicResult2 = await photon.users.findMany({
  select: { aggregate: { age: { avg: true } } },
})

type DynamicResult3 = User & {
  posts: (Post & { aggregate: { count: number } })[]
}
const dynamicResult3: DynamicResult3 = await photon.users.find({
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
await photon.posts.find('id').update({
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
await photon.users.findMany({
  where: { email: { contains: '@gmail.com' } },
  orderBy: {
    raw: 'age + postsViewCount DESC',
  },
})

const someEmail = 'bob@prisma.io'
await photon.users.findMany({
  orderBy: {
    raw: 'age + postsViewCount DESC',
  },
  where: {
    raw: ['email = $1', someEmail],
  },
})

// Raw: Knex & Prisma
const userWithPostsAndFriends1 = await photon.users.find({
  where: knex.whereBuilderInSelecet(
    knex.fields.User.name,
    knex.queryMany.Post({ title: 'Alice' }, kx.fields.Post.title),
  ),
  select: knex.select('*').from('User'),
})

// Raw: SQL & Prisma
const userWithPostsAndFriends2 = await photon.users.find({
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

## `$exec`

```ts
const usersQueryWithTimeout = await photon.users.$exec({ timeout: 1000 })
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

## Pagination / Streaming

```ts
for await (const post of photon.posts().$stream()) {
  console.log(post)
}

const postStreamWithPageInfo = await prisma
  .posts()
  .$stream()
  .$withPageInfo()

for await (const posts of photon.users
  .find('bobs-id')
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

photon.users.findMany({
  where: {
    id: ['id1', 'id2'], // instead of `_in` or `OR`
    email: { endsWith: '@gmail.com' },
  },
})

photon.users.findMany({
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

- [ ] find by unique relation
- [ ] Connection management when used with embedded query engine
- [ ] Force indexes
- [ ] Rethink raw API fallbacks
- [ ] How to query records that were "touched" during nested writes

## Ugly parts

- Select/Include API: Chainable `.select()` vs nested `{ select: { } }` API

# Future topics

- [ ] Non-CRUD API operations
- [ ] Real-time API (subscriptions/live queries)
- [ ] Operation Expressions
  - [ ] API for atomic operations
  - [ ] Update(many) API to use existing values
- [ ] Silent mutations [prisma/prisma#4075](https://github.com/prisma/prisma/issues/4075)
