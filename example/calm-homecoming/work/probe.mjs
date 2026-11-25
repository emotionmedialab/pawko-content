// node work/probe.mjs [step] -> per frame: shot, puppy head + owner head screen px (1080x1920); flags heads in the caption band (y 1270-1450) or near the edges
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const step = +(process.argv[2] || 3), root = path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.goto(`http://localhost:${srv.address().port}/index.html`); await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
const rows = await pg.evaluate((step) => { const out = [], { camera, proof } = window.dbg;
  for (let f = 0; f < window.TOTAL; f += step) { window.renderFrame(f); const p = proof.probe(), px = (v) => { const q = v.clone().project(camera); return [Math.round((q.x + 1) / 2 * 1080), Math.round((1 - q.y) / 2 * 1920), q.z < 1]; };
    out.push({ f, s: window.shotAt(f).id, d: px(p.dog), o: p.ownerVis ? px(p.owner) : null }); } return out; }, step);
const per = {}; for (const r of rows) { const k = r.s; per[k] = per[k] || { dy: [], oy: [] }; if (r.d[2]) per[k].dy.push(r.d[1]); if (r.o && r.o[2]) per[k].oy.push(r.o[1]); }
if (process.env.SUM) { for (const k in per) { const m = (a) => a.length ? Math.min(...a) + ".." + Math.max(...a) : "-"; console.log(k.padEnd(26), "pupY", m(per[k].dy), "ownY", m(per[k].oy)); } }
else for (const r of rows) { const fl = []; const chk = (n, v) => { if (!v || !v[2]) return; const [x, y] = v; if (x > -60 && x < 1140 && y > -60 && y < 1980) { if (y > 1200 && y < 1460 && x > 150 && x < 930) fl.push(n + '@caption'); if (x < 60 || x > 1020 || y < 60 || y > 1860) fl.push(n + '@edge'); } };
  chk('PUP', r.d); chk('OWN', r.o); if (fl.length) console.log(r.f, r.s, 'pup', r.d.slice(0, 2).join(','), 'own', r.o ? r.o.slice(0, 2).join(',') : '-', fl.join(' ')); }
await b.close(); srv.close();
