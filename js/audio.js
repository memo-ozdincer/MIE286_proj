/**
 * Audio feedback via the Web Audio API.
 * Generates short sine/triangle tones — no external files needed.
 */
class AudioManager {
  constructor() {
    this._ctx = null;
  }

  /** Lazily create AudioContext (must happen after a user gesture). */
  _ensureContext() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  }

  /**
   * Play a tone.
   * @param {number} freq  - Frequency in Hz.
   * @param {number} dur   - Duration in seconds.
   * @param {string} type  - OscillatorNode type ('sine', 'triangle', etc.).
   * @param {number} gain  - Volume 0-1.
   */
  _playTone(freq, dur, type = 'sine', gain = 0.35) {
    const ctx = this._ensureContext();
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    vol.gain.value = gain;

    // Quick fade-out to avoid click
    vol.gain.setValueAtTime(gain, ctx.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  /** High-pitched chirp — fast & accurate hit. */
  playFastHit() {
    this._playTone(CONFIG.AUDIO_FAST_HIT, CONFIG.AUDIO_DURATION_MS / 1000, 'sine');
  }

  /** Medium tone — slow but accurate hit. */
  playSlowHit() {
    this._playTone(CONFIG.AUDIO_SLOW_HIT, CONFIG.AUDIO_DURATION_MS / 1000, 'sine');
  }

  /** Low thud — miss. */
  playMiss() {
    this._playTone(CONFIG.AUDIO_MISS, CONFIG.AUDIO_DURATION_MS / 1000, 'triangle', 0.5);
  }
}
