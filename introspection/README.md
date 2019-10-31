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
- [Steps and Parts](#steps-and-parts)
- [Implementation](#implementation)
  - [Ids](#ids)
  - [Relations](#relations)
    - [Underlying structure](#underlying-structure)
    - [Naming relations](#naming-relations)
    - [Naming relationfields](#naming-relationfields)
  - [Default Values](#default-values)
  - [Different Types of List Fields](#different-types-of-list-fields)
  - [Different Enum Implementations](#different-enum-implementations)
  - [Hidden Tables which are not rendered into the datamodel](#hidden-tables-which-are-not-rendered-into-the-datamodel)

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
Slimming this down again to only mention cases the PSL -> SQL spec does not cover yet. 

### Ids
* We identify two possible id strategies: NONE, or AUTO if the column is autoincrementing
* In the second case we try to capture the sequence name, allocation size and initial value
* The datamodel parser is currently very restrictive with the valid @id combinations
    * `id: String @id(strategy:NONE)` for a non-auto-incrementing text id field is not accepted
    * The datamodel validator requires the addition of `@default(cuid())` `@default(uuid())`

### Relations
We are using foreign key constraints to infer relations. There could of course be relations without Foreign Key constraints (Prisma Mongo for example) but so far we only interpret something as a relation if there is a FK.

#### Underlying structure
* Relations can be either inferred from columns holding foreign key constraints or from explicit join tables (again with FKs)
* Only Prisma style join tables are ignored and rolled into relations directly joining the models, others will interpret the table as intermediate model connected by two One2Many relations.  

#### Naming relations
* We name all relations during introspection. 
* If the name matches the default name `ModelAToModelB` (in lexicographical order) the printer will omit that name. 
* If we need to disambiguate we go for the convention `ModelAToModelB_fieldWithFK`. 
* For Prisma Many2Many relations we take the name of the join table.

#### Naming relationfields
* If the relation is One2One or One2Many the SQL schema only contains one column with the FK whose name we can use for the relationfield. 
* In the case of Many2Many relation fields there are no names available to us. 
* We want to offer backrelation fields, therefore we need conventions to create at least one, sometimes two relationfield names.
* If the added relationfield is singular we camelcase the name of the opposing Model  e.g `post`
* If the added relationfield is plural we camelcase and pluralize the name of the opposing model e.g. `posts` (this can lead to ugly names when pluralization fails)
* If we need to generate several relationfields targeting the same opposing model we append the relation name `posts_RelationName`
* If the relation is a self relation we append the name of referencing field to the normally generated name i.e. `user_husband`
 
### Default Values
* For Datetime, converting defaults like CurrentTimeStamp to -> expression like `now()` is not yet implemented

### Different Types of List Fields
* Prisma scalar list tables are converted into list fields and the tables are not rendered
* Native Arrays are not yet supported (not sure here, probably the parsing but not the query engine)
* Lists implemented as tables are not recognized and rendered as normal models. 

### Different Enum Implementations
* Native enums are not recognized yet
* Check constraints are not recognized as enums
* Extra tables are not recognized as enums


### Hidden Tables which are not rendered into the datamodel 
* Migration table
* Sequence tables backing ids
* Prisma style Many2Many relation join tables
* Prisma style scalar list tables
