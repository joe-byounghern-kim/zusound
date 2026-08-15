export type DemoOptions = {
  volume: number
  debounceMs: number
  aesthetics: {
    pleasantness: number
    brightness: number
    arousal: number
    valence: number
    simultaneity: number
    baseMidi: number
  }
}

export const defaultDemoOptions: DemoOptions = {
  volume: 0.3,
  debounceMs: 50,
  aesthetics: {
    pleasantness: 0.7,
    brightness: 0.6,
    arousal: 0.6,
    valence: 0.6,
    simultaneity: 1,
    baseMidi: 69,
  },
}
