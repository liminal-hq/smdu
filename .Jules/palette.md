## 2024-05-23 - Empty State Clarity

**Learning:** Empty directories in TUI file managers can look broken without explicit feedback. Users may think the scan failed or the app froze.
**Action:** Always render a "This directory is empty" message (styled with muted/italic text) when a list view has zero items, even if the surrounding UI (header/footer) is present.

## 2024-05-23 - Destructive Action Context

**Learning:** Users often delete the wrong item in TUIs because "selected item" context can be lost when a modal appears.
**Action:** Always include the item name, type (file/directory), and size in delete confirmation dialogs to provide a final safety check.

## 2024-05-23 - Actionable Empty States

**Learning:** When a user encounters an empty state (like an empty directory), just telling them "it's empty" leaves them stranded, and they might think they have to quit. Providing a clear, actionable next step reduces friction.
**Action:** Always include a helpful call-to-action in empty states (e.g. "Press Left Arrow or Backspace to go back").
