# SMDU Review Mode Implementation Plan

## Purpose

This document turns the Review Mode spec into an implementation-oriented plan for the current SMDU codebase.

The goal is to add Review Mode as a first-class view alongside the existing `flat` and `tree` modes, while keeping the current scanner architecture intact and building the feature as a derived lens over the scanned tree.

This plan is tailored to the current repository structure:

- `src/scanner.ts` — scan tree and file metadata
- `src/state.ts` — navigation state, sorting, derived file lists
- `src/App.tsx` — app orchestration, key handling, modal state
- `src/keys.ts` — action definitions and help text
- `src/components/FileList.tsx` — current list/table renderer
- `src/components/Footer.tsx` — footer and key hints
- `src/components/InfoModal.tsx` / `StatusPanel.tsx` / `Settings.tsx` — supporting UI patterns

---

## Implementation Strategy

Build Review Mode in layers.

1. Extend the state model to support a third view mode and a dedicated Review Mode state slice.
2. Add review dataset derivation utilities that flatten and enrich entries under the current root.
3. Add filtering, sorting, and grouping engines for review entries.
4. Add a Review Mode renderer and related UI chrome.
5. Wire new keybindings and cross-view actions.
6. Add tests for derivation, grouping, filters, and view interactions.

The key architectural decision is:

**do not change the scanner first unless needed.**

Review Mode should consume the current `FileNode` tree and compute its own derived row model.

---

## Phase 0 — Define the V1 Slice Clearly

### V1 delivery target

Ship the following together as the first useful Review Mode:

- `review` added to `ViewMode`
- review list derived from current root descendants
- files/directories/both scope filter
- sorts: size, modified, created, path, type, count, percent-of-root
- grouping: type, parent directory, age bucket, mount/source
- minimum size filter
- age bucket filter
- extension/type filter
- path prefix filter
- hidden include/exclude toggle
- media-only filter preset
- default preset: Largest Files
- directory/group counts shown
- Review Mode preserves cursor/state per root
- explicit keybindings to open current selection in Flat or Tree
- keep `count` sort visible in files-only scope with stable tie-breaks

This is enough to make Review Mode genuinely useful and product-complete for an initial release.

---

## Phase 1 — State Model and Core Types

### 1.1 Extend `ViewMode`

In `src/state.ts`:

```ts
export type ViewMode = 'tree' | 'flat' | 'review';
```

### 1.2 Add Review Mode types

Create a new module:

- `src/review/types.ts`

Suggested types:

```ts
export type ReviewScope = 'files' | 'directories' | 'both';

export type ReviewSortField =
  | 'size'
  | 'modified'
  | 'created'
  | 'path'
  | 'type'
  | 'count'
  | 'percent';

export type ReviewSortOrder = 'asc' | 'desc';

export type ReviewGroupField = 'none' | 'type' | 'parent' | 'age' | 'source';

export type ReviewAgeBucket =
  | 'today'
  | 'week'
  | 'month'
  | 'older-1m'
  | 'older-3m'
  | 'older-6m'
  | 'older-1y';

export interface ReviewFilters {
  scope: ReviewScope;
  minSizeBytes?: number;
  ageBuckets: ReviewAgeBucket[];
  extensions: string[];
  inferredTypes: string[];
  pathPrefix?: string;
  mediaOnly: boolean;
  includeHidden: boolean;
  sourceRoots: string[];
}

export interface ReviewPreset {
  id: string;
  label: string;
  sortBy: ReviewSortField;
  sortOrder: ReviewSortOrder;
  groupBy: ReviewGroupField;
  filters: Partial<ReviewFilters>;
}

export interface ReviewEntry {
  id: string;
  node: FileNode;
  path: string;
  parentPath: string;
  basename: string;
  kind: 'file' | 'directory';
  size: number;
  percentOfRoot: number;
  modifiedAt?: Date;
  createdAt?: Date;
  extension: string;
  inferredType: string;
  fileCount: number;
  directoryCount: number;
  sourceRoot: string;
  depthFromRoot: number;
  isHidden: boolean;
  ageBucket?: ReviewAgeBucket;
}

export interface ReviewGroup {
  key: string;
  label: string;
  entries: ReviewEntry[];
  totalSize: number;
  itemCount: number;
  fileCount: number;
  directoryCount: number;
  percentOfRoot: number;
}

export interface ReviewViewState {
  presetId: string;
  sortBy: ReviewSortField;
  sortOrder: ReviewSortOrder;
  groupBy: ReviewGroupField;
  filters: ReviewFilters;
  selectionIndex: number;
  expandedGroups: Record<string, boolean>;
}
```

