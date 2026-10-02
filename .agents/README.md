# Zusound Consumer Skills

The canonical consumer-facing skills are in `.agents/skills/`:

- [Onboarding](skills/zusound-onboarding/SKILL.md): first integration, including a reversible pilot in an existing store.
- [Debugging](skills/zusound-debugging/SKILL.md): missing, delayed, excessive, or incorrectly mapped feedback.
- [Tuning](skills/zusound-tuning/SKILL.md): repeatable low-volume configuration and listening checks.

Each skill starts with the **consumer application**, one reproducible browser
update, and that application's actual typecheck, tests, and build. Human listening
evidence stays separate from automated state and lifecycle evidence. Supported
Zustand versions are `>=4.0.0 <6.0.0`. See the [API reference](../docs/API.md) for
current options, composition, and cleanup contracts.

## Maintainer guidance

Validate canonical skill structure and generate the local bridge only when
maintaining this repository:

```bash
pnpm skills:validate
pnpm skills:bridge
```

`.claude/skills/` is generated local output and must remain untracked. Consumer
projects should not use these repository commands as integration verification.
