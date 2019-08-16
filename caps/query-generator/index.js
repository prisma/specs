const parser = require('./schema/parser')
const visitor = require('./schema/visitor')

const ast = parser.parse(`
datasource pg {
  provider = "postgresql"
}

model Team {
  id       Int       @id
  name     String
  standups Standup[]
}

model User {
  id      Int     @id
  standup Standup

  username   String  @unique
  first_name String?
  last_name  String?
}

model Standup {
  id    Int    @id
  users User[]
  name  String
}

model Report {
  id   Int   @id
  user User?

  yesterday String?
  today     String?
  estimated String?
  blocking  String?
}
`)

const caps = {
  kind: 'QueryDocument',
  queries: [
    { kind: 'Create', conditions: [] },
    {
      kind: 'FindOne',
      conditions: [
        {
          kind: 'FilterCondition',
          expressions: [
            {
              kind: 'FunctionSignature',
              name: { kind: 'Identifier', name: 'and' },
              arguments: [{ kind: 'BooleanType' }, { kind: 'BooleanType' }],
              returns: { kind: 'BooleanType' },
            },
            {
              kind: 'FunctionSignature',
              name: { kind: 'Identifier', name: 'or' },
              arguments: [{ kind: 'BooleanType' }, { kind: 'BooleanType' }],
              returns: { kind: 'BooleanType' },
            },
            {
              kind: 'FunctionSignature',
              name: { kind: 'Identifier', name: 'equals' },
              arguments: [{ kind: 'BooleanType' }, { kind: 'BooleanType' }],
              returns: { kind: 'BooleanType' },
            },
            {
              kind: 'FunctionSignature',
              name: { kind: 'Identifier', name: 'notEquals' },
              arguments: [{ kind: 'BooleanType' }, { kind: 'BooleanType' }],
              returns: { kind: 'BooleanType' },
            },
            {
              kind: 'FunctionSignature',
              name: { kind: 'Identifier', name: 'equals' },
              arguments: [{ kind: 'StringType' }, { kind: 'StringType' }],
              returns: { kind: 'BooleanType' },
            },
            {
              kind: 'FunctionSignature',
              name: { kind: 'Identifier', name: 'notEquals' },
              arguments: [{ kind: 'StringType' }, { kind: 'StringType' }],
              returns: { kind: 'BooleanType' },
            },
            {
              kind: 'FunctionSignature',
              name: { kind: 'Identifier', name: 'greaterThan' },
              arguments: [{ kind: 'StringType' }, { kind: 'StringType' }],
              returns: { kind: 'BooleanType' },
            },
            {
              kind: 'FunctionSignature',
              name: { kind: 'Identifier', name: 'notEquals' },
              arguments: [{ kind: 'StringType' }, { kind: 'StringType' }],
              returns: { kind: 'BooleanType' },
            },
          ],
        },
      ],
    },
  ],
}

const DMMF = [
  {
    model: 'User',
    queries: [
      { kind: 'Create', conditions: [] },
      {
        kind: 'FindOne',
        conditions: [
          {
            kind: 'FilterCondition',
            expressions: [
              {
                kind: 'FunctionSignature',
                name: { kind: 'Identifier', name: 'and' },
                arguments: [{ kind: 'BooleanType' }, { kind: 'BooleanType' }],
                returns: { kind: 'BooleanType' },
              },
              {
                kind: 'FunctionSignature',
                name: { kind: 'Identifier', name: 'or' },
                arguments: [{ kind: 'BooleanType' }, { kind: 'BooleanType' }],
                returns: { kind: 'BooleanType' },
              },
              {
                kind: 'FunctionSignature',
                name: { kind: 'Identifier', name: 'equals' },
                arguments: [{ kind: 'BooleanType' }, { kind: 'BooleanType' }],
                returns: { kind: 'BooleanType' },
              },
              {
                kind: 'FunctionSignature',
                name: { kind: 'Identifier', name: 'notEquals' },
                arguments: [{ kind: 'BooleanType' }, { kind: 'BooleanType' }],
                returns: { kind: 'BooleanType' },
              },
              {
                kind: 'FunctionSignature',
                name: { kind: 'Identifier', name: 'equals' },
                arguments: [{ kind: 'StringType' }, { kind: 'StringType' }],
                returns: { kind: 'BooleanType' },
              },
              {
                kind: 'FunctionSignature',
                name: { kind: 'Identifier', name: 'notEquals' },
                arguments: [{ kind: 'StringType' }, { kind: 'StringType' }],
                returns: { kind: 'BooleanType' },
              },
              {
                kind: 'FunctionSignature',
                name: { kind: 'Identifier', name: 'greaterThan' },
                arguments: [{ kind: 'StringType' }, { kind: 'StringType' }],
                returns: { kind: 'BooleanType' },
              },
              {
                kind: 'FunctionSignature',
                name: { kind: 'Identifier', name: 'notEquals' },
                arguments: [{ kind: 'StringType' }, { kind: 'StringType' }],
                returns: { kind: 'BooleanType' },
              },
            ],
          },
        ],
      },
    ],
  },
]

let DMMF = [
  {
    model: User,
    queries: [
      {
        query: 'findOne',
        filters: [{}],
      },
    ],
  },
]

console.dir(ast, { depth: Infinity })

// const capabilityMap = {}

// visitor.visit(ast, {
//   field(field) {
//     console.log('GOT FIELD', field)
//   },
// })
