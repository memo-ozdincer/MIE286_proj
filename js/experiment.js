/**
 * Core experiment controller.
 * Manages: consent → instructions → practice → blocks → export.
 *
 * Supports two modes (set in CONFIG.MEMORY_MODE):
 *   Memory  – target appears briefly, disappears, player clicks from recall
 *   Standard – click the visible target
 *
 * Both modes measure the same DVs: reaction time + radial error.
 * Feedback is three-level in both conditions (fast-hit / slow-hit / miss),
 * ensuring equal information content across visual and auditory modalities.
 */
class Experiment {
  constructor() {
    this.audio  = new AudioManager();
    this.logger = new Logger();
    this.effects = new EffectsManager();

    // DOM
    this.canvas  = null;
    this.ctx     = null;
    this.overlay = document.getElementById('overlay');
    this.screen  = document.getElementById('screen');

    // State
    this.condition      = '';      // 'visual' | 'auditory'
    this.conditionOrder = '';      // 'VA' | 'AV'
    this.blockIndex     = 0;
    this.trialIndex     = 0;
    this.isPractice     = false;
    this.totalTrials    = 0;
    this.targetX        = 0;
    this.targetY        = 0;
    this.trialStart     = 0;
    this.awaitingClick  = false;

    // Render state
    this._animFrame  = null;
    this._phase      = 'idle';    // idle|showing|fading|retention|ready|feedback
    this._phaseStart = 0;
    this._clickX     = 0;
    this._clickY     = 0;
    this._feedbackLevel = null;   // 'fast_hit'|'slow_hit'|'miss'

    // Scoring (per block)
    this._score      = 0;
    this._streak     = 0;
    this._blockHits  = 0;
    this._blockCount = 0;

    // Cumulative (across experiment)
    this._totalScore  = 0;
    this._totalHits   = 0;
    this._totalTrials = 0;
    this._bestStreak  = 0;
  }

  // ═══════════════════════════════════════════════════════════════
  //  Entry point
  // ═══════════════════════════════════════════════════════════════

  init() { this._showConsent(); }

  // ═══════════════════════════════════════════════════════════════
  //  Screens
  // ═══════════════════════════════════════════════════════════════

  _showConsent() {
    const taskDesc = CONFIG.MEMORY_MODE
      ? `You will play a <strong>spatial memory game</strong> under two different feedback
         conditions. In each round a blue target will appear briefly &mdash;
         <strong>remember its position!</strong> After it vanishes, click where you
         think it was.`
      : `You will play a <strong>target-clicking game</strong> under two different feedback
         conditions. Click on the blue target as quickly and accurately as you can.`;

    const duration = CONFIG.MEMORY_MODE ? '8&ndash;10 minutes' : '5 minutes';

    this._renderScreen(`
      <h2>Consent &amp; Information</h2>
      <p>${taskDesc} The experiment takes approximately <strong>${duration}</strong>.</p>
      <ul>
        <li>Your data is anonymous &mdash; we only record click coordinates and timing.</li>
        <li>You may withdraw at any time by closing the browser tab.</li>
        <li>Please use a <strong>mouse or trackpad</strong> (not a touchscreen) and ensure your <strong>audio is on</strong>.</li>
      </ul>
      <form id="consent-form" class="form-grid">
        <label>Participant ID
          <input id="pid" type="text" placeholder="e.g. P01" required>
        </label>
        <label>Age Range
          <select id="age-range" required>
            <option value="">Select&hellip;</option>
            <option>18-24</option><option>25-34</option><option>35-44</option><option>45+</option>
          </select>
        </label>
        <label>Input Device
          <select id="device-type" required>
            <option value="">Select&hellip;</option>
            <option>Mouse</option><option>Trackpad</option><option>Other</option>
          </select>
        </label>
        <label>Gaming Frequency
          <select id="gaming-freq" required>
            <option value="">Select&hellip;</option>
            <option>Never</option><option>Rarely</option><option>Weekly</option><option>Daily</option>
          </select>
        </label>
        <label>Condition Order
          <select id="cond-order" required>
            <option value="">Select&hellip;</option>
            <option value="VA">Visual &rarr; Auditory</option>
            <option value="AV">Auditory &rarr; Visual</option>
          </select>
        </label>
        <button type="submit" class="btn">I Consent &mdash; Begin</button>
      </form>
    `);

    document.getElementById('consent-form').addEventListener('submit', e => {
      e.preventDefault();
      this.conditionOrder = document.getElementById('cond-order').value;
      this.logger.setMeta(
        document.getElementById('pid').value.trim(),
        this.conditionOrder,
        {
          ageRange:   document.getElementById('age-range').value,
          deviceType: document.getElementById('device-type').value,
          gamingFreq: document.getElementById('gaming-freq').value,
        },
      );
      this._showInstructions(0);
    });
  }

