# WebAudio API synthesis for cross-cultural aesthetics research

**The WebAudio API provides everything needed to build a browser-based harmonic complex tone generator mapped to aesthetic preference parameters—no libraries required.** The key building blocks are `createPeriodicWave()` for precise harmonic content, `AudioParam` scheduling methods for click-free envelopes, and Sethares' dissonance algorithm for mapping a continuous "pleasantness" parameter to interval selection. This report covers complete, runnable implementations for each component, from synthesizing 10-harmonic tones with 12dB/octave rolloff to computing psychoacoustic dissonance curves in JavaScript.

---

## Synthesizing harmonic complex tones with `createPeriodicWave()`

The WebAudio API's `createPeriodicWave(real, imag)` accepts two `Float32Array` parameters representing Fourier cosine and sine coefficients. Index 0 is the DC offset (always zero), index 1 is the fundamental, and index *n* is the *n*th harmonic. The browser performs an inverse FFT to generate the waveform, supporting up to **4096 harmonics** per the W3C spec.

For the specific case of **10 harmonics with 12dB/octave rolloff**, the amplitude formula is straightforward. A 12dB drop per octave corresponds to an amplitude factor of 1/4 per frequency doubling. Since harmonic *n* sits log₂(*n*) octaves above the fundamental, the amplitude is **(1/4)^log₂(n) = 1/n²**:

```javascript
function createComplexToneWave(audioCtx, numHarmonics = 10) {
  const real = new Float32Array(numHarmonics + 1);
  const imag = new Float32Array(numHarmonics + 1);
  for (let n = 1; n <= numHarmonics; n++) {
    imag[n] = 1 / (n * n);  // 12dB/octave = 1/n² rolloff
  }
  return audioCtx.createPeriodicWave(real, imag, {
    disableNormalization: false  // browser normalizes peak to 1.0
  });
}
```

The resulting harmonic amplitudes span **0dB (fundamental) to −40dB (10th harmonic)**. With normalization enabled (the default), the browser scales the waveform peak to 1.0, so gain control happens downstream via `GainNode`.

To play **dyads** (two simultaneous complex tones), create two `OscillatorNode` instances sharing the same `PeriodicWave` and route both through a bus gain node:

```javascript
function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playDyad(audioCtx, wave, midi1, midi2, startTime, duration) {
  const bus = new GainNode(audioCtx, { gain: 0.5 });
  bus.connect(audioCtx.destination);

  [midi1, midi2].forEach(midi => {
    const osc = new OscillatorNode(audioCtx, {
      type: 'custom', periodicWave: wave, frequency: midiToFreq(midi)
    });
    const env = new GainNode(audioCtx, { gain: 0 });
    osc.connect(env).connect(bus);

    // 15ms fade prevents clicks while sounding instantaneous
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(0.4, startTime + 0.015);
    env.gain.setValueAtTime(0.4, startTime + duration - 0.015);
    env.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  });
}
```

The **MIDI-to-frequency formula** `f = 440 × 2^((midi − 69) / 12)` maps the target range of MIDI 60–75 to **261.63 Hz (C4) through 622.25 Hz (Eb5)**. A complete lookup:

| MIDI | Note | Freq (Hz) | MIDI | Note | Freq (Hz) |
|------|------|-----------|------|------|-----------|
| 60 | C4 | 261.63 | 68 | Ab4 | 415.30 |
| 61 | C#4 | 277.18 | 69 | A4 | 440.00 |
| 62 | D4 | 293.66 | 70 | Bb4 | 466.16 |
| 63 | Eb4 | 311.13 | 71 | B4 | 493.88 |
| 64 | E4 | 329.63 | 72 | C5 | 523.25 |
| 65 | F4 | 349.23 | 73 | C#5 | 554.37 |
| 66 | F#4 | 369.99 | 74 | D5 | 587.33 |
| 67 | G4 | 392.00 | 75 | Eb5 | 622.25 |

---

## Real-time synthesis patterns that avoid clicks

Three rules govern click-free WebAudio synthesis. First, **never set `gain.gain.value` directly** during playback—MDN explicitly warns this causes "unaesthetic clicks." Always use scheduling methods. Second, **always call `setValueAtTime()` before any ramp** to establish the starting point; ramp methods interpolate from the last scheduled value, not the current one. Third, **stop oscillators after the fade completes**, not simultaneously.

