# Troubleshooting

## Output is too harsh or chaotic

- Increase `pleasantness` and reduce `brightness`.
- Raise `debounceMs` if bursts are too dense.

## Output is too dull or hard to notice

- Increase `volume`, then `arousal`.
- Lower `debounceMs` carefully and retest.

## Contradictory tuning results

- Revert to baseline.
- Apply one parameter-group change per pass and rerun the same scenario.
