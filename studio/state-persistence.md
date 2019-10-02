# Summary

Spec for all external state and its persistence for Studio

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Motivation](#motivation)
- [Common Terms](#common-terms)
- [Proposal](#proposal)
- [Deciding what goes in project state](#deciding-what-goes-in-project-state)
- [All stored state](#all-stored-state)
- [Structure of `studio.json`](#structure-of-studiojson)
- [Structure of `IndexedDB`](#structure-of-indexeddb)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Motivation

Currently, all state and configuration of Studio is stored only on one user's local environment. All of it is stored in IndexedDB in their browser.

We want to give people more visibility and control over what data is stored. Instead of verbose operations like clearing the localStorage / IndexedDB, we want to enable all of it visually.

We also want to grant them the ability to configure Studio on a per-project basis. This would be useful for teams who want to be able to share some configuration with multiple members. This also becomes useful even if you are one person working on multiple projects, so you'd want to be able to configure Studio to behave differently for each project.

## Common Terms

A few terms used throughout the document

- Project: Any directory with a `schema.prisma` file.
- State: Any data that is \***\*persisted\*\*** between Studio restarts. State does not necessarily mean data that stays in memory.

## Proposal

We segregate all state we want to store into two buckets:

- **Project state**
  This is configuration that changes between projects. Because this needs to be shareable among team members, we should associate this with a project. We do that in the form of a `studio.json` configuration file that always lives next to the schema definition. This would also be checked in to version control. Its structure is detailed later. It provides a semi-programmatic way to control the behaviour of Studio.

- **Global state**
  This is configuration that does not change between projects. This is not meant to be shared, so this goes in IndexedDB.

While it might be tempting to move all state to project state, it has a few drawbacks:

- If every small detail, like the size of the sidebar, for example, is saved, then this file would almost always change with every commit. We want to avoid this.
- Some state is saved only for caching purposes. This again, does not need to change every commit. This would never actually be changed by a user, so it would exist only to clutter the `studio.json`.

Project state always overrides global state.

Global state is considered to be a superset of project state. Not all parts of the global state are exposed to be overridden by project state. This is the same argument as above, we do not want the project state to be cluttered. Some state does not need to be programmatically accessible.

A major question then is categorization of everything we want to store into one of these buckets. The following section describes a strategy we can use to decide where a piece of state goes.

## Deciding what goes in project state

It is crucial to note that every part of the state goes in the global state. The real question is what parts we want to expose for overriding. For an arbitrary piece of global state, we should ask the following questions to influence our decision:

1. **Does it change between projects?**
   If the state does not change between projects, then it never needs to be exposed as project state. Examples of this might include

2. **Is it supposed to be visible to end users?**
   If users do not need to know about its existence, then it does not need to be exposed as project state. Example of this might include the DMMF that is cached for "instant reloads"

3. **Could it be subject to a difference in opinion among two people working on one project?**
   State that can be influenced by taste or personal opinion does not usually need to be exposed as project state. Examples include sidebar visibility and active themes

4. **Would you want it to be committed to Git?**
   State that needs to be checked in does need to be exposed as project state. Examples include custom queries and scratchpads.

5. **Would you want it to be available on both the web and the Electron app?**
   Since both apps do not share any data between themselves, state that needs to be available everywhere should be exposed as project state and checked in to version control. Examples include custom queries and scratchpads.

6. **Would it be catastrophic if this data is inaccessible?**
   State that needs to exist at all times should be exposed as project state. Examples include custom queries and scratchpads.
   Data stored in IndexedDB might not always be accessible. One such scenario is `prisma dev` restarts causing it to run on different ports for the same project. Browsers will not allow cross-domain IndexedDB access, so if unavailable data is a concern, then it cannot be stored ONLY as global state.

## All stored state

This section details all state that is currently persisted. All of it is saved to IndexedDB currently.

1. **Projects**

- All projects that have ever been opened

2. **Actions**

- Any pending limbo actions

3. **Models**

- All models from all projects, composite-keyed by [model.id, project.id]

4. **Fields**

- All fields in all models from all projects, composite-keyed by [field.id, project.id]

5. **Enums**

- All enums from all projects, composite-keyed by [enum.id, project.id]

6. **Scripts**

- All scripts (generated or saved) from all projects, composite-keyed by [script.id, project.id]

7. **Sessions**

- All sessions from all projects, composite-keyed by [session.id, project.id]

8. **Tabs**

- All open tabs from all projects, composite-keyed by [tab.id, project.id]

## Structure of `studio.json`

This file is what stores the project state. It always lives next to the schema definition file. Every key in this file needs to be optional. This makes sure that as we decide to expose more state, older configs are still compatible.

An exception to this is the `version` key, which allows us to introduce breaking changes if they're required.

```ts
interface StudioJSON {
  version: number; // Default: 1
  savedTabs?: {
    name: string; // Name of the saved tab
    code: string; // Photon request code that this saved tab runs
  };
}
```

## Structure of `IndexedDB`

Every project gets its own store in IndexedDB. This section details the structure of one such store.
Note that no key here is optional. This is managed by Studio, so we can afford that.

```ts
interface IDBSchema {
  projects: {
    key: string; // Primary key: ID of this project
    value: {
      id: string; // ID of this project
      activeTabId: string; // Last active tab's ID
      tabOrder: string[]; // ID of this project
    };
  };
  tabs: {
    key: [string, string]; // Primary key: [projectId, tabId]
    value: {
      projectId: string; // ID of the project this tab belongs to
      id: string; // ID of this tab

      sessionId: string; // ID of the session this tab will load
      preview: boolean; // Whether or not this is a "preview" tab
    };
  };
  sessions: {
    key: [string, string]; // Primary key: [projectId, sessionId]
    value: {
      projectId: string; // ID of the project this session belongs to
      id: string; // ID of this session

      scriptId: string | null; // ID of the script this session will open
      lastSavedHash: string; // Last saved hash of this session (used to determine dirty-ness)
    };
  };
  scripts: {
    key: [string, string]; // Primary key: [projectId, scriptId]
    value: {
      projectId: string; // ID of the project this script belongs to
      id: string; // ID of this script

      name: string | null; // Name of this script. Is null for generated scripts
      inputMode: "visual" | "code";
      code: string;
      modelId: string; // ID of the model this script references
      where: Array<{
        fieldId: string;
        operation:
          | "equals"
          | "not"
          | "in"
          | "notIn"
          | "lt"
          | "lte"
          | "gt"
          | "gte"
          | "contains"
          | "startsWith"
          | "endsWith";
        value: string | number;
      }>; // Where filters applied to this script (from visual mode)
      fieldIds: string[]; // IDs of fields selected (from visual mode)
      sortFieldId: string; // ID of the field to sort the results by (from visual mode)
      sortOrder: "asc" | "desc"; // Sort order (from visual mode)
      viewMode: "table" | "tree"; // How to show returned records (visual + code mode)
    };
  };
  models: {
    key: [string, string]; // Primary key: [projectId, modelId]
    value: {
      projectId: string; // ID of the project this model belongs to
      id: string; // ID of this model

      name: string; // Name of this model
      plural: string; // Plural value of this model
      fieldIds: string[]; // IDs of fields this model contains
    };
  };
  fields: {
    key: [string, string]; // Primary key: [projectId, fieldId]
    value: {
      projectId: string; // ID of the project this field belongs to
      id: string; // ID of this field

      name: string; // Name of this field
      type: string; // Type of this field
      kind: string; // (DMMF) Kind of this field
      isId: boolean; // Whether or not this is an ID field
      isUnique: boolean; // Whether or not this is a unique field
      isRequired: boolean; // Whether or not this is a required field
      isList: boolean; // Whether or not this is a list field
      isUpdatedAt: boolean; // Whether or not this is an updatedAt field
      isCreatedAt: boolean; // Whether or not this is a createdAt field
      modelId: string; // ID of the model this field belongs to
    };
  };
  enums: {
    key: [string, string]; // Primary key: [projectId, enumId]
    value: {
      projectId: string; // ID of the project this enum belongs to
      id: string; // ID of this enum

      name: string; // Name of this enum
      values: string[]; // Possible values of this enum
    };
  };
  actions: {
    key: [string, string]; // Primary key: [projectId, actionId]
    value: {
      projectId: string; // ID of the project this action belongs to
      id: string; // ID of this action

      type: "create" | "update" | "delete" | "connect" | "disconnect"; // Type of this action
      recordId: string; // ID of the record this action affects
      sessionId: string; // ID of the session this action was performed in
      value: any; // What this action changed (record's value, keyed by the field's name)
    };
  };
}
```
