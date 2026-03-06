# Skill Artifact Sharing Policy

## Scope

This policy governs reusable skill assets under `.agents/skills/` and local compatibility output under `.claude/skills/`.

## Repository Ownership Rules

- Commit canonical skill artifacts in `.agents/skills/`.
- Do not commit generated bridge artifacts in `.claude/skills/`.
- Treat `.agents/skills/` as reviewable product artifacts, not scratch notes.

## Allowed Canonical Artifacts

- `SKILL.md` for executable skill instructions
- `references/*.md` for rubrics, templates, examples, checklists

## Disallowed Content

- Secrets, private keys, tokens, account identifiers
- Customer or personal data
- Environment-specific absolute paths
- Tooling assumptions that cannot be reproduced by other contributors

## Review and Quality Requirements

Before merge:

1. `pnpm skills:validate` passes.
2. `SKILL.md` frontmatter includes `name` and `description`.
3. At least one `references/*.md` file exists.
4. Instructions are deterministic and verifiable.

## Distribution Model

- Canonical skill content is repository-shared via git.
- Local bridge output is generated per contributor machine with `pnpm skills:bridge`.
