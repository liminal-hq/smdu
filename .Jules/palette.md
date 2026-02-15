## 2024-05-23 - Empty State Clarity

**Learning:** Empty directories in TUI file managers can look broken without explicit feedback. Users may think the scan failed or the app froze.
**Action:** Always render a "This directory is empty" message (styled with muted/italic text) when a list view has zero items, even if the surrounding UI (header/footer) is present.
