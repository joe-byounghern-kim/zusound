# Compatibility Notes

- Zusound supports Zustand `>=4 <6`.
- Default behavior is safe for production: audio is disabled unless explicitly enabled.
- Browser autoplay policies can keep `AudioContext` suspended until user interaction.
- Canonical skill source is `.agents/skills/`; `.claude/skills/` is generated output.
