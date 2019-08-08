## Photon

```
interface Photon {
  type: "Photon"
  models: [ Model ]
}
```

## Model

```
interface Model {
  type: "Model"
  name: Identifier
  operations: [ Operation ]
}
```

## Operations

```
interface Operation { }
```

### FindOne

```
interface FindOne implements Operation {
  type: "Find"
  select: OutputArgument
  where: FilterArgument
}
```

```
interface FindMany implements Operation {
  type: "FindMany"
  select: SelectMap
  where: WhereMap
  orderBy: OrderByMap
}
```

```
interface Create implements Operation {
  type: "Create"
  data: DataMap
  select: SelectMap
}
```

```
interface Update implements Operation {
  type: "Update"
  data: DataMap
  where: WhereMap
  select: SelectMap
}
```

```
interface UpdateMany implements Operation {
  type: "UpdateMany"
  data: DataMap
  where: WhereMap
}
```

```
interface Upsert implements Operation {
  type: "Upsert"
  data: DataMap
  where: WhereMap
  select: SelectMap
}
```

```
interface Delete implements Operation {
  type: "Delete"
  where: WhereMap
}
```

```
interface DeleteMany implements Operation {
  type: "DeleteMany"
  where: WhereMap
}
```

## DataMap

```
interface DataMap {
  type: "DataMap"
  fields: [ DataMapProperty ]
}
```

## Data Map Property

```
interface DataMapProperty {
  type: "DataMapProperty"
  key: Field
  Value: DataExpression
}
```

## Data Expression

```
interface DataExpression { }
```

## Data Literal

Literals are toggle-able based on the list of capabilities for the given datasource.

```
interface DataLiteral implements DataExpression {
  type: "Literal"
  value: string | boolean | null | int | float
}
```

## Data Function

Functions are toggle-able based on the list of capabilities for the given datasource.

```
interface DataFunction implements DataExpression {
  type: "DataFunction",
  name: string
  arguments: [ DataExpression ]
}
```

## Data Binary Expression

Operators are toggle-able based on the list of capabilities for the given datasource.

```
interface DataBinaryExpression implements DataExpression {
  type: "DataBinaryExpression"
  operator: "+" | "-" | "*" | "/"
  left: DataExpression
  right: DataExpression
}
```

## Data Array Expression

Embedded arrays are toggle-able as a group based on the list of capabilities for the given datasource.

```
interface DataArrayExpression implements DataExpression {
  type: "DataArrayExpression"
  elements: [ DataExpression ]
}
```

## Data Map Expression

Embedded Maps are toggle-able as a group based on the list of capabilities for the given datasource.

```
interface DataMapExpression implements DataExpression {
  type: "DataMapExpression"
  properties: [ DataExpression ]
}
```

## Where Map

```
interface WhereMap {
  type: "WhereMap"
  condition: WhereConditionalExpression
}
```

## WhereConditionalExpression

```
interface WhereConditionalExpression {}
```

## WhereBoolean

```
interface Boolean implements WhereConditionalExpression, WhereExpression {
  type: "Boolean"
  value: true | false
}
```

## Where Binary Expression

```
interface WhereBinaryExpression implements WhereExpression {
  type: "WhereBinaryExpression"
  operator: "=" | ">" | ">=" | "<" | "<="
  left: WhereExpression
  right: WhereExpression
}
```

## WhereBoolean

```
interface Boolean implements WhereConditionalExpression, WhereExpression {
  type: "Boolean"
  value: true | false
}
```

## WhereExpression

```
interface WhereExpression {}
```

## Where Binary Expression

```
interface WhereBinaryExpression implements WhereExpression {
  type: "WhereBinaryExpression"
  operator: "+" | "-" | ">=" | "<" | "<="
  left: WhereExpression
  right: WhereExpression
}
```

## Output Argument

```
interface OutputArgument {
  type: "OutputArgument"
  fields: [ OutputFieldProperty ]
}
```

## Output Field Property

```
interface OutputFieldProperty {
  type: "OutputFieldProperty"
  key: Field
  Value: OutputExpression
}
```

## Output Literal

Literals are toggle-able based on the list of capabilities for the given datasource.

```
interface OutputLiteral implements OutputExpression {
  type: "Literal"
  value: string | boolean | null | int | float
}
```

## Output Function

Functions are toggle-able based on the list of capabilities for the given datasource.

```
interface OutputFunction implements OutputExpression {
  type: "OutputFunction",
  name: string
  arguments: [ OutputExpression ]
}
```

## Output Binary Expression

Operators are toggle-able based on the list of capabilities for the given datasource.

```
interface OutputBinaryExpression implements OutputExpression {
  type: "OutputBinaryExpression"
  operator: "+" | "-" | "*" | "/"
  left: OutputExpression
  right: OutputExpression
}
```

## Output Array Expression

Embedded arrays are toggle-able as a group based on the list of capabilities for the given datasource.

```
interface OutputArrayExpression implements OutputExpression {
  type: "OutputArrayExpression"
  elements: [ OutputExpression ]
}
```

## Output Object Expression

Embedded objects are toggle-able as a group based on the list of capabilities for the given datasource.

```
interface OutputObjectExpression implements OutputExpression {
  type: "OutputObjectExpression"
  properties: [ OutputExpression ]
}
```

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

## Output Arguments

```
interface OutputArgument {
  type: "OutputArgument"
  fields: FieldList
}
```

## Filter Arguments

```
interface FilterArgument {
  type: "FilterArgument"
}
```

<!--
## Expression

```
interface Expression { }
```

Many nodes below implement this -->

## BinaryExpression

```
interface BinaryExpression<ExpressionType> {
  type: "BinaryExpression"
  operator: "+" | "-" | "*" | "/"
  left: Expression
  right: Expression
}
```

## Field Property

```
interface FieldProperty implements Expression {
  Field: Field
  Expression: Expression
}
```

## Field

```
interface Field implements Expression {
  type: "Field"
  name: string
}
```

## Literal

```
interface Literal implements InputExpression {
  type: "Literal"
  value: string | boolean | null | int | float
}
```