Age bucket semantics should be explicit and non-overlapping in V1:

- `today`: `age >= 0 and < 1 day`
- `week`: `age >= 1 day and < 7 days`
- `month`: `age >= 7 days and < 1 month`
- `older-1m`: `age >= 1 month and < 3 months`
- `older-3m`: `age >= 3 months and < 6 months`
- `older-6m`: `age >= 6 months and < 1 year`
- `older-1y`: `age >= 1 year`

Use local timezone boundaries for user-facing age-bucket calculations.

### 1.3 Preserve Review state per root

In `src/state.ts`, add a per-root map:

```ts
type ReviewStateByRoot = Record<string, ReviewViewState>;
```

This allows each reviewed root path to remember:

- preset
- filters
- sort/group settings
- cursor position
- expanded/collapsed groups

### 1.4 Add default Review state factory

Create:

- `src/review/defaults.ts`

This should define:

- default preset list
- `createDefaultReviewFilters(showHiddenFiles: boolean)`
- `createDefaultReviewState(showHiddenFiles: boolean)`

Default behaviour:

- preset = `largest-files`
- sort = `size desc`
- group = `none`
- scope = `files`
- includeHidden = current global hidden setting

---

## Phase 2 — Review Dataset Derivation Engine

### 2.1 Create review derivation utilities

Create module:

- `src/review/derive.ts`

Responsibilities:

- flatten descendants under current root
- convert `FileNode` to `ReviewEntry`
- compute derived fields
- track effective hidden status (hidden basename or hidden ancestry)
- filter by hidden setting and scope
- avoid mutating original nodes

Suggested functions:

```ts
export function deriveReviewEntries(root: FileNode, options: DeriveReviewOptions): ReviewEntry[]
export function createReviewEntry(node: FileNode, root: FileNode, sourceRoot: string): ReviewEntry
export function getAgeBucket(date: Date | undefined, now: Date): ReviewAgeBucket | undefined
export function inferReviewType(node: FileNode): string
export function getExtension(name: string): string
export function countDirectoryDescendants(node: FileNode): { fileCount: number; directoryCount: number }
export function isEffectivelyHidden(node: FileNode): boolean
```

### 2.2 Reuse existing metadata where possible

Current `FileNode` already includes:

- `path`
- `size`
- `fileCount`
- `isDirectory`
- `isHidden`
- `birthtime`
- `mtime`
- `mode`

That means Review Mode V1 should not need scanner changes for core functionality.

### 2.3 Handle source root / mount source

The current app usually scans one root at a time, but Review Mode should still store `sourceRoot` in each `ReviewEntry`.

For now:

- `sourceRoot = current scan root path`

This keeps the type system ready for future multi-root or combined-root scans.
In current single-root scans, source grouping/filtering UI may be hidden or disabled.

### 2.4 Caching plan

To avoid re-flattening large trees on every render:

- cache derived entries per root path
- invalidate when rescan completes
- invalidate when deletion mutates the tree

Simplest place to keep this initially:

- inside `useFileSystem` via `useMemo`

Possible future extraction:

- dedicated cache map by root path and tree identity

---

## Phase 3 — Filter, Sort, and Group Engine

### 3.1 Filtering module

Create:

- `src/review/filter.ts`

Suggested functions:

```ts
export function filterReviewEntries(entries: ReviewEntry[], filters: ReviewFilters): ReviewEntry[]
export function matchesScope(entry: ReviewEntry, scope: ReviewScope): boolean
export function matchesMinSize(entry: ReviewEntry, minSizeBytes?: number): boolean
export function matchesAgeBuckets(entry: ReviewEntry, ageBuckets: ReviewAgeBucket[]): boolean
export function matchesExtensions(entry: ReviewEntry, extensions: string[]): boolean
export function matchesType(entry: ReviewEntry, inferredTypes: string[]): boolean
export function matchesPathPrefix(entry: ReviewEntry, pathPrefix?: string): boolean
export function matchesHidden(entry: ReviewEntry, includeHidden: boolean): boolean
export function matchesMediaOnly(entry: ReviewEntry, mediaOnly: boolean): boolean
export function matchesSourceRoots(entry: ReviewEntry, sourceRoots: string[]): boolean
```

### 3.2 Sorting module

Create:

- `src/review/sort.ts`

Suggested functions:

```ts
export function sortReviewEntries(
  entries: ReviewEntry[],
  sortBy: ReviewSortField,
  sortOrder: ReviewSortOrder,
): ReviewEntry[]
```

Add stable fallback ordering:

- primary selected field
- secondary path ascending

