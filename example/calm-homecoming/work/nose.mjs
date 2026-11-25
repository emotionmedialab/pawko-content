// node work/nose.mjs f1 f2 ... -> puppy head + nose world positions (facing check)
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve('web'), fr = process.argv.slice(2).map(Number);
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] }); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.goto(`http://localhost:${srv.address().port}/index.html`); await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
console.log(JSON.stringify(await pg.evaluate((fr) => fr.map((f) => { window.renderFrame(f); const d = window.dbg.dog, h = d.headWorld(), n = d.noseWorld(), r = d.root; return { f, yaw: +r.rotation.y.toFixed(2), root: [r.position.x, r.position.z].map((v) => +v.toFixed(2)), head: h.toArray().map((v) => +v.toFixed(2)), nose: n.toArray().map((v) => +v.toFixed(2)) }; }), fr)));
await b.close(); srv.close();
