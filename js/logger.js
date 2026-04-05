/**
 * Collects per-trial data, exports as CSV, and optionally
 * auto-saves to a Google Sheet via Apps Script endpoint.
 */
class Logger {
  constructor() {
    this.rows = [];
    this.participantId = '';
    this.conditionOrder = '';
    this.covariates = {};
  }

  /** Store participant metadata (set once during consent). */
  setMeta(id, order, covariates = {}) {
    this.participantId = id;
    this.conditionOrder = order;
    this.covariates = covariates;
  }

  /**
   * Record a single trial.
   * @param {object} d - Trial data fields.
   */
  record(d) {
    this.rows.push({
      participant_id: this.participantId,
      condition_order: this.conditionOrder,
      age_range: this.covariates.ageRange || '',
      device_type: this.covariates.deviceType || '',
      gaming_freq: this.covariates.gamingFreq || '',
      block: d.block,
      condition: d.condition,
      trial: d.trial,
      is_practice: d.isPractice ? 1 : 0,
      target_x: d.targetX,
      target_y: d.targetY,
      click_x: Math.round(d.clickX),
      click_y: Math.round(d.clickY),
      radial_error: d.radialError.toFixed(2),
      is_hit: d.isHit ? 1 : 0,
      reaction_time_ms: d.rt.toFixed(1),
      timestamp: new Date().toISOString(),
    });
  }

  /** Number of recorded rows. */
  get count() {
    return this.rows.length;
  }

  /** Build CSV string. */
  toCSV() {
    if (this.rows.length === 0) return '';
    const keys = Object.keys(this.rows[0]);
    const header = keys.join(',');
    const body = this.rows.map(r => keys.map(k => r[k]).join(',')).join('\n');
    return header + '\n' + body;
  }

  /** Trigger browser download of the CSV. */
  download() {
    const csv = this.toCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mie286_${this.participantId}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * POST all rows to the Google Sheets endpoint.
   * Returns { ok: true } on success, { ok: false, msg } on failure.
   * Silently skips if SHEET_ENDPOINT is not configured.
   */
  async submit() {
    if (!CONFIG.SHEET_ENDPOINT) {
      return { ok: false, msg: 'No endpoint configured' };
    }
    try {
      await fetch(CONFIG.SHEET_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },  // avoids CORS preflight
        body: JSON.stringify(this.rows),
        redirect: 'follow',
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, msg: err.message };
    }
  }
}
