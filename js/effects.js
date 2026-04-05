/**
 * Canvas-based visual effects: particle bursts, expanding rings, floating text.
 * Runs inside the main render loop — call update() then draw(ctx) each frame.
 */
class EffectsManager {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.texts = [];
  }

  /** Burst of coloured particles from a point. */
  burst(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        life: 1,
        decay: 0.022 + Math.random() * 0.012,
      });
    }
  }

  /** Expanding ring (used on miss). */
  ring(x, y, color) {
    this.rings.push({
      x, y, color,
      radius: 6,
      maxRadius: 45,
      life: 1,
      decay: 0.035,
    });
  }

  /** Floating score text that drifts upward. */
  floatText(x, y, text, color) {
    this.texts.push({
      x, y, text, color,
      vy: -1.1,
      life: 1,
      decay: 0.018,
    });
  }

  update() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;          // gravity
      p.vx *= 0.99;          // air drag
      p.life -= p.decay;
      return p.life > 0;
    });

    this.rings = this.rings.filter(r => {
      r.radius += (r.maxRadius - r.radius) * 0.12;
      r.life -= r.decay;
      return r.life > 0;
    });

    this.texts = this.texts.filter(t => {
      t.y += t.vy;
      t.life -= t.decay;
      return t.life > 0;
    });
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * (0.4 + 0.6 * p.life), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    for (const r of this.rings) {
      ctx.globalAlpha = r.life * 0.55;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    for (const t of this.texts) {
      ctx.globalAlpha = t.life;
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
    }

    ctx.globalAlpha = 1;
  }

  get active() {
    return this.particles.length + this.rings.length + this.texts.length > 0;
  }

  clear() {
    this.particles.length = 0;
    this.rings.length = 0;
    this.texts.length = 0;
  }
}
