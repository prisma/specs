- Owner: @weakky
- Stakeholders: @schickling
- State: 
  - Implementation: Future 👽

# Prisma Schema SDK

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Motivation](#motivation)
- [Schema rendering](#schema-rendering)
- [Use cases](#use-cases)
- [Benefits](#benefits)
- [Cons](#cons)
- [API Proposals](#api-proposals)
  - [1. Nexus-style (attributes as objects)](#1-nexus-style-attributes-as-objects)
  - [1.1 Nexus style (attributes as functions)](#11-nexus-style-attributes-as-functions)
  - [1.2 Advances use-cases](#12-advances-use-cases)
  - [2.1 Fluent style (.field function + attribute as objects)](#21-fluent-style-field-function--attribute-as-objects)
  - [2.2 Fluent style (function name as type + attribute as object)](#22-fluent-style-function-name-as-type--attribute-as-object)
  - [2.3 Fluent style (function name as type + attributes as functions)](#23-fluent-style-function-name-as-type--attributes-as-functions)
  - [2.4 Advanced use-cases](#24-advanced-use-cases)
- [Type-safety](#type-safety)
- [Notes](#notes)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

The Prisma Schema SDK is a library meant to programatically construct a Prisma Schema.

This is an alternative to the Prisma Schema Language (PSL).

## Motivation

**This is not an attempt to replace the Prisma Schema Language (PSL).** We think both are not mutually exclusive.

Prisma has managed to gather a community because of its simplicity and care for DX. While we believe the PSL is better for readability & simplicity, we also see benefits for programmatically defining a Prisma Schema.

## Schema rendering

The Prisma Schema SDK should generate an intermediate data-structure, which should then be used to render a Prisma Schema.

That intermediate data-structure should probably be the same used by the introspection component.

## Use cases

- Dev who wants to programatically defined their Prisma Schema
- Higher-level framework
- Automation
  - build a Prisma Schema from an external source (eg: Custom introspection)

## Benefits

- No need to learn an external DSL (PSL)
- Better expressiveness (JS/TS as source of expression)
- Domain constraints can shared between data layer and app layer
- Type-safety
- Better env var support for configuration

## Cons

- Less readable
- More verbose
- TS definitions would have to be generated at runtime to provide type-safety

## API Proposals

> ⚠️ **This might be out of date with the Prisma Schema Language. We'll sync it as we evolve the PSL.**

Below examples tries to represent the following Prisma Schema (except the advanced use cases)

```groovy
model User {
  id         Int       @id
  email      String    @unique
  posts      Post[]    @map("articles") @relation("UserPosts")
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@map("Customers")
}

model Post {
  id          Int        @id
  title       String
  draft       Boolean
  categories  String[]
  slug        String
  author      User
  comments    Comment[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@unique([ title, slug ])
}
```

### 1. Nexus-style (attributes as objects)

```ts
import { model, datasource, generator, render, Defaults } from '@prisma/schema-sdk'

// Config
const sqliteDatasource = datasource('db', {
  provider: 'sqlite',
  enabled: true,
  url: 'sqlite://'
})

const photonGenerator = generator('photon', {
  provider: 'photonjs',
  output: 'node_modules/@generated/photon'
})

// Attributes as objects

const User = model({
  name: 'User',
  mapsTo: 'Customers',
  definition(t) {
    t.int('id', { primary: true })
    t.string('email', { unique: true })
    t.list.field('posts', {
      type: Post,
      mapsTo: 'articles',
      relation: 'UserPosts'
    })
    t.dateTime('createdAt', {
      default: Defaults.now
    })
    t.dateTime('updatedAt', { updatedAt: true })
  }
})

const Post = model({
  name: 'Post',
  definition(t) {
    t.int('id', { primary: true })
    t.string('title')
    t.boolean('draft')
    t.string('slug')
    t.list.string('categories')
    t.field('author', { type: User })
    t.list.field('comments', { type: Comment })
    t.dateTime('createdAt', { default: Defaults.now })
    t.dateTime('updatedAt', { updatedAt: true })

    t.composite('title', 'slug')
  }
})

const prismaSchema = render([User, Post])
```

### 1.1 Nexus style (attributes as functions)

```ts
import { model, datasource, generator, render, Defaults } from '@prisma/schema-sdk'

// Config
const sqliteDatasource = datasource('db', {
  provider: 'sqlite',
  enabled: true,
  url: 'sqlite://'
})

const photonGenerator = generator('photon', {
  provider: 'photonjs',
  output: 'node_modules/@generated/photon'
})

// Attributes as functions

const User = model({
  name: 'User',
  mapsTo: 'Customers',
  definition(t) {
    t.int('id').primary()
    t.string('email').unique()
    t.field('posts', Post)
      .list()
      .mapsTo('articles')
      .relation('UserPosts')
    t.dateTime('createdAt').default(Defaults.now)
    t.dateTime('updatedAt').updatedAt()
  }
})

const Post = model({
  name: 'Post',
  definition(t) {
    t.int('id').primary()
    t.string('title')
    t.boolean('draft')
    t.string('slug')
    t.string('categories').list()
    t.field('author', User)
    t.field('comments', Comment).list()
    t.dateTime('createdAt').default(Defaults.now)
    t.dateTime('updatedAt').updatedAt()

    t.composite('title', 'slug')
  }
})
```

### 1.2 Advances use-cases

```ts
// Using custom types (https://github.com/prisma/specs/tree/master/schema#type-specifications)

/**
  * 
type PGCitext String @pg.Citext
type PGUUID String @pg.UUID

embed Point2D {
  X Int
  Y Int
  @@pg.Point
  @@ms.Point
}

embed Point3D {
  X Int
  Y Int
  Z Int
  @@pg.Point
  @@ms.Point
}

model User {
  id         UUID
  email      Citext
  location1  Point2D
  location2  Point3D
}
  */

const PGUUID = typeAlias({
  name: 'PGUUID',
  fallback: 'String',
  type: 'pg.UUID'
})

const PGCitext = typeAlias({
  name: 'PGUUID',
  fallback: 'String',
  type: 'pg.Citext'
})

const Point2D = embed({
  name: 'Point2D',
  definition(t) {
    t.int('X')
    t.int('Y')

    t.capabilities.pg('Point')
    t.capabilities.ms('Point')
  }
})

const Point3D = embed({
  name: 'Point3D',
  definition(t) {
    t.int('X')
    t.int('Y')
    t.int('Z')

    t.capabilities.pg('Point')
    t.capabilities.ms('Point')
  }
})

const User = model({
  name: 'User',
  definition(t) {
    t.field('id', { type: PGUUID })
    t.field('email', { type: PGCitext })
    t.field('location1', { type: Point2D })
    t.field('location2', { type: Point3D })
  }
})


// Using connector types (https://github.com/prisma/specs/tree/master/schema#type-definitions-provided-by-connectors)

/**
model Customer {
  age      pg.SmallInt
  amount   pg.Money
  name     pg.Varchar(n: 10)
  location pg.Point(y: 5, x: 6)
}
  */

const Customer = model({
  name: 'Customer',
  definition(t) {
    t.pg.SmallInt('age')
    t.pg.SmallMoney('amount')
    t.pg.Varchar('name', { n: 10 })
    t.pg.Point('location', { y: 5, x: 6 })
  }
})

// Other approach

import { PostgresTypes } from '@prisma/sdk'

const Customer = model({
  name: 'Customer',
  definition(t) {
    t.field('age', { type: PostgresTypes.SmallInt })
    t.field('amount', { type: PostgresTypes.SmallMoney })
    t.field('name', { type: PostgresTypes.Varchar, n: 10 })
    t.field('location', { type: PostgresTypes.Point, y: 5, x: 6 })
  }
})
```

### 2.1 Fluent style (.field function + attribute as objects)

```ts
import { schema, Types, Defaults, PostgresTypes } from '@prisma/sdk'

// config
const sqliteDatasource = schema
  .datasource('db', 'sqlite')
  .url('sqlite://')
  .enabled(true)

const photonGenerator = schema.generator('photon', 'photonjs')

// With `field` function + attribute as objects
const User = schema
  .model('User')
  .field('id', { type: Types.Int, primary: true })
  .field('email', { type: Types.string, unique: true })
  .field('posts', {
    type: () => Post,
    list: true,
    mapsTo: 'articles',
    relation: 'UserPosts'
  })
  .field('createdAt', {
    type: Types.DateTime,
    default: Defaults.now
  })
  .field('updatedAt', { type: Types.DateTime, updatedAt: true })

const Post = schema
  .model('Post')
  .field('id', { type: Types.Int, primary: true })
  .field('title', { type: Types.String })
  .field('draft', { type: Types.Boolean })
  .field('categories', { type: Types.String, list: true })
  .field('slug', { type: Types.String })
  .field('author', { type: () => User })
  .field('comments', { type: () => Comment, list: true })
  .field('createdAt', { type: Types.DateTime, default: Defaults.now })
  .field('updatedAt', { type: Types.DateTime, updatedAt: true })
  .composite('title', 'slug')

const prismaSchema = schema.render([User, Post])
```

### 2.2 Fluent style (function name as type + attribute as object)

```ts
import { schema, Types, Defaults, PostgresTypes } from '@prisma/sdk'

// config
const sqliteDatasource = schema
  .datasource('db', 'sqlite')
  .url('sqlite://')
  .enabled(true)

const photonGenerator = schema.generator('photon', 'photonjs')

// With function name as type + attribute as object
const User = schema
  .model('User', 'Customers')
  .int('id', { primary: true })
  .string('email', { unique: true })
  .field('posts', {
    type: () => Post,
    list: true,
    mapsTo: 'articles',
    relation: 'UserPosts'
  })
  .dateTime('createdAt', {
    default: Defaults.now
  })
  .dateTime('updatedAt', { updatedAt: true })

const Post = schema
  .model('Post', 'Customers')
  .int('id', { primary: true })
  .string('title')
  .boolean('draft')
  .string('categories', { list: true })
  .string('slug')
  .field('author', { type: () => User })
  .field('comments', { type: () => Comment, list: true })
  .dateTime('createdAt', { default: Defaults.now })
  .dateTile('updatedAt', { updatedAt: true })
  .composite('title', 'slug')

const prismaSchema = schema.render([User, Post])
```

### 2.3 Fluent style (function name as type + attributes as functions)

⚠️ **Problem: prettier formatting breaks the chaining readability**

```ts
import { schema, Types, Defaults, PostgresTypes } from '@prisma/sdk'

// config
const sqliteDatasource = schema
  .datasource('db', 'sqlite')
  .url('sqlite://')
  .enabled(true)

const photonGenerator = schema.generator('photon', 'photonjs')

// With function name as type + attributes as functions

// /!\ (problem: prettier formatting breaks the chaining readability :()
const User = schema
  .model('User', 'Customers')
  .int('id').primary()
  .string('email').unique()
  .field('posts', () => Post)
    .list()
    .mapsTo('articles')
    .relation('UserPosts')
  .dateTime('createdAt')
  .default(Defaults.now)
  .dateTime('updatedAt')
  .updatedAt()

const Post = schema
  .model('Post')
  .int('id').primary()
  .string('title')
  .boolean('draft')
  .string('categories').list()
  .string('slug')
  .field('author', () => User)
  .field('comments', () => Comment).list()
  .dateTime('createdAt').default(Defaults.now)
  .dateTime('updatedAt').updatedAt()
  .composite('title', 'slug')

const prismaSchema = schema.render([User, Post])
```

### 2.4 Advanced use-cases

```ts
// Using custom types (https://github.com/prisma/specs/tree/master/schema#type-specifications)

/**
type PGCitext String @pg.Citext
type PGUUID String @pg.UUID

embed Point2D {
  X Int
  Y Int
  @@pg.Point
  @@ms.Point
}

embed Point3D {
  X Int
  Y Int
  Z Int
  @@pg.Point
  @@ms.Point
}

model User {
  id         UUID
  email      Citext
  location1  Point2D
  location2  Point3D
}
*/

const PGUUID = schema.typeAlias('PGUUID', {
  fallback: 'String',
  type: PostgresTypes.UUID
})
const PGCitext = schema.typeAlias('PGCitext', {
  fallback: 'String',
  type: PostgresTypes.Citext
})

const Point2D = schema
  .embed('Point2D')
  .int('X')
  .int('Y')
  .capabilities.pg('Point')
  .capabilities.ms('Point')

const Point3D = schema
  .embed('Point3D')
  .int('X')
  .int('Y')
  .int('Z')
  .capabilities.pg('Point')
  .capabilities.ms('Point')

const User = schema
  .model('User')
  .field('id', { type: () => PGUUID })
  .field('email', { type: () => PGCitext })
  .field('location1', { type: () => Point2D })
  .field('location2', { type: () => Point3D })

// Using connector types (https://github.com/prisma/specs/tree/master/schema#type-definitions-provided-by-connectors)

/**
model Customer {
  age      pg.SmallInt
  amount   pg.Money
  name     pg.Varchar(n: 10)
  location pg.Point(y: 5, x: 6)
}
  */

const Customer = schema
  .model('Customer')
  .field('age', { type: PostgresTypes.SmallInt })
  .field('amount', { type: PostgresTypes.SmallMoney })
  .field('name', { type: PostgresTypes.Varchar, n: 10 })
  .field('location', { type: PostgresTypes.Point, y: 5, x: 6 })
```

## Type-safety

**Type generation at runtime**

The code-first API could benefit from built-in type-safety by generating type definitions at runtime (like `nexus` does). We could handle a variety of errors at compile-time, such as forcing named-relations in case of ambiguities.

**Caveats:**

- We'd face similar issues as nexus: Runtime type generation isn't intuitive
- VSCode issues randomly not capturing refreshed types
- The need for another `ts-node-dev` process to specifically watch the model definitions files

**Static type**

It doesn't seem possible to come even close to the level of type-safety we can achieve with type generation.

## Notes

- Questionable naming:
  - `mapsTo`
  - `t.composite