# Pages site

This folder hosts project documentation. The static GitHub Pages site lives in a subfolder.

## Structure

- `distribution-strategy.md` captures release and packaging plans.
- `architecture/smdu_architecture_deconstruction.md` documents the runtime architecture and module relationships.
- `architecture/smdu_internal_architecture.svg` is a detailed colourful system architecture illustration.
- `architecture/smdu_terminal_io_event_model.md` is the deep-dive on terminal read/write flows and event boundaries.
- `architecture/smdu_terminal_event_lifecycle.svg` shows event generation, boundaries, and response lifecycle in a marker style.
- `architecture/smdu_terminal_protocol_surface.svg` maps control sequences and terminal side-effects (bell, alt-screen, cursor, ANSI diff writes).
- `architecture/smdu_terminal_event_constellation.svg` adds a playful constellation motif for event sources and response loops.
- `architecture/smdu_terminal_escape_sequence_map.svg` provides a sketch-map motif for escape-sequence families and ownership.
- `architecture/smdu_resize_event_comic_flow.svg` is a left-to-right comic-style deep visual of a resize event moving through Ink internals into `smdu`.
- `architecture/smdu_svg_prompt_gallery.md` records design prompts for created SVGs in gallery format.
- `site/index.html` is the main landing page for GitHub Pages.

## Notes

- Keep site content static and edit `site/index.html` directly.
