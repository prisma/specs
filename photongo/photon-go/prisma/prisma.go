package prisma

import (
	"context"
	"io"
	"net"
	uri "net/url"
	"os/exec"
	"reflect"
	"syscall"
	"time"
)

// New client to an HTTP Prisma Engine
func New(url string) *Client {
	http := &HTTP{
		URL:   url,
		Debug: false,
	}
	return &Client{
		User: &UserModel{db: http},
		Post: &PostModel{db: http},
	}
}

// Dial a remote TCP Prisma Engine
func Dial(url string) (*Client, error) {
	u, err := uri.Parse(url)
	if err != nil {
		return nil, err
	}
	conn, err := net.Dial("tcp", u.String())
	if err != nil {
		return nil, err
	}
	db := &TCP{
		conn: conn,
	}
	return &Client{
		User: &UserModel{db: db},
		Post: &PostModel{db: db},
	}, nil
}

const defaultEnginePath = ""

// Connect to prisma engine
func Connect() (*Client, error) {
	cmd := exec.Command(defaultEnginePath)
	r, w := io.Pipe()
	cmd.Stdin = r
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	process := &Process{
		cmd:   cmd,
		stdin: w,
	}
	return &Client{
		User: &UserModel{db: process},
		Post: &PostModel{db: process},
	}, nil
}

// Launch a Prisma Engine and connect to it
func Launch(path string, args ...string) (*Client, error) {
	cmd := exec.Command(path, args...)
	r, w := io.Pipe()
	cmd.Stdin = r
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	process := &Process{
		cmd:   cmd,
		stdin: w,
	}
	return &Client{
		User: &UserModel{db: process},
		Post: &PostModel{db: process},
	}, nil
}

// DB interface
type DB interface {
	Send(ctx context.Context, query string, result interface{}) error
	Close() error
}

// HTTP client to Prisma Engine
type HTTP struct {
	URL   string
	Debug bool
}

var _ DB = (*HTTP)(nil)

// Send a query to the Prisma Engine and wait for a result
func (c *HTTP) Send(ctx context.Context, query string, result interface{}) error {
	// TODO: write to the connection and wait for a response
	// c.conn.Write([]byte(query))
	return nil
}

// Close does nothing because HTTP is stateless
func (c *HTTP) Close() error {
	return nil
}

// TCP for a remote Prisma Engine
type TCP struct {
	conn net.Conn
}

var _ DB = (*TCP)(nil)

// Send a query to the Prisma Engine and wait for a result
func (c *TCP) Send(ctx context.Context, query string, result interface{}) error {
	// TODO: write to the connection and wait for a response
	c.conn.Write([]byte(query))
	return nil
}

// Close the TCP
func (c *TCP) Close() error {
	return c.conn.Close()
}

// Process for the local Prisma Engine
type Process struct {
	cmd   *exec.Cmd
	stdin io.Writer
}

var _ DB = (*Process)(nil)

// Send a query to the Prisma Engine and wait for a result
func (p *Process) Send(ctx context.Context, query string, result interface{}) error {
	// TODO: wait for a response
	// TODO: check context while waiting
	p.stdin.Write([]byte(query))
	return nil
}

// Close the client
func (p *Process) Close() error {
	if p.cmd.Process == nil {
		return p.cmd.Wait()
	}
	// TODO: less racey
	p.cmd.Process.Signal(syscall.SIGTERM)
	return p.cmd.Wait()
}

// OrderBy type
type OrderBy string

// Ordering
const (
	ASC  OrderBy = "ASC"
	DESC         = "DESC"
)

// Client struct
type Client struct {
	ctx context.Context

	User    *UserModel
	Post    *PostModel
	Comment *CommentModel
}

// WithContext fn
func (c *Client) WithContext(ctx context.Context) *Client {
	c.ctx = ctx
	return c
}

// Disconnect fn
func (c *Client) Disconnect() error {
	return nil
}

// UserModel struct
type UserModel struct {
	db DB
}

// User struct
type User struct {
	ID    string
	Name  string
	Email string
}

// UserID strings
type UserID string

//UserEmail strings
type UserEmail string

// As user, find a nested relation
func (u *UserModel) As(where *UserWhere) *UserAs {
	return &UserAs{}
}

// Find a user by a condition
func (u *UserModel) Find(conditions ...UserCondition) (user *User, err error) {
	return user, err
}

// Upsert a user by some conditions
func (u *UserModel) Upsert(insert *UserInput, update *UserInput, where ...*UserWhere) (user *User, err error) {
	return user, err
}

// Select a user by a condition
func (u *UserModel) Select(v interface{}, conditions ...UserCondition) (err error) {
	val := reflect.ValueOf(v).Elem()

	for i := 0; i < val.NumField(); i++ {
		// valueField := val.Field(i)
		// typeField := reflect.TypeOf(valueField)
		// tag := typeField.Tag
		// fmt.Printf("Field Name: %s,\t Field Type: %v\n", typeField.Name, typeField.String())
	}

	return err
}

func unroll(myvar interface{}) string {
	t := reflect.TypeOf(myvar)
	if t.Kind() == reflect.Ptr {
		return "*" + t.Elem().Name()
	}
	return t.Name()
}

// FindMany users by a condition
func (u *UserModel) FindMany(conditions ...UserCondition) (users []*User, err error) {
	return users, err
}

// Create a user
func (u *UserModel) Create(user *UserInput) (*User, error) {
	return nil, nil
}

// Update a user
func (u *UserModel) Update(user *UserInput, where ...*UserWhere) (*User, error) {
	return nil, nil
}

// UpdateMany a user
func (u *UserModel) UpdateMany(user *UserInput, where ...*UserWhere) ([]*User, error) {
	return nil, nil
}

// Delete a user
func (u *UserModel) Delete(where *UserWhere) (*User, error) {
	return nil, nil
}

// DeleteMany a user
func (u *UserModel) DeleteMany(where *UserWhere) ([]*User, error) {
	return nil, nil
}

