# Skill Rollout Workflow

## Goal

Roll out AgentSkills-compatible reusable skills in a repeatable way while preserving local Claude compatibility.

## Workflow

1. Author/update canonical skill in `.agents/skills/<skill-id>/`.
2. Add or refresh supporting references in `.agents/skills/<skill-id>/references/`.
3. Run `pnpm skills:validate`.
4. Generate local bridge output with `pnpm skills:bridge`.
5. Execute quality gates:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test:coverage`
   - `pnpm build`
6. Update rollout or task records.

## Phase 17 User-Facing Skills

Primary distribution path for external users:

1. Canonical skills are maintained in `.agents/skills/`.
2. Users run `pnpm skills:validate` then `pnpm skills:bridge`.
3. Users consume generated `.claude/skills/*.md` artifacts locally.

Current user-facing skill IDs:

- `zusound-onboarding`
- `zusound-tuning`
- `zusound-debugging`
- `zusound-migration`

## Change Checklist

- [ ] Canonical path and structure match contract.
- [ ] Frontmatter fields exist (`name`, `description`).
- [ ] References are present and non-empty.
- [ ] Bridge generation succeeded locally.
- [ ] CI quality lane includes `pnpm skills:validate`.

## Migration Rehearsal

Rehearsal record is captured in `docs/SKILL_MIGRATION_REHEARSAL.md`.