  _showInstructions(blockIdx) {
    this.blockIndex = blockIdx;
    this.condition  = this._conditionForBlock(blockIdx);

    const label = this.condition === 'visual' ? 'Visual Feedback' : 'Auditory Feedback';
    const block = blockIdx === 0 ? 'Block 1' : 'Block 2';

    const taskLine = CONFIG.MEMORY_MODE
      ? 'A blue target will flash on screen for about one second. After it disappears, <strong>click where you remember it was</strong> &mdash; as quickly and accurately as you can!'
      : 'Click on the <strong>blue circle</strong> as quickly and accurately as you can.';

    const feedbackLine = this.condition === 'visual'
      ? 'The border will glow <span class="clr-gold">gold</span> (fast &amp; accurate), <span class="clr-green">green</span> (accurate), or <span class="clr-red">red</span> (miss).'
      : 'You\'ll hear a <strong>high tone</strong> (fast &amp; accurate), <strong>medium tone</strong> (accurate), or <strong>low tone</strong> (miss).';

    this._renderScreen(`
      <h2>${block}: ${label}</h2>
      <p>${taskLine}</p>
      <p><strong>Feedback:</strong> ${feedbackLine}</p>
      <p>You'll start with <strong>${CONFIG.PRACTICE_TRIALS} practice trials</strong>,
         then complete <strong>${CONFIG.BLOCK_TRIALS} recorded trials</strong>.</p>
      <button class="btn" id="start-btn">Start Practice</button>
    `);

    document.getElementById('start-btn').addEventListener('click', () => {
      this._startBlock(true);
    });
  }

  _showBreak() {
    this._renderScreen(`
      <h2>Break</h2>
      <p>Block 1 complete &mdash; nice work! Take a short rest, then continue.</p>
      <button class="btn" id="continue-btn">Continue to Block 2</button>
    `);
    document.getElementById('continue-btn').addEventListener('click', () => {
      this._showInstructions(1);
    });
  }