//
// User
//

// UserInput struct
type UserInput struct {
}

// Name UserInput
func (i *UserInput) Name(name string) *UserInput {
	return i
}

// Email UserInput
func (i *UserInput) Email(email string) *UserInput {
	return i
}

// UserRole enum
type UserRole string

// Enums
// TODO: consider moving
const (
	UserRoleAdmin UserRole = "ADMIN"
)

// Role UserInput
func (i *UserInput) Role(role UserRole) *UserInput {
	return i
}

// CreatePosts creates a new post input
func (i *UserInput) CreatePosts(posts ...*PostInput) *UserInput {
	return i
}

// CreatePosts creates a new post input
// func (i *UserInput) CreatePosts(posts ...*PostInput) *UserInput {
// 	return i
// }

// ConnectPosts creates a new post input
func (i *UserInput) ConnectPosts(posts ...*PostConnect) *UserInput {
	return i
}

// UserConnect struct
type UserConnect struct {
}

// Email connection
func (u *UserConnect) Email(email string) *UserConnect {
	return u
}

// UserCondition interface
type UserCondition interface {
	condition() *userCondition
}

// contains user condition state
type userCondition struct {
}

// UserWhere struct
type UserWhere struct {
	c *userCondition
}

var _ UserCondition = (*UserWhere)(nil)

// ID condition
func (w *UserWhere) ID(id string) *UserWhere {
	return w
}

// Email condition
func (w *UserWhere) Email(email string) *UserWhere {
	return w
}

// NameContains where name contains substr
func (w *UserWhere) NameContains(substr string) *UserWhere {
	return w
}

// NameIn where the name is in
func (w *UserWhere) NameIn(names ...string) *UserWhere {
	return w
}

func (w *UserWhere) condition() *userCondition {
	return w.c
}

// UserOrder struct
type UserOrder struct {
	c *userCondition
}

var _ UserCondition = (*UserOrder)(nil)

// Name condition
func (w *UserOrder) Name(order OrderBy) *UserOrder {
	return w
}

func (w *UserOrder) condition() *userCondition {
	return w.c
}

// UserFirst struct
type UserFirst struct {
	c *userCondition
}

func (w *UserFirst) condition() *userCondition {
	return w.c
}

// UserSelect struct
type UserSelect struct {
	c     *userCondition
	id    bool
	name  bool
	email bool
}

func (w *UserSelect) condition() *userCondition {
	return w.c
}

// ID selects the user name
func (w *UserSelect) ID(id *int) *UserSelect {
	w.id = true
	return w
}

// Name selects the user name
func (w *UserSelect) Name(name *string) *UserSelect {
	w.name = true
	return w
}

// Email selects the user name
func (w *UserSelect) Email(email *string) *UserSelect {
	w.email = true
	return w
}

// UserWith struct
type UserWith struct {
}

func (u *UserWith) condition() *userCondition {
	return &userCondition{}
}

// UserAs is a chaining element for user
type UserAs struct {
	Post *PostModel
}

// Post finds a post as the user
// func (u *UserAs) Post(conditions ...PostCondition) (post *Post, err error) {
// 	return post, err
// }

// // Posts finds many posts as the user
// func (u *UserAs) Posts(conditions ...PostCondition) (posts []*Post, err error) {
// 	return posts, err
// }

// // AsPost fn
// func (u *UserAs) AsPost(conditions ...PostCondition) *PostAs {
// 	return &PostAs{}
// }

// Post struct
type Post struct {
	ID        string
	Title     string
	Published bool
}

// PostModel struct
type PostModel struct {
	db DB
}

// Find a post by a condition
func (p *PostModel) Find(conditions ...PostCondition) (post *Post, err error) {
	return post, err
}

// FindMany posts by a condition
func (p *PostModel) FindMany(conditions ...PostCondition) (posts []*Post, err error) {
	return posts, err
}

// Create a post
func (p *PostModel) Create(post *PostInput) (*Post, error) {
	return nil, nil
}

// Update a post
func (p *PostModel) Update(post *PostInput, where ...*PostWhere) (*Post, error) {
	return nil, nil
}

// UpdateMany posts
func (p *PostModel) UpdateMany(post *PostInput, where ...*PostWhere) ([]*Post, error) {
	return nil, nil
}

// Delete a post
func (p *PostModel) Delete(where *PostWhere) (*Post, error) {
	return nil, nil
}

// DeleteMany a post
func (p *PostModel) DeleteMany(where *PostWhere) (*Post, error) {
	return nil, nil
}

// As post, find a nested entity
func (p *PostModel) As(where *PostWhere) *PostAs {
	return &PostAs{}
}

//
// Posts
//

// PostInput struct
type PostInput struct {
}

// Title PostInput
func (i *PostInput) Title(name string) *PostInput {
	return i
}

// Published PostInput
func (i *PostInput) Published(published bool) *PostInput {
	return i
}

// ConnectAuthor connects the author to the postInput
func (i *PostInput) ConnectAuthor(user *UserConnect) *PostInput {
	return i
}

// PostConnect struct
type PostConnect struct {
}

// ID connection
func (p *PostConnect) ID(id string) *PostConnect {
	return p
}

// PostCondition interface
type PostCondition interface {
	condition() *postCondition
}

// contains post condition state
type postCondition struct {
}

// PostWhere struct
type PostWhere struct {
	p *postCondition
}

var _ PostCondition = (*PostWhere)(nil)

// Or condition
func (w *PostWhere) Or(conditions ...*PostWhere) *PostWhere {
	return &PostWhere{}
}

// ID condition
func (w *PostWhere) ID(id string) *PostWhere {
	return w
}

// IDIn condition
func (w *PostWhere) IDIn(ids ...string) *PostWhere {
	return w
}

// Title condition
func (w *PostWhere) Title(title string) *PostWhere {
	return w
}

// TitleContains condition
func (w *PostWhere) TitleContains(subtitle string) *PostWhere {
	return w
}

