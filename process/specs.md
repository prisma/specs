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
- [Future 👽](#future-)

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

## Future 👽

In the near future this specification will be much more elaborate and also define "spec", what we want to have in there and so on.