  _showEnd() {
    const acc = this._totalTrials > 0
      ? ((this._totalHits / this._totalTrials) * 100).toFixed(1)
      : '0.0';

    this._renderScreen(`
      <h2>Experiment Complete!</h2>
      <div class="stats-grid">
        <div class="stat"><span class="stat-val">${this._totalScore.toLocaleString()}</span><span class="stat-lbl">Final Score</span></div>
        <div class="stat"><span class="stat-val">${acc}%</span><span class="stat-lbl">Accuracy</span></div>
        <div class="stat"><span class="stat-val">${this._bestStreak}</span><span class="stat-lbl">Best Streak</span></div>
      </div>
      <p id="submit-status" class="status-pending">Saving data&hellip;</p>
      <button class="btn" id="dl-btn">Download CSV</button>
    `);

    document.getElementById('dl-btn').addEventListener('click', () => this.logger.download());

    // Auto-submit to Google Sheets
    this.logger.submit().then(result => {
      const el = document.getElementById('submit-status');
      if (result.ok) {
        el.textContent = 'Data saved! Thank you for participating.';
        el.className = 'status-ok';
      } else {
        el.textContent = 'Please download your CSV using the button below.';
        el.className = 'status-err';
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  Trial engine
  // ═══════════════════════════════════════════════════════════════

  _startBlock(practice) {
    this.isPractice  = practice;
    this.trialIndex  = 0;
    this.totalTrials = practice ? CONFIG.PRACTICE_TRIALS : CONFIG.BLOCK_TRIALS;
    this._score      = 0;
    this._streak     = 0;
    this._blockHits  = 0;
    this._blockCount = 0;

    this._setupCanvas();
    this._startRenderLoop();
    this._runTrial();
  }

  _setupCanvas() {
    this.screen.innerHTML = '';
    this.overlay.classList.add('hidden');

    const wrap = document.createElement('div');
    wrap.id = 'canvas-wrap';

    this.canvas        = document.createElement('canvas');
    this.canvas.width  = CONFIG.CANVAS_W;
    this.canvas.height = CONFIG.CANVAS_H;
    this.canvas.id     = 'task-canvas';
    this.ctx           = this.canvas.getContext('2d');

    wrap.appendChild(this.canvas);
    this.screen.appendChild(wrap);

    // HUD (identical in both conditions)
    this.hud = document.createElement('div');
    this.hud.id = 'hud';
    this.screen.appendChild(this.hud);

    // Progress bar
    const bar = document.createElement('div');
    bar.id = 'progress-bar';
    bar.innerHTML = '<div id="progress-fill"></div>';
    this.screen.appendChild(bar);

    this._updateHUD();
    this._updateProgress();

    this._boundClick = e => this._handleClick(e);
    this.canvas.addEventListener('click', this._boundClick);
  }

  // ── Trial flow ──────────────────────────────────────────────────

  _runTrial() {
    this.awaitingClick  = false;
    this._phase         = 'idle';
    this._feedbackLevel = null;
    this.effects.clear();
    this._placeTarget();

    const delay = this.trialIndex === 0 ? CONFIG.FIRST_TRIAL_DELAY : CONFIG.INTER_TRIAL_DELAY;

    setTimeout(() => {
      if (CONFIG.MEMORY_MODE) {
        this._memorySequence();
      } else {
        this._standardSequence();
      }
    }, delay);
  }

  _memorySequence() {
    // 1. Show target
    this._phase      = 'showing';
    this._phaseStart = performance.now();

    setTimeout(() => {
      // 2. Fade out
      this._phase      = 'fading';
      this._phaseStart = performance.now();

      setTimeout(() => {
        // 3. Retention interval (blank)
        this._phase = 'retention';

        setTimeout(() => {
          // 4. Ready — recall cue, start timer
          this._phase        = 'ready';
          this._phaseStart   = performance.now();
          this.trialStart    = performance.now();
          this.awaitingClick = true;
        }, CONFIG.RETENTION_MS);
      }, CONFIG.TARGET_FADE_MS);
    }, CONFIG.TARGET_DISPLAY_MS);
  }

  _standardSequence() {
    this._phase      = 'ready';
    this._phaseStart = performance.now();
    this.trialStart  = performance.now();
    this.awaitingClick = true;
  }

  // ── Click handler ───────────────────────────────────────────────

  _handleClick(e) {
    if (!this.awaitingClick) return;
    this.awaitingClick = false;

    const rect   = this.canvas.getBoundingClientRect();
    const scaleX = CONFIG.CANVAS_W / rect.width;
    const scaleY = CONFIG.CANVAS_H / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top)  * scaleY;
    const rt     = performance.now() - this.trialStart;

    const dx = clickX - this.targetX;
    const dy = clickY - this.targetY;
    const radialError = Math.sqrt(dx * dx + dy * dy);
    const isHit  = radialError <= CONFIG.TARGET_RADIUS;
    const isFast = rt < CONFIG.FAST_THRESHOLD_MS;

    this._clickX = clickX;
    this._clickY = clickY;

    // Three-level feedback (identical mapping for both modalities)
    const level = isHit ? (isFast ? 'fast_hit' : 'slow_hit') : 'miss';
    this._feedbackLevel = level;

    // ── Scoring ───────────────────────────────────────────────────
    let pts = 0;
    if (isHit) {
      pts = CONFIG.SCORE_HIT_BASE;
      pts += Math.round(Math.max(0, 1 - rt / 2000) * CONFIG.SCORE_SPEED_MAX);
      pts += Math.round(Math.max(0, 1 - radialError / CONFIG.TARGET_RADIUS) * CONFIG.SCORE_ACCURACY_MAX);
      this._streak++;
      if (this._streak > this._bestStreak) this._bestStreak = this._streak;
      const mult = this._streakMultiplier();
      pts = Math.round(pts * mult);
    } else {
      this._streak = 0;
    }
    this._score += pts;

    // ── Log ───────────────────────────────────────────────────────
    if (!this.isPractice) {
      this.logger.record({
        block: this.blockIndex + 1,
        condition: this.condition,
        trial: this.trialIndex + 1,
        isPractice: false,
        targetX: this.targetX,
        targetY: this.targetY,
        clickX, clickY,
        radialError, isHit, rt,
      });
      this._blockCount++;
      this._blockHits += isHit ? 1 : 0;
    }

    // ── Feedback ──────────────────────────────────────────────────
    this._giveFeedback(level);

    // ── Effects (constant across conditions) ──────────────────────
    this._phase      = 'feedback';
    this._phaseStart = performance.now();

    if (isHit) {
      this.effects.burst(clickX, clickY, '#60A5FA', CONFIG.PARTICLE_COUNT);
      if (pts > 0) {
        this.effects.floatText(clickX, clickY - 28, `+${pts}`, '#E2E8F0');
      }
    } else {
      this.effects.ring(clickX, clickY, CONFIG.MISS_COLOR);
    }

    this._updateHUD();

    // ── Advance ───────────────────────────────────────────────────
    this.trialIndex++;
    this._updateProgress();

    setTimeout(() => {
      this._feedbackLevel = null;
      this._phase = 'idle';

      if (this.trialIndex >= this.totalTrials) {
        this._stopRenderLoop();
        this.canvas.removeEventListener('click', this._boundClick);
        if (this.isPractice) {
          this._startBlock(false);
        } else {
          this._totalScore  += this._score;
          this._totalHits   += this._blockHits;
          this._totalTrials += this._blockCount;
          if (this.blockIndex === 0) {
            this._showBreak();
          } else {
            this._showEnd();
          }
        }
      } else {
        this._runTrial();
      }
    }, CONFIG.FEEDBACK_SHOW_MS);
  }

  // ═══════════════════════════════════════════════════════════════
  //  Feedback (modality-specific — the IV)
  // ═══════════════════════════════════════════════════════════════

  _giveFeedback(level) {
    if (this.condition === 'visual') {
      this._flashBorder(level);
    } else {
      this._playAudio(level);
    }
  }

  _flashBorder(level) {
    const wrap = document.getElementById('canvas-wrap');
    const cls  = `flash-${level}`;
    wrap.classList.add(cls);
    setTimeout(() => wrap.classList.remove(cls), CONFIG.FEEDBACK_FLASH_MS);
  }

  _playAudio(level) {
    if (level === 'fast_hit')  this.audio.playFastHit();
    else if (level === 'slow_hit') this.audio.playSlowHit();
    else this.audio.playMiss();
  }

  // ═══════════════════════════════════════════════════════════════
  //  Render loop
  // ═══════════════════════════════════════════════════════════════

  _startRenderLoop() {
    if (this._animFrame) return;
    const loop = () => {
      this._animFrame = requestAnimationFrame(loop);
      this._render();
    };
    this._animFrame = requestAnimationFrame(loop);
  }

  _stopRenderLoop() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  }

  _render() {
    const ctx = this.ctx;
    const now = performance.now();
    ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

    this._drawBackground();

    // ── Target ────────────────────────────────────────────────────
    const showTarget =
      this._phase === 'showing' ||
      this._phase === 'fading'  ||
      (this._phase === 'ready'    && !CONFIG.MEMORY_MODE) ||
      (this._phase === 'feedback' && !CONFIG.MEMORY_MODE);

    if (showTarget) {
      let alpha = 1, scale = 1;
      const elapsed = now - this._phaseStart;

      if (this._phase === 'showing') {
        if (elapsed < 250) {
          const t = elapsed / 250;
          alpha = t;
          scale = this._easeOutBack(t);
        } else {
          const p = (elapsed - 250) / 800;
          scale = 1 + 0.03 * Math.sin(p * Math.PI * 4);
        }
      } else if (this._phase === 'fading') {
        alpha = Math.max(0, 1 - elapsed / CONFIG.TARGET_FADE_MS);
      } else if (this._phase === 'ready' && !CONFIG.MEMORY_MODE) {
        const p = (now % 2000) / 2000;
        scale = 1 + 0.025 * Math.sin(p * Math.PI * 2);
      }

      this._drawTarget(alpha, scale);
    }

    // ── "Remember!" hint (memory mode, first 500 ms of showing) ──
    if (this._phase === 'showing' && CONFIG.MEMORY_MODE) {
      const e = now - this._phaseStart;
      if (e < 600) {
        const a = e < 400 ? 0.45 : 0.45 * Math.max(0, 1 - (e - 400) / 200);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = '500 13px Inter, sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.textAlign = 'center';
        ctx.fillText('Remember this position!', CONFIG.CANVAS_W / 2, 28);
        ctx.restore();
      }
    }

    // ── Recall cue (memory mode, ready phase) ─────────────────────
    if (this._phase === 'ready' && CONFIG.MEMORY_MODE) {
      this._drawRecallCue(now);
    }

    // ── Ghost + click marker (feedback phase) ─────────────────────
    if (this._phase === 'feedback') {
      if (CONFIG.MEMORY_MODE) this._drawGhost();
      this._drawClickMarker();
    }

    // ── Effects ───────────────────────────────────────────────────
    this.effects.update();
    this.effects.draw(ctx);
  }

  // ── Drawing helpers ─────────────────────────────────────────────

  _drawBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

    // Subtle dot grid
    ctx.fillStyle = 'rgba(51, 65, 85, 0.25)';
    const sp = 40;
    for (let x = sp; x < CONFIG.CANVAS_W; x += sp) {
      for (let y = sp; y < CONFIG.CANVAS_H; y += sp) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _drawTarget(alpha = 1, scale = 1) {
    const ctx = this.ctx;
    const x = this.targetX;
    const y = this.targetY;
    const r = CONFIG.TARGET_RADIUS * scale;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer glow
    const glow = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.6);
    glow.addColorStop(0, 'rgba(96, 165, 250, 0.12)');
    glow.addColorStop(1, 'rgba(96, 165, 250, 0)');
    ctx.beginPath();
    ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Main body gradient
    const grad = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    grad.addColorStop(0, '#93C5FD');
    grad.addColorStop(0.6, '#3B82F6');
    grad.addColorStop(1, '#1D4ED8');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Rim
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(30, 64, 175, 0.7)';
    ctx.stroke();

    // Specular highlight
    ctx.beginPath();
    ctx.arc(x - r * 0.22, y - r * 0.28, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();

    ctx.restore();
  }

  _drawRecallCue(now) {
    const ctx = this.ctx;
    const cx  = CONFIG.CANVAS_W / 2;
    const cy  = CONFIG.CANVAS_H / 2;
    const pulse = 0.5 + 0.5 * Math.sin(now / 180);

    ctx.save();
    ctx.globalAlpha = 0.35 + 0.2 * pulse;

    // Crosshair
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    const s = 10;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy);
    ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s);
    ctx.stroke();

    // Text
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.fillText('Click where the target was!', cx, cy + 32);

    ctx.restore();
  }

  _drawGhost() {
    const ctx = this.ctx;
    ctx.save();

    // Dashed circle at actual position
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.targetX, this.targetY, CONFIG.TARGET_RADIUS, 0, Math.PI * 2);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Faint fill
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#3B82F6';
    ctx.fill();

    // Line from click to actual
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(this._clickX, this._clickY);
    ctx.lineTo(this.targetX, this.targetY);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  _drawClickMarker() {
    const ctx = this.ctx;
    const color = this._feedbackLevel === 'miss' ? CONFIG.MISS_COLOR : '#60A5FA';
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(this._clickX, this._clickY, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  //  HUD & Progress (identical in both conditions)
  // ═══════════════════════════════════════════════════════════════

  _updateHUD() {
    if (!this.hud) return;
    const phase = this.isPractice ? 'Practice' : 'Trial';
    const num   = Math.min(this.trialIndex + 1, this.totalTrials);

    let streakHTML = '';
    if (this._streak >= 3) {
      streakHTML = `<span class="hud-streak">${this._streak}x streak</span>`;
    }

    this.hud.innerHTML = `
      <span class="hud-trial">${phase} ${num} / ${this.totalTrials}</span>
      <span class="hud-score">Score: ${this._score.toLocaleString()}</span>
      ${streakHTML}
    `;
  }

  _updateProgress() {
    const fill = document.getElementById('progress-fill');
    if (!fill) return;
    const pct = this.totalTrials > 0
      ? (Math.min(this.trialIndex, this.totalTrials) / this.totalTrials * 100).toFixed(1)
      : 0;
    fill.style.width = pct + '%';
  }

  // ═══════════════════════════════════════════════════════════════
  //  Scoring
  // ═══════════════════════════════════════════════════════════════

  _streakMultiplier() {
    if (this._streak >= 12) return 2.0;
    if (this._streak >= 8)  return 1.75;
    if (this._streak >= 5)  return 1.5;
    if (this._streak >= 3)  return 1.25;
    return 1;
  }

  // ═══════════════════════════════════════════════════════════════
  //  Helpers
  // ═══════════════════════════════════════════════════════════════

  _placeTarget() {
    const pad = CONFIG.TARGET_PADDING;
    this.targetX = Math.round(pad + Math.random() * (CONFIG.CANVAS_W - 2 * pad));
    this.targetY = Math.round(pad + Math.random() * (CONFIG.CANVAS_H - 2 * pad));
  }

  _conditionForBlock(idx) {
    const first  = this.conditionOrder[0] === 'V' ? 'visual' : 'auditory';
    const second = first === 'visual' ? 'auditory' : 'visual';
    return idx === 0 ? first : second;
  }

  _renderScreen(html) {
    this.overlay.innerHTML = `<div class="card">${html}</div>`;
    this.overlay.classList.remove('hidden');
    this.screen.innerHTML = '';
  }

  _easeOutBack(t) {
    const s = 1.70158;
    return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  }
}

// ── Bootstrap ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => new Experiment().init());
