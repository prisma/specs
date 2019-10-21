# Epics in the Engineering Process

- Owner: @mavilein
- Stakeholders: @janpio @sorenbs
- State: 
  - Spec: In Progress 🚧
  - Implementation: In Progress 🚧

Engineering uses "Epics" as part of their [Engineering Process](TODO).

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Overview](#overview)
- [Fitting into larger company processes](#fitting-into-larger-company-processes)
- [Conventions](#conventions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Overview

The engineering team often tackles large features that take several iterations to be finished. Epics represent a desired feature that the product team wants to implement. Those epics are then broken down into more fine grained packages that can be tackled by engineering.
It is explicitly not a tool for micro management. We trust all individuals on our team.
Instead the goal is to provide a simple but lightweight measure of progress for the engineering process. It aims to facilitate discussions about progress both inside the engineering team as well as across the company. 

## Fitting into larger company processes

The product team within the company continuously tries to figure out what we should build next. It iterates internally through discussions and small prototypes. At the end of the process it creates or updates a spec to describe a desired feature. After the spec has been reviewed and approved by all stackeholders it is ready for implementation.
At this point the epic is created and all relevant information is put in there. The epic is broken down into multiple work packages, one for each affected component. 
Those work packages are then assigned to engineers within iterations and the implementation can begin.

## Conventions

The Github issues for epics and work packages follow the following conventions.

An *epic* follows the following conventions:
1. The title adheres to the pattern `EPIC: [NAME]`.
1. It links to all relevant specs from the [specs](https://github.com/prisma/specs/) repo.
1. It contains a brief description of the feature.
1. If possible it contains an expressive example.
1. It links to all associated work packages.
1. It may contain an initial breakdown of tasks.

A *work package* follows the following conventions:
1. The title adheres to the pattern `[COMPONENT]: [NAME]`. The name is the same as the one of the parent epic. The part component is one of: `Datamodel Parser`, `Migration Engine`, `Query Engine` or `Introspection Engine`.
1. It links to its associated parent epic.
1. The implementing engineer supplies a small preliminary task list to provide a rough progress overview. New tasks are added to the list when they are discovered.