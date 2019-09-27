# Photon.go

- Owner: @matthewmueller
- Stakeholders: -
- State: 
  - Spec: Outdated 🚨
  - Implementation: Future 👽

This spec describes the Photon Go API

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [General Usage](#general-usage)
  - [Prepare photon](#prepare-photon)
    - [Connecting to Prisma Engine](#connecting-to-prisma-engine)
    - [Disconnecting from the Prisma Engine](#disconnecting-from-the-prisma-engine)
- [Query API](#query-api)
  - [Example Model](#example-model)
  - [Basic information](#basic-information)
  - [Generated models](#generated-models)
  - [Basic usage](#basic-usage)
    - [Basic example](#basic-example)
  - [Reading Data](#reading-data)
    - [FindOne](#findone)
      - [Returns all scalar fields of a single User](#returns-all-scalar-fields-of-a-single-user)
      - [Fetch a single post by its id:](#fetch-a-single-post-by-its-id)
      - [Fetch a single user by their email:](#fetch-a-single-user-by-their-email)
    - [FindMany](#findmany)
      - [Find all users](#find-all-users)
      - [Find all comments](#find-all-comments)
      - [Find users that have an A in their names](#find-users-that-have-an-a-in-their-names)
      - [Find users named Ada or Grace](#find-users-named-ada-or-grace)
      - [Fetch comments created before 2019](#fetch-comments-created-before-2019)
      - [Fetch posts that have prisma or graphql in their title](#fetch-posts-that-have-prisma-or-graphql-in-their-title)
      - [Sort comments by their creation date (ascending)](#sort-comments-by-their-creation-date-ascending)
      - [Sort users alphabetically by their names (descending)](#sort-users-alphabetically-by-their-names-descending)
      - [Find the first 3 posts (seeking forward)](#find-the-first-3-posts-seeking-forward)
      - [Find the posts from position 6 to position 10 (seeking forward)](#find-the-posts-from-position-6-to-position-10-seeking-forward)
      - [Find the last 3 posts (seeking backward)](#find-the-last-3-posts-seeking-backward)
      - [Fetch the posts (of 30) from position 21 to position 27 (seeking backward)](#fetch-the-posts-of-30-from-position-21-to-position-27-seeking-backward)
      - [Fetch the first 3 posts after the posts with 3 as it's id](#fetch-the-first-3-posts-after-the-posts-with-3-as-its-id)
      - [Fetch the first 5 posts after the post with 10 as id and skipping 3 posts:](#fetch-the-first-5-posts-after-the-post-with-10-as-id-and-skipping-3-posts)
      - [Fetch the last 5 posts before the post with 10 as id](#fetch-the-last-5-posts-before-the-post-with-10-as-id)
      - [Fetch the last 3 posts before the record with 10 as id and skipping 5 posts](#fetch-the-last-3-posts-before-the-record-with-10-as-id-and-skipping-5-posts)
    - [Fetch by related things](#fetch-by-related-things)
      - [Fetch posts by a certain user that were created after christmas](#fetch-posts-by-a-certain-user-that-were-created-after-christmas)
      - [Find all comments belonging to a post of a user](#find-all-comments-belonging-to-a-post-of-a-user)
  - [Writing Data](#writing-data)
    - [Create](#create)
      - [Create a User](#create-a-user)
      - [Create a new post and set alice@prisma.io as the author](#create-a-new-post-and-set-aliceprismaio-as-the-author)
      - [Create a new user with two new posts](#create-a-new-user-with-two-new-posts)
      - [Create 1 user, a post and connect an existing post](#create-1-user-a-post-and-connect-an-existing-post)
    - [Update](#update)
      - [Update the role of an existing user](#update-the-role-of-an-existing-user)
      - [Update the author of a post](#update-the-author-of-a-post)
    - [UpdateMany](#updatemany)
      - [Update three posts by their IDs](#update-three-posts-by-their-ids)
      - [Update all posts where the title contains the given string](#update-all-posts-where-the-title-contains-the-given-string)
    - [Delete](#delete)
      - [Delete a post by its ID](#delete-a-post-by-its-id)
      - [Delete a user by their email](#delete-a-user-by-their-email)
    - [DeleteMany](#deletemany)
      - [Delete all posts that were created before 2018:](#delete-all-posts-that-were-created-before-2018)
    - [Upsert](#upsert)
      - [Create a user or update their role](#create-a-user-or-update-their-role)
    - [Select multiple things](#select-multiple-things)
      - [Select a user with 10 of their posts](#select-a-user-with-10-of-their-posts)
      - [Advanced selection of various nested relations](#advanced-selection-of-various-nested-relations)
    - [Raw PQL Query](#raw-pql-query)
    - [Raw database query](#raw-database-query)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## General Usage

### Prepare photon

#### Connecting to Prisma Engine

The Prisma constructor is used to create new instances of the Prisma client.

```go
client, err := photon.NewClient()
// wait until prisma engine is connected, otherwise it's lazy loaded
client.Connect()
```

This will launch the Prisma Engine process and connect to it.

You can also start a mock client for testing and debugging without a database setup.

```go
client, err := photon.NewMockClient()
```

#### Disconnecting from the Prisma Engine

After connecting, you can disconnect with the following

```go
err := client.Disconnect()
```

## Query API

This section describes how the most important part of Photon Go, the query API, works.

### Example Model

The API below uses examples based on this data model:

```
model Post {
  id         ID        @id
  createdAt  DateTime  @createdAt
  updatedAt  DateTime  @updatedAt
  title      String
  desc       String?
  published  Boolean   @default(value: false)
  author     User
  comments   Comment[]
}

model User {
  id         ID        @id
  createdAt  DateTime  @createdAt
  updatedAt  DateTime  @updatedAt
  name       String?
  email      String    @unique
  role       Role      @default(value: USER)
  posts      Post[]
  comments   Comment[]
  friends    User[]
}

model Comment {
  id         ID        @id
  createdAt  DateTime  @createdAt
  updatedAt  DateTime  @updatedAt
  text       String
  post       Post
  writtenBy  User
}

enum Role {
  USER
  ADMIN
}
```

### Basic information

This spec assumes the following decisions:

- Fluent API (vs. structs API)
- Null-structs for nullability (vs. using pointers) [photon-go#1](https://github.com/prisma/photongo/issues/1)
- Require passing a context explicitly [photon-go#6](https://github.com/prisma/photongo/issues/6)
- Generate code into a single file [photon-go#3](https://github.com/prisma/photongo/issues/3)

### Generated models

The above data model will generate the following Go models.

```go
type Post struct {
  Id        string     `json:"id"`
  CreatedAt time.Time  `json:"createdAt"`
  UpdatedAt time.Time  `json:"updatedAt"`
  Title     string     `json:"title"`
  Desc      NullString `json:"desc"`
  Published bool       `json:"published"`
  Author    User       `json:"author"`
  Comments  []Comment  `json:"comments"`
}

type User struct {
  Id        string     `json:"id"`
  CreatedAt time.Time  `json:"createdAt"`
  UpdatedAt time.Time  `json:"updatedAt"`
  Name      NullString `json:"name"`
  Email     string     `json:"email"`
  Role      Role       `json:"role"`
  Posts     []Post     `json:"posts"`
  Comments  []Comment  `json:"comments"`
  Friends   []User     `json:"friends"`
}

type Comment struct {
  Id        string    `json:"id"`
  CreatedAt time.Time `json:"createdAt"`
  UpdatedAt time.Time `json:"updatedAt"`
  Text      string    `json:"text"`
  Post      NullPost  `json:"post"`
  WrittenBy NullUser  `json:"writtenBy"`
}

type Role string

const (
  RoleUser  Role = "USER"
  RoleAdmin Role = "ADMIN"
)
```

### Basic usage

#### Basic example

This is an example how you can fetch a node and access its properties.

Related fields, i.e. fields referencing structs, are nil per default if you don't fetch them explicitly.

```go
user, err := client.User.FindOne.Exec(ctx)

log.Printf("name: %s", user.Email)

// Name is an optional field (NullString), which is why we should check if it's valid (i.e. not null)
if user.Name.Valid {
  log.Printf("user has a name: %s", user.Name.Value)
}

// user.Posts == nil because we didn't fetch for a user's posts explicitly
```

### Reading Data

#### FindOne

FindOne returns the first item which matches a given query.

##### Returns all scalar fields of a single User

```go
user, err := client.User.FindOne.Where(
  photon.User.Email.Equals("ada@prisma.io"),
).Exec(ctx)
```

##### Fetch a single post by its id:

```go
user, err := client.User.FindOne.Where(
  photon.User.ID.Equals("ada@prisma.io"),
).Exec(ctx)
```

##### Fetch a single user by their email:

```go
user, err := client.User.FindOne.Where(
  photon.User.Email.Equals("ada@prisma.io"),
).Exec(ctx)
```

#### FindMany

##### Find all users

```go
users, err := client.User.FindMany.Exec(ctx)
```

##### Find all comments

```go
comments, err := client.Comment.FindMany.Exec(ctx)
```

##### Find users that have an A in their names

```go
users, err := client.User.FindMany.Where(photon.User.Name.Contains("A")).Exec(ctx)
```

##### Find users named Ada or Grace

```go
users, err := client.User.FindMany.Where(
  photon.User.Name.In([]string{"Ada", "Grace"}),
).Exec(ctx)
```

##### Fetch comments created before 2019

```go
comments, err := client.Comment.FindMany.Where(post.Comment.CreatedAt.Lt(christmas)).Exec(ctx)
```

##### Fetch posts that have prisma or graphql in their title

```go
posts, err := client.Post.FindMany.Where(photon.Post.Or(
  photon.Post.Title.Contains("prisma"),
  photon.Post.Title.Contains("graphql"),
)).Exec(ctx)
```

##### Sort comments by their creation date (ascending)

```go
comments, err := client.Comment.FindMany.OrderBy(photon.Comment.CreatedAt.ASC).Exec(ctx)
```

##### Sort users alphabetically by their names (descending)

```go
users, err := client.User.FindMany.OrderBy(photon.Comment.Name.DESC).Exec(ctx)
```

##### Find the first 3 posts (seeking forward)

```go
posts, err := client.Post.FindMany.First(3).Exec(ctx)
```

##### Find the posts from position 6 to position 10 (seeking forward)

```go
posts, err := client.Post.FindMany.Skip(6).First(4).Exec(ctx)
```

##### Find the last 3 posts (seeking backward)

```go
posts, err := client.Post.FindMany.Last(3).Exec(ctx)
```

##### Fetch the posts (of 30) from position 21 to position 27 (seeking backward)

```go
posts, err := client.Post.FindMany.Skip(3).Last(7).Exec(ctx)
```

##### Fetch the first 3 posts after the posts with 3 as it's id

```go
posts, err := client.Post.FindMany.Where(
  post.First(3),
  post.After("cjsyqxwqo000j0982da8cvw7o"),
)
```

##### Fetch the first 5 posts after the post with 10 as id and skipping 3 posts:

```go
posts, err := client.Post.FindMany.After("abc").Skip(3).First(5).Exec(ctx)
```

##### Fetch the last 5 posts before the post with 10 as id

```go
posts, err := client.Post.FindMany.Last(5).Before(10).Exec(ctx)
```

##### Fetch the last 3 posts before the record with 10 as id and skipping 5 posts

```go
posts, err := client.Post.FindMany.Last(3).Before(10).Skip(5).Exec(ctx)
```

#### Fetch by related things

##### Fetch posts by a certain user that were created after christmas

```go
posts, err := user.Post.FindMany.Where(
  photon.Post.CreatedAt.Gt(christmas),
  photon.Post.User.Email.Equals(email),
).Exec(ctx)
```

##### Find all comments belonging to a post of a user

```go
comments, err := user.Comment.FindMany.Where(
  photon.Comment.Title.Contains("my title"),
  photon.Post.User.Email.Equals(email),
).Exec(ctx)
```

### Writing Data

The following methods describe how to write data in the database. These are all mutations on
a Prisma level. You can create, update and delete data, which maps to insert, update, and
delete SQL operations respectively.

You can optionally connect other nodes or even create new related nodes.

#### Create

You can create objects which maps to SQL inserts.

##### Create a User

```go
// User.Create has fixed and required arguments for required fields
user, err := client.User.Create(
  photon.User.ID.Set("abc43"),
  photon.User.Email.Set("alice@prisma.io"),
  photon.User.Age.Set(37),
).Exec(ctx)
```

##### Create a new post and set alice@prisma.io as the author

```go
post, err := client.Post.Create(
  photon.User.ID.Set("abc43"),
  photon.User.Title.Set("Prisma"),
).ConnectAuthor(
  photon.User.Email.Equals("alice@prisma.io"),
).Exec(ctx)
```

##### Create a new user with two new posts

```go
user, err := client.User.Create(
  photon.User.Id.Set("abc345"),
  photon.User.Name.Set("John"),
  photon.User.Email.Set("john@example.com"),
  photon.User.Age.Set(50),
).CreatePost(
  photon.Post.ID.Set("a"),
  photon.Post.Title.Set("Follow @prisma on Twitter"),
).CreatePost(
  photon.Post.ID.Set("b"),
  photon.Post.Title.Set("Join us for GraphQL"),
).Exec(ctx)
```

##### Create 1 user, a post and connect an existing post

```go
user, err := client.User.Create(
  photon.User.ID.Set("7d42"),
  photon.User.Email.Set("bob@prisma.io"),
  photon.User.Name.Set("Bob"),
).CreatePost(
  photon.Post.ID.Set("a"),
  photon.Post.Title.Set("Follow @prisma on Twitter"),
).ConnectPost(
  photon.Post.ID.Equals("abc"),
).Exec(ctx)

// an alternative to this syntax could be this

user, err := client.User.Create(
  photon.User.ID.Set("7d42"),
  photon.User.Email.Set("bob@prisma.io"),
  photon.User.Name.Set("Bob"),
  photon.User.Post.Create(
    photon.Post.ID.Set("1b32f")
    photon.Post.Title.Set("New blog post")
  ),
  photon.User.Post.Connect(
    photon.Post.Email.Equals("1b32f")
  ),
).Exec(ctx)
```

#### Update

You can update records by querying for specific documents and setting specific fields.

##### Update the role of an existing user

```go
user, err := client.User.Update.Where(
  photon.User.ID.Equals("cjsyytzn0004d0982gbyeqep7"),
).Data(
  photon.user.Role.Set(photon.User.Role.ADMIN),
).Exec(ctx)
```

##### Update the author of a post

```go
post, err := client.Post.Update.Where(
  photon.Post.ID.Equals("cjsx2j8bw02920b25rl806l07"),
).Data(
  photon.Post.Author.Connect.Where(
    photon.User.Email.Equals("bob@prisma.io"),
  ),
).Exec(ctx)
```

#### UpdateMany

##### Update three posts by their IDs

```go
updated, err := client.Post.UpdateMany.Where(
  photon.Post.ID.In([]string{
    "cjsyqxwqv000l0982p5qdq34p",
    "cjsyqxwqo000j0982da8cvw7o",
    "cjsyqxwr0000n0982cke8i5sc",
  }),
).Data(
  photon.Post.Published.Set(true),
).Exec(ctx)
```

##### Update all posts where the title contains the given string

```go
updated, err = client.Post.UpdateMany.Where(
  photon.Post.Title.Contains("prisma"),
).Data(
  photon.Post.Published.Set(true),
).Exec(ctx)
```

#### Delete

##### Delete a post by its ID

```go
post, err := client.Post.Delete.Where(
  photon.Post.ID.Equals(10),
).Exec(ctx)
```

##### Delete a user by their email

```go
user, err := client.User.Delete.Where(
  photon.User.Email.Equals("alice@prisma.io"),
).Exec(ctx)
```

#### DeleteMany

##### Delete all posts that were created before 2018:

```go
deleted, err := client.Post.DeleteMany.Where(
  photon.Post.CreatedAt.Gt(christmas),
).Exec(ctx)
```

#### Upsert

##### Create a user or update their role

```go
user, err := client.User.Upsert.Where(
  photon.User.Email.Equals("alice@prisma.io"),
).Data(
  photon.User.Email.Set("alice@prisma.io"),
  photon.User.Role.Set(user.Role.ADMIN),
).Exec(ctx)
```

#### Select multiple things

##### Select a user with 10 of their posts

```go
posts, err := client.User.FindOne.Where(
  photon.User.Where.ID.Equals("bobs-id"),
).With(
  photon.User.Posts.
    Where(
      photon.Post.Title.Contains("some title")
    ).
    Limit(10),
).Exec(ctx)
```

##### Advanced selection of various nested relations

This will fetch users

Note: This uses an additional relation "friends" which is not 

```go
posts, err := client.User.FindOne.Where(
  photon.User.Where.ID.Equals("bobs-id"),
).With(
  photon.User.Posts.
    Where(
      photon.Post.Title.Contains("some title")
    ).
    Limit(10),
).Exec(ctx)
```

#### Raw PQL Query

You can use the PQL function to query the Prisma server directly.

```go
var u photon.User
err := client.User.PQL(
  &u,
  `
    query {
      findOnePost(where: {
        id: "123"
      }) {
        id
        title
        content
      }
    }
  `,
  map[string]interface{}{
    "id": "alice@prisma.io",
  },
)
```

#### Raw database query

You can use the raw function as an escape hatch to write custom complex queries which are
sent directly to the underlying database.

```go
var u photon.User
err := client.User.Raw(&u, `SELECT * FROM users WHERE email = ?`,
  "alice@prisma.io",
)
```
