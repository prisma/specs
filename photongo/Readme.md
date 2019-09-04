- Start Date: 5/31/2019
- RFC PR: (leave this empty)
- Prisma Issue: (leave this empty)

# Summary

This spec describes the Photon Go API

<!-- START doctoc -->
<!-- END doctoc -->

## Connecting to Prisma Engine

The Prisma constructor is used to create new instances of the Prisma client.

```go
client, err := prisma.Connect()
```

This will launch the Prisma Engine process and connect to it.

### Disconnecting from the Prisma Engine

After connecting, you can disconnect with the following

```go
err := client.Disconnect()
```

## Example Model

The API below uses examples based on this data model:

```groovy
type Post {
  id: ID! @id
  createdAt: DateTime! @createdAt
  updatedAt: DateTime! @updatedAt
  title: String!
  published: Boolean! @default(value: false)
  author: User
  comments: [Comment!]!
}

type User {
  id: ID! @id
  name: String
  email: String! @unique
  role: Role! @default(value: USER)
  posts: [Post!]!
  comments: [Comment!]!
}

type Comment {
  id: ID! @id
  createdAt: DateTime! @createdAt
  text: String!
  post: Post!
  writtenBy: User!
}

enum Role {
  USER
  ADMIN
}
```

## Reading Data

The read examples follow along closely with the documentation here: https://www.prisma.io/docs/prisma-client/basic-data-access/reading-data-GO-go05/

### Find

For example, the following query returns all scalar fields of a single User

```go
usr, err := client.User.Find(user.Where().Email("ada@prisma.io"))
```

Fetch a single post by its id:

```go
usr, err := client.User.Find(user.Where().ID(10))
```

Fetch a single user by their email:

```go
usr, err := client.User.Find(user.Where().Email("ada@prisma.io"))
```

### FindMany

#### Find all users

```go
users, err := client.User.FindMany()
```

#### Find all comments

```go
comments, err := client.Comment.FindMany()
```

#### Find users that have an A in their names

```go
users, err := client.User.FindMany(user.Where().NameContains("A"))
```

#### Find users named Ada or Grace

```go
usrs, err := client.User.FindMany(user.Where().NameIn("Ada", "Grace"))
```

#### Fetch comments created before December 24, 2019

```go
christmas := time.Date(2019, time.December, 24, 10, 0, 0, 0, time.UTC)
comments, err := client.Comment.FindMany(comment.Where().CreatedAtLt(christmas))
```

#### Fetch posts that have prisma or graphql in their title and were created in 2019

```go
posts, err := client.Post.FindMany(post.Where().Or(
  post.Where().TitleContains("prisma"),
  post.Where().TitleContains("graphql"),
))
```

#### Sort comments by their creation date (ascending)

```go
comments, err := client.Comment.FindMany(comment.Order().CreatedAt(prisma.ASC))
```

#### Sort users alphabetically by their names (descending)

```go
usrs, err := client.User.FindMany(user.Order().Name(prisma.DESC))
```

#### Find the first 3 posts (seeking forward)

```go
posts, err := client.Post.FindMany(post.First(3))
```

#### Find the posts from position 6 to position 10 (seeking forward)

```go
posts, err := client.Post.FindMany(post.Skip(6), post.First(4))
```

#### Find the last 3 posts (seeking backward)

```go
posts, err := client.Post.FindMany(post.Last(3))
```

#### Fetch the posts from position 21 to position 27 (seeking backward)

```go
posts, err := client.Post.FindMany(post.Skip(3), post.Last(7))
```

#### Fetch the first 3 posts after the posts with 3 as it's id

```go
posts, err := client.Post.FindMany(
  post.First(3),
  post.After("cjsyqxwqo000j0982da8cvw7o"),
)
```

#### Fetch the first 5 posts after the post with 10 as id and skipping 3 posts:

```go
posts, err := client.Post.FindMany(
  post.After(10),
  post.Skip(3),
  post.First(5),
)
```

#### Fetch the last 5 posts before the post with 10 as id

```go
posts, err := client.Post.FindMany(
  post.Last(5),
  post.Before(10),
)
```

#### Fetch the last 3 posts before the record with 10 as id and skipping 5 posts

```go
posts, err := client.Post.FindMany(
  post.Last(3),
  post.Before(10),
  post.Skip(5),
)
```

### FindAs

#### Fetch all the posts of a single user

