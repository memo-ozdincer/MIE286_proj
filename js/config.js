/**
 * Experiment configuration constants.
 * All tuneable parameters live here — nothing is hardcoded elsewhere.
 */
const CONFIG = Object.freeze({
  // ── Canvas ────────────────────────────────────────────────────
  CANVAS_W: 800,
  CANVAS_H: 500,

  // ── Target ────────────────────────────────────────────────────
  TARGET_RADIUS: 35,
  TARGET_COLOR: '#3B82F6',
  TARGET_GLOW: '#60A5FA',
  TARGET_BORDER: '#1E40AF',

  // ── Game mode ─────────────────────────────────────────────────
  // true  = spatial memory (target appears, disappears, recall from memory)
  // false = standard (click the visible target)
  MEMORY_MODE: false,

  // ── Memory-mode timing (ms) ───────────────────────────────────
  TARGET_DISPLAY_MS: 1000,     // how long the target is shown
  TARGET_FADE_MS: 250,         // fade-out duration
  RETENTION_MS: 400,           // blank period before recall cue

  // ── General timing (ms) ───────────────────────────────────────
  INTER_TRIAL_DELAY: 400,
  FIRST_TRIAL_DELAY: 600,
  FEEDBACK_SHOW_MS: 550,       // how long feedback + ghost are shown
  FEEDBACK_FLASH_MS: 150,      // border flash duration
  AUDIO_DURATION_MS: 200,

  // ── Trials ────────────────────────────────────────────────────
  PRACTICE_TRIALS: 5,
  BLOCK_TRIALS: 30,

  // ── Outlier thresholds (ms) ───────────────────────────────────
  RT_MIN: 150,
  RT_MAX: 8000,

  // ── Audio frequencies (Hz) ────────────────────────────────────
  AUDIO_FAST_HIT: 880,
  AUDIO_SLOW_HIT: 440,
  AUDIO_MISS: 180,

  // ── Speed threshold (ms) — same for BOTH visual & auditory ───
  FAST_THRESHOLD_MS: 600,

  // ── Feedback colours (3-level visual, matching 3-level audio) ─
  HIT_FAST_COLOR: '#FBBF24',   // gold  — fast & accurate
  HIT_SLOW_COLOR: '#22C55E',   // green — accurate
  MISS_COLOR: '#EF4444',       // red   — miss

  // ── Scoring ───────────────────────────────────────────────────
  SCORE_HIT_BASE: 100,
  SCORE_SPEED_MAX: 150,        // max bonus for fast RT
  SCORE_ACCURACY_MAX: 75,      // max bonus for dead-centre hit

  // ── Data storage ───────────────────────────────────────────────
  // CSVs are saved to the data/ directory via GitHub API.
  // Pass the token in the URL hash: .../#token=github_pat_xxx
  GITHUB_REPO: 'memo-ozdincer/MIE286_proj',

  // ── Effects ───────────────────────────────────────────────────
  PARTICLE_COUNT: 14,

  // ── Edge padding ──────────────────────────────────────────────
  get TARGET_PADDING() {
    return this.TARGET_RADIUS + 15;
  },
});
