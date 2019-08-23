# Summary
Specs for Studio design and features

- [Overview](#overview)
  * [Sections of Studio](#sections-of-studio)
- [Tabbar](#tabbar)
  * [Opening a new tab](#opening-a-new-tab)
  * [Tab states](#tab-states)
- [Tools sidebar](#tools-sidebar)
- [Page](#page)
- [Databrowser](#databrowser)
  * [Query](#query)
  * [Photon query](#photon-query)
  * [Filters query](#filters-query)
  * [Result](#result)
  * [Table result](#table-result)
  * [Tree result](#tree-result)
  * [Unsaved data changes](#unsaved-data-changes)
- [Dashboard](#dashboard)
- [Keyboard navigation](#keyboard-navigation)
  * [Global scope](#global-scope)
  * [Tabbar scope](#tabbar-scope)
  * [Page scope](#page-scope)
  * [Databrowser scope](#databrowser-scope)
  * [Photon query scope](#photon-query-scope)
  * [Filters query scope](#filters-query-scope)
  * [Table result scope](#table-result-scope)
  * [Tree result scope](#tree-result-scope)
- [Theming](#theming)

# Overview

## Sections of Studio
![Sections](https://i.imgur.com/XNZG1Sk.png)

- [Tabbar](#tabbar)
- [Tools sidebar](#tools-sidebar)
- [Page](#page)

# Tabbar
![Tabbar](https://i.imgur.com/I3NlV9s.png)

Tabs are one of the main workflow organization tools in Studio. They should feel lightweight to open, rearrange, switch between and close, all while having confidence that no data or state is accidentally dropped or removed.

A tab can contain a variety of content, from databrowser tables to dashboards and settings views.

## Opening a new tab
![Quick open modal](https://i.imgur.com/vefE25X.png)

Since tabs can represent a variety of views it makes it difficult to have a standard "empty state".

So instead of a blank tab, when a user clicks the "plus" icon (or hits `⌘ + T`) we would show a "quick open modal" that lets user search and open (or navigate to) any model, saved query, settings or other page.

When a "non-dirty" version of selected link is already open in an existing tab, user will be redirected into that one instead of opening a new one.

## Tab states
There are two potential UX problems with tabs:
- accidentally closing tabs that contain unsaved queries, filters or other changes
- having a new tab open on each link click, potentially overflowing the tabbar with unused tabs

In order to alleviate those problems, we need track (and indicate) tab state and change it's behaviour accordingly.

Tab can have three states: [preview](#preview-tab), [sticky](#sticky-tab) and [dirty](#dirty-tab).

### Preview tab
![Preview tab](https://i.imgur.com/PEySXvc.png)

Any newly opened tab is in a _preview_ state. This is indicated by italic name in the tab.

While in _preview_ mode, the content of a tab is replaced when a user clicks on another link in the sidebar, or on a relation in a databrowser.

When focusing into another tab, the _preview_ tab stays in the tabbar. When a user then clicks on anything that usually would open in a new tab, the click target would be opened in the previously created _preview_ tab instead.

No confirmation asked when closing the _preview_ tab.

### Sticky tab
![Sticky tab](https://i.imgur.com/QNJ1T07.png)

User can open a sidebar link as an _sticky_ tab instead of _preview_ by double-clicking on the link. User can also double-click on the tab itself to turn it from _preview_ to _sticky_.

While in an _sticky_ tab and clicking on a sidebar link, the click target should open in a new _preview_ tab and focus into it.

No confirmation asked when closing the _sticky_ tab.

### Dirty tab
![Dirty tab](https://i.imgur.com/wCDSXcz.png)

A tab turns "dirty" as soon as there is some potential state or data that could be lost when closing the tab.

**Examples include..**
- A databrowser tab, where user has changed either...
  * filters
  * field selection
  * sorting
  * (pagination?)
- A databrowser tab, where user has switched to Photon query mode and customized the query
- A databrowser tab, where user has changed data, but not commited it to database
- A settings page where user has not saved their chages

While in an _dirty_ tab and clicking on a sidebar link, the click target should open in a new _preview_ tab and focus into it.

When closing the tab, user will be asked either to discard or save the changes.

# Tools sidebar
- [Databrowser](#databrowser)
- [(Development) Dashboard](#dashboard)

# Page
Where the main content of the tab is rendered

# Databrowser

## Query
- Query mode toggle

## Photon query
![Filters query](https://i.imgur.com/1AAJO3K.png)

- Autocompletion
- Syntax errors
- Generated Photon client docs

## Filters query
![Filters query](https://i.imgur.com/dR9iO6f.png)

- Model selection
- Filters management
- Fields selection
- Sorting
- Pagination

## Result
- Result mode toggle

## Table result
![Table result](https://i.imgur.com/DG5OU06.png)

## Tree result
![Tree result](https://i.imgur.com/Fw463Na.png)

# Unsaved data changes

# Dashboard

# Keyboard navigation
![Keyboard nav](https://i.imgur.com/6Q6N47A.png)

The goal is to support as extensive usage of Studio through keyboard as possible. The keyboard navigation and shortcuts should feel natural to use and adjust themselves depending on the scope in focus.

- While many of the keyboard shortcuts apply globally, navigating with keyboard benefits from having areas or "layers" of the app separated into different scopes.

- As a common navigation pattern, hitting `tab` key should generally move focus to the next element and `shift + tab` to the previous element.

- Depending on the scope, that element might for example be a tab, databrowser, result row or a result row cell.

- Generally, unless scope as has assigned a different behavior, the arrow keys should also move the focus inside the scope. Both horizontally and vertically, when applicable.

- Entering a scope happens with `enter` and exiting with `shift + enter` or `esc` key.

## Global scopes
| General | |
|-|-|
| Show help panel with shortcuts | `⌘ + ?` |
| Close a project | `⌘ + Q` |

| Tabs | |
|-|-|
| Move to tab at index | `⌘ + [tab_index]` |
| Move to next tab | `⌘ + alt + right arrow` |
| Move to previous tab | `⌘ + alt + left arrow` |
| Open a new tab | `⌘ + T` |
| Close an open tab | `⌘ + W` |
| Force close an open tab | `⌘ + shift + W` |

## Tabbar scope
| Navigation | |
|-|-|
| Move focus to next tab | `tab` or  right arrow |
| Move focus to previous tab | `shift + tab` or left arrow |
| Open focused tab | `enter` |

## Page scope
| Navigation | |
|-|-|
| Move focus to next databrowser | `tab` or down arrow |
| Move focus to previous databrowser | `shift + tab` or up arrow |
| Enter focused databrowser scope | `enter` |
| Move back into tabs scope | `shift + enter` or `esc` |

## Databrowser scope
The focusable elements in databrowser scope are:

- Query mode toggle
- Model select
- Filters select
- Fields select
- Sorting select
- Pagination select
- Result mode toggle
- Expand button
- Menu button
- Run button
- Code query
- Results table
- Results tree

| Navigation | |
|-|-|
| Move focus to next item | `tab` or right arrow |
| Move focus to previous item | `shift + tab` or left arrow |
| Move focus to an item above | up arrow |
| Move focus to an item below | down arrow |
| Open focused dropdown | `enter` |
| Enter focused result table/tree scope | `enter` |
| Enter focused photon query scope | `enter` |
| Move back into page scope | `shift + enter` or `esc` |

## Photon query scope
| Editor | |
|-|-|
| Open autocomplete dropdown | `ctrl + space` |
| Autocomplete a word | `tab` |

## Filters query scope
| Navigation | |
|-|-|
| | |

## Table result scope
| Navigation | |
|-|-|
| | |

## Tree result scope
| Navigation | |
|-|-|
| | |

# Theming
- Dark mode