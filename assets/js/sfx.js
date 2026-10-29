/* =========================================================================
   Ninja Rebirth VN — sfx.js
   Hiệu ứng âm thanh nhỏ, tổng hợp bằng Web Audio. Không dùng file âm thanh
   bên ngoài. Người chơi có thể tắt bằng nút ♪.
   ========================================================================= */
'use strict';

const Sfx = {
  enabled: true,
  ctx: null,

  _ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { this.ctx = new AC(); } catch (e) { return null; }
    }
    if (this.ctx.state === 'suspended') { this.ctx.resume().catch(() => {}); }
    return this.ctx;
  },

  _tone(freq, dur, opts) {
    const ctx = this._ensure();
    if (!ctx) return;
    const o = opts || {};
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = o.type || 'sine';
    const t0 = ctx.currentTime + (o.delay || 0);
    osc.frequency.setValueAtTime(freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, o.to), t0 + dur);
    const vol = o.vol === undefined ? 0.06 : o.vol;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  _noise(dur, vol) {
    const ctx = this._ensure();
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = vol === undefined ? 0.05 : vol;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  },

  play(name) {
    if (!this.enabled) return;
    try {
      switch (name) {
        case 'click':
          this._tone(680, 0.07, { type: 'triangle', vol: 0.045 });
          break;
        case 'hit':
          this._noise(0.12, 0.045);
          this._tone(190, 0.11, { type: 'square', vol: 0.035, to: 120 });
          break;
        case 'crit':
          this._noise(0.18, 0.06);
          this._tone(320, 0.2, { type: 'sawtooth', vol: 0.045, to: 90 });
          break;
        case 'heal':
          this._tone(520, 0.16, { type: 'sine', vol: 0.05 });
          this._tone(780, 0.2, { type: 'sine', vol: 0.04, delay: 0.07 });
          break;
        case 'coin':
          this._tone(880, 0.09, { type: 'triangle', vol: 0.05 });
          this._tone(1320, 0.14, { type: 'triangle', vol: 0.04, delay: 0.06 });
          break;
        case 'win':
          [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.28, { type: 'triangle', vol: 0.05, delay: i * 0.1 }));
          break;
        case 'lose':
          [400, 320, 240].forEach((f, i) => this._tone(f, 0.3, { type: 'sine', vol: 0.045, delay: i * 0.12 }));
          break;
        case 'battle':
          this._tone(120, 0.35, { type: 'sine', vol: 0.07, to: 70 });
          this._noise(0.25, 0.04);
          break;
        default:
          break;
      }
    } catch (e) { /* bỏ qua lỗi âm thanh */ }
  },

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.play('click');
    return this.enabled;
  }
};
