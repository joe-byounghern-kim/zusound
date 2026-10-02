import type { AestheticParams, ZusoundOptions } from 'zusound'

export type Tone = Pick<AestheticParams, 'pleasantness' | 'brightness' | 'duration'>
export type DemoOptions = {
  volume: number
  debounceMs: 0 | 80
  aesthetics: Tone | null
}

export const defaultDemoOptions: DemoOptions = { volume: 0.15, debounceMs: 0, aesthetics: null }
export const tonePresets: Record<'Soft' | 'Bright' | 'Custom', Tone> = {
  Soft: { pleasantness: 0.9, brightness: 0.25, duration: 0.18 },
  Bright: { pleasantness: 0.65, brightness: 0.85, duration: 0.12 },
  Custom: { pleasantness: 0.7, brightness: 0.5, duration: 0.15 },
}

export function soundOptions(options: DemoOptions): ZusoundOptions {
  return {
    enabled: true,
    volume: options.volume,
    debounceMs: options.debounceMs,
    ...(options.aesthetics ? { aesthetics: options.aesthetics } : {}),
  }
}
