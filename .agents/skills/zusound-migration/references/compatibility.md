# Compatibility Notes

- Migrate one store at a time; do not parallelize first adoption across all critical stores.
- Keep existing middleware order stable unless explicitly tested.
- Preserve an immediate rollback path for each rollout phase.
