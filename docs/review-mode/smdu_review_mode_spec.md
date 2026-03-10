# SMDU Review Mode Spec

## Overview

SMDU currently provides strong navigation and hierarchy inspection for scanned storage trees, but the existing views answer the question **"where is space located in the tree?"** more directly than **"which exact items deserve attention?"**

Review Mode introduces a new lens over the same scan data. Instead of presenting only the immediate children of the current location, it presents a ranked, filterable review surface for files and directories under the selected root.

This is especially useful for media mounts, backup volumes, photo archives, downloads, caches, and mixed datasets where the user needs to identify individual files, heavy folders, stale large items, or suspicious growth patterns.

Review Mode should be designed as a general-purpose audit view, with media being the first motivating use case rather than the only one.

---

## Goals

Review Mode should:

- Help the user identify **specific files or directories** that are consuming meaningful space.
- Support **ranking and filtering** across the full scanned subtree.
- Work as a **new lens over existing scan data**, not as a separate scanner.
- Preserve the existing navigation model by allowing users to **jump from a review result back into normal browsing context**.
- Generalise beyond media so the feature remains useful for archives, backups, code, logs, caches, and photos.

---

## Non-Goals (V1)

Review Mode V1 will not:

- Perform deep media metadata extraction such as duration, bitrate, codec, or subtitle inspection.
- Perform content-aware deduplication using hashes.
- Add destructive file operations.
- Replace existing flat/tree browsing modes.

Those ideas are deferred to Review V2 and beyond.

---

## Terminology

- **Current root**: the directory currently being reviewed.
- **Review dataset**: all matching descendants under the current root, flattened into a ranked list.
- **Candidate**: a file or directory included in the review dataset.
- **Preset**: a saved or built-in combination of sort, scope, and filters.

---

## User Problem

The current view is effective for showing which top-level directories are largest, but users often care more about:

- the largest files anywhere under a mount
- old large files that are likely safe to archive or remove
- recent growth that may indicate new media, backups, downloads, or runaway data
- which file types are consuming the most space
- whether a folder is dominated by a few massive files or huge counts of tiny files
- potential duplicate candidates

This means users need an **analysis-first mode** rather than a strictly tree-first mode.

---

## Core Concept

Add a third major view mode:

- `Flat`
- `Tree`
- `Review`

Review Mode presents a flattened, ranked, filterable list of candidates under the current root. Each row represents something worth inspecting, not just a direct child in the current directory.

The model should feel closer to an audit table than a file browser.

---

## Review Mode V1 Scope

### Core behaviour

Review Mode V1 should:

- derive its data from the already scanned tree
- flatten descendants under the current root into a review dataset
- support reviewing **files**, **directories**, or both depending on filter state
- support multiple sorts
- support **grouping** in V1
- support composable filters
- support built-in review presets
- preserve its own browsing state per root
- support full operations directly inside Review Mode so the user is not forced out of the mode for normal review work
- support shortcuts that open the currently selected item in alternate views when desired

### Initial built-in presets

1. **Largest Files**
   - Files only
   - Sort by size descending

2. **Largest Directories**
   - Directories only
   - Sort by contained size descending

3. **Oldest Large Files**
   - Files only
   - Minimum size filter enabled
   - Sort by age / modified time ascending (oldest first)

4. **Recent Growth**
   - Files only by default
   - Sort by modified time descending
   - Intended to answer “what got added or changed recently?”

5. **By Type**
   - Files only
   - Grouping or sorting by extension/type
   - Secondary sort by size descending

These presets should be viewed as preconfigured starting points rather than separate implementations.

## Data Model Expectations

Review Mode should operate over the scan output and compute a derived list of entries.

Each review candidate should expose, where available:

- absolute path
- basename
- parent path
- entry kind (`file` / `directory`)
- size
- percentage of current root total
- modified time
- created time (if available)
- extension / inferred type
- descendant file count (for directories)
- descendant directory count (for directories)

This data may be partially platform-dependent. Missing fields should degrade gracefully.

---

## UI Requirements

### View switcher

The main UI should expose a clear way to switch between:

- Flat
- Tree
- Review

### Table-like presentation

Review Mode should favour a denser, table-like listing. Suggested columns:

**Wide layout:**

- Path
- Size
- Age
- Type
- % of total

**Narrow layout:**

- Path
- Size
- Age

The exact layout can adapt to terminal width.

### Detail panel / inspector

When a row is selected, the detail area should show deeper context such as:

- full path
- parent directory
- exact size
- modified date
- created date if available
- type / extension
- percent of root total
- for directories: item counts if available
- optional contextual note such as “14% of current root” or “dominates parent directory”

### Navigation interop

Review Mode should function as a first-class view mode rather than a temporary launcher into another mode.

That means:

- the user should be able to perform normal review operations without being forced to leave Review Mode
- the selected candidate should remain actionable within Review Mode
- alternate views of the same selected item should be available through explicit key shortcuts

Examples:

- open selected item in Flat view
- open selected item in Tree view
- peek parent directory in another view while preserving the Review cursor/state

