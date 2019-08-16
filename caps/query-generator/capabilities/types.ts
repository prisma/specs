type QueryDocument = {
  kind: 'QueryDocument'
  queries: Query[]
}

// type Query = FindOne | FindMany | Create | Update | UpdateMany | Upsert | Delete | DeleteMany
// type FindOne = {
//   kind: 'FindOne'
//   conditions: Condition[]
// }

// type FindMany = {
//   kind: 'FindMany'
//   conditions: Condition[]
// }

// type Create = {
//   kind: 'Create'
//   conditions: Condition[]
// }

// type Update = {
//   kind: 'Update'
//   conditions: Condition[]
// }

// type UpdateMany = {
//   kind: 'UpdateMany'
//   conditions: Condition[]
// }

// type Upsert = {
//   kind: 'Upsert'
//   conditions: Condition[]
// }

// type Delete = {
//   kind: 'Delete'
//   conditions: Condition[]
// }

// type DeleteMany = {
//   kind: 'DeleteMany'
//   conditions: Condition[]
// }

// type Condition = InputCondition | FilterCondition | OutputCondition

// type InputCondition = {
//   kind: 'InputCondition'
//   expressions: Expression[]
// }

// type FilterCondition = {
//   kind: 'FilterCondition'
//   expressions: Expression[]
// }

// type OutputCondition = {
//   kind: 'OutputCondition'
//   // fieldComparisons: FieldComparison[]
// }

type ArithmeticOperand = MultiplyOperand | DivideOperand | AddOperand | SubtractOperand
type MultiplyOperand = '*'
type DivideOperand = '/'
type AddOperand = '+'
type SubtractOperand = '-'

type Comparison = EqualComparison | NotEqualComparison | GreaterThanComparison | GreaterThanEqualComparison | LessThanComparison | LessThanEqualComparison
type EqualComparison = '='
type NotEqualComparison = '!='
type GreaterThanComparison = '>'
type GreaterThanEqualComparison = '>='
type LessThanComparison = '<'
type LessThanEqualComparison = '<='

type LogicalOperand = AndOperand | OrOperand
type AndOperand = '&&'
type OrOperand = '||'

// // type BooleanExpression = BooleanType | BooleanComparison

// // type BooleanComparison = {
// //   kind: 'BooleanComparison'
// //   left: Expression
// //   comparison: Comparison
// //   right: Expression
// // }

// type Expression = FunctionSignature | Type

// type FunctionSignature = {
//   kind: 'FunctionSignature'
//   name: Identifier
//   arguments: Expression[]
//   returns: Expression
// }

// type Field = StringField | IntegerField | FloatField | BooleanField | DateTimeField

// type StringField = {
//   kind: 'StringField'
// }

// type IntegerField = {
//   kind: 'IntegerField'
// }

// type FloatField = {
//   kind: 'FloatField'
// }

// type BooleanField = {
//   kind: 'BooleanField'
// }

// type DateTimeField = {
//   kind: 'DateTimeField'
// }

type TypeExpression = BooleanExpression | StringExpression | IntegerExpression | FloatExpression | DateTimeExpression
type LiteralType = StringLiteralType | IntegerLiteralType | FloatLiteralType | BooleanLiteralType | DateTimeLiteralType
type FieldType = StringFieldType | IntegerFieldType | FloatFieldType | BooleanFieldType | DateTimeFieldType
// type Type = StringType | IntegerType | FloatType | BooleanType | DateTimeType

type StringExpression = StringFieldType | StringLiteralType | StringFunction

export function StringFunction(name: string, ...args: TypeExpression[]): StringFunction {
  return {
    kind: 'StringFunction',
    name,
    args,
  }
}

export function StringFieldType(): StringFieldType {
  return {
    kind: 'StringFieldType',
  }
}

export function StringLiteralType(): StringLiteralType {
  return {
    kind: 'StringLiteralType',
  }
}