This avoids cursor jitter and unpredictable rerenders.
`count` sort should remain available in files-only scope and rely on stable fallback ordering when counts tie.

### 3.3 Grouping module

Create:

- `src/review/group.ts`

Suggested functions:

```ts
export function groupReviewEntries(
  entries: ReviewEntry[],
  groupBy: ReviewGroupField,
  rootSize: number,
): ReviewGroup[]
```

Grouping requirements:

- no grouping => one flat pseudo-group or direct list
- type grouping => by extension / inferred type
- parent grouping => by parent path
- age grouping => by age bucket
- source grouping => by source root

Each group should compute:

- total size
- item count
- file count
- directory count
- percent of root

### 3.4 Preset module

Create:

- `src/review/presets.ts`

Define built-ins:

- Largest Files
- Largest Directories
- Oldest Large Files
- Recent Growth
- By Type
- Media Review

Add function:

```ts
export function applyPreset(state: ReviewViewState, presetId: string): ReviewViewState
```

---

## Phase 4 — Hook and State Integration

### 4.1 Add review state to `useFileSystem`

Extend `src/state.ts` so `useFileSystem` returns review-specific data and actions.

New returned properties should include:

```ts
reviewState
reviewEntries
reviewGroups
reviewVisibleRows
setReviewPreset
setReviewSort
setReviewGroup
updateReviewFilters
resetReviewFilters
moveReviewSelection
toggleReviewGroupExpanded
openSelectedInFlat
openSelectedInTree
```

### 4.2 Visible row model for grouped UI

The Review renderer should not receive raw groups only. It should receive a flattened visible row model that includes group headers and entry rows.

Create in:

- `src/review/rows.ts`

Suggested types:

```ts
export type ReviewVisibleRow =
  | { kind: 'group'; group: ReviewGroup }
  | { kind: 'entry'; groupKey?: string; entry: ReviewEntry };
```

Suggested function:

```ts
export function buildVisibleReviewRows(
  groups: ReviewGroup[],
  expandedGroups: Record<string, boolean>,
): ReviewVisibleRow[]
```

This makes cursor navigation straightforward.

### 4.3 Selection behaviour

Review selection should operate over `ReviewVisibleRow[]` rather than raw entries.

Rules:

- selection can land on group rows and entry rows
- Enter on a group row toggles expand/collapse
- Enter on an entry directory opens that directory as the new current review root
- Enter on an entry file is a no-op in V1
- explicit keys open entry in Flat or Tree

### 4.4 Preserve global hidden toggle relationship

There are now two related concepts:

- app-wide `showHiddenFiles`
- review-local `filters.includeHidden`

Recommended V1 behaviour:

- initial Review filter inherits global hidden state when a root gets its first Review state
- Review can diverge from that state afterward
- toggling global hidden should not wipe Review-specific filter state unless explicitly desired

That keeps Review Mode independent enough to be useful.

---

## Phase 5 — UI Components

### 5.1 Add Review renderer

Create:

- `src/components/ReviewList.tsx`

This should be a sibling to `FileList.tsx`, not a variation hidden inside it.

Responsibilities:

- render review headers
- render group rows and entry rows
- adapt columns to terminal width
- show counts and percentages
- support narrow layout fallback
- highlight selected row
- support persistent entry-point highlighting for items opened via cross-view actions

### 5.2 Column design for V1

Wide layout:

- Path
- Size
- Age
- Type
- % of total
- Count (for directory/group rows where appropriate)

Narrow layout:

- Path
- Size
- Age

### 5.3 Detail panel / status integration

There are two reasonable approaches:

#### Option A — Reuse Info modal

Minimal work, but less discoverable.

#### Option B — Extend the status panel to show Review details

Recommended.

Update `StatusPanel` or add:

- `src/components/ReviewInspector.tsx`

Suggested content:

- full path
- parent path
- exact size
- modified date
- created date
- type / extension
- percent of root
- file and directory counts
- source root
- active filters summary

### 5.4 Add filter UI shell

Recommended V1 approach:

- compact top bar for high-frequency controls
- modal for detailed filters

Create:

- `src/components/ReviewToolbar.tsx`
- `src/components/ReviewFiltersModal.tsx`

Toolbar content:

- preset
- scope
- sort
- group
- hidden toggle

Detailed modal content:

- minimum size
- age buckets
- extensions
- inferred types
- path prefix
- media-only
- source root selection

When only one source is present, source root controls may be hidden or disabled.

### 5.5 Footer updates

Update `src/components/Footer.tsx` to reflect Review Mode key hints.

It should vary by mode more explicitly:

