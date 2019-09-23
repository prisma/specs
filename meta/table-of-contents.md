# Table of Contents

- Owner: @janpio
- Stakeholders: @schickling, @divyenduz, @matthewmueller
- State: 
  - Spec: Stable ✅
  - Implementation: Fully implemented ✅

This meta spec describes how Table of Contents work in the `specs` repository.  
It is aimed at people writing or editing specs.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Adding a _Table of Contents_ (TOC) to a document](#adding-a-_table-of-contents_-toc-to-a-document)
  - [When and how: GitHub Action](#when-and-how-github-action)
  - [Generate it manually/locally](#generate-it-manuallylocally)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Adding a _Table of Contents_ (TOC) to a document

To add an auto generated Table of Contents to a document, just include the following placeholder at the appropriate location:

```
<!-- START doctoc -->
<!-- END doctoc -->
```

If you do _not_ add this placeholder, the TOC will be added in the beginning of the document (even before the first headline, which will in this case be included in the TOC). You can then either delete it and add the placeholder at the correct location, or just move the whole generated block.

### When and how: GitHub Action

By default the TOC is added to all `.md` files as an additional commit (see [this example](https://github.com/prisma/specs/pull/136/commits/4500c27f471eec04d5b93620ed7132b239992d29) when the TOC was first added to this file you are reading right now) in a Pull Request or branch (this includes `master`) via the [`technote-space/toc-generator` GitHub action](https://github.com/technote-space/toc-generator) that is [installed as a workflow in this repo](https://github.com/prisma/specs/blob/master/.github/workflows/toc.yml). 

### Generate it manually/locally

If you prefer to already generate a TOC when working locally, you can install [`doctoc`](https://github.com/thlorenz/doctoc) (`npm install -g doctoc`) and run it manually against your `.md` file (`doctoc path/file.md`).