type StringFieldType = {
  kind: 'StringFieldType'
}

type StringLiteralType = {
  kind: 'StringLiteralType'
}

type StringFunction = {
  kind: 'StringFunction'
  name: string
  args: TypeExpression[]
}

export function IntegerFieldType(): IntegerFieldType {
  return {
    kind: 'IntegerFieldType',
  }
}

export function IntegerLiteralType(): IntegerLiteralType {
  return {
    kind: 'IntegerLiteralType',
  }
}

type IntegerExpression = IntegerFieldType | IntegerLiteralType | IntegerFunction

type IntegerFieldType = {
  kind: 'IntegerFieldType'
}

type IntegerLiteralType = {
  kind: 'IntegerLiteralType'
}

type IntegerFunction = {
  kind: 'IntegerFunction'
  name: string
  args: TypeExpression[]
}

export function FloatFieldType(): FloatFieldType {
  return {
    kind: 'FloatFieldType',
  }
}

export function FloatLiteralType(): FloatLiteralType {
  return {
    kind: 'FloatLiteralType',
  }
}

type FloatExpression = FloatFieldType | FloatLiteralType | FloatFunction

type FloatFieldType = {
  kind: 'FloatFieldType'
}

type FloatLiteralType = {
  kind: 'FloatLiteralType'
}

type FloatFunction = {
  kind: 'FloatFunction'
  name: string
  args: TypeExpression[]
}

export function BooleanFunction(name: string, ...args: TypeExpression[]): BooleanFunction {
  return {
    kind: 'BooleanFunction',
    name,
    args,
  }
}

export function BooleanFieldType(): BooleanFieldType {
  return {
    kind: 'BooleanFieldType',
  }
}

export function BooleanLiteralType(): BooleanLiteralType {
  return {
    kind: 'BooleanLiteralType',
  }
}

type BooleanExpression = BooleanFieldType | BooleanLiteralType | BooleanFunction

type BooleanFieldType = {
  kind: 'BooleanFieldType'
}

type BooleanLiteralType = {
  kind: 'BooleanLiteralType'
}

type BooleanFunction = {
  kind: 'BooleanFunction'
  name: string
  args: TypeExpression[]
}

export function DateTimeFieldType(): DateTimeFieldType {
  return {
    kind: 'DateTimeFieldType',
  }
}

export function DateTimeLiteralType(): DateTimeLiteralType {
  return {
    kind: 'DateTimeLiteralType',
  }
}

type DateTimeExpression = DateTimeFieldType | DateTimeLiteralType | DateTimeFunction

type DateTimeFieldType = {
  kind: 'DateTimeFieldType'
}

type DateTimeLiteralType = {
  kind: 'DateTimeLiteralType'
}

type DateTimeFunction = {
  kind: 'DateTimeFunction'
  name: string
  args: TypeExpression[]
}

// type BooleanExpression = {
//   kind: 'BooleanExpression'
//   left: Expression
//   comparison: Comparison
//   right: Expression
// }

// type FieldComparison = {
//   kind: 'FieldComparison'
//   left: FieldReference
//   comparison: Comparison
//   right: Expression
// }

// type Expression =
//   | StringExpression
//   | BooleanExpression
//   | IntegerExpression
//   | FloatExpression
//   | DateTimeExpression
//   | FunctionDeclaration
//   | FieldComparison
//   | LogicalExpression
//   | ArithmeticExpression

// type FunctionDeclaration = {
//   kind: 'FunctionDeclaration'
//   name: Identifier
//   arguments: Expression[]
// }

// type ArithmeticExpression = {
//   kind: 'ArithmeticExpression'
//   left: Expression
//   operand: ArithmeticOperand
//   right: Expression
// }

// type LogicalExpression = {
//   kind: 'BinaryExpression'
//   left: Expression
//   operand: LogicalOperand
//   right: Expression
// }

// type Identifier = {
//   kind: 'Identifier'
//   name: string
// }

