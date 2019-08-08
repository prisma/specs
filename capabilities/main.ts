interface Photon {
  type: 'Photon'
  models: Model[]
}

interface Datasource {
  type: 'Datasource'
  provider: Provider
}

interface Provider {
  type: 'Provider'
  name: string
  operations: Operation[]
}

type Operation =
  | FindOperation
  | FindManyOperation
  | CreateOperation
  | CreateManyOperation
  | UpdateOperation
  | UpdateManyOperation
  | DeleteOperation
  | DeleteManyOperation
  | UpsertOperation

interface FindOperation {
  type: 'FindOperation'
  where: WhereMap
  select?: SelectMap
}

function findOperation(where: WhereMap, select?: SelectMap): FindOperation {
  return {
    type: 'FindOperation',
    where: where,
    select: select,
  }
}

interface FindManyOperation {
  type: 'FindManyOperation'
  where: WhereMap
  select?: SelectMap
  // order?: OrderByInput TODO
}

interface CreateOperation {
  type: 'CreateOperation'
  data: DataMap
  select?: SelectMap
}

interface CreateManyOperation {
  type: 'CreateManyOperation'
  data: DataMap
  select?: SelectMap
}

interface UpdateOperation {
  type: 'UpdateOperation'
  data: DataMap
  where: WhereMap
  select?: SelectMap
}

interface UpdateManyOperation {
  type: 'UpdateManyOperation'
  data: DataMap
  where: WhereMap
  select: SelectMap
}

interface DeleteOperation {
  type: 'DeleteOperation'
  where: WhereMap
}

interface DeleteManyOperation {
  type: 'DeleteManyOperation'
  where: WhereMap
}

interface UpsertOperation {
  type: 'UpsertOperation'
  create: DataMap
  update: DataMap
  where: WhereMap
}

interface DataMap {
  type: 'DataMap'
  properties: DataMapProperty[]
}

interface DataMapProperty {
  type: 'DataMapProperty'
  field: FieldReference
  value: DataExpression
}

type DataExpression = Literal | CallFunction | DataBinaryExpression | DataMapProperty

// NOTE: These will be created by the capability list
interface DataLiteral {
  type: 'DataLiteral'
  // TODO: this might change, we can accept many more inputs
  // and have prisma translate them to literals
  value: Literal
}

// NOTE: These will be created by the capability list
interface DataFunction {
  type: 'DataFunction'
  name: string
  arguments: [] // TODO
}

interface DataBinaryExpression {
  type: 'DataBinaryExpression'
  operator: '+' | '-' | '*' | '/'
  left: DataExpression
  right: DataExpression
}

interface WhereMap {
  type: 'WhereMap'
  properties: WhereMapProperty[]
}

function where(...props: WhereMapProperty[]): WhereMap {
  return {
    type: 'WhereMap',
    properties: props,
  }
}

interface WhereMapProperty {
  type: 'WhereMapProperty'
  field: FieldReference
  value: WhereConditional
}

type WhereConditional = WhereUnaryExpression | WhereConditionalExpression

interface WhereUnaryExpression {
  type: 'WhereUnaryExpression'
  operation: '!'
  expression: WhereExpression
}

function whereNot(expression: WhereExpression): WhereUnaryExpression {
  return {
    type: 'WhereUnaryExpression',
    operation: '!',
    expression: expression,
  }
}

interface WhereConditionalExpression {
  type: 'WhereConditionalExpression'
  operation: '&&' | '||' | '=' | '>' | '>=' | '<' | '<='
  left: WhereExpression
  right: WhereExpression
}

function whereAnd(left: WhereExpression, right: WhereExpression): WhereConditionalExpression {
  return {
    type: 'WhereConditionalExpression',
    operation: '&&',
    right: right,
    left: left,
  }
}

function whereOr(left: WhereExpression, right: WhereExpression): WhereConditionalExpression {
  return {
    type: 'WhereConditionalExpression',
    operation: '||',
    right: right,
    left: left,
  }
}

function whereEqual(left: WhereExpression, right: WhereExpression): WhereConditionalExpression {
  return {
    type: 'WhereConditionalExpression',
    operation: '=',
    right: right,
    left: left,
  }
}

function whereGt(left: WhereExpression, right: WhereExpression): WhereConditionalExpression {
  return {
    type: 'WhereConditionalExpression',
    operation: '>',
    right: right,
    left: left,
  }
}

function whereGte(left: WhereExpression, right: WhereExpression): WhereConditionalExpression {
  return {
    type: 'WhereConditionalExpression',
    operation: '>=',
    right: right,
    left: left,
  }
}

function whereLt(left: WhereExpression, right: WhereExpression): WhereConditionalExpression {
  return {
    type: 'WhereConditionalExpression',
    operation: '<',
    right: right,
    left: left,
  }
}

function whereLte(left: WhereExpression, right: WhereExpression): WhereConditionalExpression {
  return {
    type: 'WhereConditionalExpression',
    operation: '<=',
    right: right,
    left: left,
  }
}

