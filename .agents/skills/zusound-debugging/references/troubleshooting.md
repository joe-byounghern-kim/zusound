# Troubleshooting

## No sound ever

- Check `enabled` path and runtime env classification.
- Ensure a user gesture occurs before first playback.

## Sound only after second action

- This often indicates first-action context unlock behavior.
- Trigger unlock explicitly and retry deterministic repro.

## Repeated rapid-fire sounds

- Increase `debounceMs` and inspect update loops.
- Verify subscriptions are not duplicated.

## Escalation boundary

- If all checks pass and issue persists, capture repro script and option payload before escalation.