// type StringExpression = {
//   kind: 'StringExpression'
// }

// type BooleanExpression = {
//   kind: 'BooleanExpression'
// }

// type IntegerExpression = {
//   kind: 'IntegerExpression'
// }

// type FloatExpression = {
//   kind: 'FloatExpression'
// }

// type DateTimeExpression = {
//   kind: 'DateTimeExpression'
// }

type Capabilities = {
  kind: 'Capabilities'
  datasources: Datasource[]
}

export function Capabilities(...datasources: Datasource[]): Capabilities {
  return {
    kind: 'Capabilities',
    datasources,
  }
}

type Datasource = {
  kind: 'Datasource'
  name: string
  queries: Query[]
}

export function Postgres(...queries: Query[]): Datasource {
  return {
    kind: 'Datasource',
    name: 'Postgres',
    queries: queries,
  }
}
export function SQLite(...queries: Query[]): Datasource {
  return {
    kind: 'Datasource',
    name: 'SQLite',
    queries: queries,
  }
}

type Query = {
  kind: 'Query'
  name: string
  input?: Input
  output?: Output
  filter?: Filter
}

export function Create(input: Input, output: Output): Query {
  return {
    kind: 'Query',
    name: 'Create',
    input,
    output,
  }
}

type Input = {
  kind: 'input'
  properties: Property[]
}

export function Input(...properties: Property[]): Input {
  return {
    kind: 'input',
    properties,
  }
}

type Output = {
  kind: 'output'
  properties: Property[]
}

export function Output(...properties: Property[]): Output {
  return {
    kind: 'output',
    properties,
  }
}

type Filter = {
  kind: 'filter'
  expressions: BooleanExpression[]
}

export function Filter(...expressions: BooleanExpression[]): Filter {
  return {
    kind: 'filter',
    expressions,
  }
}

export function Property(key: FieldType, value: TypeExpression): Property {
  return {
    kind: 'Property',
    key: key,
    value: value,
  }
}

type Property = {
  kind: 'Property'
  key: FieldType
  value: TypeExpression
}

// type Input = {
//   kind: 'input'
//   key: Field
//   value: Type
// }

export function FindOne(filter: Filter, output: Output): Query {
  return {
    kind: 'Query',
    name: 'FindOne',
    filter,
    output,
  }
}

// export function FindMany(...conditions: Condition[]): Query {
//   return {
//     kind: 'Query',
//     name: 'FindMany',
//     conditions,
//   }
// }

// export function And(conditions: BooleanResult[], returns: BooleanResult): BooleanFunction {
//   return {
//     kind: 'BooleanExpression',
//     name: 'and',
//     returns,
//   }
// }

// type StructType = StructFieldType

// type FieldMap = {
//   kind: 'FieldMap'
//   fields: FieldProperty[]
// }

// type FieldProperty = {
//   kind: 'FieldProperty'

// }

// export function Query(name: string, ...conditions: Condition[]): Query {
//   return {
//     kind: 'Query',
//     name,
//     conditions,
//   }
// }

// type Condition = {
//   kind: 'Condition'
//   name: string
// }

// export function QueryDocument(...queries: Query[]): QueryDocument {
//   return {
//     kind: 'QueryDocument',
//     queries,
//   }
// }

// export function FindOne(...conditions: Condition[]): FindOne {
//   return {
//     kind: 'FindOne',
//     conditions,
//   }
// }

// export function FindMany(...conditions: Condition[]): FindMany {
//   return {
//     kind: 'FindMany',
//     conditions,
//   }
// }

// export function Create(...conditions: Condition[]): Create {
//   return {
//     kind: 'Create',
//     conditions,
//   }
// }

// export function Update(...conditions: Condition[]): Update {
//   return {
//     kind: 'Update',
//     conditions,
//   }
// }

// export function UpdateMany(...conditions: Condition[]): UpdateMany {
//   return {
//     kind: 'UpdateMany',
//     conditions,
//   }
// }