// CreatedAtGt condition
func (w *PostWhere) CreatedAtGt(createdAt time.Time) *PostWhere {
	return w
}

func (w *PostWhere) condition() *postCondition {
	return w.p
}

// PostFirst struct
type PostFirst struct {
	c *postCondition
}

func (w *PostFirst) condition() *postCondition {
	return w.c
}

// PostAfter struct
type PostAfter struct {
	c *postCondition
}

func (w *PostAfter) condition() *postCondition {
	return w.c
}

// PostBefore struct
type PostBefore struct {
	c *postCondition
}

func (w *PostBefore) condition() *postCondition {
	return w.c
}

// PostSkip struct
type PostSkip struct {
	c *postCondition
}

func (w *PostSkip) condition() *postCondition {
	return w.c
}

// PostLast struct
type PostLast struct {
	c *postCondition
}

func (w *PostLast) condition() *postCondition {
	return w.c
}

// PostSelect struct
type PostSelect struct {
	c *postCondition
}

// ID fn
func (p *PostSelect) ID(id *int) *PostSelect {
	return p
}

// Title fn
func (p *PostSelect) Title(title *string) *PostSelect {
	return p
}

// CreatedAt fn
func (p *PostSelect) CreatedAt(createdAt *time.Time) *PostSelect {
	return p
}

// condition
func (p *PostSelect) condition() *postCondition {
	return p.c
}

// PostWith struct
type PostWith struct {
}

func (p *PostWith) condition() *postCondition {
	return &postCondition{}
}

// PostAs struct
type PostAs struct {
	Comment *CommentModel
}

// // Comment condition
// func (p *PostAs) Comment(conditions ...CommentCondition) (comment *Comment, err error) {
// 	return comment, err
// }

// // Comments condition
// func (p *PostAs) Comments(conditions ...CommentCondition) (comments []*Comment, err error) {
// 	return comments, err
// }

//
// Comments
//

// Comment struct
type Comment struct {
	ID        int
	Email     string
	CreatedAt time.Time
}

// CommentModel struct
type CommentModel struct {
	db DB
}

// Find a comment by a condition
func (c *CommentModel) Find(conditions ...CommentCondition) (comment *Comment, err error) {
	return comment, err
}

// FindMany comments by a condition
func (c *CommentModel) FindMany(conditions ...CommentCondition) (comments []*Comment, err error) {
	return comments, err
}

// Create a comment
func (c *CommentModel) Create(comment *CommentInput) (*Comment, error) {
	return nil, nil
}

// Update a comment
func (c *CommentModel) Update(comment *CommentInput, where ...*CommentWhere) (*Comment, error) {
	return nil, nil
}

// UpdateMany a comment
func (c *CommentModel) UpdateMany(comment *CommentInput, where ...*CommentWhere) (*Comment, error) {
	return nil, nil
}

// Delete a comment
func (c *CommentModel) Delete(where *CommentWhere) (*Comment, error) {
	return nil, nil
}

// DeleteMany a comment
func (c *CommentModel) DeleteMany(where *CommentWhere) (*Comment, error) {
	return nil, nil
}

// As a comment, find a nested relation
func (c *CommentModel) As(where *CommentWhere) *CommentAs {
	return &CommentAs{}
}

// CommentInput struct
type CommentInput struct {
}

// CommentCondition interface
type CommentCondition interface {
	condition() *commentCondition
}

// contains comment condition state
type commentCondition struct {
}

// CommentWhere struct
type CommentWhere struct {
	c *commentCondition
}

var _ CommentCondition = (*CommentWhere)(nil)

// ID condition
func (w *CommentWhere) ID(id string) *CommentWhere {
	return w
}

// Email condition
func (w *CommentWhere) Email(email string) *CommentWhere {
	return w
}

// CreatedAtLt condition
func (w *CommentWhere) CreatedAtLt(createdAt time.Time) *CommentWhere {
	return w
}

func (w *CommentWhere) condition() *commentCondition {
	return w.c
}

// CommentOrder struct
type CommentOrder struct {
	c *commentCondition
}

var _ CommentCondition = (*CommentOrder)(nil)

// CreatedAt condition
func (w *CommentOrder) CreatedAt(order OrderBy) *CommentOrder {
	return w
}

func (w *CommentOrder) condition() *commentCondition {
	return w.c
}

// CommentWith struct
type CommentWith struct {
}

func (p *CommentWith) condition() *commentCondition {
	return &commentCondition{}
}

// CommentAs struct
type CommentAs struct {
}

// Conn struct
// type Conn struct {
// }

// Close the connection
// func (*Conn) Close() error {
// 	return nil
// }

// New Prisma client
// func New() *Prisma {

// }

// // Prisma Client
// type Prisma struct {
// }

// // String field
// func String(v string) *string { return &v }

// // Int field
// func Int(v int) *int { return &v }

// // Client for Prisma
// type Client interface {
// 	// TODO
// }

// // UserCreate interface
// type UserCreate interface {
// 	Input() *UserCreateInput
// }

// // UserCreateInput struct
// type UserCreateInput struct {
// 	Email     *string              `json:"email,omitempty"`
// 	FirstName *string              `json:"first_name,omitempty"`
// 	LastName  *string              `json:"last_name,omitempty"`
// 	StripeID  *string              `json:"stripe_id,omitempty"`
// 	Posts     *PostCreateManyInput `json:"posts,omitempty"`
// 	Friends   *UserCreateManyInput `json:"friends,omitempty"`
// }

// // Input implements prisma.UserCreate
// func (u *UserCreateInput) Input() *UserCreateInput {
// 	return u
// }

// // UserCreateManyInput struct
// type UserCreateManyInput struct {
// 	Create  []UserCreateInput    `json:"create,omitempty"`
// 	Connect []UserWhereCondition `json:"connect,omitempty"`
// }

