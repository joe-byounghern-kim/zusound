# Symptom branches

## No audio ever

An update triggered during mount is not an audible-playback reproduction. It can run before browser activation while the audio context is suspended. Confirm its state result, then reproduce with a direct click or tap that invokes the same known action.

1. **Disabled environment:** inspect the final options. Set `enabled: true` only for the development reproduction. Production and unknown environments default off.
2. **Suspended context:** use a direct click or tap that invokes the known store action, then retry. Check browser and device mute settings after the state action is confirmed.
3. **Incorrect wiring:** middleware must wrap the initializer. Subscriber mode must call `store.subscribe(zs)` with a fresh instance that has not been cleaned up.
4. **No detected change:** verify an immutable update changes a top-level key. Nested in-place mutation with the same top-level reference can be missed.

## The first action is quiet

Repeat the same direct gesture after confirming it changed state. A browser can require user activation before resuming audio. Record this as a browser activation observation, not as a failed store action.

## Too many or delayed cues

Inspect duplicate subscriptions and update loops first. Then increase `debounceMs` in milliseconds. Debounce is trailing-edge and retains the last descriptor per top-level path. It is not a net diff or a global rate limiter.

## The cue has the wrong character

Inspect mapping precedence: defaults, `aesthetics`, `mapChangeToAesthetics`, then `soundMapping[path]`. A path mapping wins last. `AestheticParams.duration` is seconds, while `soundMapping[path].duration` is milliseconds. A mapping `volume` is clamped to `0..1`; keep the global `volume` option in that range yourself.

## Stop condition

Escalate with the reproducible action, final options, integration mode, browser activation result, lifecycle state, and consumer typecheck/test/build evidence. Do not report audible success unless a person actually listened.
