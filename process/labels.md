# GitHub Labels

- Owner: @janpio
- Stakeholders: @pantharshit00 @divyenduz
- State: 
  - Spec: Stable ✅
  - Implementation: Fully implemented ✅

Our [Prisma Framework repositories](repositories.md) use several labels in the [Issue Triage](issue-triage.md) process.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Categorization](#categorization)
- [Qualification](#qualification)
- [Special case: `prisma/specs`](#special-case-prismaspecs)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Categorization

To categorize incoming issues:

- `kind/bug`: A reported bug.
- `kind/regression`: A reported bug in functionality that used to work before.
- `kind/feature`: A request for a new feature.
- `kind/improvement`: An improvement to existing feature and code.
- `kind/docs`: A documentation change is required.
- `kind/discussion`: Discussion is required. 
- `kind/question`: Developer asked a question. No code changes required.

## Qualification

To further qualify `kind/bug` issues:

- `bug/0-needs-info`:  More information is needed for reproduction.
- `bug/1-repro-available`: A reproduction exists and needs to be confirmed. 
- `bug/2-confirmed`: We have confirmed that this is a bug.

## Special case: `prisma/specs`

The `specs` repository has a different set of labels. It is currently still to much in a state of flux to be properly documented.
