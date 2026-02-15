# AGENTS.md

## Coding Standards

- **Spelling:** Must use Canadian Spelling for things that don't require American spelling (e.g., UI strings, variables, comments). Examples: "colour", "center" -> "centre", "behavior" -> "behaviour".
- **Commit Messages:** Use Conventional Commits (e.g., `feat: add scanner`, `fix: typo in header`).

## Testing

- **Mandatory Testing:** Make sure the unit tests are run after changes to the code.
- **Verification:** Always verify code changes by running relevant tests.
- **Build Check:** Run `pnpm build` to surface any TypeScript errors.

## Documentation

- **Updates:** When user-facing behaviour, CLI options, or features change, update `README.md` and `SPEC.md`.
- **Man Page:** Ensure `man/smdu.1` is kept in sync with CLI options and features.

## Project Structure

- This is a TypeScript project using Ink for the CLI UI.
- Use `pnpm` as the package manager.

## Penpot MCP Usage

- **Colours:** Use the `fillColor` property with Hex strings for fills. The API does not reliably support RGB objects or plain `fill` string shorthand.
  - Correct: `shape.fills = [{ fillColor: "#ff0000", fillOpacity: 1 }]`
  - Incorrect: `shape.fills = [{ fill: { r:1, g:0, b:0, a:1 } }]`
- **Text:** Always specify font family (e.g., "Roboto Mono") and ensure `text.fills` uses the `fillColor` pattern.
- **Shapes:** Create shapes using `penpot.createRectangle()`, set `x`, `y`, and use `.resize(w, h)` for dimensions.
- **Strokes:** Use `strokeColor` in the strokes array: `shape.strokes = [{ strokeColor: "#ffffff", strokeWidth: 1 }]`
