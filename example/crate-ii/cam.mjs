// usage: node cam.mjs outdir f "px,py,pz>lx,ly,lz@fov" ["..."]   (renders frame f from each ad-hoc camera; TEST.cam override in story.js)
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const [,, outdir, fr, ...cams] = process.argv; fs.mkdirSync(outdir, { recursive: true });
const root = path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/index.html`); await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
let i = 0;
for (const spec of cams) {
  const [pl, fov = '42'] = spec.split('@'), [p, l] = pl.split('>').map((x) => x.split(',').map(Number));
  const d = await pg.evaluate(([f, p, l, fov]) => { globalThis.TEST = { cam: { pos: p, look: l, fov, shadowAt: [0.1, 0.2, 0] } }; window.renderFrame(f); delete globalThis.TEST; return document.getElementById('c').toDataURL('image/jpeg', 0.9); }, [+fr, p, l, +fov]);
  fs.writeFileSync(path.join(outdir, `f${String(i++).padStart(4, '0')}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
}
await b.close(); srv.close();
