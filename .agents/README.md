# Zusound Consumer Skills

The canonical consumer-facing Skills are in `.agents/skills/`:

- [Onboarding](skills/zusound-onboarding/SKILL.md)
- [Debugging](skills/zusound-debugging/SKILL.md)
- [Migration](skills/zusound-migration/SKILL.md)
- [Tuning](skills/zusound-tuning/SKILL.md)

Each Skill tells an agent to inspect the **consumer application** first, use one reproducible browser update, run that application's actual typecheck, tests, and build, and keep audio listening evidence separate from automated evidence. They support Zustand `>=4.0.0 <6.0.0` and the upcoming v0.3.0 lifecycle guidance.

## Maintainer guidance

Validate canonical Skill structure and generate the local bridge only when maintaining this repository:

```bash
pnpm skills:validate
pnpm skills:bridge
```

`.claude/skills/` is generated local output and must remain untracked. Consumer projects should not use these repository commands as integration verification.