// // User struct
// type User struct {
// 	ID        string    `json:"id,omitempty"`
// 	FirstName string    `json:"first_name,omitempty"`
// 	LastName  string    `json:"last_name,omitempty"`
// 	Email     string    `json:"email,omitempty"`
// 	StripeID  **string  `json:"stripe_id,omitempty"`
// 	CreatedAt time.Time `json:"created_at,omitempty"`
// 	UpdatedAt time.Time `json:"updated_at,omitempty"`
// }

// // UserWhere interface
// type UserWhere interface {
// 	Condition() *UserWhereCondition
// }

// // UserWhereCondition struct
// type UserWhereCondition struct {
// 	ID                     *string               `json:"id,omitempty"`
// 	IDNot                  *string               `json:"id_not,omitempty"`
// 	IDIn                   []string              `json:"id_in,omitempty"`
// 	IDNotIn                []string              `json:"id_not_in,omitempty"`
// 	IDLt                   *string               `json:"id_lt,omitempty"`
// 	IDLte                  *string               `json:"id_lte,omitempty"`
// 	IDGt                   *string               `json:"id_gt,omitempty"`
// 	IDGte                  *string               `json:"id_gte,omitempty"`
// 	IDContains             *string               `json:"id_contains,omitempty"`
// 	IDNotContains          *string               `json:"id_not_contains,omitempty"`
// 	IDStartsWith           *string               `json:"id_starts_with,omitempty"`
// 	IDNotStartsWith        *string               `json:"id_not_starts_with,omitempty"`
// 	IDEndsWith             *string               `json:"id_ends_with,omitempty"`
// 	IDNotEndsWith          *string               `json:"id_not_ends_with,omitempty"`
// 	Email                  *string               `json:"email,omitempty"`
// 	EmailNot               *string               `json:"email_not,omitempty"`
// 	EmailIn                []string              `json:"email_in,omitempty"`
// 	EmailNotIn             []string              `json:"email_not_in,omitempty"`
// 	EmailLt                *string               `json:"email_lt,omitempty"`
// 	EmailLte               *string               `json:"email_lte,omitempty"`
// 	EmailGt                *string               `json:"email_gt,omitempty"`
// 	EmailGte               *string               `json:"email_gte,omitempty"`
// 	EmailContains          *string               `json:"email_contains,omitempty"`
// 	EmailNotContains       *string               `json:"email_not_contains,omitempty"`
// 	EmailStartsWith        *string               `json:"email_starts_with,omitempty"`
// 	EmailNotStartsWith     *string               `json:"email_not_starts_with,omitempty"`
// 	EmailEndsWith          *string               `json:"email_ends_with,omitempty"`
// 	EmailNotEndsWith       *string               `json:"email_not_ends_with,omitempty"`
// 	FirstName              *string               `json:"first_name,omitempty"`
// 	FirstNameNot           *string               `json:"first_name_not,omitempty"`
// 	FirstNameIn            []string              `json:"first_name_in,omitempty"`
// 	FirstNameNotIn         []string              `json:"first_name_not_in,omitempty"`
// 	FirstNameLt            *string               `json:"first_name_lt,omitempty"`
// 	FirstNameLte           *string               `json:"first_name_lte,omitempty"`
// 	FirstNameGt            *string               `json:"first_name_gt,omitempty"`
// 	FirstNameGte           *string               `json:"first_name_gte,omitempty"`
// 	FirstNameContains      *string               `json:"first_name_contains,omitempty"`
// 	FirstNameNotContains   *string               `json:"first_name_not_contains,omitempty"`
// 	FirstNameStartsWith    *string               `json:"first_name_starts_with,omitempty"`
// 	FirstNameNotStartsWith *string               `json:"first_name_not_starts_with,omitempty"`
// 	FirstNameEndsWith      *string               `json:"first_name_ends_with,omitempty"`
// 	FirstNameNotEndsWith   *string               `json:"first_name_not_ends_with,omitempty"`
// 	LastName               *string               `json:"last_name,omitempty"`
// 	LastNameNot            *string               `json:"last_name_not,omitempty"`
// 	LastNameIn             []string              `json:"last_name_in,omitempty"`
// 	LastNameNotIn          []string              `json:"last_name_not_in,omitempty"`
// 	LastNameLt             *string               `json:"last_name_lt,omitempty"`
// 	LastNameLte            *string               `json:"last_name_lte,omitempty"`
// 	LastNameGt             *string               `json:"last_name_gt,omitempty"`
// 	LastNameGte            *string               `json:"last_name_gte,omitempty"`
// 	LastNameContains       *string               `json:"last_name_contains,omitempty"`
// 	LastNameNotContains    *string               `json:"last_name_not_contains,omitempty"`
// 	LastNameStartsWith     *string               `json:"last_name_starts_with,omitempty"`
// 	LastNameNotStartsWith  *string               `json:"last_name_not_starts_with,omitempty"`
// 	LastNameEndsWith       *string               `json:"last_name_ends_with,omitempty"`
// 	LastNameNotEndsWith    *string               `json:"last_name_not_ends_with,omitempty"`
// 	StripeID               *string               `json:"stripe_id,omitempty"`
// 	StripeIDNot            *string               `json:"stripe_id_not,omitempty"`
// 	StripeIDIn             []string              `json:"stripe_id_in,omitempty"`
// 	StripeIDNotIn          []string              `json:"stripe_id_not_in,omitempty"`
// 	StripeIDLt             *string               `json:"stripe_id_lt,omitempty"`
// 	StripeIDLte            *string               `json:"stripe_id_lte,omitempty"`
// 	StripeIDGt             *string               `json:"stripe_id_gt,omitempty"`
// 	StripeIDGte            *string               `json:"stripe_id_gte,omitempty"`
// 	StripeIDContains       *string               `json:"stripe_id_contains,omitempty"`
// 	StripeIDNotContains    *string               `json:"stripe_id_not_contains,omitempty"`
// 	StripeIDStartsWith     *string               `json:"stripe_id_starts_with,omitempty"`
// 	StripeIDNotStartsWith  *string               `json:"stripe_id_not_starts_with,omitempty"`
// 	StripeIDEndsWith       *string               `json:"stripe_id_ends_with,omitempty"`
// 	StripeIDNotEndsWith    *string               `json:"stripe_id_not_ends_with,omitempty"`
// 	PostsEvery             *PostWhereCondition   `json:"posts_every,omitempty"`
// 	PostsSome              *PostWhereCondition   `json:"posts_some,omitempty"`
// 	PostsNone              *PostWhereCondition   `json:"posts_none,omitempty"`
// 	FriendsEvery           *UserWhereCondition   `json:"friends_every,omitempty"`
// 	FriendsSome            *UserWhereCondition   `json:"friends_some,omitempty"`
// 	FriendsNone            *UserWhereCondition   `json:"friends_none,omitempty"`
// 	And                    []*UserWhereCondition `json:"AND,omitempty"`
// 	Or                     []*UserWhereCondition `json:"OR,omitempty"`
// 	Not                    []*UserWhereCondition `json:"NOT,omitempty"`
// }

