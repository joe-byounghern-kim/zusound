# Troubleshooting

## No sound on first action

- Trigger a direct user interaction first (click/tap), then retry.
- Check browser tab permission and muted device output.

## No sound in production

- Expected unless `enabled: true` is set.
- Verify environment classification and explicit option flow.

## Sound fires too often

- Increase `debounceMs`.
- Verify repeated state updates are not accidental loops.
