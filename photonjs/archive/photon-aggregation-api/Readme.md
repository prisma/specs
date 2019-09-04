<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Summary](#summary)
- [Basic example](#basic-example)
- [Motivation](#motivation)
- [Detailed design](#detailed-design)
  - [Operators](#operators)
  - [Usage](#usage)
    - [Examples](#examples)
- [Drawbacks](#drawbacks)
- [Alternatives](#alternatives)
- [Adoption strategy](#adoption-strategy)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

- Start Date: 2019-01-23
- RFC PR: (leave this empty)
- Prisma Issue: (leave this empty)

# Summary

This RFC proposes a basic aggregation mechanism to prisma.

This RFC depends on [prisma expression language](https://github.com/prisma/rfcs/pull/3).

<!-- toc -->

- [Basic example](#basic-example)
- [Motivation](#motivation)
- [Detailed design](#detailed-design)
  * [Operators](#operators)
  * [Usage](#usage)
    + [Examples](#examples)
- [Drawbacks](#drawbacks)
- [Alternatives](#alternatives)
- [Adoption strategy](#adoption-strategy)

<!-- tocstop -->

# Basic example

A basic aggregation mechanisms would allow applying aggregate functions to single fields:

```typescript
const nestedResult1 = await prisma.users({
  first: 100,
  // See #1
  select: {
    posts: {
      select: {
        likeCount: (post: PostExpression) => post.comments.likes.sum()
      }
    },
    friends: true
  }
});
```

This example shows how an aggregation over an integer value from a child node can be accomplished.

# Motivation

**Why aggregation?**

Because [users](https://www.prisma.io/forum/t/possibilities-with-prisma/5734) [are](https://github.com/prisma/prisma/issues/3801)
[asking](https://github.com/prisma/prisma/issues/1312) [for](https://github.com/prisma/prisma/issues/1279) it.

**Why this basic form of aggregation**?

More complex aggregation (as in SQL or MongoDB) should go hand in hand with operations on result sets (similar to subquery). The reason is that those form of
operations would be needed for elegant group-by support.

These requirements are very hard to fullfil with GraphQL as wire protocol. Surely, it would be possible, but would require many workaround for GraphQL
limitations.

At the other hand, the proposal here would fulfill already many use cases, without introducing significant architectural changes.

# Detailed design

The detailed design relies heavily on [prisma expression language](https://github.com/prisma/rfcs/pull/3).

## Operators

We propose that the following operations are made available on the expression language:

- Average (`avg`)
- Sum (`sum`)
- Count (`count`)
- Distinct Count (`count distinct`)
- Maximum (`max`)
- Minimum (`min`)
- Variance (`var`)

The above operators are available for all relevant relational and document databases.

Optionally, a `random` operator for selecting a random node can be supported.

## Usage

In accordance with the expression language RFC, those operators can be used to

- Request custom scalar fields on any level
- Filter and order a result set

### Examples

Order by an aggregated value:

```typescript
const nestedResult1 = await prisma.posts({
    first: 10,
    // See #1
    orderBy: (post: PostExpression) => post.comments.likes.sum()
    select: {
        posts: { },
        friends: true
    }
})
```

Filter by aggregated value:

```typescript
const nestedResult2 = await prisma.students({
    filter: (student: StudentExpression) => student.exams.grades.avg() > 3.0
    select: {
        firstName: true
        lastName: true
    }
})
```

Nested ordering and filtering:

```typescript
const nestedResult3 = await prisma.directors({
    orderBy: (director) => director.movies.reviews.rating.avg()
    select: {
        movies: {
            orderBy: (movie) => movie.reviews.rating.avg(),
            select: {
                reviews: {
                    filter: (review) => review.text.length() > 100
                    select: { }
                }
            }
        }
    }
})
```

# Drawbacks

This concept is a beginning, but limited. The most important drawback is that only grouping along a single relation is supported. Arbitrary group-by is not
possible.

# Alternatives

Alternatives could be:

- Adding a `groupBy` field
- Adding an explicit `aggregate` field, instead of relying on the custom/computed field mechanism
- Allowing further computations on result sets of queries

# Adoption strategy

The proposal is kept minimal, so it can be added on top of the existing system., including GraphQL as a wire protocol. See the expression language RFC for
details.
