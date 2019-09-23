# Specs

- Owner: @janpio
- Stakeholders: @schickling, @matthewmueller, @divyenduz
- State: 
  - Spec: Stable ✅
  - Implementation: In Progress 🚧

This is a stub of a specification for "Specs". It contains a minimal definition that will allow us to start iterating on specs.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Minimal Format](#minimal-format)
  - [Example](#example)
- [Implemented vs. Not Implemented](#implemented-vs-not-implemented)
- [Future](#future)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Minimal Format

- First headline `# Topic` mirrors the folder/file name and general content as the spec title
- The file begins with some front matter:
  - Owner: The directly responsible person of the spec
  - Stakeholders: Interested Parties that are involved in the spec creation process
  - State:
    - Spec: 
      - Stable ✅ 
      - In Progress 🚧
      - Incomplete 💔
      - Missing ❌
      - Outdated 🚨
      - Unknown ❔
    - Implementation:
      - Fully implemented ✅
      - In Progress 🚧
      - Future 👽
      - Unknown ❔
- An introductionary paragraph (overview, summary, description) follows that gives a rough idea what the spec is about
- This is separated from the rest of the document by a horizontal line
- A Table of Contents is automatically generated on commit, place it [as documented](table-of-contents)
- The next headline with `## Section` starts the first actual content section
- Each section might contain any number of subsections (`### Subsection` and so on)

### Example

```
# Spec Name

- Owner: @foo
- Stakeholders: @bar
- State: 
  - Spec: Outdated 🚨
  - Implementation: In Progress 🚧

Description

---

<!-- START doctoc -->
<!-- END doctoc -->

## First section

Here be dragons
```

## Implemented vs. Not Implemented

There are two extremes of the implementation status of a spec: `Future 👽` and `Fully implemented ✅`. In between lives `In Progress 🚧` which is used whenever a spec is in implementation but not all parts of the spec already are implemented in the product.

Additionally to the overall state, we also want to be able to know **which** _specific_ features are not implemented yet when reading through a spec:

> ⚠ This is not implemented yet.

To be created by this Markdown:

`> ⚠ This is not implemented yet.`

The text is variable and can include a link to a tracking issue or other commentary.

## Future

In the near future this specification will be much more elaborate and also define "spec", what we want to have in there and so on.