```go
user := client.User.As(user.Where().Email("alice@prisma.io"))
posts, err := user.Post.FindMany()
```

#### Fetch posts by a certain user that were created after christmas

```go
user := client.User.As(user.Where().Email(email))
posts, err := user.Post.FindMany(post.Where().CreatedAtGt(christmas))
```

#### Find all comments belonging to a post of a user

```go
user := client.User.As(user.Where().Email("alice@prisma.io"))
post := user.Post.As(post.Where().TitleContains("my title"))
comments, err := post.Comments.FindMany()
```

## Writing Data

The write examples follow closely with the demo here: https://www.prisma.io/docs/prisma-client/basic-data-access/writing-data-GO-go08/

### Create

#### Create a User

```go
usr, err := client.User.Create(
  user.New().Email("alice@prisma.io").Name("Alice"),
)
```

#### Create a new post and set alice@prisma.io as the author

```go
pst, err := client.Post.Create(
  post.New().Title("Join us for GraphQL").ConnectAuthor(
    user.Connect().Email("alice@prisma.io")
  ),
)
```

#### Create a new user with two new posts

```go
usr, err := client.User.Create(
  user.New().Email("bob@prisma.io").Name("Bob").CreatePosts(
    post.New().Title("Follow @prisma on Twitter"),
    post.New().Title("Join us for GraphQL"),
  ),
)
```

#### Create 1 user, 2 posts and connect an existing post

```go
usr, err := client.User.Create(
  user.New().Email("bob@prisma.io").Name("Bob").
    CreatePosts(
      post.New().Title("Follow @prisma on Twitter"),
      post.New().Title("Join us for GraphQL"),
    ).
    ConnectPosts(
      post.Connect().ID(10),
    ),
)
```

### Update

#### Update the role of an existing user

```go
usr, err := client.User.Update(
  user.New().Role(user.Role.ADMIN),
  user.Where().ID("cjsyytzn0004d0982gbyeqep7"),
)
```

#### Update the author of a post

```go
pst, err := client.Post.Update(
  post.New().ConnectAuthor(
    user.Connect().Email("bob@prisma.io"),
  ),
  post.Where().ID("cjsx2j8bw02920b25rl806l07"),
)
```

### UpdateMany

#### Update three posts by their IDs

```go
updated, err := client.Post.UpdateMany(
  post.New().Published(true),
  post.Where().IDIn(
    "cjsyqxwqv000l0982p5qdq34p",
    "cjsyqxwqo000j0982da8cvw7o",
    "cjsyqxwr0000n0982cke8i5sc",
  ),
)
```

#### Update all posts where the title contains the given string

```go
updated, err = client.Post.UpdateMany(
  post.New().Published(true),
  post.Where().TitleContains("prisma"),
)
```

### Delete

#### Delete a post by its ID

```go
pst, err := client.Post.Delete(post.Where().ID(10))
```

#### Delete a user by their email

```go
usr, err := client.User.Delete(user.Where().Email("alice@prisma.io"))
```

### DeleteMany

#### Delete all posts that were created before 2018:

```go
deleted, err := client.Post.DeleteMany(
  post.Where().CreatedAtGt(christmas),
)
```

### Upsert

#### Create a user or update their role

```go
usr, err := client.User.Upsert(
  user.New().Email("alice@prisma.io"),
  user.New().Role(user.Role.ADMIN),
  user.Where().Email("alice@prisma.io"),
)
```

### Select

#### Select a user, their posts and their comments

We're using generated fields here to maintain type-safety

```go
var u struct {
  user.ID
  user.Email
  Posts []struct {
    post.Title
    post.CreatedAt
    Comments []struct {
      comment.Comment
      comment.Text
    }
  }
}

err := client.User.Select(&u,
  user.Where().ID("bobs-id"),
  user.WithPosts(
    post.Where().TitleContains("my title"),
  ),
)
```

### Raw

You can use the raw fields in a model as an escape hatch to write custom complex queries.

```go
var u user.User
err := client.User.Raw(&u, `select %s, %s from users`,
  user.ID(10),
  user.Email("alice@prisma.io")),
)
```

## Adding Context

Context can be added to a client with the following:

```go
ctx := context.Background()
client = client.WithContext(ctx)
```

Normally you'd add this line at the beginning of your request handlers:

```go
func (u *User) Create(w http.ResponseWriter, r *http.Request) {
  client = client.WithContext(r.Context())
  usr, err := client.User.Find(user.Where().ID(10))
}
```