type WhereExpression = FieldReference | WhereConditional | Literal | WhereFunction | WhereBinaryExpression

// NOTE: These will be created by the capability list
// interface WhereLiteral {
//   type: 'WhereLiteral'
//   value: Literal
// }

// NOTE: These will be created by the capability list
interface WhereFunction {
  type: 'WhereFunction'
  name: string
  arguments: [] // TODO
}

interface WhereBinaryExpression {
  type: 'WhereBinaryExpression'
  operator: '+' | '-' | '*' | '/'
  left: WhereExpression
  right: WhereExpression
}

interface SelectMap {
  type: 'SelectMap'
  properties: SelectMapProperty[]
}

interface SelectMapProperty {
  type: 'SelectMapProperty'
  // TODO: relax, if we want to be able to have custom namedaliases:
  // { select: { rightNow: "now()" } }
  field: FieldReference
  value: BooleanLiteral
}

interface Model {
  type: 'Model'
  name: string
  datasource: Datasource
  fields: Field[]
}

interface Field {
  type: 'Field'
  name: string
  dataType: DataType
  comment?: string
  attributes: Attribute[]
}

type DataType = StringType | BooleanType | IntType | FloatType | DateTimeType | OptionalType | ListType

interface StringType {
  type: 'StringType'
}

function stringType(): StringType {
  return {
    type: 'StringType',
  }
}

interface BooleanType {
  type: 'BooleanType'
}

function booleanType(): BooleanType {
  return {
    type: 'BooleanType',
  }
}

interface IntType {
  type: 'IntType'
}

function intType(): IntType {
  return {
    type: 'IntType',
  }
}

interface FloatType {
  type: 'FloatType'
}

function floatType(): FloatType {
  return {
    type: 'FloatType',
  }
}

interface DateTimeType {
  type: 'DateTimeType'
}

function datetimeType(): DateTimeType {
  return {
    type: 'DateTimeType',
  }
}

interface OptionalType {
  type: 'OptionalType'
  elementType: DataType
}

function optionalType(elementType: DataType): OptionalType {
  return {
    type: 'OptionalType',
    elementType: elementType,
  }
}

interface ListType {
  type: 'ListType'
  elementType: DataType
}

function listType(elementType: DataType): ListType {
  return {
    type: 'ListType',
    elementType: elementType,
  }
}

interface Attribute {
  type: 'Attribute'
  name: string
  arguments: AttributeArgument[]
}

type AttributeArgument = Literal | FieldReference

interface FieldReference {
  type: 'FieldReference'
  model: string
  field: string
}

function fieldReference(model: string, field: string): FieldReference {
  return {
    type: 'FieldReference',
    model: model,
    field: field,
  }
}

type Literal = ListLiteral | StringLiteral | BooleanLiteral | IntLiteral | FloatLiteral | DateTimeLiteral

interface ListLiteral {
  type: 'ListLiteral'
  literal: Literal
}

function listLiteral(literal: Literal): ListLiteral {
  return {
    type: 'ListLiteral',
    literal: literal,
  }
}

interface StringLiteral {
  type: 'StringLiteral'
  value: string
}

function stringLiteral(value: string): StringLiteral {
  return {
    type: 'StringLiteral',
    value: value,
  }
}

interface BooleanLiteral {
  type: 'BooleanLiteral'
  value: boolean
}

function booleanLiteral(value: boolean): BooleanLiteral {
  return {
    type: 'BooleanLiteral',
    value: value,
  }
}

interface IntLiteral {
  type: 'IntLiteral'
  value: number
}

function intLiteral(value: number): IntLiteral {
  return {
    type: 'IntLiteral',
    value: value,
  }
}

interface FloatLiteral {
  type: 'FloatLiteral'
  value: number
}

function floatLiteral(value: number): FloatLiteral {
  return {
    type: 'FloatLiteral',
    value: value,
  }
}

interface DateTimeLiteral {
  type: 'DateTimeLiteral'
  value: Date
}

function datetimeLiteral(value: Date): DateTimeLiteral {
  return {
    type: 'DateTimeLiteral',
    value: value,
  }
}

interface CallFunction {
  type: 'CallFunction'
  name: string
  arguments: CallFunctionArgument[]
}

interface CallFunctionArgument {
  type: 'CallFunctionArgument'
  name: string
  value: FieldReference | Literal
}

function photon(models: Model[]): Photon {
  return {
    type: 'Photon',
    models: models,
  }
}

function provider(name: string, ...operations: Operation[]): Provider {
  return {
    type: 'Provider',
    name: name,
    operations: operations,
  }
}

function datasource(provider: Provider): Datasource {
  return {
    type: 'Datasource',
    provider: provider,
  }
}

function model(name: string, datasource: Datasource, fields: Field[] = []): Model {
  return {
    type: 'Model',
    name: name,
    datasource: datasource,
    fields: fields,
  }
}

function field(name: string, dataType: DataType, ...attributes: Attribute[]): Field {
  return {
    type: 'Field',
    name: name,
    dataType: dataType,
    attributes: attributes || [],
  }
}

