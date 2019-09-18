# Introspection

- Owner: @matthewmueller 
- Stakeholders: @do4gr @timsuchanek
- State: 
  - Spec: In Progress 🚧
  - Implementation: Unknown ❔

When a user gets started with Prisma in a brownfield project, they can let Prisma introspect their database to generate the initial Prisma data model definition.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Motivation](#motivation)
- [Implementation](#implementation)
  - [Current](#current)
  - [Future 👽](#future-)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Motivation

For greenfield projects, we offer a selection of starter kits to the user that they can select during prisma2 init. For brownfield projects, we eventually want to get to a similar level of sophistication and e.g. offer a to auto-generate a GraphQL server that's based on the existing database schema of the user.

The introspection allows an user to examine an existing database and generate a Prisma schema for it. The database could have been created by Prisma or with other tools / manually. The goal is to have all the information included in the db-schema available in the Prisma schema. If this works perfectly it should be possible to create an equivalent database schema from the Prisma schema. 

## Implementation

Introspection happens in the following steps:

* Prisma connects to the database in question using a connection string
* The schema describer connector queries the database schema and turns it into an internal db-schema representation
* The introspection connector takes that db-schema representation and converts it into Prismas internal datamodel representation
* The internal datamodel representation gets rendered into the Prisma schema

The formats for the connection strings are discussed in the schema spec. https://github.com/prisma/specs/blob/master/schema/Readme.md
The conversion from the sql-schema to the Prisma internal datamodel changes the information from a description of the data layout / connection in the db to the data structure used to generate the API. This means that some tables / collections that are present in the database are omitted while some fields that have no representation in the database are generated. 

* Backrelation fields for relations that store Ids in the model table
* Omitting Prisma style M:N relation tables and adding relationfields to their models
* Omitting Prisma style scalar list tables and instead adding the list fields to their models

The logic Prisma uses to create names for relations / relation fields in cases where they are not specified in the database is also described in the Schema spec. 

The renderer then takes the internal datamodel representation and prints it. While doing this, it omits printing out some information if it follows Prismas opionionation. Examples include:

* not printing relation names for unambigous relations if their name matches a Prisma style M:N relation table '_PostToUser'
* not printing the @relation(references: id) if the foreign key is on the lexicographically lower model

### Current


### Future 👽