Default navigation should therefore **not** force a mode switch on selection. Cross-view jumps should be intentional and tied to specific keys.

Within Review Mode itself:

- pressing Enter on a selected **directory** should open that directory as the new current review root
- pressing Enter on a selected **file** should be a no-op in V1

For explicit cross-view jumps from Review into Flat or Tree:

- open the parent directory
- preselect the selected child entry
- apply a persistent entry-point highlight to that line so the user can see where they came from

## Sorting Requirements

Review Mode should support the following sorts:

- **Size**
- **Modified date**
- **Created date**
- **Path**
- **Extension / Type**
- **File count**
- **Percentage of scanned total**

Where fields are missing, that sort should still function with predictable fallback ordering.

`File count` sort should remain available even in files-only scope. In those cases, ties should be resolved by stable fallback ordering (for example path ascending).

### Multi-sort

Review Mode should support secondary ordering, either explicitly or internally. Example combinations:

- size descending, then path ascending
- type ascending, then size descending
- modified descending, then size descending

Explicit user-facing multi-sort can be deferred if necessary, but the internal system should be designed to allow it.

### Grouping

Grouping is in scope for V1.

Initial useful groupings include:

- by extension / type
- by parent directory
- by age bucket
- by mount / source

When only one source is present, mount/source grouping may collapse to a single group.

Grouped views should still support sorting within groups and should expose group-level summary information such as:

- total size
- item count
- percentage of root total

## Filtering Requirements

Review Mode V1 should include the full filter set below.

### Scope filters

- **Files only**
- **Directories only**
- **Files and directories**

### Size filters

- **Minimum size**
- Optional future extension: maximum size

Minimum size is especially important for surfacing only meaningful candidates in large datasets.

### Age filters

- **Age bucket** filter

Suggested built-in age buckets:

- modified today (`age >= 0 and < 1 day`)
- modified this week (`age >= 1 day and < 7 days`)
- modified this month (`age >= 7 days and < 1 month`)
- older than 1 month (`age >= 1 month and < 3 months`)
- older than 3 months (`age >= 3 months and < 6 months`)
- older than 6 months (`age >= 6 months and < 1 year`)
- older than 1 year (`age >= 1 year`)

Buckets should be based on modified time for V1, and should be mutually exclusive for grouping.
Use local timezone boundaries for user-facing age bucket calculations.

### Type filters

- **Extension filter**
- **Inferred type filter** (if implemented)

Examples:

- `.mkv`
- `.mp4`
- `.zip`
- `.iso`
- `.jpg`
- `.flac`

### Path filters

- **Path prefix filter**

This allows the user to narrow a large review dataset to a branch within the current root.

### Media-focused filter

- **Media-only** preset / filter

This should include common media extensions and provide a quick way to review media datasets without manually entering many extensions.

### Visibility filters

- **Hidden included / excluded** toggle

This is useful for dot-directories, hidden cache locations, or platform-specific metadata folders.

When hidden entries are excluded, entries that are hidden by basename or by hidden ancestry should be excluded.

### Mount / source filter

- **Mount-specific** filter

Where scan context includes multiple roots or mount sources, the user should be able to restrict review results to one source.

This may be a no-op when the current review root is already a single mount.
In single-source scans, source controls may be disabled or hidden.

---

## Presets and Profiles

To keep the feature approachable, Review Mode should ship with built-in presets.

### V1 presets

- Largest Files
- Largest Directories
- Oldest Large Files
- Recent Growth
- By Type
- Media Review (optional named preset built on top of Review Mode filters)

### Future presets

- Archives
- Photos
- Backups
- Cleanup Candidates
- Duplicate Candidates
- Tiny File Clutter

Presets should be implemented as combinations of filter + sort + scope rather than separate logic paths.

---

## Media Review Use Case

Although Review Mode is general-purpose, the motivating media workflow is:

1. enter a large media mount or root
2. switch to Review Mode
3. filter to files only
4. apply minimum size threshold, e.g. `> 4 GiB`
5. optionally enable media-only
6. sort by size descending or modified date
7. identify large individual files, recently added media, or old oversized content

This should make it much easier to answer:

- what exact files are consuming space?
- what changed recently?
- what kinds of media dominate this dataset?

---

## Suggested Interaction Model

### Example key actions

The exact keymap may evolve, but Review Mode likely needs actions for:

- switch sort field
- reverse sort order
- switch grouping field
- collapse / expand groups
- open filter controls
- cycle presets
- toggle files/directories scope
- toggle hidden items
- open selected item in Flat view
- open selected item in Tree view
- return to previous location or view state

### Filter UX options

Possible approaches:

1. **Inline compact filter bar**
   - Fast and visible
   - Good for frequently toggled filters

2. **Popup / panel editor**
   - Better for more detailed filter composition
   - Easier if terminal space is tight

3. **Hybrid**
   - top bar for scope/sort/group/preset
   - side panel or modal for detailed filter editing

The recommended approach is a hybrid model:

- a persistent compact top bar for the most common controls
  - preset
  - scope
  - sort
  - grouping
  - hidden toggle
