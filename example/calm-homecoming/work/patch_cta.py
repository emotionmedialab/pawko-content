# one-off: fold the CTA tail into web/story.js (run once)
s = open('web/story.js', encoding='utf8').read()
def rp(a, b):
    global s
    assert a in s, a
    s = s.replace(a, b)
NL = '\\n'
rp('// "Calm Homecoming — the 5-minute rule" reel (42.88 s, 1286 frames).', '// "Calm Homecoming — the 5-minute rule" reel (46.89 s, 1407 frames: voice_cta.mp3 = voice.mp3 + 0.25 s + the CTA take, level-matched).')
rp('its 1174 | normal 1183 | and 1220 | calm2 1225 | happy 1260\n', 'its 1174 | normal 1183 | and 1220 | calm2 1225 | happy 1260\n// CTA (work/words-cta.json + 43.13 s; Comment re-dated to the silence_end 43.22): comment 1297 | paw 1305 | and 1332 | training 1373 | guide 1386\n')
rp('its: 1174, normal: 1183, and: 1220, happy: 1260 };', 'its: 1174, normal: 1183, and: 1220, happy: 1260, comment: 1297, paw: 1305, guide: 1386 };')
rp('const TOTAL = 1286;', 'const TOTAL = 1407;')
rp("'four', 'paws', 'calm', 'happy']", "'four', 'paws', 'calm', 'happy', 'paw', 'training', 'guide']")
rp("cap.title({ text: 'CALM DOG," + NL + "HAPPY DOG!', a: w.happy - 4, b: TOTAL - 1,", "cap.title({ text: 'CALM DOG," + NL + "HAPPY DOG!', a: w.happy - 4, b: w.comment - 3,")
rp("cap.pop({ text: '♥', a: w.and + 6, b: TOTAL - 1, at: [190, 640], angle: -10, size: 120, color: '#ff6b8a' });",
   "cap.pop({ text: '♥', a: w.and + 6, b: w.comment - 3, at: [190, 640], angle: -10, size: 120, color: '#ff6b8a' });\n"
   "  cap.title({ text: 'COMMENT" + NL + "PAW 👇', a: w.paw - 2, b: TOTAL - 1, at: [540, 250], size: 150 });   // CTA title, lands on \"PAW\"")
rp("    { id: '45-happy-puppy-title', a: 1256, b: TOTAL - 1, cam: pupCam(-0.65, 1.15, 0.45, 0.3, 44, 0.1, 1256, TOTAL - 1) },",
   "    { id: '45-happy-puppy-title', a: 1256, b: 1292, cam: pupCam(-0.65, 1.15, 0.45, 0.3, 44, 0.1, 1256, 1292) },\n"
   "    { id: '46-cta-two-shot', a: 1293, b: 1349, cam: glide(1293, 1349, C([1.4, 0.95, 2.4], [0.45, 0.6, -0.8], 46), C([1.3, 0.92, 2.2], [0.45, 0.6, -0.8], 46)) },\n"
   "    { id: '47-cta-two-shot-side', a: 1350, b: TOTAL - 1, cam: glide(1350, TOTAL - 1, C([0.55, 0.9, 2.6], [0.45, 0.6, -0.8], 46), C([0.5, 0.88, 2.35], [0.45, 0.6, -0.8], 46)) },")
open('web/story.js', 'w', encoding='utf8').write(s)
print('ok')
