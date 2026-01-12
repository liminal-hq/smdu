# SMDU Feature Ideas & Roadmap

## Philosophy Note
SMDU is growing beyond the Unix "do one thing well" principle - and that's okay! Modern TUI tools like `lazygit`, `k9s`, and `bottom` prove that a focused domain (disk usage) can support rich interactions. Think of it as "do one *domain* well" rather than one *function* well.

---

## 🔥 High Priority (Quick Wins)

### 1. Incremental/Real-Time Scanning Display
**Problem:** Large scans show no progress until complete  
**Solution:** Update the file list as directories complete, sort in real-time  
**Impact:** Massive UX improvement, users can start exploring immediately  
**Complexity:** Medium  
**Implementation Notes:**
- Modify `scanDirectory` to yield results progressively
- Add a "partial scan" indicator in the UI
- Keep the list sorted as new items arrive
- Consider debouncing updates (every 100ms) to avoid flickering

**Research:**
- Look into async generators in TypeScript
- Consider using a priority queue for sorting during scan
- Test with very large directories (millions of files)

---

### 2. Enhanced Focus Mode
**Problem:** Hard to track selection in large lists  
**Solution:** Dim non-selected items more aggressively  
**Impact:** High (especially for neurodivergent users)  
**Complexity:** Low  
**Implementation Notes:**
- Add `opacity` or `dim` property to unselected items
- Make this configurable (some users may want subtle, others want stark)
- Consider adding a "focus line" or border around selection

**Research:**
- Test with different terminal emulators (some handle dimming differently)
- Check if Ink supports opacity/dimming natively
- Consider using inverse colours for selected item

---

### 3. Information Panel (Press `i`) ✅
**Problem:** Users need to leave SMDU to check file details  
**Solution:** Modal showing full path, dates, permissions, file type  
**Impact:** High  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Create new `InfoModal` component
- Use `fs.stat` for detailed file info
- Show:
  - Full path
  - Size (with multiple unit formats)
  - Created/modified/accessed dates
  - Permissions (octal and rwx format)
  - Owner/group
  - File type/MIME (use `file-type` package)
  - For directories: item count, depth

**Research:**
- `file-type` npm package for MIME detection
- `date-fns` for human-readable dates ("2 days ago")
- Consider showing inode, device info for power users

---

### 4. Breadcrumb Navigation Enhancement
**Problem:** Current breadcrumb is just display, not interactive  
**Solution:** Make each segment clickable, show relative sizes  
**Impact:** Medium-High  
**Complexity:** Medium  
**Implementation Notes:**
- Parse current path into segments
- Make each segment respond to selection (needs keyboard navigation)
- Show size of each parent directory in breadcrumb
- Alternative: Add `gg` keybinding for "go to path" dialogue

**Research:**
- How to handle keyboard navigation of breadcrumbs in TUI
- Consider a "fuzzy finder" style interface for path jumping
- Look at `fzf` integration for path selection

---

## 🎨 Visual Enhancements

### 5. File Type Colour Coding ✅
**Problem:** All items look the same regardless of type  
**Solution:** Colour-code by category with optional legend  
**Impact:** Medium (helps pattern recognition)  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Create file type categories:
  - 🔴 Media (video, audio, images)
  - 🟡 Documents (pdf, docx, txt)
  - 🟢 Code (js, ts, py, etc.)
  - 🔵 Archives (zip, tar, gz)
  - ⚫ System/Config (dotfiles, logs)
- Add legend toggle with `L` key
- Make colours theme-aware
- Add config option to disable

**Research:**
- Build a comprehensive file extension → category mapping
- Consider using `mime-types` package
- Test colour visibility across themes

---

### 6. Visual Indicators for Item Types
**Problem:** Folders and files look similar at a glance  
**Solution:** Consistent icons/prefixes  
**Impact:** Medium  
**Complexity:** Low  
**Implementation Notes:**
- Use Unicode symbols:
  - 📁 Directory
  - 📄 File
  - 🔗 Symlink
  - 📦 Archive
  - 🎵 Audio
  - 🎬 Video
  - 🖼️ Image
