// node work/mouth.mjs f -> screen px of the puppy's head bone, jaw bone, noseWorld and tongue (tongue placement check)
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve('web'), f = +process.argv[2];
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] }); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.goto(`http://localhost:${srv.address().port}/index.html`); await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
console.log(JSON.stringify(await pg.evaluate((f) => { window.renderFrame(f); const { dog, camera, THREE } = window.dbg, px = (v) => { const q = v.clone().project(camera); return [Math.round((q.x + 1) * 540), Math.round((1 - q.y) * 960)]; };
  const r = dog.root.position, k = (v, s) => r.clone().add(v.clone().sub(r).multiplyScalar(s)); const o = {}; for (const b of ["head", "top", "sp1", "sp2", "sp3", "sp4", "n1"]) { const v = dog.boneWorld(b); o[b] = [px(v), px(k(v, 1.6))]; } o.nose = [px(dog.noseWorld()), px(k(dog.noseWorld(), 1.6))]; o.root = px(r.clone()); o.ms = dog.mesh.matrixWorld.elements.map((x) => +x.toFixed(3)); return o; }, f)));
await b.close(); srv.close();
