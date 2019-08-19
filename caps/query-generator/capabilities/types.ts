export type Capabilities = {
  kind: 'Capabilities'
  datasources: Datasource[]
}

export type Datasource = {
  kind: 'Datasource'
  name: string
  queries: Query[]
}

export type Query = {
  kind: 'Query'
  name: string
  input?: Input
  output?: Output
  filter?: Filter
}

type Input = {
  kind: 'Input'
  properties: Property[]
}

type Output = {
  kind: 'Output'
  properties: Property[]
}

type Property = {
  kind: 'Property'
  key: FieldType
  value: TypeExpression
}

type Filter = {
  kind: 'Filter'
  expressions: BooleanExpression[]
}

export type ArithmeticOperand = MultiplyOperand | DivideOperand | AddOperand | SubtractOperand
export type MultiplyOperand = '*'
export type DivideOperand = '/'
export type AddOperand = '+'
export type SubtractOperand = '-'

export type Comparison =
  | EqualComparison
  | NotEqualComparison
  | GreaterThanComparison
  | GreaterThanEqualComparison
  | LessThanComparison
  | LessThanEqualComparison

export type EqualComparison = '='
export type NotEqualComparison = '!='
export type GreaterThanComparison = '>'
export type GreaterThanEqualComparison = '>='
export type LessThanComparison = '<'
export type LessThanEqualComparison = '<='

export type LogicalOperand = AndOperand | OrOperand
export type AndOperand = '&&'
export type OrOperand = '||'

export type TypeExpression = BooleanExpression | StringExpression | IntegerExpression | FloatExpression | DateTimeExpression
export type StringExpression = StringFieldType | StringLiteralType | StringFunction
export type IntegerExpression = IntegerFieldType | IntegerLiteralType | IntegerFunction
export type FloatExpression = FloatFieldType | FloatLiteralType | FloatFunction
export type BooleanExpression = BooleanFieldType | BooleanLiteralType | BooleanFunction
export type DateTimeExpression = DateTimeFieldType | DateTimeLiteralType | DateTimeFunction

export type LiteralType = StringLiteralType | IntegerLiteralType | FloatLiteralType | BooleanLiteralType | DateTimeLiteralType
export type FieldType = StringFieldType | IntegerFieldType | FloatFieldType | BooleanFieldType | DateTimeFieldType

export type StringFieldType = {
  kind: 'StringFieldType'
}

export type StringLiteralType = {
  kind: 'StringLiteralType'
}

export type StringFunction = {
  kind: 'StringFunction'
  name: string
  args: TypeExpression[]
}

export type IntegerFieldType = {
  kind: 'IntegerFieldType'
}

export type IntegerLiteralType = {
  kind: 'IntegerLiteralType'
}

export type IntegerFunction = {
  kind: 'IntegerFunction'
  name: string
  args: TypeExpression[]
}

export type FloatFieldType = {
  kind: 'FloatFieldType'
}

export type FloatLiteralType = {
  kind: 'FloatLiteralType'
}

export type FloatFunction = {
  kind: 'FloatFunction'
  name: string
  args: TypeExpression[]
}

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
