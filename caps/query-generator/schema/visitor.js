exports.visit = visit

function visit(ast, map) {
  const declarations = ast.declarations
  for (let i = 0; i < declarations.length; i++) {
    const declaration = declarations[i]
    visitDeclaration(declaration, map)
  }
}

function visitDeclaration(declaration, map) {
  if (map[declaration.kind]) {
    const next = map[declaration.kind](declaration)
    if (!next) return
  }

  visitIdentifier(declaration.name, map)

  const properties = declaration.properties || []
  for (let index = 0; index < properties.length; index++) {
    const property = properties[index]
    visitProperty(property, map)
  }

  const fields = declaration.fields || []
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index]
    visitField(field, map)
  }

  const attributes = declaration.attributes || []
  for (let index = 0; index < attributes.length; index++) {
    const attribute = attributes[index]
    visitAttribute(attribute, map)
  }
}

function visitProperty(property, map) {
  if (map[property.kind]) {
    const next = map[property.kind](property)
    if (!next) return
  }
}

function visitField(field, map) {
  if (map[field.kind]) {
    const next = map[field.kind](field)
    if (!next) return
  }

  visitIdentifier(declaration.name, map)
  visitType(declaration.type, map)

  const attributes = declaration.attributes || []
  for (let index = 0; index < attributes.length; index++) {
    const attribute = attributes[index]
    visitAttribute(attribute, map)
  }
}

function visitAttribute(attribute, map) {
  if (map[attribute.kind]) {
    const next = map[attribute.kind](attribute)
    if (!next) return
  }
}

function visitType(type, map) {
  if (map[type.kind]) {
    const next = map[type.kind](type)
    if (!next) return
  }

  if (type.type) {
    visitType(type.type, map)
  }
}

function visitIdentifier(identifier, map) {
  if (map[identifier.kind]) {
    const next = map[identifier.kind](identifier)
    if (!next) return
  }
}