- a dedicated filter drawer, side panel, or modal for detailed filters such as:
  - minimum size
  - age bucket
  - extension/type filters
  - path prefix
  - media-only
  - mount/source selection

For very small terminal sizes, the detailed filter editor can collapse into a full-screen modal.

## Implementation Notes

### Architectural approach

Review Mode should be implemented as a derived view over the scan tree rather than a new scanning mechanism.

Suggested flow:

1. reuse current scan data structure
2. flatten descendants under current root into a review candidate list
3. apply scope filter
4. apply remaining filters
5. sort results
6. present ranked rows

This keeps the scanner simple and makes the feature additive.

### Performance

Potential concerns:

- flattening very large trees
- repeatedly recomputing filters on every keystroke
- sorting large candidate sets interactively

Mitigations:

- cache the flattened candidate list per root
- cache derived values such as extension, percent-of-total, and age bucket
- apply incremental recalculation only when filters or sort change
- support lazy rendering / virtualised row presentation if the UI toolkit benefits from it

### Graceful degradation

If created time or certain metadata is unavailable:

- hide or de-emphasise unavailable columns
- disable exact sort choices only if necessary
- otherwise use consistent fallback behaviour

---

## Review Mode V2 / Later Ideas

These ideas are intentionally deferred, but the V1 design should avoid blocking them.

### Rich media metadata

Allow optional enrichment for media files, including:

- duration
- resolution
- bitrate
- codec
- subtitle presence
- audio track count

This would enable much smarter media review and transcode decisions.

### Media-specific grouping

Potential future groupings:

- by series / season
- by container format
- by resolution tier
- by codec

### Duplicate detection

Progressive sophistication:

1. same filename + same size
2. same size + extension
3. hash-based duplicates

### Cleanup heuristics

Possible future labels or scores:

- likely archive candidate
- likely duplicate candidate
- unusually large for type
- recently exploded in size
- tiny-file clutter hotspot

### Tiny-file clutter analysis

Help identify directories dominated by enormous counts of small files, which can hurt sync, backup, indexing, or general usability.

### Advanced saved views

Allow users to save custom review configurations such as:

- “Movies over 8 GiB older than 1 year”
- “Recent downloads under /mnt/media9”
- “Hidden cache growth”

---

## Decisions / Resolved Questions

1. **Grouping in V1**
   - Yes. Review Mode V1 should support grouping.

2. **Show counts for directories**
   - Yes. Directory rows and groups should show counts.

3. **Filter UX in a small terminal**
   - Use a hybrid approach.
   - Keep the most common controls visible in a compact top bar.
   - Put detailed filters in a drawer, side panel, or modal.
   - Fall back to a full-screen modal on narrow layouts.

4. **Preserve Review Mode cursor/state per root**
   - Yes.

5. **Should Review Mode force a jump back to Flat/Tree?**
   - No.
   - Review Mode should be a full view mode with its own operations.
   - Alternate views should be opened intentionally with key shortcuts.

6. **Which view should cross-view open use?**
   - It depends on the key.
   - Provide explicit shortcuts for opening the selected item in Flat or Tree.

7. **Default preset**
   - Default should be **Largest Files**.
   - Future settings-based override is deferred.

8. **Count sort in files-only scope**
   - Keep `File count` sort available.
   - Use stable fallback ordering for ties.

9. **Enter behaviour in Review Mode**
   - Enter on a selected directory opens that directory in Review.
   - Enter on a selected file is a no-op in V1.

10. **Cross-view open behaviour**

- Open parent directory in Flat or Tree.
- Preselect the selected child entry.
- Keep a persistent entry-point highlight.

11. **Age bucket boundaries**

- Buckets should be non-overlapping.
- Use local timezone boundaries for user-facing bucket calculation.

12. **Source grouping in current architecture**

- Source grouping/filtering is still in V1 scope.
- In current single-root scans it may collapse to one source or be hidden/disabled in controls.

## Recommended Incremental Bootstrap (Optional)

If this feature is implemented incrementally, the following first slice is recommended as a bootstrap step.
The full V1 scope remains the target for release.

1. Add `Review` as a view mode.
2. Flatten descendants under current root.
3. Implement files-only / directories-only scope.
4. Implement sort by size, modified date, created date, path, and type.
5. Implement grouping by type and parent directory.
6. Implement minimum size filter.
7. Add built-in presets:
   - Largest Files
   - Largest Directories
   - Oldest Large Files
   - Recent Growth
   - By Type
8. Show directory and group counts.
9. Preserve Review cursor/state per root.
10. Support explicit shortcuts to open the selected item in Flat or Tree while keeping Review Mode first-class.

This first slice already transforms the app from a hierarchical space viewer into a practical cleanup and inspection tool.

---

## Summary

Review Mode adds an analysis-first lens to SMDU.

Instead of only showing where size lives in the tree, it helps the user answer:

- what exact files are largest?
- what is old and big?
- what changed recently?
- what types dominate this dataset?
- what deserves my attention first?

That makes it a natural next step for SMDU, especially in media-heavy environments, while also opening the door to broader audit workflows across any filesystem dataset.
