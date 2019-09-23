# Issue Triage

- Owner: @janpio
- Stakeholders: @pantharshit00 @divyenduz 
- State: 
  - Spec: Stable ✅
  - Implementation: Fully implemented ✅

We use an _Issue Triage process_ to handle our GitHub issues for Prisma Framework. This spec defines that process.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Triage?](#triage)
- [Who](#who)
- [When](#when)
- [How](#how)
  - [Labeling](#labeling)
  - [Assigning](#assigning)
  - [Closing](#closing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Triage?

Triage in this case refers to a process to _understand_ and _qualify_ issues, so they are _actionable_ for our Enginerring or Product teams (a feature can be spec-ed out or implemented, a bug can be fixed).

## Who

Issues are usually triaged by our Support team, and sometimes by other team members from Engineering or Product.
A special case are the `prisma/specs` issues which are mainly handled by Product.

## When

We try to triage each new issue as soon as possible. The Support team triages all issues at least daily, and tries to follow up on comments during the day as well.

## How

### Labeling

We use [GitHub Labels](labels.md) to classify our issues. Each label represents some information, that is tagged to that issue by applying the label.

1. Understand what _kind_ of task an issue describes:  
   Is it a `kind/bug`, `kind/regression`, `kind/feature`, `kind/discussion` etc.?
2. Different kinds of issues then have a follow up process to _qualify_ its content and actionability: 
   - `kind/bug` and `kind/regressions` issues can get `bug/0-needs-info` and a comment asking for the missing information, `bug/1-repro-available` if the information required to reproduce a bug is available, or `bug/2-confirmed` if that available reproduction information could actually be used to reproduce and confirm the issue.

### Assigning

- Issues that should be acted on fairly quickly can be assigned to the person that will "drive" them during the triage, otherwise assignment happens during the planning phase.

### Closing

- Issues that turn out to be duplicates of existing issues can be closed by the Support team.
- Issues that can not be turned into actionable issues can be closed by the Support team.
