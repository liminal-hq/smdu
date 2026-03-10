# Architecture Docs

This folder contains architecture documentation and visual references for `smdu`.

## Contents

- [`smdu_architecture_deconstruction.md`](./smdu_architecture_deconstruction.md):
  system-level architecture deconstruction and runtime boundaries.
- [`smdu_terminal_io_event_model.md`](./smdu_terminal_io_event_model.md):
  terminal input/output event flow, control sequences, and runtime responsibilities.
- [`smdu_ink_event_pipeline_paper.md`](./smdu_ink_event_pipeline_paper.md):
  deep-dive write-up of Ink-to-`smdu` event and render pipelines.
- [`smdu_svg_prompt_gallery.md`](./smdu_svg_prompt_gallery.md):
  gallery of SVG visuals with their source generation prompts.
- [`images/`](./images/):
  source SVG assets used across the architecture documentation.

## Notes

- SVG assets are the primary visuals and are linked directly from docs pages.
- Keep image paths relative to this folder (`./images/<name>.svg`) for portability.
