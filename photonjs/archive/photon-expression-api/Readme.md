- Start Date: 2017-01-17
- RFC PR: (leave this empty)
- Prisma Issue: (leave this empty)

# Summary

Prisma currently has no support for arbitrary expressions in it's query protocol or at client side.

An Expression language allows users to not only operate on fields, but also on values which are derived from fields (virtual fields).

This allows use-cases like:

- Querying aggregated data
- Filtering by calculated values
- Filtering or Ordering by aggregated data

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Basic example](#basic-example)
- [Motivation](#motivation)
- [Detailed design](#detailed-design)
  - [Capabilities of Expressions](#capabilities-of-expressions)
  - [Limitations of Expressions](#limitations-of-expressions)
  - [Identifiers and Functions](#identifiers-and-functions)
  - [Interoperability with the GraphQL API](#interoperability-with-the-graphql-api)
- [Drawbacks](#drawbacks)
- [Alternatives](#alternatives)
- [Adoption strategy](#adoption-strategy)
  - [Implementation Plan and related DB capabilities](#implementation-plan-and-related-db-capabilities)
- [How we teach this](#how-we-teach-this)
- [Unresolved questions](#unresolved-questions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Basic example

An expression could look similar to this on the client side.

```ts
const nestedResult1 = await prisma.users({
  first: 100,
  // See #1
  select: {
    posts: {
      select: {
        // Extra aggregate field of type T where Lambda type returns Expression<T>
        likeCount: (post: PostExpression) => post.comments.likes.sum(),
      },
    },
    friends: true,
  },
})
```

Alternatives would be other builder patterns, like a util object, or a string containing the expressions.

Please see below for a draft of the changes to the GraphQL API.

# Motivation

Allowing expressions would solve at least certain shortcomings for aggregation, filtering or sorting.

Please note that this does not allow

- Arbitrary aggregations
- Queries on result sets (subqueries)

# Detailed design

## Capabilities of Expressions

Expressions should be valid

- As orderBy arguments
- As where arguments
- As query fields

An expression can return

- A scalar

Expressions can use

- Data in child objects (which forces aggregation, except for 1:n and 1:1 relations)

Please note that the aggregation of child objects is NOT synonymous by arbitrary group by, as only grouping by relation can happen.

## Limitations of Expressions

An Expression can not

- Bind variables from other levels
- Bind to other prisma result sets
- Compose an arbitrary type as result

## Identifiers and Functions

Data identifiers can be chained to navigate through the data graph. For example `user.address.street` identifies the a single field. `user.posts.likes`
identifies a set of integers. A set cannot be returned from an expression, so an aggregation is forced.

Functions supported by expressions include basic arithmetic and logical operators, as well as functions on strings and dates. We need to find a subset of
functions which is supported by all databases we want to support.

## Interoperability with the GraphQL API

The client API can be designed freely, but for transmitting expressions, they need to be serialized as strings.

For doing so, the reverse polish notation (RPN) is used, because it makes it very easy to parse and write expression strings.

Example for above query:

```
user.posts.comments $count 2 $multiply user.posts.comments.likes.sum $add
```

Alternative would be infix notation (with parentheses and unary functions) or a JS-like notation, where the latter one is hard to parse.

**Parsing and execution**

The serialized query is parsed, type checked and executed by the prisma server.

**Future development**

The RPN scheme is a pure parser-specific notation. It is therefore powerful enough to express every expression tree that can also be expressed in infix
notation.

When moving away from GraphQL, a binary representation might be considered.

**GraphQL Schema**

That would be exposed on GraphQL types as a special expressoin field, that can be aliased in the query.

```graphql
type User {
  firstName: string
  lastName: string
  posts: [Post!]!
  expression(expression: string, nestedQuery: "'): JSON
}
```

The expression field would then be used like this in a query

```graphql
allUsers {
   firstName
   lastName
   name: expression(expression: "user.firstName ' ' $concat user.lastName $concat"
}
```

# Drawbacks

- The query language described here is not infinitely powerful. For example: While it is possible to aggregate, it is only possible to aggregate by relations.
- It might be tempting to use expressions too much, which destroys the advantage of indices
- Pseudo Expression languages are hard to implement in some languages (especially languages with a non-generic type system)
- The client API proposal from above is very verbose (as JS does not support operator overloading)

# Alternatives

- Constructs tied to the datamodel: Computed Fields, Stored Procedures or Views. The drawback here is that these things would need to be known at schema
  creation time. In other words those are cumbersome to use.
- Injecting RAW queries which are passed to the database. The drawback here is that it disables type checking and database interoperability.

# Adoption strategy

## Implementation Plan and related DB capabilities

Adding expression support would be an additive feature with the concept mentioned above, ensuring no API breakages.

The features depend on each other. The given order is a suggestion on implementation order.

1. Query expressions which return a scalar and allow fields on the same level e.g. `user.firstName.concat(user.lastName)`

2. Filtering by expressions which return a scalar on the same level

3. Sorting by expressions which return a scalar on the same level

4. Query expressions which return a scalar and allow traversal through child relations for aggregation e.g.

`user.posts.comment.likes.sum`

5. Filtering aggregating expressions

6. Sorting by aggregating expressions

7. Expressions which return an object and allow a query on the resulting type

# How we teach this

Care has to be taken to align this proposal closely with the proposed
[TS client nested api](https://github.com/prisma/rfcs/blob/ts-client-nested-api-rfc/text/0000-ts-client-nested-api.md). Goals were type safety and ease of use,
aligning with prismas goals.

# Unresolved questions

- Which subset of operators should be supported?
- Should expressions be allowed to return objects?
- Should there be a mechanism for querying on the result set of an expression, thus enabling arbitrary aggregation and subqueries?
- Should it be possible to refer to a parent object, thus enabling correlated subqueries?
