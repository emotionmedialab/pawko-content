// ================= word-by-word captions + pop text + title card, drawn as a 2D overlay on top of the finished frame =================
// Words come from timing.py / transcribe.py (work/words.json): [{ w, s, e }] seconds. One word at a time, white, highlight words yellow,
// bottom-centre inside the phone safe area (above the app UI, away from the right-hand buttons), thick dark outline.
//
//   import { createCaptions } from './captions.js';
//   const cap = createCaptions(THREE, renderer, { words, hi: ['feet', 'wolf'], fps: 30 });   // main.js, once
//   cap.pop({ text: 'CREAK!', a: 30, b: 62, at: [540, 560], angle: -8 });                   // SFX word, frames a..b (bounces in, shrinks out)
//   cap.title({ text: 'AT YOUR\nFEET!', a: 70, b: 118 });                                  // big angled title card (white, dark outline)
//   cap.step({ n: 1, text: 'STOP', a: 10, b: 70 });                                       // redo-parts: big numbered step card (yellow number badge + white word)
//   cap.timer({ from: 300, to: 0, a: 20, b: 140, at: [540, 420] });                          // redo-parts: "5:00" countdown (m:ss) in a white ring that drains
//   cap.render(f);                                                                           // every frame, AFTER the last render pass (draws to the screen)
// Pops/titles: at = [x, y] in 1080x1920 px, size px, angle degrees, color. Use '\n' for two lines. Keep them off faces (check the sheets).
const FONT = '"Arial Rounded MT Bold","Segoe UI Black","Arial Black",Arial,sans-serif';
const W = 1080, H = 1920, CAP_Y = 1360;   // caption centre: 71 % down (safe area: nothing below y 1500, nothing right of x 960)

export const createCaptions = (THREE, renderer, { words = [], hi = [], fps = 30, size = 138 } = {}) => {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const quad = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }); quad.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  const hiSet = new Set(hi.map((s) => s.toLowerCase())), pops = [];
  const clean = (w) => w.replace(/[^\p{L}\p{N}'-]/gu, '');
  const cap1 = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  const back = (t) => { t = Math.min(1, Math.max(0, t)) - 1; return t * t * (2.7 * t + 1.7) + 1; };   // overshoot then settle

  const text = (str, x, y, px, fill, ang = 0, sc = 1) => {
    g.save(); g.translate(x, y); g.rotate(ang * Math.PI / 180); g.scale(sc, sc);
    g.font = `800 ${px}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
    const lines = str.split('\n'), lh = px * 1.02;
    lines.forEach((ln, i) => { const yy = (i - (lines.length - 1) / 2) * lh;
      g.strokeStyle = '#1a1226'; g.lineWidth = px * 0.2; g.strokeText(ln, 0, yy + px * 0.05); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText(ln, 0, yy + px * 0.07);   // outline + soft drop
      g.strokeStyle = '#1a1226'; g.lineWidth = px * 0.2; g.strokeText(ln, 0, yy); g.fillStyle = fill; g.fillText(ln, 0, yy); });
    g.restore();
  };
  /** SFX word shown frames a..b */
  const pop = (p) => pops.push({ size: 150, color: '#ffffff', angle: -6, at: [W / 2, 560], ...p });
  /** big angled title card: white, dark outline, two lines */
  const title = (p) => pop({ size: 190, angle: -7, at: [W / 2, 640], ...p });

  /** redo-parts: numbered step card, frames a..b: a yellow round badge with the number + the word beside it (same font / outline) */
  const steps = [], timers = [];
  const step = (p) => steps.push({ at: [W / 2, 420], size: 170, angle: -5, ...p });
  /** redo-parts: countdown m:ss from `from` seconds down to `to` across frames a..b (ring drains with it) */
  const timer = (p) => timers.push({ at: [W / 2, 430], size: 150, from: 300, to: 0, ...p });
  const drawStep = (p, sc) => {
    const ws = p.size, r = ws * 0.62; g.font = `800 ${ws}px ${FONT}`; const tw = g.measureText(p.text).width, gap = ws * 0.22, total = 2 * r + gap + tw;
    g.save(); g.translate(p.at[0], p.at[1]); g.rotate(p.angle * Math.PI / 180); g.scale(sc, sc);
    const bx = -total / 2 + r;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(bx, ws * 0.07, r + ws * 0.1, 0, 7); g.fill();
    g.fillStyle = '#1a1226'; g.beginPath(); g.arc(bx, 0, r + ws * 0.1, 0, 7); g.fill(); g.fillStyle = '#ffd93b'; g.beginPath(); g.arc(bx, 0, r, 0, 7); g.fill();
    g.restore();
    const c = Math.cos(p.angle * Math.PI / 180), s2 = Math.sin(p.angle * Math.PI / 180), off = (x) => [p.at[0] + x * sc * c, p.at[1] + x * sc * s2];
    { const [nx, ny] = off(bx); g.save(); g.translate(nx, ny); g.rotate(p.angle * Math.PI / 180); g.scale(sc, sc); g.font = `800 ${ws * 0.95}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1a1226'; g.fillText(String(p.n), 0, ws * 0.04); g.restore(); }
    text(p.text, ...off(bx + r + gap + tw / 2 + ws * 0.05), ws, p.color || '#ffffff', p.angle, sc);
  };
  const drawTimer = (p, f, sc) => {
    const k = Math.min(1, Math.max(0, (f - p.a) / Math.max(1, p.b - p.a))), sec = Math.round(p.from + (p.to - p.from) * k), r = p.size * 1.05;
    g.save(); g.translate(p.at[0], p.at[1]); g.scale(sc, sc); g.lineCap = 'round';
    g.strokeStyle = '#1a1226'; g.lineWidth = p.size * 0.3; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = p.size * 0.16; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
    const left = p.from ? sec / p.from : 0; g.strokeStyle = '#ffd93b'; g.beginPath(); g.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * left); g.stroke();
    g.restore();
    text(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, p.at[0], p.at[1], p.size * 0.82, '#ffffff', 0, sc);
  };

  const render = (f) => {
    g.clearRect(0, 0, W, H);
    const t = f / fps;
    let i = -1; for (let k = 0; k < words.length; k++) if (words[k].s <= t) i = k; else break;   // the last word that has started
    if (i >= 0 && t < words[i].e + 0.3) {   // hold a word until the next one starts (up to 0.3 s after it ends)
      const w = clean(words[i].w); if (w) text(cap1(w), W / 2, CAP_Y, size, hiSet.has(w.toLowerCase()) ? '#ffd93b' : '#ffffff', 0, 0.82 + 0.18 * back((t - words[i].s) * fps / 5));
    }
    for (const p of pops) if (f >= p.a && f <= p.b) {
      const sIn = back((f - p.a) / 6), sOut = Math.min(1, (p.b - f) / 5);
      text(p.text, p.at[0], p.at[1], p.size, p.color, p.angle, Math.max(0.01, sIn * sOut));
    }
    for (const p of steps) if (f >= p.a && f <= p.b) drawStep(p, Math.max(0.01, back((f - p.a) / 6) * Math.min(1, (p.b - f) / 5)));
    for (const p of timers) if (f >= p.a && f <= p.b + (p.hold ?? 20)) drawTimer(p, f, Math.max(0.01, back((f - p.a) / 6) * Math.min(1, (p.b + (p.hold ?? 20) - f) / 5)));
    tex.needsUpdate = true;
    renderer.setRenderTarget(null); renderer.autoClear = false; renderer.render(quad, cam); renderer.autoClear = true;
  };
  return { pop, title, step, timer, render };
};
