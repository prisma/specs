package post

import (
	"time"

	"github.com/matthewmueller/prisma/specs/photongo/photon-go/prisma"
)

// Title field
type Title string

// CreatedAt field
type CreatedAt time.Time

// Post model
type Post struct {
}

// New post input
func New() *prisma.PostInput {
	return &prisma.PostInput{}
}

// // Condition interface
// type Condition interface {
// 	condition() *condition
// }

// // contains condition state
// type condition struct {
// }

// Where condition
func Where() *prisma.PostWhere {
	return &prisma.PostWhere{}
}

// Connect condition
func Connect() *prisma.PostConnect {
	return &prisma.PostConnect{}
}

// First condition
func First(first int) *prisma.PostFirst {
	return &prisma.PostFirst{}
}

// After condition
func After(after string) *prisma.PostAfter {
	return &prisma.PostAfter{}
}

// Before condition
func Before(before string) *prisma.PostBefore {
	return &prisma.PostBefore{}
}

// Skip condition
func Skip(skip int) *prisma.PostSkip {
	return &prisma.PostSkip{}
}

// Last condition
func Last(last int) *prisma.PostLast {
	return &prisma.PostLast{}
}

// WithComments comments
func WithComments(conditions ...*prisma.CommentCondition) *prisma.PostWith {
	return nil
}

// Find a post by a condition
func Find(db prisma.Client, conditions ...prisma.PostCondition) (post *prisma.Post, err error) {
	return post, err
}

// FindMany posts by a condition
func FindMany(db prisma.Client, conditions ...prisma.PostCondition) (posts []*prisma.Post, err error) {
	return posts, err
}

// Create a post
func Create(db prisma.Client, input *prisma.PostInput) (post *prisma.Post, err error) {
	return post, err
}

// Update a post
func Update(db prisma.Client, post *prisma.PostInput, where *prisma.PostWhere) (*prisma.Post, error) {
	return nil, nil
}

// UpdateMany a posts
func UpdateMany(db prisma.Client, post *prisma.PostInput, where *prisma.PostWhere) (*prisma.Post, error) {
	return nil, nil
}

// Delete a post
func Delete(db prisma.Client, where *prisma.PostWhere) (*prisma.Post, error) {
	return nil, nil
}

// DeleteMany posts
func DeleteMany(db prisma.Client, where *prisma.PostWhere) (*prisma.Post, error) {
	return nil, nil
}

// // Input for a user
// type Input struct {
// 	i *prisma.UserCreateInput
// }

// var _ prisma.UserCreate = (*Input)(nil)

// // Input gets the user input
// func (i *Input) Input() *prisma.UserCreateInput {
// 	return i.i
// }

// // Email input
// func (i *Input) Email(email string) *Input {
// 	return i
// }

// // FirstName input
// func (i *Input) FirstName(firstName string) *Input {
// 	return i
// }

// // LastName input
// func (i *Input) LastName(lastName string) *Input {
// 	return i
// }

// // ConnectPosts connects with an existing post
// func (i *Input) ConnectPosts(posts ...prisma.PostConnect) *Input {
// 	return i
// }

// // CreatePosts creates a new post
// func (i *Input) CreatePosts(posts ...prisma.PostCreate) *Input {
// 	return i
// }

// // Create a user
// func Create(db prisma.Client, user prisma.UserCreate) (*prisma.User, error) {
// 	input := user.Input()
// 	_ = input
// 	return nil, nil
// }

// // type CreateConditions interface {
// // 	condition() *CreateCondition
// // }

// // // CreateCondition struct
// // type CreateCondition struct {
// // }

// // Find a user by some conditions
// func Find(db prisma.Client, conds ...FindConditions) (*prisma.User, error) {
// 	conditions := findConditionMerge(conds)
// 	_ = conditions
// 	return nil, nil
// }

// // FindConditions interface
// type FindConditions interface {
// 	condition() *FindCondition
// }

// // FindCondition struct
// type FindCondition struct {
// 	Where   *prisma.UserWhereCondition `json:"where,omitempty"`
// 	OrderBy *prisma.UserOrderCondition `json:"order_by,omitempty"`
// 	Skip    *int                       `json:"skip,omitempty"`
// 	After   *string                    `json:"after,omitempty"`
// 	Before  *string                    `json:"before,omitempty"`
// 	First   *int                       `json:"first,omitempty"`
// 	Last    *int                       `json:"last,omitempty"`
// }

