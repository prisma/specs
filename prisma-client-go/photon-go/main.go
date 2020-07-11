package main

import (
	"context"
	"fmt"
	"time"

	"github.com/prisma/photon-go/prisma"
	"github.com/prisma/photon-go/prisma/comment"
	"github.com/prisma/photon-go/prisma/post"
	"github.com/prisma/photon-go/prisma/user"
)

func main() {
	//
	// https://www.prisma.io/docs/prisma-client/setup/constructor-GO-go02/
	//

	client, err := prisma.Connect()

	// later on, inside the request handlers
	ctx := context.Background()
	client = client.WithContext(ctx)

	//
	// https://www.prisma.io/docs/prisma-client/basic-data-access/reading-data-GO-go05/
	//

	// For example, the following query returns all scalar fields of a single User:
	email := "ada@prisma.io"
	usr, err := client.User.Find(user.Where().Email(email))

	// Here is an example of fetching a list of User records:
	usrs, err := client.User.FindMany()

	// Fetch a single post by its id:
	id := "cjsx2j8bw02920b25rl806l07"
	usr, err = client.User.Find(user.Where().ID(id))

	// Fetch a single user by their email:
	email = "ada@prisma.io"
	usr, err = client.User.Find(user.Where().Email(email))

	// Fetch all comments:
	cmnts, err := client.Comment.FindMany()

	// Fetch a list of users:
	usrs, err = client.User.FindMany()

	// Fetch all the posts of a single user:
	psts, err := client.User.As(user.Where().Email(email)).Post.FindMany()

	// Fetch all the comments from a user's post in a single transaction
	cmnts, err = client.
		User.As(user.Where().Email(email)).
		Post.As(post.Where().TitleContains("title")).
		Comment.FindMany()

	// Fetch users that have an A in their names:
	usrs, err = client.User.FindMany(user.Where().NameContains("A"))

	// Fetch users called Ada or Grace:
	usrs, err = client.User.FindMany(user.Where().NameIn("Ada", "Grace"))

	christmas := time.Date(2019, time.December, 24, 10, 0, 0, 0, time.UTC)

	// Fetch comments created before December 24, 2019:
	cmnts, err = client.Comment.FindMany(comment.Where().CreatedAtLt(christmas))

	// Fetch posts that have prisma or graphql in their title and were created in 2019:
	psts, err = client.Post.FindMany(post.Where().Or(
		post.Where().TitleContains("prisma"),
		post.Where().TitleContains("graphql"),
	))

	// Fetch posts by a certain user that were created after christmas
	psts, err = client.User.As(user.Where().Email(email)).Post.FindMany(post.Where().CreatedAtGt(christmas))

	// Sort comments by their creation date (ascending):
	cmnts, err = client.Comment.FindMany(comment.Order().CreatedAt(prisma.ASC))

	// Sort users alphabetically by their names (descending):
	usrs, err = client.User.FindMany(user.Order().Name(prisma.DESC))

	// Fetch the first 3 posts (seeking forward):
	psts, err = client.Post.FindMany(post.First(5))

	// Fetch the posts from position 6 to position 10 (seeking forward):
	psts, err = client.Post.FindMany(post.First(5), post.Skip(5))

	// Fetch the last 3 posts (seeking backward):
	psts, err = client.Post.FindMany(post.Last(3))

	// Fetch the posts from position 21 to position 27 (seeking backward):
	psts, err = client.Post.FindMany(post.Skip(3), post.Last(7))

	// Fetch the first 3 posts after the posts with cixnen24p33lo0143bexvr52n as id:
	psts, err = client.Post.FindMany(
		post.First(3),
		post.After("cjsyqxwqo000j0982da8cvw7o"),
	)

	// Fetch the first 5 posts after the post with cixnen24p33lo0143bexvr52n as id and skipping 3 posts:
	psts, err = client.Post.FindMany(
		post.First(5),
		post.After("cjsyqxwqo000j0982da8cvw7o"),
		post.Skip(3),
	)

	// Fetch the last 5 posts before the post with cixnen24p33lo0143bexvr52n as id:
	psts, err = client.Post.FindMany(
		post.Last(5),
		post.Before("cixnen24p33lo0143bexvr52n"),
	)

	// Fetch the last 3 posts before the record with cixnen24p33lo0143bexvr52n as id and skipping 5 posts:
	psts, err = client.Post.FindMany(
		post.Last(3),
		post.Before("cixnen24p33lo0143bexvr52n"),
		post.Skip(5),
	)

	//
	// https://www.prisma.io/docs/prisma-client/basic-data-access/writing-data-GO-go08/
	//

	// Create a new user:
	usr, err = client.User.Create(
		user.New().
			Email("alice@prisma.io").
			Name("Alice"),
	)

	// Create a new post and set alice@prisma.io as the author:
	pst, err := client.Post.Create(post.New().
		Title("Join us for GraphQL Conf in 2019").
		ConnectAuthor(user.Connect().Email("alice@prisma.io")),
	)
	_ = pst

	// Create a new user with two new posts:
	usr, err = client.User.Create(
		user.New().
			Email("bob@prisma.io").
			Name("Bob").
			CreatePosts(
				post.New().Title("Follow @prisma on Twitter"),
				post.New().Title("Join us for GraphQL Conf"),
			),
	)

	// Update the role of an existing user:
	usr, err = client.User.Update(
		user.New().Role(user.Role.ADMIN),
		user.Where().ID("cjsyytzn0004d0982gbyeqep7"),
	)

	// Update the author of a post:
	pst, err = client.Post.Update(
		post.New().ConnectAuthor(
			user.Connect().Email("bob@prisma.io"),
		),
		post.Where().ID("cjsx2j8bw02920b25rl806l07"),
	)

	// Delete a post by its id:
	pst, err = client.Post.Delete(post.Where().ID("cjsyqxwqo000j0982da8cvw7o"))

	// Delete a user by their email:
	usr, err = client.User.Delete(user.Where().Email("cjsyqxwqo000j0982da8cvw7o"))

	// Update the role of a user. If the user doesn't exist yet, create a new one:
	usr, err = client.User.Upsert(
		user.New().Email("alice@prisma.io"),
		user.New().Role(user.Role.ADMIN),
		user.Where().Email("alice@prisma.io"),
	)

	// Unpublish three posts by their IDs:
	updated, err := client.Post.UpdateMany(
		post.New().Published(true),
		post.Where().IDIn(
			"cjsyqxwqv000l0982p5qdq34p",
			"cjsyqxwqo000j0982da8cvw7o",
			"cjsyqxwr0000n0982cke8i5sc",
		),
	)

	// Update all posts where the description contains the string prisma and publish them:
	updated, err = client.Post.UpdateMany(
		post.New().Published(true),
		post.Where().TitleContains("prisma"),
	)

	// Delete all posts that were created before 2018:
	deleted, err := client.Post.DeleteMany(
		post.Where().CreatedAtGt(christmas),
	)

	// Nested Object Writes
	usr, err = client.User.Create(
		user.New().Email("bob@prisma.io").Name("Bob").
			CreatePosts(
				post.New().Title("Follow @prisma on Twitter"),
				post.New().Title("Join us for GraphQL Conf"),
			).
			ConnectPosts(
				post.Connect().ID("cjsyqxwqo000j0982da8cvw7o"),
			),
	)

	// Select API
	// Type-safe by using the generated fields
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

	// application
	err = client.User.Select(&u,
		user.Where().ID("bobs-id"),
		user.WithPosts(
			post.Where().TitleContains("my title"),
		),
	)

	// Raw fields
	// Reuses the generated fields
	sql := fmt.Sprintf(`select %s, %s from users`,
		user.ID(10),
		user.Email("mueller@prisma.io"),
	)

	_, _, _, _, _, _, _, _, _ = client, err, usrs, psts, usr, cmnts, updated, deleted, sql
}