// export function Upsert(...conditions: Condition[]): Upsert {
//   return {
//     kind: 'Upsert',
//     conditions,
//   }
// }

// export function Delete(...conditions: Condition[]): Delete {
//   return {
//     kind: 'Delete',
//     conditions,
//   }
// }

// export function DeleteMany(...conditions: Condition[]): DeleteMany {
//   return {
//     kind: 'DeleteMany',
//     conditions,
//   }
// }

// export function InputCondition(...expressions: Expression[]): InputCondition {
//   return {
//     kind: 'InputCondition',
//     expressions,
//   }
// }

// // export function OutputCondition(...fieldComparisons: FieldComparison[]): OutputCondition {
// //   return {
// //     kind: 'OutputCondition',
// //     fieldComparisons,
// //   }
// // }

// export function FilterCondition(...expressions: Expression[]): FilterCondition {
//   return {
//     kind: 'FilterCondition',
//     expressions,
//   }
// }

// // export function BooleanComparison(left: Expression, comparison: Comparison, right: Expression): BooleanComparison {
// //   return {
// //     kind: 'BooleanComparison',
// //     left,
// //     comparison,
// //     right,
// //   }
// // }

// export function FunctionSignature(name: Identifier, args: Expression[], returns: Expression): FunctionSignature {
//   return {
//     kind: 'FunctionSignature',
//     name,
//     arguments: args,
//     returns,
//   }
// }

// export function StringType(): StringType {
//   return {
//     kind: 'StringType',
//   }
// }

// export function BooleanType(): BooleanType {
//   return {
//     kind: 'BooleanType',
//   }
// }

// export function IntegerType(): IntegerType {
//   return {
//     kind: 'IntegerType',
//   }
// }

// export function FloatType(): FloatType {
//   return {
//     kind: 'FloatType',
//   }
// }

// export function DateTimeType(): DateTimeType {
//   return {
//     kind: 'DateTimeType',
//   }
// }

// export function StringComparison(left: FieldReference, comparison: Comparison, right: Expression): FieldComparison {
//   return {
//     kind: 'FieldComparison',
//     left,
//     comparison,
//     right,
//   }
// }

// export function StringFieldComparison(left: StringField)

// Expression FieldReference = StringField | BooleanField | IntegerField | FloatField | DateTimeField

// export function StringField(): StringField {
//   return {
//     kind: 'StringField',
//   }
// }

// export function BooleanField(): BooleanField {
//   return {
//     kind: 'BooleanField',
//   }
// }

// export function IntegerField(): IntegerField {
//   return {
//     kind: 'IntegerField',
//   }
// }

// export function FloatField(): FloatField {
//   return {
//     kind: 'FloatField',
//   }
// }

// export function DateTimeField(): DateTimeField {
//   return {
//     kind: 'DateTimeField',
//   }
// }

// export function FunctionDeclaration(name: Identifier, ...args: Expression[]): FunctionDeclaration {
//   return {
//     kind: 'FunctionDeclaration',
//     name,
//     arguments: args,
//   }
// }

// // export function BinaryExpression(left: Expression, operation: Operation, right: Expression): BinaryExpression {
// //   return {
// //     kind: 'BinaryExpression',
// //     left,
// //     operation,
// //     right,
// //   }
// // }

// export function Identifier(name: string): Identifier {
//   return {
//     kind: 'Identifier',
//     name,
//   }
// }

// type StringExpression =

// export function StringExpression(): StringExpression {
//   return {
//     kind: 'StringExpression',
//   }
// }

// export function BooleanExpression(): BooleanExpression {
//   return {
//     kind: 'BooleanExpression',

//   }
// }

// export function IntegerExpression(): IntegerExpression {
//   return {
//     kind: 'IntegerExpression',
//   }
// }

// export function FloatExpression(): FloatExpression {
//   return {
//     kind: 'FloatExpression',
//   }
// }
