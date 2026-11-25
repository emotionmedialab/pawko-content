# v3: narration voice_v3.wav (CTA "Comment PAW and I'll send you my complete dog training guide." replaces "Send this...")
p='web/story.js'; s=open(p,encoding='utf8').read()
R=[("// \"Heatstroke — 5 steps\" reel (55.44 s, 1663 frames).","// \"Heatstroke — 5 steps\" reel v3 (voice_v3.wav, 56.23 s, 1687 frames)."),
("go 1508 | fine 1545 | send 1587 | know 1645","go 1508 | fine 1545 | comment 1577 | paw 1584 | training 1654 | guide 1665 (v3 CTA tail: work/words_tail.json)"),
("fine: 1545, send: 1587, know: 1645 };","fine: 1545, comment: 1577, paw: 1584, training: 1654, guide: 1665 };"),
("const TOTAL = 1663;","const TOTAL = 1687;"),
("'air', 'fan', 'vet', 'send'] });","'air', 'fan', 'vet', 'paw', 'training', 'guide'] });"),
("a: w.send + 20, b: TOTAL - 1, at: [250, 560]","a: w.paw + 24, b: TOTAL - 1, at: [230, 600]"),
("a: w.send + 34, b: TOTAL - 1, at: [830, 470]","a: w.paw + 40, b: TOTAL - 1, at: [850, 520]"),
("cap.title({ text: 'SEND THIS!', a: w.send, b: TOTAL - 1, at: [540, 220], size: 140 });","cap.title({ text: 'COMMENT\nPAW 👇', a: w.paw - 2, b: TOTAL - 1, at: [540, 260], size: 150 });"),
("air: f < w.send ? 1 : 0.6","air: f < w.comment ? 1 : 0.6"),
("const cta = f >= w.send,","const cta = f >= w.comment,"),
("ramp(f, w.send, w.send + 14), pet = ramp(f, w.send + 10, w.send + 20);","ramp(f, w.comment, w.comment + 14), pet = ramp(f, w.comment + 10, w.comment + 20);"),
("(f - w.send - 10) * 0.22","(f - w.comment - 10) * 0.22"),
("{ id: 'v6-puppy-wag-low', a: 1566, b: 1586,","{ id: 'v6-puppy-wag-low', a: 1566, b: 1576,"),
("{ id: 'c1-kneel-pet', a: 1587, b: 1662, k: 'room', cam: glide(1587, 1662, C([0.15, 0.9, 4.4], [0.05, 0.5, 0.25], 40), C([0.12, 0.9, 4.15], [0.05, 0.5, 0.25], 40)) },",
 "{ id: 'c1-kneel-pet-cta', a: 1577, b: 1686, k: 'room', cam: glide(1577, 1686, C([0.3, 0.92, 4.45], [0.05, 0.5, 0.25], 40), C([-0.05, 0.86, 3.95], [0.05, 0.5, 0.25], 40)) },"),
]
for a,b in R:
    c=s.count(a); assert c==1, (a[:70],c); s=s.replace(a,b)
open(p,'w',encoding='utf8').write(s); print('ok')
