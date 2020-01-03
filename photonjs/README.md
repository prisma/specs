# Photon.js

- Owner: @sorenbs
- Stakeholders: @timsuchanek @schickling
- State:
  - Spec: Unknown ❔
  - Implementation: Unknown ❔

This spec describes the Photon Javascript API

> Note: the spec is currently being re-written. While this is ongoing, you can find an archive of old thoughts and notes in the `archive` folder. This folder will be deleted when this spec rewrite is complete.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


  - [Prisma Schema](#prisma-schema)
  - [Types](#types)
  - [Terminology](#terminology)
  - [Constructor](#constructor)
  - [Logging & Debugging](#logging--debugging)
    - [Logging](#logging)
    - [Debugging](#debugging)
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
  - [Constructor](#constructor-1)
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



# Background

Prisma Query Engine performs efficient data retrieval from various datasources. A generated Photon Client provides an ergonomic interface for developers working with Prisma. This spec describes the leftmost arrow in the diagram below labelled "Query".

![image-20191211103451703](./photon-generator-overview.png)

Prisma is designed to decouple the data retrieval work done by Prisma Query engine from the interface exposed to developers through the generated Photon Client. This enables us to optimise Photon Client API for every language we target. It is a goal to be as language-idiomatic as possible.

### Goals for the PhotonJS API

- Provide an API that is intuitive for JavaScript developers
- Take advantage of TypeScript to provide the best possible typesafe API

# Client Layout

 The client is generated from a Prisma Schema. When imported, it already contain any required configuration:

```typescript
import { Photon } from '@prisma/photon'
const photon = new Photon()
```

The client has two methods for connection handling:

```typescript
photon.connect(): Promise<void>
photon.disconnect(): Promise<void>
```

The only other fields present on the top-level photon client object is a field for each of your models. If you have two models named `Post` and `User` in your Prisma Schema, the photon object could look like this:

```typescript
{
  connect(): Promise<void>,
	disconnect(): Promise<void>,
  post: PostDelegate,
  user: UserDelegate
}
```

### A note on Promises

Any method that performs IO will return a promise. Or to be more precise, a promise-like object. They work like promises, but have extra fields and methods to enable the elegant chaining API. The TypeScript definition for such a Promise might look like this:

```typescript
declare class PostClient<T> implements Promise<T>
```

In the following we will ignore this detail, and simply write type declarations like this:

```typescript
Promise<Post>
```

# Reading data

There are two methods related to reading records:

```
photon.post.findOne([args]): Promise<Post>
photon.post.findMany([args]): Promise<Post[]>
```

### Default selection set

By default, Photon returns all scalar fields on a record, and no related records. This behavior can be decided on a per-query basis using the `include` and `select` fields described below.

## Find a single record

Retrieves a single record that can be unambiguously identified by a single unique field or a combination of fields that together are unique. 

```typescript
photon.post.findOne([args]): Promise<Post>
```

args is an object with a single required field `where` and two optional fields `include` and `select`.

Example:

```
const singlePost = await photon.post.findOne({
	where: { id: "post-1" }
	include: { author: true }
})
```

### where

The `where` field is used to specify the fields to look up by. It contains another object with an optional field for each unique field combination:

```
model Post {
	id 		   Int  	@id
	email 	 String @unique
	category String
	title    String
	@@unique([category, title])
}
```

The above schema results in a `where` argument with the following type signature:

```
where: {
	id: number?
	email: string?
	category_title: { category: string, title: string }?
}
```

Only a single field may be used in a query, otherwise the call will error without performing the query.

### include

The `include` field is used to specify relations that should be retrieved together with the record. Related records will contain all scalar fields[LINK!] by default. If the related record also have relations, it is possible to include them as well. There is no limit to how deeply you can include relations. For to-many relations, you can also use the normal `findMany` arguments [LINK!] to filter, paginate etc.

#### Including a to-one relation

```
model Post {
	author User
}

model User {
	posts Post[]
}
```

The above schema results in a `include` argument that can be used as follows:

```
include: {
	author: true
}
```

#### Including multiple relation-hops

```
model Post {
	author User
}

model User {
	posts 	 Post[]
	friends: User[]
}
```

The above schema results in a `include` argument that can be used as follows:

```
include: {
	author: {
		friends: true
	}
}
```

#### Include a to-many relation and use relation arguments

```
model Post {
	comments Comment[]
}

model Comment {
	text String
}
```

The above schema results in a `include` argument that can be used as follows:

```
include: {
	comments: {
		skip: 10,
		first: 10
	}
}
```

### select

The `select` field is used to override the default selection set [LINK!]. When present, only scalar fields and relations explicitly requested are returned:

```
model Post {
  title		 String
	comments Comment[]
}

model Comment {
	text String
}
```

The above schema results in a `select` argument that can be used as follows:

```
select: {
	title: true
	comments: {
		skip: 10,
		first: 10
	}
}
```

Note that `select` and `include` cannot be combined.

## Find multiple records

Retrieves a list of records that match the filter criteria in the `where` field:

```typescript
photon.post.findMany([args]): Promise<Post[]>
```

args is an object with 9 optional fields `where`,`before`, `after`, `first`, `last`, `skip`, `orderBy`,  `select`, `include`.

Example:

```typescript
photon.post.findMany({
	first: 10,
	where: {
		title: {contains: "abba"}
	}
})
```

> return the first 10 posts where the title contains "abba"

`findMany` always returns a list containing 0, 1 or many records.

### where

The `where` field is used to specify the filter to apply when selecting records to return. Unlike `findOne`, the filter can use any field(s), not just unique fields. It contains an optional field for each field on the model:

```
model Post {
	id 		   Int  	@id
	email 	 String @unique
	category String
	title    String
}
```

```
where: {
	id: number | NumberFilter | null
	email: string | StringFilter | null
	category: string | StringFilter | null
	title: string | StringFilter | null
	AND: Enumerable<PostWhereInput> | null
  OR: Enumerable<PostWhereInput> | null
  NOT: Enumerable<PostWhereInput> | null
}
```

#### Exact match and advanced filters

Photon support supplying an exact match filter directly, or using one of the more advanced filters:

```
export declare type StringFilter = {
    equals?: string | null;
    not?: string | StringFilter | null;
    in?: Enumerable<string> | null;
    notIn?: Enumerable<string> | null;
    lt?: string | null;
    lte?: string | null;
    gt?: string | null;
    gte?: string | null;
    contains?: string | null;
    startsWith?: string | null;
    endsWith?: string | null;
};
export declare type DateTimeFilter = {
    equals?: Date | string | null;
    not?: Date | string | DateTimeFilter | null;
    in?: Enumerable<Date | string> | null;
    notIn?: Enumerable<Date | string> | null;
    lt?: Date | string | null;
    lte?: Date | string | null;
    gt?: Date | string | null;
    gte?: Date | string | null;
};
export declare type BooleanFilter = {
    equals?: boolean | null;
    not?: boolean | BooleanFilter | null;
};
export declare type IntFilter = {
    equals?: number | null;
    not?: number | IntFilter | null;
    in?: Enumerable<number> | null;
    notIn?: Enumerable<number> | null;
    lt?: number | null;
    lte?: number | null;
    gt?: number | null;
    gte?: number | null;
};
export declare type FloatFilter = {
    equals?: number | null;
    not?: number | FloatFilter | null;
    in?: Enumerable<number> | null;
    notIn?: Enumerable<number> | null;
    lt?: number | null;
    lte?: number | null;
    gt?: number | null;
    gte?: number | null;
};
```

Exact Match examples:

```typescript
photon.post.findMany({
	where: {
		title: "abba is my favourite group!"
	}
})

photon.post.findMany({
	where: {
		title: "abba is my favourite group!",
    category: "1980 music"
	}
})
```

Advanced Filter examples:

```
photon.post.findMany({
	where: {
		title: { startsWith: "abba" }
	}
})

photon.post.findMany({
	where: {
		title: { not: { contains: "abba" } },
		id: { lt: 47 }
	}
})
```

#### Boolean combinators

Photon supports 3 boolean combinators: `OR`, `NOT`, `AND`, that all take an array of objects with the exact same shape as the `where` argument.

Either the title or id field must match the creiterias:

```
photon.post.findMany({
	where: {
		OR: [
			{ title: { not: { contains: "abba" } } },
			{ id: { lt: 47 }}
    ]
	}
})
```

Neither the title nor id field must match the creiterias:

```
photon.post.findMany({
	where: {
		NOT: [
			{ title: { not: { contains: "abba" } } },
			{ id: { lt: 47 }}
    ]
	}
})
```

Both the title or id field must match the creiterias (above). This is equivalent to the simplified form not using the `AND` combinator (below):

```
photon.post.findMany({
	where: {
		AND: [
			{ title: { not: { contains: "abba" } } },
			{ id: { lt: 47 }}
    ]
	}
})
```

```
photon.post.findMany({
	where: {
		title: { not: { contains: "abba" } },
		id: { lt: 47 }
	}
})
```

#### Syntax inconsistency between findOne and findMany

The syntax for finding a single record that can be uniquely identified by two or more fields using the `findOne` API is different from returning that same record using the `findMany` API. This is due to the implementation complexity of supporting that same API in the `findOne` case:

```
model Post {
	category String
	title    String
	@@id([category, title])
}
```

> Note: `@@id` is not supported yet

```typescript
photon.post.findOne({
	where: {
		category_title: { category: "1980 music", title: "abba is my favourite group!" }
	}
})
```

```typescript
photon.post.findMany({
	where: {
		category: "1980 music",
    title: "abba is my favourite group!"
	}
})
```



### pagination: before, after, first, last, skip

Together, these five fields provide powerful pagination control.

`before` and `after` are cursors that point to a particular record, either using its `@id` field or a nuique field combination.

> Note: only `@id` is supported at the moment

`first` and `last` specify how many records to retrieve, either from the beginning or the end of the list.

`skip` pushes the beginning of the `first` or `last` segment away from the cursor specified by `before` or `after` be the amount specified. This is illustrated with yellow arrows on the illustration below.

<img src="./pagination.png" alt="image-20191229151441215" style="zoom:50%;" />

> Note: There is an [outstanding proposal](https://github.com/prisma/specs/issues/376) to simplify the pagination model by combining the `first` and `last` fields into a single `take` field. 
>
> This proposal is based on two observations: 1) `last` is only really useful in combination with `before` and `first` is only really useful in combination with `after`, as such we are using two variables to describe a single degree of freedom, which is confusing. 2) Even if other combinations are useful, they can be simply achieved by using the regular `where` filters.
>
> If adopted, this proposal will result in a simpler mental model depicted below.

Proposed simpler model:

<img src="./pagination-simplified.png" alt="image-20191229152718492" style="zoom:50%;" />

# Writing data

TODO