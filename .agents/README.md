# ZuSound Agent Skills

Canonical reusable skills live in `.agents/skills/zusound-onboarding/`; the other skill IDs use the same directory layout.

Each skill contains:

- `SKILL.md` with `name` and `description` frontmatter
- one or more `references/*.md` files

Current skills:

- `zusound-onboarding`
- `zusound-tuning`
- `zusound-debugging`
- `zusound-migration`

Validate and generate the local Claude bridge with:

```bash
pnpm skills:validate
pnpm skills:bridge
```

`.claude/skills/` is generated local output and must not be committed. Do not include secrets, personal data, absolute machine paths, or unreproducible tooling assumptions in canonical skill files.
