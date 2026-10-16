---
'zusound': patch
---

Sanitize non-finite state modulation and audio overrides, clamp global volume to 0..1, and bound both oscillator frequencies to 20 Hz through the context's Nyquist frequency.