The `AudioParam` interface provides five scheduling methods, each suited to different envelope segments:

- **`setValueAtTime(value, time)`** — instant set, used to anchor ramp starting points
- **`linearRampToValueAtTime(value, endTime)`** — linear interpolation, ideal for attack phases
- **`exponentialRampToValueAtTime(value, endTime)`** — exponential curve (value must be >0, cannot reach zero)
- **`setTargetAtTime(target, startTime, timeConstant)`** — asymptotic approach, natural-sounding decay/release reaching ~63.2% of target after one time constant
- **`setValueCurveAtTime(values, startTime, duration)`** — arbitrary envelope shapes via sample array

A full **ADSR envelope** implementation:

```javascript
function applyADSR(gainNode, startTime, { attack, decay, sustain, release, hold = 0.5 }, peak = 1.0) {
  const g = gainNode.gain;
  const sustainLevel = sustain * peak;
  const t0 = startTime;
  const t1 = t0 + attack;
  const t2 = t1 + decay;
  const t3 = t2 + hold;
  const t4 = t3 + release;

  g.setValueAtTime(0, t0);
  g.linearRampToValueAtTime(peak, t1);           // Attack
  g.linearRampToValueAtTime(sustainLevel, t2);    // Decay
  g.setValueAtTime(sustainLevel, t3);             // Sustain hold
  g.exponentialRampToValueAtTime(0.001, t4);      // Release
  g.setValueAtTime(0, t4 + 0.001);               // Silence

  return t4;  // end time for scheduling osc.stop()
}
```

**AudioContext lifecycle** requires handling browser autoplay policy. Contexts created outside user gestures start in `'suspended'` state. The recommended pattern: create the context early, then call `await audioCtx.resume()` inside a click handler. Once closed, a context cannot be reopened—create a new one instead.

For **scheduling sequences** (arpeggios, melodic patterns), use Chris Wilson's "two clocks" lookahead scheduler. A `setTimeout` loop fires every ~25ms, scheduling any notes that fall within a 100ms lookahead window using `AudioContext.currentTime`. This decouples visual frame rate from audio timing, achieving sample-accurate precision:

```javascript
class Scheduler {
  constructor(ctx, tempo = 120) {
    this.ctx = ctx;
    this.secondsPerBeat = 60 / tempo;
    this.lookahead = 0.1;
    this.nextNoteTime = 0;
  }
  start(callback) {
    this.nextNoteTime = this.ctx.currentTime;
    const schedule = () => {
      while (this.nextNoteTime < this.ctx.currentTime + this.lookahead) {
        callback(this.nextNoteTime);
        this.nextNoteTime += this.secondsPerBeat;
      }
      this.timerId = setTimeout(schedule, 25);
    };
    schedule();
  }
  stop() { clearTimeout(this.timerId); }
}
```

**Key implementation note**: `OscillatorNode.setPeriodicWave()` can be called on a *running* oscillator to change timbre dynamically. However, `PeriodicWave` objects are immutable after creation—generate a new one each time timbre parameters change.

---

## Mapping aesthetic parameters to synthesis controls

Research on the Russell circumplex model (valence × arousal) and Music Emotion Recognition provides empirically grounded mappings between continuous psychological dimensions and audio parameters.

### Consonance-to-interval mapping

The psychoacoustic consonance hierarchy, validated across Helmholtz (1877), Plomp & Levelt (1965), and Bidelman & Krishnan (2009), ranks the 12 chromatic intervals consistently:

```javascript
const CONSONANCE_MAP = [
  { semitones: 0,  score: 1.00, name: 'unison' },
  { semitones: 12, score: 0.95, name: 'octave' },
  { semitones: 7,  score: 0.90, name: 'perfect 5th' },
  { semitones: 5,  score: 0.80, name: 'perfect 4th' },
  { semitones: 9,  score: 0.70, name: 'major 6th' },
  { semitones: 4,  score: 0.65, name: 'major 3rd' },
  { semitones: 3,  score: 0.55, name: 'minor 3rd' },
  { semitones: 8,  score: 0.45, name: 'minor 6th' },
  { semitones: 10, score: 0.35, name: 'minor 7th' },
  { semitones: 2,  score: 0.25, name: 'major 2nd' },
  { semitones: 11, score: 0.15, name: 'major 7th' },
  { semitones: 6,  score: 0.10, name: 'tritone' },
  { semitones: 1,  score: 0.05, name: 'minor 2nd' },
];
```

