/**
 * Upper limit on the number of harmonics used in timbre synthesis.
 * Capped to prevent excessive computation in `createTimbreWave` and
 * `buildPartials` while providing sufficient spectral richness.
 */
export const MAX_HARMONICS = 32 as const

/** Time offset between consecutive change sounds in a batch (seconds). */
export const STAGGER_SECONDS = 0.04

/** Maximum total stagger offset for batched sounds (seconds). */
export const MAX_STAGGER_SECONDS = 0.4