// // implement FindConditions
// func (f *FindCondition) condition() *FindCondition {
// 	return f
// }

// func findConditionMerge(conds []FindConditions) *FindCondition {
// 	var base FindCondition
// 	// later non-nulls override earlier non-nulls
// 	for _, icond := range conds {
// 		cond := icond.condition()
// 		if cond.Where != nil {
// 			base.Where = cond.Where
// 		}
// 		if cond.OrderBy != nil {
// 			base.OrderBy = cond.OrderBy
// 		}
// 		if cond.Skip != nil {
// 			base.Skip = cond.Skip
// 		}
// 		if cond.After != nil {
// 			base.After = cond.After
// 		}
// 		if cond.Before != nil {
// 			base.Before = cond.Before
// 		}
// 		if cond.First != nil {
// 			base.First = cond.First
// 		}
// 		if cond.Last != nil {
// 			base.Last = cond.Last
// 		}
// 	}
// 	return &base
// }

// // Where Condition
// func Where() *WhereCondition {
// 	return &WhereCondition{&prisma.UserWhereCondition{}}
// }

// // WhereCondition struct
// type WhereCondition struct {
// 	p *prisma.UserWhereCondition
// }

// var _ FindConditions = (*WhereCondition)(nil)
// var _ prisma.UserWhere = (*WhereCondition)(nil)

// // Implements user.FindConditions
// func (w *WhereCondition) condition() *FindCondition {
// 	return &FindCondition{Where: w.p}
// }

// // Condition Implements user.FindConditions
// func (w *WhereCondition) Condition() *prisma.UserWhereCondition {
// 	return w.p
// }

// // ID fn
// func (w *WhereCondition) ID(id string) *WhereCondition {
// 	w.p.ID = &id
// 	return w
// }

// // FirstName fn
// func (w *WhereCondition) FirstName(firstName string) *WhereCondition {
// 	w.p.FirstName = &firstName
// 	return w
// }

// // LastName fn
// func (w *WhereCondition) LastName(lastName string) *WhereCondition {
// 	w.p.LastName = &lastName
// 	return w
// }

// // SomePosts fn
// func (w *WhereCondition) SomePosts(posts prisma.PostWhere) *WhereCondition {
// 	return w
// }

// // Skip n users
// func Skip(n int) *SkipCondition {
// 	return &SkipCondition{&n}
// }

// // SkipCondition struct
// type SkipCondition struct {
// 	n *int
// }

// var _ FindConditions = (*SkipCondition)(nil)

// func (s *SkipCondition) condition() *FindCondition {
// 	return &FindCondition{Skip: s.n}
// }

// // Order fn
// func Order() *OrderCondition {
// 	return &OrderCondition{&prisma.UserOrderCondition{}}
// }

// // OrderCondition struct
// type OrderCondition struct {
// 	p *prisma.UserOrderCondition
// }

// var _ FindConditions = (*OrderCondition)(nil)

// func (o *OrderCondition) condition() *FindCondition {
// 	return &FindCondition{OrderBy: o.p}
// }

// // EmailAsc orders email in ascending order
// func (o *OrderCondition) EmailAsc() *OrderCondition {
// 	emailAsc := prisma.UserOrderEmailAsc
// 	o.p.Email = &emailAsc
// 	return o
// }

// // FirstNameDesc orders first name in descending order
// func (o *OrderCondition) FirstNameDesc() *OrderCondition {
// 	firstNameDesc := prisma.UserOrderFirstNameDesc
// 	o.p.FirstName = &firstNameDesc
// 	return o
// }

// // Update the prisma user
// func Update(db prisma.Client, conds ...UpdateConditions) (*prisma.User, error) {
// 	return nil, nil
// }

// // UpdateConditions interface
// type UpdateConditions interface {
// 	condition() *UpdateCondition
// }

// // UpdateCondition struct
// type UpdateCondition struct {
// 	Data  *prisma.UserUpdateInput      `json:"data"`
// 	Where *prisma.UserWhereUniqueInput `json:"where"`
// }