A continuous **pleasantness parameter (0–1)** maps to interval selection by finding the nearest-scored entry. For smooth transitions between consonance levels, interpolate semitones directly to produce microtonal detuning: `freq2 = baseFreq * 2^(semitones/12)`.

### Timbre brightness via rolloff rate

**Spectral centroid** is the strongest acoustic correlate of perceived brightness. Mapping a brightness parameter to harmonic rolloff:

```javascript
function createTimbreWave(ctx, brightness, numHarmonics = 32) {
  // brightness 0→24dB/oct (dark), 1→0dB/oct (bright)
  const rolloffDb = (1 - brightness) * 24;
  const real = new Float32Array(numHarmonics + 1);
  const imag = new Float32Array(numHarmonics + 1);
  for (let n = 1; n <= numHarmonics; n++) {
    const octaves = Math.log2(n);
    const attenuation = Math.pow(10, -(rolloffDb * octaves) / 20);
    imag[n] = attenuation;
  }
  return new PeriodicWave(ctx, { real, imag, disableNormalization: false });
}
```

### Arousal/valence to envelope shape

**Short attacks (<20ms)** signal high arousal and aggression; **long attacks (>200ms)** signal calm and gentleness. Research-backed parameter ranges:

```javascript
function emotionalEnvelope(arousal, valence) {
  return {
    attack:  0.002 + (1 - arousal) * 0.998,    // 2ms–1s
    decay:   0.05  + (1 - arousal) * 2.95,      // 50ms–3s
    sustain: 0.3   + (1 - valence) * 0.4 + arousal * 0.2,  // 0.3–0.9
    release: 0.05  + (1 - arousal) * 2.0 + valence * 0.5   // 50ms–2.55s
  };
}
```

### Simultaneity parameter

A `simultaneity` value (0 = fully arpeggiated, 1 = fully simultaneous) controls temporal spread. At simultaneity=1, all tones in a dyad start at the same time. At simultaneity=0, tones are spread across 80% of the note duration, creating melodic rather than harmonic perception.

---

## Psychoacoustic dissonance computation in JavaScript

The **Sethares/Plomp-Levelt model** is the standard computational approach to sensory dissonance. For two pure tones, dissonance peaks when their separation equals roughly **25% of the critical bandwidth** at their mean frequency, then drops to near-zero beyond one critical bandwidth.

### The core formula

Sethares (1993) curve-fit the Plomp-Levelt experimental data:

```
d(f₁, f₂) = min(a₁, a₂) × [5·exp(−3.51·s·Δf) + (−5)·exp(−5.75·s·Δf)]
```

where `s = 0.24 / (0.0207·f_min + 18.96)` stretches the curve across frequency registers, and Δf = f_max − f_min. The constants **Dstar=0.24, S1=0.0207, S2=18.96, A1=−3.51, A2=−5.75** come directly from Sethares' published code at sethares.engr.wisc.edu/comprog.html.

For **complex tones with harmonics**, total dissonance is the sum over all partial pairs from both tones. Complete JavaScript implementation:

