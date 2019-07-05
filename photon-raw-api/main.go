package main

import "fmt"

type raw struct {
	User *rawUser
}

type rawUser struct {
	Email     string
	FirstName string
}

func (r *rawUser) String() string {
	return "users"
}

// Raw API
var Raw = &raw{
	User: &rawUser{
		Email:     "email",
		FirstName: "email",
	},
}

func main() {
	fmt.Printf("select %s, %s from %s\n", Raw.User.Email, Raw.User.FirstName, Raw.User)
}
