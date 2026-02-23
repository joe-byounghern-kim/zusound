# QA Checklist for Zusound Demo

## Manual Validation

### 1. Audio Activation

- [ ] Load demo page. Audio status should be "Audio is locked".
- [ ] Click "Enable Audio". Status should change to "Audio is ready".
- [ ] Verify no errors in console.

### 2. Scene 1: State Triggers

- [ ] Toggle "Sound" switch. Verify "Audio is ready" / "Audio is locked".
- [ ] Toggle between "Middleware" and "Subscriber" modes.
- [ ] In both modes, click "Increment (+)". Should hear a neutral sound.
- [ ] In both modes, click "Add Item". Should hear a brighter/consonant sound.
- [ ] In both modes, click "Remove Item". Should hear a darker/tense sound.
- [ ] Verify "Action Log" updates with timestamps and event types.

### 3. Scene 2: Aesthetic Mapping

- [ ] Navigate to Scene 2.
- [ ] Apply "Calm" preset. Sliders should move.
- [ ] Apply "Chaotic" preset. Sliders should move.
- [ ] Manually adjust "Pleasantness" slider.
- [ ] Trigger sounds (e.g. go back to Scene 1 or use buttons if available) to hear changes.

### 4. Scene 3: Timing and Throughput

- [ ] Navigate to Scene 3.
- [ ] Click "Stress Test". Should hear a burst of random sounds.
- [ ] Click "Stop Stress Test". Sounds should stop.
- [ ] Click "Simulate API". Button should disable, then re-enable with a sound.

### 5. Static / Hosted Mode

- [ ] Verify mode badge shows `Hosted simulation` on GitHub Pages.
- [ ] Verify deterministic hosted events appear in Action Log.
- [ ] Verify no 404 errors for `/events` in network tab (handled by code).
- [ ] Verify all assets (JS, CSS) load correctly (no 404s).

## Automated Checks

- [ ] `pnpm demo:verify` passes in CI.
- [ ] `pnpm demo:react:typecheck` passes in CI.
