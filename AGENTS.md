# AGENTS.md

## Coding Standards

- **Spelling:** Must use Canadian Spelling for things that don't require American spelling (e.g., UI strings, variables, comments). Examples: "colour", "center" -> "centre", "behavior" -> "behaviour".
- **Commit Messages:** Use Conventional Commits (e.g., `feat: add scanner`, `fix: typo in header`).

## Commit Messages

**Format:** Use Conventional Commits format (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `test: ...`).

- Use `test:` for test-related changes, including fixes to tests themselves (do not use `fix:` unless it fixes application code).

**Body Requirements:**

- Explain what and why (not how)
- Use markdown: **bold**, _italics_, `code`, bullet lists
- **NO markdown headings** - use **bold labels** for sections (not always required)
- When a commit body includes backticked code in shell commands, avoid command substitution by using single-quoted `-m` strings (preferred) or escaping backticks.
  - Example (preferred): `git commit -m 'fix: ...' -m 'Use `scanStatus` in footer'`
  - Example (escape): `git commit -m "Use \`scanStatus\` in footer"`

**Specific Updates**: Each commit message should reflect the specific changes made in that commit. Do not just recap the entire project history or scope. Focus on the now.

**Shell Interpolation Safety:**

- Do not pass markdown-heavy commit bodies directly via `git commit -m "..."` when they include backticks, `$()`, or shell-sensitive characters.
- Prefer writing the message to a file with a single-quoted heredoc and commit with `git commit -F <file>` to prevent shell expansion.
- If using `-m`, escape shell-sensitive characters explicitly before running the command.
- After committing, verify the stored message with `git log -1 --pretty=fuller` and amend immediately if interpolation altered content.

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

## Licence and Copyright

- **Requirement:** New source files (and substantially rewritten source files) should include a short header as the first content in the file.
- **Applies to:** `.ts`, `.tsx`, `.js` source files in `src/` and `tests/` (and scripts where appropriate).
- **Do not add headers to:** generated files, lockfiles, config files (`.json`, `.yml`, etc.), markdown docs, or man pages.

Preferred header format for TypeScript/JavaScript:

```ts
// Brief one-line summary of what this file does
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT
```

- Keep the summary to one concise sentence.
- Place the header before `import` statements.
- Leave one blank line between the header and the first code line.
- Preserve existing valid licence headers when already present.

## Penpot MCP Usage

- **Colours:** Use the `fillColor` property with Hex strings for fills. The API does not reliably support RGB objects or plain `fill` string shorthand.
  - Correct: `shape.fills = [{ fillColor: "#ff0000", fillOpacity: 1 }]`
  - Incorrect: `shape.fills = [{ fill: { r:1, g:0, b:0, a:1 } }]`
- **Text:** Always specify font family (e.g., "Roboto Mono") and ensure `text.fills` uses the `fillColor` pattern.
- **Shapes:** Create shapes using `penpot.createRectangle()`, set `x`, `y`, and use `.resize(w, h)` for dimensions.
- **Strokes:** Use `strokeColor` in the strokes array: `shape.strokes = [{ strokeColor: "#ffffff", strokeWidth: 1 }]`
