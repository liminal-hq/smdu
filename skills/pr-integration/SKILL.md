---
name: pr-integration
description: Review and integrate pull requests with audit and execute modes, conflict-aware ordering, mandatory labelling, code and docs review gates, build and test validation, and rollback safeguards. Use when preparing a repo-wide PR integration batch or merging multiple PRs safely.
---

# PR Integration

## Quick Start

1. Run `audit` mode first and produce run artifacts.
2. Review and approve the action plan artifact.
3. Run `execute` mode to apply the approved plan on an integration branch.

Never merge directly from local `main` unless explicitly requested.

## Queue Filter

Use this command to review active integration candidates while excluding deferred work:

```bash
gh pr list --state open --search "-label:deferred-review"
```

## Core Modes

### Audit Mode

1. Capture `main` state and open PR inventory.
2. Score and rank PRs.
3. Detect file overlaps and merge risks.
4. Build a dry-run command plan.
5. Output action-plan artifacts:
   - `docs/integration-runs/<date>-<batch>-action-plan.md`
   - `docs/integration-runs/<date>-<batch>-action-plan.json`

### Execute Mode

1. Require explicit approval of the action-plan artifact.
2. Create and use an integration branch.
3. Apply PR changes in approved order.
4. Run validation gates after each integration step and at batch end.
5. Stop immediately on gate failure and follow rollback policy.

## Required Gates

1. Preflight
   - `gh auth status`
   - `git switch main`
   - `git pull --ff-only`
   - clean working tree
2. Per-PR review
   - scope correctness
   - regression and security review
   - standards checks (commit format, spelling policy, licence headers where applicable)
   - docs impact review
3. Validation
   - `pnpm test`
   - `pnpm build`

## Prioritization Model

Use a deterministic score model:

- Security fix: `+100`
- Bug fix: `+60`
- Performance change: `+40`
- UX enhancement: `+30`
- Documentation-only: `+10`
- Failing CI: `-80`
- Overlap risk with higher-priority PR: `-20`

Apply tie-breakers in this order:

1. Smaller scope first
2. Older PR first
3. Fewer overlapping files first

## Merge Rules

1. Label each PR before merging.
2. Keep or exclude changed files based on allowed-file review for that PR.
3. Keep PR titles human-readable and outcome-focused:
   - start with a capital letter
   - do not use Conventional Commit prefixes in PR titles
   - keep title style consistent across open PRs in the same stack
4. Use this merge message format exactly:

```text
PR Title (#PRNo.)

PR Description
```

5. Use Conventional Commits with bodies for integration commits.
6. Do not push changes unless explicitly requested by the user.

## Rollback Policy

If any gate fails:

1. Stop execution.
2. Revert the last integration commit on the integration branch.
3. Re-run validation.
4. Regenerate action-plan artifacts from updated repo state.

## References

Use [references/action-plan-template.md](references/action-plan-template.md) as the template for per-run planning artifacts.