- Make this a toggle (some terminals don't render well)
- Add to config as `showIcons: boolean`

**Research:**
- Test Unicode rendering across terminal emulators
- Consider ASCII fallback mode
- Look at how `lsd` and `exa` handle icons

---

### 7. Heatmap Mode for Size Bars
**Problem:** All bars use same colour, harder to spot outliers  
**Solution:** Gradient from green (small) → yellow → red (large)  
**Impact:** Medium  
**Complexity:** Low  
**Implementation Notes:**
- Calculate colour based on size relative to largest item
- Use HSL colour space for smooth gradient
- Make this a toggle with `H` key
- Ensure accessibility (don't rely solely on colour)

**Research:**
- Colour gradient algorithms
- Accessibility guidelines for colour-coded data
- Test with colourblind-friendly palettes

---

## 🧠 ADHD/Autism-Friendly Features

### 8. Quick Insights / "What's Taking Space?"
**Problem:** Need to scan entire list to find space hogs  
**Solution:** Show top 3 consumers at the top of view  
**Impact:** High (reduces cognitive load)  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Add a collapsible panel at top (toggle with `I`)
- Show:
  - "🔴 Largest item: X (45%)"
  - "🟡 2nd largest: Y (23%)"
  - "🟢 3rd largest: Z (15%)"
- Update as user navigates
- Consider showing "unexpected" items (large hidden files)

**Research:**
- How to make this non-intrusive
- Consider showing "compared to parent directory"
- Add "suggestions" (e.g., "Old logs detected")

---

### 9. Timer Mode
**Problem:** Open-ended cleaning sessions can be overwhelming  
**Solution:** Set a focus timer with visual countdown  
**Impact:** High for ADHD users  
**Complexity:** Medium  
**Implementation Notes:**
- Add `T` key to set timer (5/10/15/30 minutes)
- Show countdown in footer or corner
- Optional: bell/notification when time's up
- Track session stats (space freed, files deleted)
- Show "achievement" message at end

**Research:**
- Node.js timer APIs
- Terminal bell/notification support
- Gamification patterns that don't become annoying

---

### 10. Achievement System / Session Stats
**Problem:** Hard to feel progress, easy to lose motivation  
**Solution:** Track and celebrate accomplishments  
**Impact:** Medium-High  
**Complexity:** Medium  
**Implementation Notes:**
- Track in current session:
  - Space freed
  - Files deleted
  - Directories explored
- Show periodic encouragement:
  - "You've freed 5 GiB! 🎉"
  - "10 directories cleaned! ⭐"
- Add `--session-log` flag to save session history
- Consider long-term stats across runs

**Research:**
- Non-annoying notification patterns
- Where to store session history
- Privacy implications of tracking

---

### 11. Smart Suggestions / Auto-Highlight Candidates
**Problem:** Decision fatigue - what should I delete?  
**Solution:** Intelligent highlighting of deletion candidates  
**Impact:** High (reduces analysis paralysis)  
**Complexity:** High  
**Implementation Notes:**
- Create heuristics for "probably safe to delete":
  - Temp files (`*.tmp`, cache directories)
  - Old downloads (>90 days in ~/Downloads)
  - Large log files
  - Duplicate filenames in same directory
  - Empty directories
- Add visual indicator (⚠️ or different colour)
- Add `A` key to show "suggested deletions" view
- IMPORTANT: Add safety warnings, make opt-in

**Research:**
- Safe deletion heuristics (research ncdu, BleachBit)
- Duplicate file detection algorithms (hash-based)
- User studies on automated suggestions

---

### 12. Pre-set Filters / Quick Views
**Problem:** Repeatedly typing same filter criteria  
**Solution:** Quick-access filter presets  
**Impact:** Medium  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Add number keys for presets:
  - `1`: Show items >1 GiB
  - `2`: Show items >100 MiB
  - `3`: Show items modified >6 months ago
  - `4`: Show items modified <7 days ago
  - `5`: Show empty files/directories
- Make presets configurable in config file
- Show active filter in header

**Research:**
- Filter syntax design
- How to make discoverable without cluttering UI

---

### 13. Sensory Customisation Options
**Problem:** One size doesn't fit all sensory needs  
**Solution:** Extensive customisation options  
**Impact:** High for accessibility  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Add to config:
  - High contrast mode (stark black/white)
  - Reduced motion (disable animations/progress bars)
  - Optional sound effects (toggle with `--sound`)
  - Dyslexia-friendly font recommendations in README
  - Adjustable scan update frequency (reduce flicker)
- Consider a `--accessibility` flag that sets sensory-friendly defaults

**Research:**
- Terminal accessibility best practices
- Web Content Accessibility Guidelines (adapted for TUI)
- Test with screen readers (though TUI support is limited)

---

## 🔍 Navigation & Filtering

### 14. Advanced Filtering System
**Problem:** Can't easily find specific items  
**Solution:** Comprehensive filter modes  
**Impact:** High  
**Complexity:** Medium-High  
**Implementation Notes:**
- Add filter modes (activated with `/`):
  - Name pattern (glob or regex)
  - Size range (`>100MB`, `<1GB`, `100MB-500MB`)
  - Date range (modified/created)
  - File type/extension (`.mp4`, `.log`)
- Show filter in header with clear indicator
- `Esc` or `/` again to clear filter
- Consider filter history (up/down arrows)

**Research:**
- Glob vs regex - which is more user-friendly?
- `minimatch` package for glob patterns
- UI design for filter input in TUI

---

### 15. Bookmarks System
**Problem:** Repeatedly navigating to same directories  
**Solution:** Bookmark frequently-checked paths  
**Impact:** Medium  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Press `b` to bookmark current directory
- Press `B` to open bookmark list modal
- Store in config file as array of paths
- Show bookmark indicator in list (⭐)
- Add bookmark name/description support
- Support bookmark groups/tags

**Research:**
- Bookmark UI design (modal vs sidebar)
- How to handle deleted/moved directories
- Consider sync with shell bookmarks (if possible)

---

### 16. "Go To" Quick Navigation
**Problem:** Navigating deep trees is slow  
**Solution:** Type-to-jump interface  
**Impact:** High for power users  
**Complexity:** Medium  
**Implementation Notes:**
- Press `g` to open "Go To" modal
- Type path (with tab completion)
- Fuzzy matching for paths
- Show recent paths
- Integration with bookmarks

**Research:**
- Autocomplete in TUI (Ink input components)
- Fuzzy matching algorithms (`fuse.js`)
- Consider integrating with `fzf` externally

---

### 17. Hidden Files Toggle ✅
**Problem:** Hidden files clutter view or are needed selectively  
**Solution:** Quick toggle  
**Impact:** Medium  
**Complexity:** Low  
**Implementation Notes:**
- Press `.` to toggle showing hidden files
- Show indicator in header when hidden files are shown
- Remember preference per session (or persist to config)
- Consider: default to hidden files off, but scan still includes them in size calculations

**Research:**
- Platform differences in hidden files (Unix `.` vs Windows attributes)

---

### 18. Follow Symlinks
**Problem:** Symlinks show their own tiny size, not target  
**Solution:** Follow to target with `f` key  
**Impact:** Low-Medium  
**Complexity:** Low  
**Implementation Notes:**
- When symlink is selected, press `f` to jump to target
- Show target path in info panel
- Handle broken symlinks gracefully
- Show symlink indicator (🔗 or `->`)

**Research:**
- `fs.readlink` and `fs.realpath`
- Cycle detection (symlink loops)

---

## 📊 Data Management

### 19. Export & Reports
**Problem:** Need to share findings or keep records  
**Solution:** Export current view to structured formats  
**Impact:** Medium (especially for teams/audits)  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Press `x` to open export dialogue
- Format options:
  - CSV (path, size, percentage, type)
  - JSON (full tree structure)
  - Text report (human-readable)
  - Markdown (for documentation)
- Include metadata (scan date, total size, path)
- Save to `~/Downloads/smdu-export-{date}.csv`

**Research:**
- CSV formatting libraries
- Consider adding `--export` CLI flag for scripting

---

### 20. Scan Caching & History
**Problem:** Re-scanning is slow, no historical comparison  
**Solution:** Cache scan results and enable comparison  
**Impact:** High  
**Complexity:** Medium-High  
**Implementation Notes:**
- Store scan results in `~/.cache/smdu/{path-hash}.json`
- Include timestamp, file tree, scan metadata
- On launch, check if cache exists and is recent (<1 hour)
- Show "Loaded from cache (scanned 15 minutes ago)" message
- Add `--no-cache` flag to force fresh scan
- Add `R` key to refresh current directory

**Research:**
- Cache invalidation strategies
- Serialisation format (JSON vs binary)
- Compression for large directory trees

---

### 21. Comparison Mode
**Problem:** Can't see what changed since last scan  
**Solution:** Diff view showing changes  
**Impact:** Medium-High  
**Complexity:** High  
**Implementation Notes:**
- When cache exists, offer comparison mode (`C` key)
- Show:
  - New files (+ indicator, green)
  - Deleted files (- indicator, red)
  - Changed files (Δ indicator, yellow)
  - Size differences (+5 GiB, -200 MiB)
- Add filter: "Show only changes"
- Generate report of changes

**Research:**
- Tree diffing algorithms
- How to visualise changes in TUI effectively
- Consider: track multiple historical scans

---

### 22. Background Re-scanning
**Problem:** Refreshing blocks UI  
**Solution:** Scan in background while user continues working  
**Impact:** Medium  
**Complexity:** High  
**Implementation Notes:**
- When `R` is pressed, start scan in background
- Show subtle progress indicator (spinner in footer)
- Update view incrementally as new data arrives
- Handle race conditions (user navigates during scan)
- Use Node.js worker threads or separate process

**Research:**
- Node.js `worker_threads` API
- IPC between main process and scanner
- Ink rendering while background task runs

---

## 🗂️ Advanced Operations

### 23. Batch Operations / Multi-Select
**Problem:** Can only delete one item at a time  
**Solution:** Mark multiple items for batch operations  
**Impact:** High  
**Complexity:** Medium  
**Implementation Notes:**
- Press `Space` to mark/unmark item
- Visual indicator: `[✓]` prefix or highlight colour
- Show count in footer: "3 items marked"
- Operations on marked items:
  - `d`: Delete all marked
  - `m`: Move all marked (prompt for destination)
  - `c`: Copy all marked
  - `x`: Export marked to list
- `Ctrl+A`: Mark all visible items
- `Ctrl+Shift+A`: Unmark all

**Research:**
- State management for selections
- How to make operations "undoable"
- Safety confirmations for batch operations

---

### 24. Move Operation
**Problem:** Delete is destructive, sometimes you want to relocate  
**Solution:** Move files/directories to another location  
**Impact:** Medium  
**Complexity:** Medium  
**Implementation Notes:**
- Press `m` on item (or marked items) to move
- Show dialogue: "Move to:" with path input
- Support tab completion, bookmarks
- Show progress for large moves
- Handle cross-filesystem moves (copy + delete)

**Research:**
- `fs.rename` vs `fs.copyFile` + `fs.unlink`
- Progress tracking for large operations
- Atomic operations and failure handling

---

### 25. Duplicate Finder
**Problem:** Duplicate files waste space  
**Solution:** Detect and highlight duplicates  
**Impact:** Medium  
**Complexity:** High  
**Implementation Notes:**
- Add `D` key to enter "duplicate detection mode"
- Find duplicates by:
  - Exact size match (fast, but many false positives)
  - Hash (SHA-256) of first 4KB (fast, good accuracy)
  - Full file hash (slow, perfect accuracy)
- Show groups of duplicates
- Allow marking all-but-one for deletion
- Show size savings potential

**Research:**
- Fast duplicate detection algorithms
- Hash function selection (performance vs accuracy)
- UI for showing duplicate groups
- Look at `fdupes`, `jdupes` implementations

---

## 🎯 Dual Pane Mode

### 26. Dual Pane Interface
**Problem:** Comparing directories or moving files between them  
**Solution:** Split-screen view with two independent navigations  
**Impact:** High for power users  
**Complexity:** High  
**Implementation Notes:**
- Press `P` to toggle dual pane mode
- Split screen vertically (50/50)
- Each pane is independent (own path, selection, sort)
- Active pane highlighted
- `Tab` to switch active pane
- Operations work across panes:
  - `m`: Move from active to other pane's path
  - `c`: Copy to other pane's path
  - `C`: Compare directories (show diff)
- Footer shows stats for both panes

**Research:**
- Ink layout management for split view
- State management for two independent navigations
- How to handle very narrow terminals
- Look at `Midnight Commander`, `ranger` dual pane implementations

---

## 🔧 Performance & Technical

### 27. Scan Profiles
**Problem:** Different use cases need different scan options  
**Solution:** Saveable scan configurations  
**Impact:** Medium  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Create profile system in config:
  ```json
  {
    "profiles": {
      "quick": { "maxDepth": 3, "ignoreHidden": true },
      "deep": { "maxDepth": -1, "followSymlinks": true },
      "home": { "path": "~", "excludePatterns": ["node_modules"] }
    }
  }
  ```
- Add `--profile <name>` CLI flag
- Add profile selector in UI (`Shift+P`)
- Common profiles: quick, deep, media-only, code-only

**Research:**
- Profile configuration schema
- How to make profiles discoverable

---

### 28. Exclude Patterns
**Problem:** Some directories should always be skipped  
**Solution:** Configurable ignore patterns  
**Impact:** Medium  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Add to config:
  ```json
  {
    "excludePatterns": [
      "node_modules",
      ".git",
      "*.tmp",
      ".cache"
    ]
  }
  ```
- Respect `.gitignore` if present (opt-in)
- Show excluded items count in footer
- Allow toggling "show excluded" with key

**Research:**
- Glob pattern matching
- `.gitignore` parsing (use `ignore` package)
- Performance impact of pattern matching

---

### 29. Scan Progress Improvements
**Problem:** Progress is just numbers, not meaningful  
**Solution:** Enhanced progress feedback  
**Impact:** Medium  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Show estimated time remaining (based on items/second)
- Show current directory depth
- Show "stuck" warning if directory takes >10 seconds
- Visualise scan with tree-growth animation
- Show running "top 5 largest items found so far"

**Research:**
- ETA calculation algorithms
- Non-blocking progress updates
- Terminal animation techniques

---

## 🎮 Quality of Life

### 30. Persistent Context Bar
**Problem:** Easy to forget keybindings  
**Solution:** Always-visible context-sensitive help  
**Impact:** Medium  
**Complexity:** Low  
**Implementation Notes:**
- Bottom of screen shows relevant actions
- Changes based on context:
  - Normal: `[d] Delete | [Enter] Open | [n] Sort Name`
  - Multi-select: `[d] Delete 3 items | [Space] Unmark | [Esc] Clear`
  - Filter mode: `[Enter] Apply | [Esc] Cancel`
- Keep concise, only show top 5-6 actions
- Make collapsible with `Ctrl+B` for full-screen view

**Research:**
- Dynamic help text generation
- Terminal width management (abbreviate on narrow screens)

---

### 31. Mouse Support (if possible)
**Problem:** Some users prefer mouse interaction  
**Solution:** Click to select, scroll to navigate  
**Impact:** Low (Ink limitation)  
**Complexity:** High (may be impossible)  
**Implementation Notes:**
- Ink doesn't support mouse well currently
- Research alternatives:
  - `blessed` library (older but has mouse support)
  - Raw terminal control with `ansi-escapes`
  - Hybrid approach (Ink + mouse overlay)
- Features if possible:
  - Click to select item
  - Scroll wheel to navigate
  - Click breadcrumbs to jump
  - Drag and drop to move files

**Research:**
- Ink roadmap for mouse support
- `blessed` vs Ink comparison
- Terminal emulator mouse protocol support

---

### 32. Vim-Style Commands
**Problem:** Power users want efficiency  
**Solution:** Vim-inspired command mode  
**Impact:** Medium (niche but powerful)  
**Complexity:** Medium  
**Implementation Notes:**
- Press `:` to enter command mode
- Commands:
  - `:q` - Quit
  - `:cd <path>` - Change directory
  - `:sort name` / `:sort size` - Sort
  - `:filter >100MB` - Apply filter
  - `:export csv ~/output.csv` - Export
  - `:bookmark add` - Bookmark current
  - `:theme dracula` - Change theme
- Tab completion for commands
- Command history (up/down arrows)

**Research:**
- Command parser implementation
- Argument parsing and validation
- Command plugin system for extensibility

---

## 🚀 Advanced / Long-Term Ideas

### 33. Plugin System
**Problem:** Can't extend functionality without forking  
**Solution:** Plugin architecture  
**Impact:** High (community contributions)  
**Complexity:** Very High  
**Implementation Notes:**
- Define plugin API:
  - File type handlers (custom icons, colours)
  - Custom filters
  - Export formats
  - Key bindings
  - Scan hooks (pre/post)
- Plugin discovery in `~/.config/smdu/plugins/`
- Plugin manager (install/list/remove)
- Security considerations (sandboxing?)

**Research:**
- Plugin architecture patterns
- TypeScript plugin loading
- Security models for untrusted plugins
- Look at `vim-plug`, `eslint` plugin systems

---

### 34. Remote Scanning (SSH/SFTP)
**Problem:** Can't analyse remote servers easily  
**Solution:** Scan over SSH  
**Impact:** Medium (DevOps/sysadmin users)  
**Complexity:** Very High  
**Implementation Notes:**
- Add `--remote user@host:/path` flag
- Use SSH to run scan on remote system
- Stream results back incrementally
- Handle authentication (keys, passwords)
- Consider: deploy lightweight scanner binary to remote

**Research:**
- `ssh2` npm package
- Security implications
- Network performance optimisation
- How `ncdu` handles remote scans (it doesn't)

---

### 35. Sparklines / Historical Trends
**Problem:** No sense of how disk usage changes over time  
**Solution:** Show size change history as sparklines  
**Impact:** Low-Medium  
**Complexity:** High  
**Implementation Notes:**
- Requires scan history storage (see #20)
- Show miniature graph next to size:
  - `📈` Trending up
  - `📉` Trending down
  - `━` Stable
- Detailed view shows full graph over time
- Track per-directory trends

**Research:**
- Sparkline rendering in terminal
- Historical data storage and querying
- Statistical analysis (trends, predictions)

---

### 36. Integration with Cloud Storage
**Problem:** Local disk is only part of storage picture  
**Solution:** Scan cloud storage (Google Drive, Dropbox, etc.)  
**Impact:** Low (niche)  
**Complexity:** Very High  
**Implementation Notes:**
- OAuth authentication for cloud services
- API wrappers for each service
- Merge view showing local + cloud
- Cloud-specific operations (share links, etc.)
- Handle rate limits, pagination

**Research:**
- Each cloud service API
- OAuth flow in CLI application
- Cost/quota implications of API calls

---

## 📝 Documentation & Onboarding

### 37. Interactive Tutorial
**Problem:** First-time users overwhelmed by features  
**Solution:** Guided tour on first run  
**Impact:** High for adoption  
**Complexity:** Medium  
**Implementation Notes:**
- Detect first run (no config file)
- Show step-by-step tutorial overlay
- Cover: navigation, sorting, views, deletion, settings
- Allow skip/exit tutorial
- Add `--tutorial` flag to replay

**Research:**
- In-app tutorial UX patterns
- Progress tracking through tutorial
- How to make optional but discoverable

---

### 38. Comprehensive README & Man Page
**Problem:** Features aren't discoverable outside the app  
**Solution:** Documentation overhaul  
**Impact:** Medium  
**Complexity:** Low  
**Implementation Notes:**
- Expand README with:
  - Feature showcase (GIFs/screenshots)
  - Common workflows
  - FAQ
  - Troubleshooting
- Create man page (`man smdu`)
- Add `--examples` flag showing common use cases
- Video walkthrough for YouTube

**Research:**
- Man page creation tools
- GIF recording tools for terminal (`asciinema`, `vhs`)
- Documentation best practices

---

## 🔐 Security & Safety

### 39. Safer Deletion with Trash
**Problem:** Deletion is permanent, mistakes happen  
**Solution:** Move to trash instead of permanent delete  
**Impact:** High (safety)  
**Complexity:** Low-Medium  
**Implementation Notes:**
- Use platform trash directories:
  - Linux: `~/.local/share/Trash/`
  - macOS: `~/.Trash/`
  - Windows: Recycle Bin
- Press `d` to move to trash
- Press `Shift+D` for permanent delete (with scary warning)
- Add `--empty-trash` flag to clear trash

**Research:**
- `trash` npm package
- Platform-specific trash implementations
- XDG trash specification

---

### 40. Dry Run Mode
**Problem:** Want to see what would be deleted without doing it  
**Solution:** Simulate deletions  
**Impact:** Medium  
**Complexity:** Low  
**Implementation Notes:**
- Add `--dry-run` flag
- Show "would delete" messages instead of actually deleting
- Log all actions that would occur
- Generate report of planned actions
- Useful for script testing

**Research:**
- Logging framework
- Report generation format

---

## Implementation Priority Ranking

### Phase 1: Foundation (Next 2-4 weeks)
1. **Incremental Scanning** (#1) - Game-changer for UX
2. **Enhanced Focus Mode** (#2) - Quick win, high impact
3. **Information Panel** (#3) - Frequently requested
4. **File Type Colour Coding** (#5) - Visual improvement

### Phase 2: Navigation & Filtering (4-6 weeks)
5. **Advanced Filtering** (#14) - Power user feature
6. **Bookmarks** (#15) - Productivity boost
7. **Quick Insights** (#8) - ADHD-friendly
8. **Breadcrumb Enhancement** (#4) - Polish existing feature

### Phase 3: Operations & Data (6-10 weeks)
9. **Batch Operations** (#23) - Essential for cleanup workflows
10. **Export/Reports** (#19) - Team/audit needs
11. **Scan Caching** (#20) - Performance win
12. **Safer Deletion** (#39) - Safety critical

### Phase 4: Advanced Features (10-16 weeks)
13. **Comparison Mode** (#21) - Builds on caching
14. **Dual Pane** (#26) - Power user feature
15. **Duplicate Finder** (#25) - High value
16. **Timer Mode** (#9) - ADHD-specific

### Phase 5: Long-term / Nice-to-Have
- Achievement System (#10)
- Smart Suggestions (#11)
- Plugin System (#33)
- Remote Scanning (#34)

---

## Quick Reference: Complexity vs Impact

```
High Impact, Low Complexity (DO FIRST):
- Enhanced Focus Mode
- Information Panel
- File Type Colour Coding
- Visual Indicators
- Quick Insights

High Impact, Medium Complexity:
- Incremental Scanning
- Advanced Filtering
- Bookmarks
- Batch Operations
- Safer Deletion

High Impact, High Complexity:
- Dual Pane Mode
- Duplicate Finder
- Comparison Mode

Medium Impact, Low Complexity (POLISH):
- Heatmap Mode
- Hidden Files Toggle ✅
- Persistent Context Bar
- Exclude Patterns

Low Impact / Niche (LATER):
- Mouse Support
- Remote Scanning
- Cloud Integration
```

---

## Notes on Philosophy

Remember: SMDU doesn't need to implement EVERYTHING. Focus on:
1. **Disk usage analysis** (core mission)
2. **Making decisions easier** (reduce cognitive load)
3. **Being accessible** (neurodivergent-friendly)
4. **Fast & efficient** (respect user's time)

Avoid feature creep into:
- Full file manager territory (use `ranger`, `nnn` for that)
- System administration tasks (permissions, ownership bulk changes)
- File editing/viewing (that's what editors are for)

The goal is: "The best tool for understanding and cleaning up disk usage" not "Replace all file operations."

---

## Community Feedback Section

*(Add notes here from user feedback, GitHub issues, etc.)*

- [ ] User request: Add ...
- [ ] Bug report: Feature X doesn't work when ...
- [ ] Enhancement: Consider supporting ...