// var _ UserWhere = (*UserWhereCondition)(nil)

// // Condition implements prisma.UserWhere
// func (u *UserWhereCondition) Condition() *UserWhereCondition {
// 	return u
// }

// // UserOrder type
// type UserOrder string

// // UserOrder enums
// const (
// 	UserOrderIDAsc         UserOrder = "id ASC"
// 	UserOrderIDDesc        UserOrder = "id DESC"
// 	UserOrderEmailAsc      UserOrder = "email ASC"
// 	UserOrderEmailDesc     UserOrder = "email DESC"
// 	UserOrderFirstNameAsc  UserOrder = "first_name ASC"
// 	UserOrderFirstNameDesc UserOrder = "first_name DESC"
// 	UserOrderLastNameAsc   UserOrder = "last_name ASC"
// 	UserOrderLastNameDesc  UserOrder = "last_name DESC"
// 	UserOrderStripeIDAsc   UserOrder = "stripe_id ASC"
// 	UserOrderStripeIDDesc  UserOrder = "stripe_id DESC"
// 	UserOrderCreatedAtAsc  UserOrder = "created_at ASC"
// 	UserOrderCreatedAtDesc UserOrder = "created_at DESC"
// 	UserOrderUpdatedAtAsc  UserOrder = "updated_at ASC"
// 	UserOrderUpdatedAtDesc UserOrder = "updated_at DESC"
// )

// // UserOrderCondition struct
// type UserOrderCondition struct {
// 	ID        *UserOrder
// 	Email     *UserOrder
// 	FirstName *UserOrder
// 	LastName  *UserOrder
// 	StripeID  *UserOrder
// }

// // UserUpdateInput struct
// type UserUpdateInput struct {
// 	Email     *string              `json:"email,omitempty"`
// 	FirstName *string              `json:"first_name,omitempty"`
// 	LastName  *string              `json:"last_name,omitempty"`
// 	StripeID  *string              `json:"stripe_id,omitempty"`
// 	Posts     *PostUpdateManyInput `json:"posts,omitempty"`
// 	Friends   *UserUpdateManyInput `json:"friends,omitempty"`
// }

// // PostUpdateManyDataInput struct
// type PostUpdateManyDataInput struct {
// 	Title *string `json:"title,omitempty"`
// }

// // UserUpdateManyInput struct
// type UserUpdateManyInput struct {
// 	Create     []UserCreateInput                      `json:"create,omitempty"`
// 	Update     []UserUpdateWithWhereUniqueNestedInput `json:"update,omitempty"`
// 	Upsert     []UserUpsertWithWhereUniqueNestedInput `json:"upsert,omitempty"`
// 	Delete     []UserWhereUniqueInput                 `json:"delete,omitempty"`
// 	Connect    []UserWhereUniqueInput                 `json:"connect,omitempty"`
// 	Set        []UserWhereUniqueInput                 `json:"set,omitempty"`
// 	Disconnect []UserWhereUniqueInput                 `json:"disconnect,omitempty"`
// 	DeleteMany []UserScalarWhereInput                 `json:"deleteMany,omitempty"`
// 	UpdateMany []UserUpdateManyWithWhereNestedInput   `json:"updateMany,omitempty"`
// }

// // UserUpdateWithWhereUniqueNestedInput struct
// type UserUpdateWithWhereUniqueNestedInput struct {
// 	Where UserWhereUniqueInput `json:"where"`
// 	Data  UserUpdateDataInput  `json:"data"`
// }

// // UserUpsertWithWhereUniqueNestedInput struct
// type UserUpsertWithWhereUniqueNestedInput struct {
// 	Where  UserWhereUniqueInput `json:"where"`
// 	Update UserUpdateDataInput  `json:"update"`
// 	Create UserCreateInput      `json:"create"`
// }

