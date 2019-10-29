# Introspection

- Owner: @matthewmueller 
- Stakeholders: @do4gr @timsuchanek
- State: 
  - Spec: In Progress 🚧
  - Implementation: Unknown ❔
  
TODO

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Motivation](#motivation)
- [Functionality](#functionality)
- [Implementation](#implementation)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Motivation

For greenfield projects, we offer a selection of starter kits to the user that they can select during prisma2 init. For brownfield projects, we eventually want to get to a similar level of sophistication and e.g. offer a to auto-generate a GraphQL server that's based on the existing database schema of the user.

The introspection allows an user to examine an existing database and generate a Prisma schema for it. The database could have been created by Prisma or with other tools / manually. The goal is to have all the information included in the db-schema available in the Prisma schema. If this works perfectly it should be possible to create an equivalent database schema from the Prisma schema. 

## Functionality

- Introspect database from database connection
- Introspect database from database dump (`.sql` file) TODO Really?
- Make manual decisions on non obvious representations in schema TODO Really?
- Goal: Database -> Introspection -> create database from schema (migration via lift?) => identical to where we started

## Steps and Parts

Introspection happens in the following steps:

* Prisma connects to the database in question using a connection string
* The schema describer connector queries the database schema and turns it into an internal db-schema representation
* The introspection connector takes that db-schema representation and converts it into Prismas internal datamodel representation
* The internal datamodel representation gets rendered into the Prisma schema

The formats for the connection strings are discussed in the schema spec. https://github.com/prisma/specs/tree/master/schema#supported-fields
The conversion from the sql-schema to the Prisma internal datamodel changes the information from a description of the data layout / connection in the db to the data structure used to generate the API. This means that some tables / collections that are present in the database are omitted while some fields that have no representation in the database are generated. 

* Backrelation fields for relations that store Ids in the model table
* Omitting Prisma style M:N relation tables and adding relationfields to their models
* Omitting Prisma style scalar list tables and instead adding the list fields to their models

The logic Prisma uses to create names for relations / relation fields in cases where they are not specified in the database is also described in the Schema spec. https://github.com/prisma/specs/tree/master/schema#relations

The renderer then takes the internal datamodel representation and prints it. While doing this, it omits printing out some information if it follows Prismas opionionation. Examples include:

* not printing relation names for unambigous relations if their name matches a Prisma style M:N relation table '_PostToUser'
* not printing the @relation(references: id) if the foreign key is on the lexicographically lower model

## Implementation

### Ids
* are identified by the primary key status
* can be single column than they get the @id annotation
* or multi-column, than they get a @@id block annotation
* we identify two possible id strategies: NONE, or AUTO if the column is autoincrementing
* in the second case we try to capture the sequence name, allocation size and initial value
* the datamodel parser is currently very restrictive with the valid @id combinations
    * `id: String @id(strategy:NONE)` for a non-auto-incrementing text id field is no accepted
    * the datamodel validator requires the addition of `@default(cuid())` `@default(uuid())`

### Relations

#### Underlying structure
* relations can be either inferred from columns holding foreign key constraints or from explicit join tables
* only Prisma style join tables are ignored and rolled into relations directly joining the models, others will interpret the table as intermediate model  

#### Naming relations
#### Naming relationfields
#### Which side has the fk
#### Cardinality of relation
#### Backrelationfields

### Foreign Keys
* compound foreign key constraints for a relation are currently not specced correctly in PSL 


### Unique / Indexes 
* single field unique indexes are converted to @unique annotations on the field they affect except for
    * relationfields (here they indicate a One2One relation)
    * id fields, the @id annotation already implies the @unique
* multi field unique indexes are converted in a @@unique block anotation, the fields themselves do not get an annotation

### Default Values
* read it if possible
* DateTime -> expression not yet implemented

### Data Types
* As datatypes Prisma only supports the GQL types ID, String, Int, Float, Boolean, Json as well as Prismas Datetime
* Therefore the schema describer maps the underlying database types to these datatypes. This is db specific.
    * this can cause data entry errors at runtime due to loss of constraints during conversions such as varchar(20) -> String or smallint -> Int 

### Lists
* Prisma 
* native Arrays
* lists as tables?

### Enums



### Hidden Tables which are not rendered into the datamodel 
* Migration table
* Sequence tables backing ids
* Prisma style Many2Many relation join tables
* Prisma style scalar list tables