```javascript
const DSTAR = 0.24, S1 = 0.0207, S2 = 18.96;
const C1 = 5, C2 = -5, A1 = -3.51, A2 = -5.75;

function pairDissonance(f1, f2, a1, a2) {
  const fmin = Math.min(f1, f2);
  const s = DSTAR / (S1 * fmin + S2);
  const fdif = Math.abs(f2 - f1);
  return Math.min(a1, a2) * (
    C1 * Math.exp(A1 * s * fdif) + C2 * Math.exp(A2 * s * fdif)
  );
}

function dissmeasure(freqs, amps) {
  let D = 0;
  for (let i = 0; i < freqs.length; i++) {
    for (let j = i + 1; j < freqs.length; j++) {
      D += pairDissonance(freqs[i], freqs[j], amps[i], amps[j]);
    }
  }
  return D;
}

function harmonicTone(fundamental, numHarmonics = 10) {
  const freqs = [], amps = [];
  for (let n = 1; n <= numHarmonics; n++) {
    freqs.push(fundamental * n);
    amps.push(1 / (n * n));  // 12dB/octave rolloff
  }
  return { freqs, amps };
}

function intervalDissonance(freq1, freq2, numHarmonics = 10) {
  const t1 = harmonicTone(freq1, numHarmonics);
  const t2 = harmonicTone(freq2, numHarmonics);
  return dissmeasure([...t1.freqs, ...t2.freqs], [...t1.amps, ...t2.amps]);
}
```

### Vassilakis improvement (2005)

Vassilakis refined the amplitude weighting to better model SPL effects and amplitude fluctuation, achieving **r=0.98** correlation with perceptual roughness ratings (vs r=0.87 for earlier models):

```javascript
function vassilakisPairRoughness(f1, f2, a1, a2) {
  const fmin = Math.min(f1, f2), amin = Math.min(a1, a2);
  const fmax = Math.max(f1, f2), amax = Math.max(a1, a2);
  const X = amin * amax;
  const Y = (2 * amin) / (amin + amax);
  const s = 0.24 / (0.0207 * fmin + 18.96);
  const Z = Math.exp(-3.5 * s * (fmax - fmin)) - Math.exp(-5.75 * s * (fmax - fmin));
  return Math.pow(X, 0.1) * 0.5 * Math.pow(Y, 3.11) * Z;
}
```

### Pleasantness-to-interval mapping via computed dissonance

Rather than using a hardcoded consonance table, compute dissonance for all 12 chromatic intervals against your exact timbre, then map the pleasantness parameter into the sorted results:

```javascript
function pleasantnessToInterval(pleasantness, baseFreq = 261.63, numHarmonics = 10) {
  const results = [];
  for (let st = 1; st <= 12; st++) {
    const freq2 = baseFreq * Math.pow(2, st / 12);
    const d = intervalDissonance(baseFreq, freq2, numHarmonics);
    results.push({ semitones: st, dissonance: d });
  }
  results.sort((a, b) => a.dissonance - b.dissonance);  // consonant first
  const idx = Math.round((1 - pleasantness) * (results.length - 1));
  return results[idx].semitones;
}
```

This approach is **timbre-aware**: the dissonance ranking shifts depending on the harmonic spectrum, matching how inharmonic timbres (bells, metallophones) favor different tunings than harmonic timbres—a core insight from Sethares' *Tuning, Timbre, Spectrum, Scale*.

### Tenney height as a simpler alternative

For a fast, computation-free consonance measure, **Tenney height** = log₂(p × q) for a ratio p/q in lowest terms. Unison (1:1) scores 0, octave (2:1) scores 1, perfect fifth (3:2) scores 2.58, tritone (45:32) scores 10.49. This is useful when you need instant interval ranking without computing over all partial pairs.

---

## Putting it all together

A complete system connects these components through a parameter interface. The user provides continuous values for pleasantness, brightness, arousal, and simultaneity. The system computes the appropriate interval via the Sethares dissonance model, generates a `PeriodicWave` with the specified brightness rolloff, configures an ADSR envelope from the arousal/valence mapping, and schedules the dyad either simultaneously or sequentially.

Key **implementation details** to remember: each `OscillatorNode` should be freshly created per note (they are lightweight and single-use by design). `PeriodicWave` objects are immutable—create new ones when timbre changes. The **15ms fade-in/fade-out** ramp is the minimum needed to prevent clicks while remaining imperceptible. And always anchor ramps with `setValueAtTime()` first—this is the most common source of bugs in WebAudio envelope code.

For reference implementations, Sethares' MATLAB dissonance code lives at sethares.engr.wisc.edu/comprog.html, with a Python port by endolith at gist.github.com/endolith/3066664. MDN's WebAudio documentation (developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) remains the authoritative API reference, with particularly useful pages on `BaseAudioContext.createPeriodicWave()`, `AudioParam` scheduling methods, and the Web Audio best practices guide.