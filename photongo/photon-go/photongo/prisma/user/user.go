package user

import "github.com/prisma/photon-go/prisma"

// Users table
const Users = "users"

// ID string
type ID string

// Email string
type Email string

// New user input
func New() *prisma.UserInput {
	return &prisma.UserInput{}
}

// Role enum
var Role = struct {
	ADMIN prisma.UserRole
}{
	ADMIN: "ADMIN",
}

// Connect user input
func Connect() *prisma.UserConnect {
	return &prisma.UserConnect{}
}

// Where condition
func Where() *prisma.UserWhere {
	return &prisma.UserWhere{}
}

// Order condition
func Order() *prisma.UserOrder {
	return &prisma.UserOrder{}
}

// First condition
func First(first int) *prisma.UserFirst {
	return &prisma.UserFirst{}
}

// Select a user
func Select(v interface{}) *prisma.UserSelect {
	return &prisma.UserSelect{}
}

// WithPosts conditions
func WithPosts(conditions ...prisma.PostCondition) *prisma.UserWith {
	return &prisma.UserWith{}
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
