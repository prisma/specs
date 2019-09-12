# Specs

- Owner: @janpio
- Stakeholders: @schickling, @matthewmueller, @divyenduz
- State:
    - Spec: Stable ✅
    - Implementation: In Progress 👷‍

This specification specs what *Specs* are, [who](#who) creates and maintains them, [what](#what) we usually put in there and [when](#when) specs should actually be created and what timeframe they target. It also describes how we organize these specs in this `specs` repository.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Spec?](#spec)
  - [Specs at Prisma](#specs-at-prisma)
  - [Functional vs. technical specs](#functional-vs-technical-specs)
  - [Pain Points](#pain-points)
- [Who](#who)
  - [For who?](#for-who)
  - [Who writes specs?](#who-writes-specs)
    - [Who can update specs?](#who-can-update-specs)
  - [Owner](#owner)
  - [Stakeholders](#stakeholders)
- [What](#what)
- [What should be specified in a spec?](#what-should-be-specified-in-a-spec)
  - [How are spec files structured?](#how-are-spec-files-structured)
  - [Functional vs. Technical Specification](#functional-vs-technical-specification)
  - [Top Level State](#top-level-state)
    - [Spec State](#spec-state)
    - [Implementation State](#implementation-state)
  - [State in Spec](#state-in-spec)
  - [How do we specify which individual parts of a spec are not implemented yet?](#how-do-we-specify-which-individual-parts-of-a-spec-are-not-implemented-yet)
  - [Folders and Filenames](#folders-and-filenames)
  - [Where should we link to specs?](#where-should-we-link-to-specs)
- [When](#when)
  - [When are specs created?](#when-are-specs-created)
  - [Do specs reflect the present or the future?](#do-specs-reflect-the-present-or-the-future)
- [Spec Workflow](#spec-workflow)
- [How](#how)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Spec?

"Spec" is short for "specification", which Wikipedia defines as:

> A specification often refers to a set of documented requirements to be satisfied by a material, design, product, or service. A specification is often a type of technical standard. [...] The word _specification_ is broadly defined as "to state explicitly or in detail" or "to be specific"

### Specs at Prisma

For Prisma specs are documents collected in the [`prisma/specs` repository](https://github.com/prisma/specs) that define different parts of Prisma: tools, features, APIs, file formats and even the specs and their process themselves (you are reading that one right now).

### Functional vs. technical specs

Our usage and format of specs are highly influenced by the ["Painless Functional Specifications" article series of Joel Spolsky](https://www.joelonsoftware.com/2000/10/02/painless-functional-specifications-part-1-why-bother/), which explains why you want to have specs, what they could/should look like and also who writes them.

> It seems that specs are like flossing: everybody knows they should be writing them, but nobody does.

As Prisma is a pretty technical product, in contrast to Joel's opinion we sometime _do_ include elaborate technical specifications as well.

### Pain Points

We acknowledge that our definition of specs and specs in general always have some pain points, that are hard or impossible to get rid of. The following 

- granularity
    - low vs. high level
    - exhaustive
- up to date?
- inconsitency 
    - optimisation problem
- where to draw lines / packaging
    - orthogonal dimensions
- cross disciplinary
- acceptance (aka buy-in) by everyone (of process)
- best medium
    - markdown sometimes is not enough


## Who

### For who?

Product, Engineering, Community


### Who writes specs?

Product, Engineering
conversation between both

#### Who can update specs?

Everyone - via PR or issue to trigger changes.

### Owner

Each spec has one (1) owner that is the directly reponsible person for the content of the spec file. They do not have to 

### Stakeholders

A spec has multiple (n) stakeholders connected to it. These are all the people, that have a direct interest in the content of the spec and should be consulted during the creation of the spec already.

## What

## What should be specified in a spec?

Everything.
iterative document to reflect our goal

### How are spec files structured?

Every spec is different, so we do not have one template that can just be adapted to become a great spec. But most specs should probably follow this general structure:

- First headline with `# Topic` mirrors the folder name and general content as the spec title
- The file begins with some information about [Who](TODO) and [State](TODO)
- An introductionary paragraph might follow that gives a rough overview what the spec will be about
- A Table of Contents is automatically created on commit, it's location after the introduction is marked with:
   ```
   <!-- toc -->
   <!-- endtoc -->
   ```
   (For more information see [Table of Contents](table-of-contents))
- The next headline with `## Section` starts the first actual content section
- Each section might contain any number of subsections (`### Subsection` and so on)

### Functional vs. Technical Specification

- Functional = point of view of the user using the tool
- Technical = point of view of the developer implementing the code



### Top Level State

#### Spec State

- Stable ✅ 
- Draft 🚧 
- Outdated 🚨 
- Missing ❌

#### Implementation State

- Future 👽
- In Progress 👷‍
- Fully implemented 🌼


### State in Spec

### How do we specify which individual parts of a spec are not implemented yet?

> ⚠ This is not implemented yet.

Notes in text:

`> ⚠ This is not implemented yet.`






### Folders and Filenames

The main structuring tool for the `specs` repo are folders. In these folders we usually have one `README.md` file that contains the actual spec. In cases where having the complete spec in one file would be counterproductive, we also use multiple files per folder.

1 file per spec






### Where should we link to specs?

TODO

- feature request issues
- discussion and question issues after conversation gets more concrete we move over to specs
documentation





## When


### When are specs created?

Specs should usually be written _before_ any implementation work begins.

TODO discussion and question issues after conversation gets more concrete we move over to specs

### Do specs reflect the present or the future?

Are of conflict: Write what we _want_ or what we _have_? As specs should be created _before_ implemetation, we obviously decided to go with the "specs describe our optimal future" approach.


## Spec Workflow

- Owner starts small
- Talks to stakeholders
- Integrates more and more stakeholders, based on iteration
- Publication via All-Hands meeting ("Specs update")
- 


## How

- Start PR
- Start with Front Matter (Owner, Stakeholders, State) and Introduction sentence
- Get first buy-in from Stakeholders
- Start with usage scenario
- Confirm with Stakeholders
- Flesh out the details, probably together with Stakeholders
- 