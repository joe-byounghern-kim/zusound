# Tuning recovery

## Cues are too dense

First check for duplicate subscriptions or update loops. Then raise `debounceMs` in milliseconds and repeat the fixed scenario. Do not use debounce as a substitute for repairing an unintended update loop.

## Cues are too faint or harsh

Adjust one group only. Start with global `volume`, then character controls such as `pleasantness` and `brightness`, then motion controls. Restore the previous profile if the listener cannot identify a clear improvement.

## Duration changed unexpectedly

Check units before changing values: `AestheticParams.duration` is seconds and `soundMapping[path].duration` is milliseconds. A path mapping wins last for that path.

## Automated checks pass but listening is inconclusive

Record automatic success as state and lifecycle evidence only. Keep the old profile or disable optional feedback until a listener can evaluate the same fixed scenario.