- default file browsing
- review mode
- settings/help/info/modal states

---

## Phase 6 — Keybindings and Interaction Model

### 6.1 Add actions to `src/keys.ts`

Suggested new actions:

```ts
REVIEW_MODE
REVIEW_PRESET_NEXT
REVIEW_PRESET_PREV
REVIEW_FILTERS
REVIEW_GROUP_NEXT
REVIEW_GROUP_TOGGLE
REVIEW_SCOPE_CYCLE
OPEN_IN_FLAT
OPEN_IN_TREE
RESET_REVIEW_FILTERS
```

Possible default mappings:

- `v` cycles view mode, now including Review
- `f` opens Review filters modal
- `g` cycles grouping field
- `G` expands/collapses current group
- `m` cycles preset
- `o` opens selected item in Flat
- `O` opens selected item in Tree
- `/` optional future quick filter input

You may prefer different keys, but the main requirement is clarity and low collision with current bindings.

### 6.2 Update help text

Update `HELP_ITEMS` to include Review controls.

If Review Mode introduces enough new controls, consider mode-specific help sections in the Help modal.

### 6.3 Cross-view open behaviour

Implement in `src/state.ts`:

```ts
openSelectedInFlat()
openSelectedInTree()
```

Rules:

- if selection is a group row, no-op or expand/collapse
- if selection is an entry row:
  - set `currentNode` to the selected entry's parent directory
  - set `viewMode` to requested view
  - preselect the selected child entry
  - apply a persistent entry-point highlight for that row in the destination view
- preserve existing Review state in the per-root map

This is one of the most important UX details because it makes Review feel integrated rather than trapped.

---

## Phase 7 — FileList / Shared Layout Refactoring

### 7.1 Extract shared table helpers

`FileList.tsx` already contains layout logic for terminal width, columns, visible windowing, and divider rendering.

Refactor shared pieces into:

- `src/components/tableLayout.ts`

Potential utilities:

- row windowing calculations
- divider construction
- column width helpers
- truncation helpers

This avoids duplicating fragile terminal layout code in ReviewList.

### 7.2 Keep review-specific rendering separate

Do not try to force `FileList.tsx` to become a universal file/review renderer.

That would make both modes harder to reason about.

Preferred split:

- `FileList.tsx` handles browsing views
- `ReviewList.tsx` handles review rows
- shared helper module handles reusable layout calculations

---

## Phase 8 — Optional Scanner Follow-Ups

### 8.1 Scanner changes not required for V1

Review V1 can ship with current metadata.

### 8.2 Nice-to-have scanner additions later

Only consider these if needed after V1 lands:

- direct recursive directory count at scan time
- richer extension/type categorisation
- mount/device metadata
- media metadata hooks for V2

These should remain deferred unless implementation friction proves otherwise.

---

## Phase 9 — Testing Plan

### 9.1 Unit tests for derivation

Add tests for:

- entry flattening order independence
- percent-of-root calculation
- extension extraction
- inferred type classification
- age bucket assignment
- age bucket boundary correctness (non-overlapping ranges)
- local-timezone bucket handling
- directory count derivation

Suggested files:

- `tests/review.derive.test.ts`

### 9.2 Unit tests for filters

Add tests for:

- files/directories/both
- min size
- hidden toggle
- age buckets
- extensions/type filtering
- path prefix
- media-only

Suggested file:

- `tests/review.filter.test.ts`

### 9.3 Unit tests for sorting

Add tests for:

- each sort field
- asc/desc
- stable fallback ordering
- `count` sort in files-only scope keeps stable tie-break behaviour

Suggested file:

- `tests/review.sort.test.ts`

### 9.4 Unit tests for grouping

Add tests for:

- type grouping
- parent grouping
- age grouping
- source grouping
- group summary counts and percentages

Suggested file:

- `tests/review.group.test.ts`

### 9.5 State tests

Extend `tests/state.test.ts` to cover:

- view mode cycling includes Review
- Review state preserved per root
- cross-view open retains Review state
- cross-view open preselects child in destination view
- persistent entry-point highlight state
- Review selection clamps correctly when filters change
- group collapse/expand affects visible rows correctly

### 9.6 UI/component tests

Add component tests for:

- ReviewList rendering wide vs narrow layouts
- group row rendering
- selected row styling
- toolbar visibility
- filters modal opening

Suggested file:

- `tests/ReviewList.test.tsx`

---

## Phase 10 — Incremental Delivery Plan

### Milestone A — Review data and hidden integration

Deliver:

- review types
- default review state
- `review` in `ViewMode`
- derived review entries from current root
- files/directories/both scope
- basic review selection state

