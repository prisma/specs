Schema = list:DeclarationList* _ {
  return {
    type:"schema",
    declarations: list
  }
}

DeclarationList = _ decl:Declaration {
  return decl
}

Declaration = Model / Datasource / Generator / Enum

Model = "model" sp name:Identifier sp "{" _ fields:ModelList* _ "}" {
  return {
    kind: "model",
    name: name,
    fields: fields,
    attributes: []
  }
}

Datasource = "datasource" sp name:Identifier sp "{" _ DatasourceList* _ "}" {
  return {
    kind: "datasource",
    name: name,
    properties: []
  }
}

Generator = "generator" sp name:Identifier sp "{" _ GeneratorList* _ "}" {
  return {
    kind: "generator",
    name: name,
    properties: []
  }
}

Enum = "enum" sp name:Identifier sp "{" _ EnumList* _ "}"{
  return {
    kind: "enum",
    name: name,
    values: [],
    directives: []
  }
}

ModelList = _ field:Field {
  return field
}

DatasourceList = PropertyList
GeneratorList = PropertyList
EnumList = "a"

PropertyList = _ Identifier _ "=" _ Literal

Field = name:Identifier sp type:FieldType attributes:AttributeList* {
  return {
    kind: "field",
    name: name,
    type: type,
    attributes: attributes
  }
}

Identifier = head:[A-Za-z] tail:[_A-Za-z0-9]* {
  return {
    kind: "identifier",
    name: [head].concat(tail).join('')
  }
}

FieldType = Optional / List / Type

Optional = type:(List / Type) "?" {
  return {
    kind: "optional",
    type: type
  }
}


List = type:Type "[]" {
  return {
    kind: "list",
    type: type
  }
}

Type = CoreType / ReferenceType

CoreType = name:("String" / "Float" / "Int" / "DateTime" / "Boolean") {
  return {
    kind: "type",
    name: name
  }
}

ReferenceType = Identifier

AttributeList = sp attr:Attribute {
  return attr
}

// TODO: this is incomplete

Attribute = "@" name:Identifier args:Arguments? {
  return {
    kind:"attribute",
    name: name,
    arguments: args || []
  }
}

Arguments = "(" args:ArgumentList* ")" {
  return args
}

ArgumentList = _ argument:Argument _ ","? _ {
  return argument
}

Argument = Literal / Identifier

Literal = StringLiteral / NumberLiteral

StringLiteral = '"' literal:[A-Za-z ]+ '"' {
  return {
    kind: "string",
    value: literal.join("")
  }
}

NumberLiteral = literal:[0-9]+ {
  return {
    kind: "number",
    value: literal.join("")
  }
}

sp = [ \t]+

_ "whitespace"
  = [ \t\n\r]*