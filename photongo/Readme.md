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
      - [Create 1 user, 2 posts and connect an existing post](#create-1-user-2-posts-and-connect-an-existing-post)
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
  - [Aggregations](#aggregations)
    - [Query for aggregated values](#query-for-aggregated-values)
      - [Find all users which has more than 10 posts](#find-all-users-which-has-more-than-10-posts)
    - [Perform basic aggregations on fields](#perform-basic-aggregations-on-fields)
      - [Get the total count of posts](#get-the-total-count-of-posts)
      - [Get the total sum of all post likes](#get-the-total-sum-of-all-post-likes)
      - [Get the average likes per post](#get-the-average-likes-per-post)
  - [Advanced queries](#advanced-queries)
    - [Defining the struct by yourself](#defining-the-struct-by-yourself)
    - [Generated code](#generated-code)
    - [Notes](#notes)
    - [Relations](#relations)
      - [Fetch a specific user and 10 of their posts](#fetch-a-specific-user-and-10-of-their-posts)
      - [Find the most popular users with their most popular posts and the post's comments](#find-the-most-popular-users-with-their-most-popular-posts-and-the-posts-comments)
    - [Aggregations](#aggregations-1)
      - [Fetch users which have filled out their name and their total post likes](#fetch-users-which-have-filled-out-their-name-and-their-total-post-likes)
      - [Order by category and user and count](#order-by-category-and-user-and-count)
  - [Raw usage](#raw-usage)
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
  category   String?
  published  Boolean   @default(value: false)
  views      Int
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
- Methods for nullability (vs. using pointers or null-structs) [photon-go#1](https://github.com/prisma/photongo/issues/1)
- Require passing a context explicitly [photon-go#6](https://github.com/prisma/photongo/issues/6)
- Generate code into a single file [photon-go#3](https://github.com/prisma/photongo/issues/3)
- Code generation for advanced queries [photon-go#9](https://github.com/prisma/photongo/issues/9)

### Generated models

The above data model will generate the following Go models.

```go
type Post struct {
  Id        string     `json:"id"`
  CreatedAt time.Time  `json:"createdAt"`
  UpdatedAt time.Time  `json:"updatedAt"`
  Title     string     `json:"title"`
  Published bool       `json:"published"`
  Views     int        `json:"likes"`
  Author    User       `json:"author"`
}

func (Post) Desc() (string, bool) { /* implementation hidden */ }
func (Post) Category() (string, bool) { /* implementation hidden */ }

type User struct {
  Id        string     `json:"id"`
  CreatedAt time.Time  `json:"createdAt"`
  UpdatedAt time.Time  `json:"updatedAt"`
  Email     string     `json:"email"`
  Role      Role       `json:"role"`
}

func (User) Name() (string, bool) { /* implementation hidden */ }

type Comment struct {
  Id        string    `json:"id"`
  CreatedAt time.Time `json:"createdAt"`
  UpdatedAt time.Time `json:"updatedAt"`
  Text      string    `json:"text"`
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

// Name is an optional field, which is why it is exposed as a method with a multi value context
// this also enforces the user to check for the null value or explicitly ignore it
if name, ok := user.Name(); ok {
  log.Printf("user has a name: %s", name)
}
```

### Reading Data

#### FindOne

FindOne returns the first item which matches a given query.

##### Returns all scalar fields of a single User

```go
user, err := client.User.FindOne(
  photon.User.Email.Equals("ada@prisma.io"),
).Exec(ctx)
```

##### Fetch a single post by its id:

```go
user, err := client.User.FindOne(
  photon.User.ID.Equals("ada@prisma.io"),
).Exec(ctx)
```

##### Fetch a single user by their email:

```go
user, err := client.User.FindOne(
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
users, err := client.User.FindMany(photon.User.Name.Contains("A")).Exec(ctx)
```

##### Find users named Ada or Grace

```go
users, err := client.User.FindMany(
  photon.User.Name.In([]string{"Ada", "Grace"}),
).Exec(ctx)
```

##### Fetch comments created before 2019

```go
comments, err := client.Comment.FindMany(photon.Comment.CreatedAt.Lt(christmas)).Exec(ctx)
```

##### Fetch posts that have prisma or graphql in their title

```go
posts, err := client.Post.FindMany(photon.Post.Or(
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
posts, err := client.Post.FindMany.After("cjsyqxwqo000j0982da8cvw7o").Exec(ctx)
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
posts, err := client.Post.FindMany(
  photon.Post.CreatedAt.Gt(christmas),
  photon.Post.User.Email.Equals(email),
).Exec(ctx)
```

##### Find all comments belonging to a post of a user

```go
comments, err := client.Comment.FindMany(
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
user, err := client.User.CreateOne(
  photon.User.ID.Set("abc43"),
  photon.User.Email.Set("alice@prisma.io"),
  photon.User.Age.Set(37),
  photon.User.Username.Set("alice"),
  photon.User.FirstName.Set("Alice"),
  photon.User.LastName.Set("West"),
  photon.User.AvatarURL.Set("img-cdn.com/123"),
  photon.User.Timezone.Set("Europe/Berlin"),
  photon.User.IsTeamOwner.Set(true),
  photon.User.TeamID.Set("123"),
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
user, err := client.User.CreateOne(
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

##### Create 1 user, 2 posts and connect an existing post

```go
user, err := client.User.CreateOne(
  photon.User.ID.Set("7d42"),
  photon.User.Email.Set("bob@prisma.io"),
  photon.User.Name.Set("Bob"),
).CreatePost(
  photon.Post.ID.Set("a"),
  photon.Post.Title.Set("Follow @prisma on Twitter"),
).CreatePost(
  photon.Post.ID.Set("b"),
  photon.Post.Title.Set("GraphQL is cool"),
).ConnectPost(
  photon.Post.ID.Equals("c"),
).Exec(ctx)

// an alternative to this syntax could be this

user, err := client.User.CreateOne(
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
user, err := client.User.UpdateOne(
  photon.User.ID.Equals("cjsyytzn0004d0982gbyeqep7"),
).Data(
  photon.User.Role.Set(photon.User.Role.ADMIN),
).Exec(ctx)
```

##### Update the author of a post

```go
post, err := client.Post.UpdateOne(
  photon.Post.ID.Equals("cjsx2j8bw02920b25rl806l07"),
).Data(
  photon.Post.Author.Connect(
    photon.User.Email.Equals("bob@prisma.io"),
  ),
).Exec(ctx)
```

#### Update operations

##### Increment the views of a post

```go
post, err := client.Post.UpdateOne(
  photon.Post.ID.Equals("cjsx2j8bw02920b25rl806l07"),
).Data(
  photon.Post.Views.Inc(1),
).Exec(ctx)
```

##### Decrease the views of a post

```go
post, err := client.Post.UpdateOne(
  photon.Post.ID.Equals("cjsx2j8bw02920b25rl806l07"),
).Data(
  photon.Post.Views.Dec(1),
).Exec(ctx)
```

#### UpdateMany

##### Update three posts by their IDs

```go
affectedRows, err := client.Post.UpdateMany(
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
affectedRows, err = client.Post.UpdateMany(
  photon.Post.Title.Contains("prisma"),
).Data(
  photon.Post.Published.Set(true),
).Exec(ctx)
```

#### Delete

##### Delete a post by its ID

```go
post, err := client.Post.DeleteOne(
  photon.Post.ID.Equals(10),
).Exec(ctx)
```

##### Delete a user by their email

```go
user, err := client.User.DeleteOne(
  photon.User.Email.Equals("alice@prisma.io"),
).Exec(ctx)
```

#### DeleteMany

##### Delete all posts that were created before 2018:

```go
affectedRows, err := client.Post.DeleteMany(
  photon.Post.CreatedAt.Gt(christmas),
).Exec(ctx)
```

#### Upsert

##### Create a user or update their role

```go
user, err := client.User.UpsertOne(
  photon.User.Email.Equals("alice@prisma.io"),
).Data(
  photon.User.Email.Set("alice@prisma.io"),
  photon.User.Role.Set(photon.User.Role.ADMIN),
).Exec(ctx)
```


### Aggregations

#### Query for aggregated values

##### Find all users which has more than 10 posts

```go
posts, err := client.User.FindMany(
  photon.User.ID.Equals("bobs-id"),
  photon.User.Posts.Count().Lt(10),
).Exec(ctx)
```

#### Perform basic aggregations on fields

##### Get the total count of posts

```go
postCount, err := client.Post.Aggregate.Count().Exec(ctx)
```

##### Get the total sum of all post likes

```go
totalPostLikes, err := client.Post.Aggregate.Sum(photon.Post.Likes).Exec(ctx)
```

##### Get the average likes per post

```go
averagePostLikes, err := client.Post.Aggregate.Average(photon.Post.Likes).Exec(ctx)
```

### Advanced queries

Advanced queries can involve fetching relations, specific fields only, aggregations and order bys.
The user can query for complex aggregations by specifying the return value themselves, while they can use the
type-safe query parameters. We also may include tools to generate the result structs automatically for the user.

#### Defining the struct by yourself

Your first option is to query for something and define the struct by yourself. This is very simple, but also 
error-prone because you have to keep it in sync with your query. Also, it's hard to verify if the user
mapped the fields correctly, and we want to avoid checking on runtime.

Example:

```go
var result []struct {
  Name  string `json:"name"`
  Likes int    `json:"likes"`
}

err := client.User.Select(
  User.Name.Contains("John"),
).Fields(
  photon.User.Name.Select(),
  photon.User.Post.Likes.Sum(),
).Into(&result).Exec(ctx)
```

#### Generated code

A much better option is to just generate the struct types for the user, although it comes with some caveats.
For more information, see https://github.com/prisma/photongo/issues/9.

#### Notes

In the following examples, we use explicit struct types for readability. However, you should generate
the structs in a real application.

#### Relations

##### Fetch a specific user and 10 of their posts

You don't have to explicitly join. When you use `.With()` to query for a relation, Photon Go automatically
fetches the related fields, without explicitly querying for it (e.g. `WHERE id = ?`).

```go
var user struct {
  // embedded User
  User  `json:"user"`
  // posts relation
  Posts []struct {
    // embedded post field
    Post `json:"post"`
  } `json:"posts"`
}
user, err := client.User.FindOne(
  photon.User.ID.Equals("bobs-id"),
).With(
  photon.User.Posts.
    Where(
      photon.Post.Title.Contains("some title"),
    ).
    Limit(10),
).Into(&user).Exec(ctx)
```

##### Find the most popular users with their most popular posts and the post's comments

Queries can as deeply nested as wanted. The integrated dataloader will make sure as few underlying
SQL queries as possible are generated.

```go
var users []struct {
  // embedded User
  User  `json:"user"`
  // posts relation
  Posts []struct {
    // embedded post field
    Post `json:"post"`
    Comments []struct {
      // embedded comment field
      Comment `json:"comment"`
    } `json:"posts"`
  } `json:"posts"`
}
err := client.User.FindMany(
  photon.Post.Views.Sum().Lt(10),
).With(
  photon.User.Posts.
    Limit(10).
    With(
      photon.Post.Comments.Limit(10),
    ),
).Into(&users).Exec(ctx)
```

#### Aggregations

##### Fetch users which have filled out their name and their total post likes

```go
var result []struct {
  User  `json:"user"`
  Likes `json:"likes"`
}

err := client.User.Aggregate(
  photon.User.Name.Filled(),
).Select(
  photon.User.Name.Select().As("user"), // user field "user" instead of "name"
  photon.User.Post.Likes.Sum(),
).Into(&result).Exec(ctx)
```

##### Order by category and user and count

```go
var result []struct {
  Category     `json:"category"`
  UserName     `json:"name"`
  LikeCount    `json:"likeCount"`
  AvgPostLikes `json:"avgPostLikes"`
}

err := client.User.Aggregate.GroupBy(
  photon.User.Post.Category.Group(),
  photon.User.Name.Group(),
).Select(
  photon.User.Post.Count(),
  photon.User.Post.Likes.Sum(),
).Into(&result).Exec(ctx)
```

### Raw usage

#### Raw PQL Query

The PQL function can be used as an escape hatch to query the Prisma server directly.

```go
var u photon.User
err := client.User.PQL(
  ctx,
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

The raw function can be used as an escape hatch to write custom complex queries which are
sent directly to the underlying database.

```go
var u photon.User
err := client.User.Raw(
  ctx,
  &u,
  `SELECT * FROM users WHERE email = ?`,
  "alice@prisma.io",
)
```