Success check:

- app can switch into Review Mode and show a simple flat list of review entries

### Milestone B — Sorting and presets

Deliver:

- sort engine
- preset engine
- default preset = Largest Files
- counts and percent-of-root

Success check:

- Review Mode can answer “what are the largest files under here?”

### Milestone C — Grouping

Deliver:

- group engine
- visible row model
- expand/collapse groups
- counts on groups and directory rows

Success check:

- Review Mode can group by type or parent and still navigate correctly

### Milestone D — Filter UX

Deliver:

- toolbar
- filters modal
- min size
- age bucket
- extension/type
- path prefix
- media-only
- source filter scaffolding

Success check:

- user can interactively narrow large datasets to meaningful candidates

### Milestone E — Cross-view integration

Deliver:

- open selected item in Flat
- open selected item in Tree
- preserved Review state per root
- footer/help updates

Success check:

- Review Mode feels like a true first-class mode rather than a dead end

### Milestone F — Polish

Deliver:

- narrow layout tuning
- status panel / inspector
- help text cleanup
- edge-case fixes
- performance checks on large trees

---

## Recommended File Changes Summary

### New files

- `src/review/types.ts`
- `src/review/defaults.ts`
- `src/review/derive.ts`
- `src/review/filter.ts`
- `src/review/sort.ts`
- `src/review/group.ts`
- `src/review/rows.ts`
- `src/review/presets.ts`
- `src/components/ReviewList.tsx`
- `src/components/ReviewToolbar.tsx`
- `src/components/ReviewFiltersModal.tsx`
- `src/components/ReviewInspector.tsx` or a `StatusPanel` extension
- `src/components/tableLayout.ts` (optional but recommended)

### Updated files

- `src/state.ts`
- `src/App.tsx`
- `src/keys.ts`
- `src/components/Footer.tsx`
- `src/components/FileList.tsx` (only if extracting shared helpers)
- `src/components/HelpModal.tsx` (if mode-specific help is added)
- `src/config.ts` (only later if Review defaults become configurable)

### New tests

- `tests/review.derive.test.ts`
- `tests/review.filter.test.ts`
- `tests/review.sort.test.ts`
- `tests/review.group.test.ts`
- `tests/review.rows.test.ts`
- `tests/ReviewList.test.tsx`

### Updated tests

- `tests/state.test.ts`
- possibly `tests/App.test.tsx`

---

## Performance Notes

The current scanner can already handle large trees, but Review Mode introduces new derived work.

Important safeguards:

- derive review entries with `useMemo`
- avoid repeated recursive counting during every render
- compute directory descendant counts once during entry creation
- keep sort/filter/group as pure transforms over arrays
- use stable IDs for rows to minimise rerender churn
- clamp selection after filter changes

If performance becomes an issue on very large trees, the first optimisation should be:

- cached derived entries by root path and scan version

not scanner rewrites.

---

## Edge Cases to Handle Early

- current root has no descendants
- filters exclude everything
- all visible rows are group headers
- selected row becomes invalid after filtering
- deleted file was selected in Review Mode
- file opened in Flat/Tree no longer exists after rescan
- created time missing on some platforms
- extensionless files
- hidden parent directories with visible children
- hidden ancestry filtering matches tree-mode expectations
- symlinks and broken symlinks

These should be covered in both logic tests and light UI tests.

---

## Deferred Work

Do not block V1 on these:

- saved user-configurable default preset
- custom saved review views
- hash-based duplicate detection
- media metadata like duration/codec/resolution
- transcode candidate analysis
- richer mount/device metadata
- destructive actions unique to Review Mode

The V1 objective is a strong filesystem-review workflow, not a full media librarian.

---

## Suggested Build Order for Real Development

If implemented in one working branch, the recommended order is:

1. add `review` to `ViewMode`
2. create `review/types.ts` and `review/defaults.ts`
3. implement `deriveReviewEntries`
4. wire simple Review Mode list in `App.tsx`
5. add sort/preset support
6. add grouping and visible row model
7. add filter engine and minimal filter controls
8. add explicit Flat/Tree open actions
9. add inspector/status integration
10. finish tests and polish narrow layouts

This keeps the feature shippable at several points without forcing a massive all-or-nothing refactor.

---

## Final Outcome

When complete, SMDU should have three distinct but connected modes:

- **Flat** — immediate children of current directory
- **Tree** — hierarchical flattened traversal from current root
- **Review** — analysis-first ranked and grouped audit mode over all descendants

That gives the app a much stronger identity: not just “terminal disk usage browser”, but a practical review and cleanup tool for real datasets.
