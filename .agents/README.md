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

## Install in a consumer project

Install the consumer skills for guided onboarding, debugging, and tuning:

```bash
npx skills add https://github.com/joe-byounghern-kim/zusound
```

Skills come from this repository, not the npm tarball. To install one manually,
copy the **entire** `.agents/skills/zusound-onboarding/` directory from a checkout
into your project's `.agents/skills/` or `.claude/skills/` for Claude Code. Keep
`SKILL.md` and `references/` together. You can copy `zusound-debugging` or
`zusound-tuning` the same way. Each directory is self-contained and does not
require the other skills, repository docs, or example fixtures.

Choose onboarding for first wiring, debugging for an already-wired integration
that is wrong or silent, and tuning for working cues that sound wrong. Zustand
4.1–4.2 requires default factory imports with modern order. 4.3–4.4 uses named
factories with modern order. Exactly 4.0 has an outermost-Zusound exception.

## Maintainer guidance

Validate canonical skill structure and generate the local bridge only when
maintaining this repository:

```bash
pnpm skills:validate
pnpm skills:bridge
```

The bridge emits `.claude/skills/<name>/SKILL.md` plus `references/`, preserving
frontmatter at the start and a generated-file marker in the body. It removes
stale generated directories and the old generated flat `.md` files, but never
overwrites a hand-authored skill directory.

`.claude/skills/` is generated local output and must remain untracked. Consumer
projects should not use these repository commands as integration verification.