// // UserScalarWhereInput struct
// type UserScalarWhereInput struct {
// 	ID                     *string                `json:"id,omitempty"`
// 	IDNot                  *string                `json:"id_not,omitempty"`
// 	IDIn                   []string               `json:"id_in,omitempty"`
// 	IDNotIn                []string               `json:"id_not_in,omitempty"`
// 	IDLt                   *string                `json:"id_lt,omitempty"`
// 	IDLte                  *string                `json:"id_lte,omitempty"`
// 	IDGt                   *string                `json:"id_gt,omitempty"`
// 	IDGte                  *string                `json:"id_gte,omitempty"`
// 	IDContains             *string                `json:"id_contains,omitempty"`
// 	IDNotContains          *string                `json:"id_not_contains,omitempty"`
// 	IDStartsWith           *string                `json:"id_starts_with,omitempty"`
// 	IDNotStartsWith        *string                `json:"id_not_starts_with,omitempty"`
// 	IDEndsWith             *string                `json:"id_ends_with,omitempty"`
// 	IDNotEndsWith          *string                `json:"id_not_ends_with,omitempty"`
// 	Email                  *string                `json:"email,omitempty"`
// 	EmailNot               *string                `json:"email_not,omitempty"`
// 	EmailIn                []string               `json:"email_in,omitempty"`
// 	EmailNotIn             []string               `json:"email_not_in,omitempty"`
// 	EmailLt                *string                `json:"email_lt,omitempty"`
// 	EmailLte               *string                `json:"email_lte,omitempty"`
// 	EmailGt                *string                `json:"email_gt,omitempty"`
// 	EmailGte               *string                `json:"email_gte,omitempty"`
// 	EmailContains          *string                `json:"email_contains,omitempty"`
// 	EmailNotContains       *string                `json:"email_not_contains,omitempty"`
// 	EmailStartsWith        *string                `json:"email_starts_with,omitempty"`
// 	EmailNotStartsWith     *string                `json:"email_not_starts_with,omitempty"`
// 	EmailEndsWith          *string                `json:"email_ends_with,omitempty"`
// 	EmailNotEndsWith       *string                `json:"email_not_ends_with,omitempty"`
// 	FirstName              *string                `json:"first_name,omitempty"`
// 	FirstNameNot           *string                `json:"first_name_not,omitempty"`
// 	FirstNameIn            []string               `json:"first_name_in,omitempty"`
// 	FirstNameNotIn         []string               `json:"first_name_not_in,omitempty"`
// 	FirstNameLt            *string                `json:"first_name_lt,omitempty"`
// 	FirstNameLte           *string                `json:"first_name_lte,omitempty"`
// 	FirstNameGt            *string                `json:"first_name_gt,omitempty"`
// 	FirstNameGte           *string                `json:"first_name_gte,omitempty"`
// 	FirstNameContains      *string                `json:"first_name_contains,omitempty"`
// 	FirstNameNotContains   *string                `json:"first_name_not_contains,omitempty"`
// 	FirstNameStartsWith    *string                `json:"first_name_starts_with,omitempty"`
// 	FirstNameNotStartsWith *string                `json:"first_name_not_starts_with,omitempty"`
// 	FirstNameEndsWith      *string                `json:"first_name_ends_with,omitempty"`
// 	FirstNameNotEndsWith   *string                `json:"first_name_not_ends_with,omitempty"`
// 	LastName               *string                `json:"last_name,omitempty"`
// 	LastNameNot            *string                `json:"last_name_not,omitempty"`
// 	LastNameIn             []string               `json:"last_name_in,omitempty"`
// 	LastNameNotIn          []string               `json:"last_name_not_in,omitempty"`
// 	LastNameLt             *string                `json:"last_name_lt,omitempty"`
// 	LastNameLte            *string                `json:"last_name_lte,omitempty"`
// 	LastNameGt             *string                `json:"last_name_gt,omitempty"`
// 	LastNameGte            *string                `json:"last_name_gte,omitempty"`
// 	LastNameContains       *string                `json:"last_name_contains,omitempty"`
// 	LastNameNotContains    *string                `json:"last_name_not_contains,omitempty"`
// 	LastNameStartsWith     *string                `json:"last_name_starts_with,omitempty"`
// 	LastNameNotStartsWith  *string                `json:"last_name_not_starts_with,omitempty"`
// 	LastNameEndsWith       *string                `json:"last_name_ends_with,omitempty"`
// 	LastNameNotEndsWith    *string                `json:"last_name_not_ends_with,omitempty"`
// 	StripeID               *string                `json:"stripe_id,omitempty"`
// 	StripeIDNot            *string                `json:"stripe_id_not,omitempty"`
// 	StripeIDIn             []string               `json:"stripe_id_in,omitempty"`
// 	StripeIDNotIn          []string               `json:"stripe_id_not_in,omitempty"`
// 	StripeIDLt             *string                `json:"stripe_id_lt,omitempty"`
// 	StripeIDLte            *string                `json:"stripe_id_lte,omitempty"`
// 	StripeIDGt             *string                `json:"stripe_id_gt,omitempty"`
// 	StripeIDGte            *string                `json:"stripe_id_gte,omitempty"`
// 	StripeIDContains       *string                `json:"stripe_id_contains,omitempty"`
// 	StripeIDNotContains    *string                `json:"stripe_id_not_contains,omitempty"`
// 	StripeIDStartsWith     *string                `json:"stripe_id_starts_with,omitempty"`
// 	StripeIDNotStartsWith  *string                `json:"stripe_id_not_starts_with,omitempty"`
// 	StripeIDEndsWith       *string                `json:"stripe_id_ends_with,omitempty"`
// 	StripeIDNotEndsWith    *string                `json:"stripe_id_not_ends_with,omitempty"`
// 	And                    []UserScalarWhereInput `json:"AND,omitempty"`
// 	Or                     []UserScalarWhereInput `json:"OR,omitempty"`
// 	Not                    []UserScalarWhereInput `json:"NOT,omitempty"`
// }

// // UserUpdateDataInput struct
// type UserUpdateDataInput struct {
// 	Email     *string              `json:"email,omitempty"`
// 	FirstName *string              `json:"first_name,omitempty"`
// 	LastName  *string              `json:"last_name,omitempty"`
// 	StripeID  *string              `json:"stripe_id,omitempty"`
// 	Posts     *PostUpdateManyInput `json:"posts,omitempty"`
// 	Friends   *UserUpdateManyInput `json:"friends,omitempty"`
// }

// // UserUpdateManyWithWhereNestedInput struct
// type UserUpdateManyWithWhereNestedInput struct {
// 	Where UserScalarWhereInput    `json:"where"`
// 	Data  UserUpdateManyDataInput `json:"data"`
// }

// // UserUpdateManyDataInput struct
// type UserUpdateManyDataInput struct {
// 	Email     *string `json:"email,omitempty"`
// 	FirstName *string `json:"first_name,omitempty"`
// 	LastName  *string `json:"last_name,omitempty"`
// 	StripeID  *string `json:"stripe_id,omitempty"`
// }

