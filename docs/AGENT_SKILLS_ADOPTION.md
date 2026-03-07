# Agent Skills Adoption Contract

## Decision

Phase 16 adopts a standards-first hybrid model:

- Canonical source: `.agents/skills/`
- Canonical format: `SKILL.md` (frontmatter + instruction body)
- Canonical decomposition: `references/` for supporting artifacts
- Local compatibility bridge: generated `.claude/skills/` files for tooling that expects Claude-local skill paths

## Canonical Directory Contract

Every reusable skill must follow this structure:

```text
.agents/skills/
  <skill-id>/
    SKILL.md
    references/
      *.md
```

## Required SKILL.md Contract

Each `SKILL.md` must contain YAML frontmatter with:

- `name`: kebab-case skill identifier matching directory name (except `_template`), with no leading/trailing or consecutive hyphens
- `description`: one-sentence purpose and trigger

The markdown body should define:

- when to use the skill
- required inputs/context
- execution procedure
- verification criteria

## Compatibility Bridge Contract

Bridge artifacts are generated from canonical skills:

- Source: `.agents/skills/*/SKILL.md`
- Output: `.claude/skills/<skill-id>.md`
- Generation command: `pnpm skills:bridge`

`.claude/` remains ignored and local-only. The bridge is reproducible and does not become source-of-truth.

## Validation Gate

Canonical structural contract is validated by:

- `pnpm skills:validate`

The CI quality lane runs this check before lint/typecheck/tests/build. Section-content quality remains a review responsibility.