function attribute(name: string, ...args: AttributeArgument[]): Attribute {
  return {
    type: 'Attribute',
    name: name,
    arguments: args || [],
  }
}

function attributeArgument(args: AttributeArgument[]): Attribute {
  return {
    type: 'Attribute',
    name: name,
    arguments: args || [],
  }
}

interface CapabilityTypeMap {
  type: 'CapabilityTypeMap'
  datasourceType: CapabilityDataSourceType
  coreType: DataType
}

function capabilityTypeMap(datasourceType: CapabilityDataSourceType, coreType: DataType): CapabilityTypeMap {
  return {
    type: 'CapabilityTypeMap',
    datasourceType: datasourceType,
    coreType: coreType,
  }
}

type CapabilityDataSourceType = CapabilityScalarType | CapabilityListType | CapabilityOptionalType

interface CapabilityListType {
  type: 'CapabilityListType'
  elementType: CapabilityDataSourceType
}

function capabilityListType(elementType: CapabilityDataSourceType): CapabilityListType {
  return {
    type: 'CapabilityListType',
    elementType: elementType,
  }
}

interface CapabilityScalarType {
  type: 'CapabilityScalarType'
  name: string
}

function capabilityScalarType(name: string): CapabilityScalarType {
  return {
    type: 'CapabilityScalarType',
    name: name,
  }
}

interface CapabilityOptionalType {
  type: 'CapabilityOptionalType'
  elementType: CapabilityDataSourceType
}

// TODO: I figured a tree might be nice for lift, since optional doesn't really have a specific
// type in postgres. But maybe it's better to just map to a string
function capabilityOptionalType(elementType: CapabilityDataSourceType): CapabilityOptionalType {
  return {
    type: 'CapabilityOptionalType',
    elementType: elementType,
  }
}

interface CapabilityExpressionMap {
  type: 'CapabilityExpressionMap'
  // TODO
}

interface CapabilityFunctionMap {
  type: 'CapabilityTypeMap'
  // TODO
}

interface Capabilities {
  type: 'Capabilities'
  // TODO: add support for diffentiating between inputs, outputs, and filter arguments
  dataTypeMap: CapabilityTypeMap[]
  expressionMap: CapabilityExpressionMap[]
  functionMap: CapabilityFunctionMap[]
}

const Postgres: Capabilities = {
  type: 'Capabilities',

  dataTypeMap: [
    // text
    capabilityTypeMap(capabilityScalarType('text'), stringType()),
    // nullable text
    capabilityTypeMap(capabilityOptionalType(capabilityScalarType('text')), optionalType(stringType())),
    // text[]
    capabilityTypeMap(capabilityListType(capabilityScalarType('text')), listType(stringType())),

    // int
    capabilityTypeMap(capabilityScalarType('int'), intType()),
    // nullable int
    capabilityTypeMap(capabilityOptionalType(capabilityScalarType('int')), optionalType(intType())),
    // int[]
    capabilityTypeMap(capabilityListType(capabilityScalarType('int')), listType(intType())),

    // float
    capabilityTypeMap(capabilityScalarType('float4'), floatType()),
    // nullable float
    capabilityTypeMap(capabilityOptionalType(capabilityScalarType('float4')), optionalType(floatType())),
    // float[]
    capabilityTypeMap(capabilityListType(capabilityScalarType('float4')), listType(floatType())),

    // datetime
    capabilityTypeMap(capabilityScalarType('timestamp'), datetimeType()),
    // nullable datetime
    capabilityTypeMap(capabilityOptionalType(capabilityScalarType('timestamp')), optionalType(datetimeType())),
    // datetime[]
    capabilityTypeMap(capabilityListType(capabilityScalarType('timestamp')), listType(datetimeType())),

    // boolean
    capabilityTypeMap(capabilityScalarType('boolean'), booleanType()),
    // nullable boolean
    capabilityTypeMap(capabilityOptionalType(capabilityScalarType('boolean')), optionalType(booleanType())),
    // boolean[]
    capabilityTypeMap(capabilityListType(capabilityScalarType('boolean')), listType(booleanType())),
  ],

  expressionMap: [],
  functionMap: [],
}

console.log(JSON.stringify(Postgres, null, 2))

// const postgres = datasource(provider('postgres'), findOperation(where(whereEqual(fieldReference()))))
const postgres = datasource(provider('postgres'))

// TODO: support models that may be spread across many datasources

const ast = photon([
  model('Blog', postgres, [
    field('id', intType(), attribute('id')),
    field('website', stringType()),
    field('created_at', stringType()), // TODO: default(now())
  ]),
  model('Post', postgres, [
    field('id', intType(), attribute('id')),
    field('blog_id', intType(), attribute('id')), // TODO: references blogs.id
    field('title', stringType()),
    field('created_at', stringType()), // TODO: default(now())
  ]),
  model('Comment', postgres, [
    field('id', intType(), attribute('id')),
    field('post_id', intType(), attribute('id')), // TODO: references posts.id
    field('comment', stringType()),
    field('created_at', stringType()), // TODO: default(now())
  ]),
])