// // UserWhereUniqueInput struct
// type UserWhereUniqueInput struct {
// 	ID    *string `json:"id,omitempty"`
// 	Email *string `json:"email,omitempty"`
// }

// // PostWhere interface
// type PostWhere interface {
// 	Condition() *PostWhereCondition
// }

// // PostWhereCondition struct
// type PostWhereCondition struct {
// 	ID                 *string                `json:"id,omitempty"`
// 	IDNot              *string                `json:"id_not,omitempty"`
// 	IDIn               []string               `json:"id_in,omitempty"`
// 	IDNotIn            []string               `json:"id_not_in,omitempty"`
// 	IDLt               *string                `json:"id_lt,omitempty"`
// 	IDLte              *string                `json:"id_lte,omitempty"`
// 	IDGt               *string                `json:"id_gt,omitempty"`
// 	IDGte              *string                `json:"id_gte,omitempty"`
// 	IDContains         *string                `json:"id_contains,omitempty"`
// 	IDNotContains      *string                `json:"id_not_contains,omitempty"`
// 	IDStartsWith       *string                `json:"id_starts_with,omitempty"`
// 	IDNotStartsWith    *string                `json:"id_not_starts_with,omitempty"`
// 	IDEndsWith         *string                `json:"id_ends_with,omitempty"`
// 	IDNotEndsWith      *string                `json:"id_not_ends_with,omitempty"`
// 	Title              *string                `json:"title,omitempty"`
// 	TitleNot           *string                `json:"title_not,omitempty"`
// 	TitleIn            []string               `json:"title_in,omitempty"`
// 	TitleNotIn         []string               `json:"title_not_in,omitempty"`
// 	TitleLt            *string                `json:"title_lt,omitempty"`
// 	TitleLte           *string                `json:"title_lte,omitempty"`
// 	TitleGt            *string                `json:"title_gt,omitempty"`
// 	TitleGte           *string                `json:"title_gte,omitempty"`
// 	TitleContains      *string                `json:"title_contains,omitempty"`
// 	TitleNotContains   *string                `json:"title_not_contains,omitempty"`
// 	TitleStartsWith    *string                `json:"title_starts_with,omitempty"`
// 	TitleNotStartsWith *string                `json:"title_not_starts_with,omitempty"`
// 	TitleEndsWith      *string                `json:"title_ends_with,omitempty"`
// 	TitleNotEndsWith   *string                `json:"title_not_ends_with,omitempty"`
// 	CommentsEvery      *CommentWhereCondition `json:"comments_every,omitempty"`
// 	CommentsSome       *CommentWhereCondition `json:"comments_some,omitempty"`
// 	CommentsNone       *CommentWhereCondition `json:"comments_none,omitempty"`
// 	And                []PostWhereCondition   `json:"AND,omitempty"`
// 	Or                 []PostWhereCondition   `json:"OR,omitempty"`
// 	Not                []PostWhereCondition   `json:"NOT,omitempty"`
// }

// var _ PostWhere = (*PostWhereCondition)(nil)

// // Condition implements prisma.PostWhere
// func (p *PostWhereCondition) Condition() *PostWhereCondition {
// 	return p
// }

// // PostConnect interface
// type PostConnect interface {
// 	Condition() *PostConnectCondition
// }

// // PostConnectCondition struct
// type PostConnectCondition struct {
// 	ID *string `json:"id,omitempty"`
// }

// // PostCreate interface
// type PostCreate interface {
// 	Input() *PostCreateInput
// }

// // PostCreateInput struct
// type PostCreateInput struct {
// 	Title    *string                 `json:"title"`
// 	Comments *CommentCreateManyInput `json:"comments,omitempty"`
// }

// // Input implements prisma.UserCreate
// func (p *PostCreateInput) Input() *PostCreateInput {
// 	return p
// }

// // PostCreateManyInput struct
// type PostCreateManyInput struct {
// 	Create  []PostCreateInput      `json:"create,omitempty"`
// 	Connect []PostWhereUniqueInput `json:"connect,omitempty"`
// }

// // CommentCreateManyInput struct
// type CommentCreateManyInput struct {
// 	Create  []CommentCreateInput      `json:"create,omitempty"`
// 	Connect []CommentWhereUniqueInput `json:"connect,omitempty"`
// }

// // CommentCreate interface
// type CommentCreate interface {
// 	Input() *CommentCreateInput
// }

// // CommentCreateInput struct
// type CommentCreateInput struct {
// 	Comment *string `json:"comment"`
// }

// // Input implements prisma.UserCreate
// func (c *CommentCreateInput) Input() *CommentCreateInput {
// 	return c
// }

// // CommentConnect interface
// type CommentConnect interface {
// 	Condition() *CommentConnectCondition
// }

// // CommentConnectCondition struct
// type CommentConnectCondition struct {
// 	ID *string `json:"id,omitempty"`
// }

// // CommentWhereUniqueInput struct
// type CommentWhereUniqueInput struct {
// 	ID *string `json:"id,omitempty"`
// }

// // PostUpdateManyInput struct
// type PostUpdateManyInput struct {
// 	Create     []PostCreateInput                      `json:"create,omitempty"`
// 	Update     []PostUpdateWithWhereUniqueNestedInput `json:"update,omitempty"`
// 	Upsert     []PostUpsertWithWhereUniqueNestedInput `json:"upsert,omitempty"`
// 	Delete     []PostWhereUniqueInput                 `json:"delete,omitempty"`
// 	Connect    []PostWhereUniqueInput                 `json:"connect,omitempty"`
// 	Set        []PostWhereUniqueInput                 `json:"set,omitempty"`
// 	Disconnect []PostWhereUniqueInput                 `json:"disconnect,omitempty"`
// 	DeleteMany []PostScalarWhereInput                 `json:"deleteMany,omitempty"`
// 	UpdateMany []PostUpdateManyWithWhereNestedInput   `json:"updateMany,omitempty"`
// }

