import * as t from './types'

// TODO: limit conditions to only acceptable arguments

const capabilities = t.Capabilities(
  t.Postgres(
    t.Create(
      t.Input(
        t.Property(t.StringFieldType(), t.StringLiteralType()),
        t.Property(t.IntegerFieldType(), t.IntegerLiteralType()),
        t.Property(t.BooleanFieldType(), t.BooleanLiteralType()),
        t.Property(t.DateTimeFieldType(), t.DateTimeLiteralType()),
        t.Property(t.FloatFieldType(), t.FloatLiteralType()),
        // e.g. { data: { amount: 5 } }
        t.Property(t.FloatFieldType(), t.IntegerLiteralType()),
        // e.g. { data: { first_name: "lower(MATT)" } }
        t.Property(t.StringFieldType(), t.StringFunction('lower', t.StringFieldType()))
      ),
      t.Output(
        t.Property(t.StringFieldType(), t.StringLiteralType()),
        t.Property(t.IntegerFieldType(), t.IntegerLiteralType()),
        t.Property(t.BooleanFieldType(), t.BooleanLiteralType()),
        t.Property(t.DateTimeFieldType(), t.DateTimeLiteralType()),
        t.Property(t.FloatFieldType(), t.FloatLiteralType()),
        // supports return an integer from a float field
        // TODO: does this make sense for outputs?
        t.Property(t.FloatFieldType(), t.IntegerLiteralType()),
        // { select: first_name: "lower(first_name)" }
        t.Property(t.StringFieldType(), t.StringFunction('lower', t.StringFieldType()))
      )
    ),
    t.FindOne(
      t.Filter(
        // boolean filters
        t.BooleanFieldType(),
        t.BooleanLiteralType(),
        t.BooleanFunction('and', t.BooleanFieldType(), t.BooleanFieldType()),
        t.BooleanFunction('or', t.BooleanFieldType(), t.BooleanFieldType()),
        t.BooleanFunction('xor', t.BooleanFieldType(), t.BooleanFieldType()),
        t.BooleanFunction('equals', t.BooleanFieldType(), t.BooleanFieldType()),
        t.BooleanFunction('notEquals', t.BooleanFieldType(), t.BooleanFieldType()),

        // string filters
        t.BooleanFunction('equals', t.StringFieldType(), t.StringLiteralType()),
        t.BooleanFunction('notEquals', t.BooleanFieldType(), t.BooleanFieldType()),
        t.BooleanFieldType()
      ),
      t.Output()
    )
  ),
  t.SQLite()
)

// t.InputCondition(
//   t.FieldComparison(t.StringField(), '=', t.StringExpression()),
//   t.FieldComparison(t.StringField(), '!=', t.StringExpression()),
//   t.FieldComparison(t.StringField(), '>', t.StringExpression()),
//   t.FieldComparison(t.StringField(), '<', t.StringExpression()),
//   t.FieldComparison(t.StringField(), '>=', t.StringExpression()),
//   t.FieldComparison(t.StringField(), '<=', t.StringExpression()),
//   t.FieldComparison(t.BooleanField(), '=', t.BooleanExpression())
//   t.FieldComparison(t.BooleanField(), '=', t.BooleanField())
// ),
// t.OutputCondition()

// maybe abstract to t.Query("findOne", ...) & t.Condition("where", ...)
// t.FindOne(
//   t.FilterCondition(
//     // booleans
//     t.FunctionSignature(t.Identifier('and'), [t.BooleanType(), t.BooleanType()], t.BooleanType()),
//     t.FunctionSignature(t.Identifier('or'), [t.BooleanType(), t.BooleanType()], t.BooleanType()),
//     t.FunctionSignature(t.Identifier('equals'), [t.BooleanType(), t.BooleanType()], t.BooleanType()),
//     t.FunctionSignature(t.Identifier('notEquals'), [t.BooleanType(), t.BooleanType()], t.BooleanType()),

//     // strings
//     t.FunctionSignature(t.Identifier('equals'), [t.StringType(), t.StringType()], t.BooleanType()),
//     t.FunctionSignature(t.Identifier('notEquals'), [t.StringType(), t.StringType()], t.BooleanType()),
//     t.FunctionSignature(t.Identifier('greaterThan'), [t.StringType(), t.StringType()], t.BooleanType()),
//     t.FunctionSignature(t.Identifier('notEquals'), [t.StringType(), t.StringType()], t.BooleanType()),

//     // TODO: this shouldn't work
//     // t.StringType()

//     t.BooleanType()
//   )
// )
// t.FindMany(t.WhereCondition(), t.SelectCondition()),
// t.Update(t.DataCondition(), t.WhereCondition(), t.SelectCondition()),
// t.UpdateMany(t.DataCondition(), t.WhereCondition(), t.SelectCondition()),
// t.Delete(t.WhereCondition()),
// t.DeleteMany(t.WhereCondition())
