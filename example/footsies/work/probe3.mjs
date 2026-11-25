import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 270, height: 480 } });
pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/index.html`);
await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
await pg.evaluate(async()=>{window.__d=(await import('./story.js'))._dbg});
const r = await pg.evaluate(() => { const D = window.dbg, out = []; let worst = { g: 9 };
  const dseg = (p, a, b) => { const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq())); return p.distanceTo(a.clone().addScaledVector(ab, t)); };
  for (let f = 300; f < 1060; f += 4) { window.renderFrame(f); const n = D.dog.noseWorld(), h = D.dog.headWorld(); let g = 9;
    for (const [a, b, r] of D.legs.segments()) { g = Math.min(g, dseg(n, a, b) - r, dseg(h, a, b) - r - 0.07); }
    if (g < 0.02) out.push(f + ':' + (g * 100).toFixed(1)); if (g < worst.g) worst = { f, g }; }
  let me=0;for(let f=300;f<1060;f+=2){if(f>786&&f<836)continue;const o=window.__d.fd(f);me=Math.max(me,o.L.err,o.R.err)}return { worst, low: out.join(' '), maxErrMm: +(me*1000).toFixed(0) }; });
console.log(JSON.stringify(r)); await b.close(); srv.close();