// // PostUpdateManyWithWhereNestedInput struct
// type PostUpdateManyWithWhereNestedInput struct {
// 	Where PostScalarWhereInput    `json:"where"`
// 	Data  PostUpdateManyDataInput `json:"data"`
// }

// // PostUpdateWithWhereUniqueNestedInput struct
// type PostUpdateWithWhereUniqueNestedInput struct {
// 	Where PostWhereUniqueInput `json:"where"`
// 	Data  PostUpdateDataInput  `json:"data"`
// }

// // PostUpsertWithWhereUniqueNestedInput struct
// type PostUpsertWithWhereUniqueNestedInput struct {
// 	Where  PostWhereUniqueInput `json:"where"`
// 	Update PostUpdateDataInput  `json:"update"`
// 	Create PostCreateInput      `json:"create"`
// }

// // PostScalarWhereInput struct
// type PostScalarWhereInput struct {
// 	ID                 *string                `json:"id,omitempty"`
// 	IDNot              *string                `json:"id_not,omitempty"`
// 	IDIn               []string               `json:"id_in,omitempty"`
// 	IDNotIn            []string               `json:"id_not_in,omitempty"`
// 	IDLt               *string                `json:"id_lt,omitempty"`
// 	IDLte              *string                `json:"id_lte,omitempty"`
// 	IDGt               *string                `json:"id_gt,omitempty"`
// 	IDGte              *string                `json:"id_gte,omitempty"`
// 	IDContains         *string                `json:"id_contains,omitempty"`
// 	IDNotContains      *string                `json:"id_not_contains,omitempty"`
// 	IDStartsWith       *string                `json:"id_starts_with,omitempty"`
// 	IDNotStartsWith    *string                `json:"id_not_starts_with,omitempty"`
// 	IDEndsWith         *string                `json:"id_ends_with,omitempty"`
// 	IDNotEndsWith      *string                `json:"id_not_ends_with,omitempty"`
// 	Title              *string                `json:"title,omitempty"`
// 	TitleNot           *string                `json:"title_not,omitempty"`
// 	TitleIn            []string               `json:"title_in,omitempty"`
// 	TitleNotIn         []string               `json:"title_not_in,omitempty"`
// 	TitleLt            *string                `json:"title_lt,omitempty"`
// 	TitleLte           *string                `json:"title_lte,omitempty"`
// 	TitleGt            *string                `json:"title_gt,omitempty"`
// 	TitleGte           *string                `json:"title_gte,omitempty"`
// 	TitleContains      *string                `json:"title_contains,omitempty"`
// 	TitleNotContains   *string                `json:"title_not_contains,omitempty"`
// 	TitleStartsWith    *string                `json:"title_starts_with,omitempty"`
// 	TitleNotStartsWith *string                `json:"title_not_starts_with,omitempty"`
// 	TitleEndsWith      *string                `json:"title_ends_with,omitempty"`
// 	TitleNotEndsWith   *string                `json:"title_not_ends_with,omitempty"`
// 	And                []PostScalarWhereInput `json:"AND,omitempty"`
// 	Or                 []PostScalarWhereInput `json:"OR,omitempty"`
// 	Not                []PostScalarWhereInput `json:"NOT,omitempty"`
// }

// // PostUpdateDataInput struct
// type PostUpdateDataInput struct {
// 	Title *string `json:"title,omitempty"`
// 	// Comments *CommentUpdateManyInput `json:"comments,omitempty"`
// }

// // PostWhereUniqueInput struct
// type PostWhereUniqueInput struct {
// 	ID *string `json:"id,omitempty"`
// }

// // CommentWhereCondition struct
// type CommentWhereCondition struct {
// 	ID                   *string                 `json:"id,omitempty"`
// 	IDNot                *string                 `json:"id_not,omitempty"`
// 	IDIn                 []string                `json:"id_in,omitempty"`
// 	IDNotIn              []string                `json:"id_not_in,omitempty"`
// 	IDLt                 *string                 `json:"id_lt,omitempty"`
// 	IDLte                *string                 `json:"id_lte,omitempty"`
// 	IDGt                 *string                 `json:"id_gt,omitempty"`
// 	IDGte                *string                 `json:"id_gte,omitempty"`
// 	IDContains           *string                 `json:"id_contains,omitempty"`
// 	IDNotContains        *string                 `json:"id_not_contains,omitempty"`
// 	IDStartsWith         *string                 `json:"id_starts_with,omitempty"`
// 	IDNotStartsWith      *string                 `json:"id_not_starts_with,omitempty"`
// 	IDEndsWith           *string                 `json:"id_ends_with,omitempty"`
// 	IDNotEndsWith        *string                 `json:"id_not_ends_with,omitempty"`
// 	Comment              *string                 `json:"comment,omitempty"`
// 	CommentNot           *string                 `json:"comment_not,omitempty"`
// 	CommentIn            []string                `json:"comment_in,omitempty"`
// 	CommentNotIn         []string                `json:"comment_not_in,omitempty"`
// 	CommentLt            *string                 `json:"comment_lt,omitempty"`
// 	CommentLte           *string                 `json:"comment_lte,omitempty"`
// 	CommentGt            *string                 `json:"comment_gt,omitempty"`
// 	CommentGte           *string                 `json:"comment_gte,omitempty"`
// 	CommentContains      *string                 `json:"comment_contains,omitempty"`
// 	CommentNotContains   *string                 `json:"comment_not_contains,omitempty"`
// 	CommentStartsWith    *string                 `json:"comment_starts_with,omitempty"`
// 	CommentNotStartsWith *string                 `json:"comment_not_starts_with,omitempty"`
// 	CommentEndsWith      *string                 `json:"comment_ends_with,omitempty"`
// 	CommentNotEndsWith   *string                 `json:"comment_not_ends_with,omitempty"`
// 	And                  []CommentWhereCondition `json:"AND,omitempty"`
// 	Or                   []CommentWhereCondition `json:"OR,omitempty"`
// 	Not                  []CommentWhereCondition `json:"NOT,omitempty"`
// }
