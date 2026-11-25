# Whisper fixes (PLAYBOOK): sentence-start words re-dated to the silence_end before them; numbers spelled out; trailing hallucinated "8." dropped.
import json
ws = json.load(open("work/words.json"))
ws = [x for x in ws if not (x["w"] == "8." and x["s"] > 55)]
fix = {  # (word, whisper start) -> (text, new start, new end or None)
 ("Save", 4.26): ("Save", 4.41, None), ("because", 5.26): ("because", 5.43, None), ("there's", 6.68): ("there's", 6.80, None),
 ("It", 8.92): ("It", 8.95, None), ("Watch", 14.46): ("Watch", 14.57, None), ("drooling,", 16.06): ("drooling,", 16.15, None),
 ("or", 17.68): ("or", 17.77, None), ("act", 20.6): ("act", 20.68, None),
 ("1.", 22.36): ("One.", 22.22, 22.57), ("Stop.", 22.88): ("Stop.", 23.01, 23.30), ("2.", 26.0): ("Two.", 25.82, 26.21), ("Shade.", 26.68): ("Shade.", 26.71, 27.27),
 ("Get", 26.92): ("Get", 27.93, 28.08), ("them", 27.22): ("them", 28.08, 28.22), ("3.", 31.22): ("Three.", 31.63, 32.10), ("Water.", 32.62): ("Water.", 32.76, 33.21),
 ("Pour", 33.74): ("Pour", 33.96, None), ("No", 38.16): ("No", 38.19, None), ("4.", 43.08): ("Four.", 42.85, 43.31), ("Air.", 43.66): ("Air.", 43.75, 44.11),
 ("5.", 46.86): ("Five.", 47.21, 47.71), ("Call", 48.12): ("Call", 48.19, None), ("and", 50.24): ("and", 50.26, None),
}
for x in ws:
    k = (x["w"], round(x["s"], 2))
    if k in fix:
        t, s, e = fix[k]; x["w"], x["s"] = t, s
        if e: x["e"] = e
json.dump(ws, open("web/words.json", "w"), indent=1)
for x in ws: print(f"{x['s']:6.2f} f{round(x['s']*30):4d} {x['w']}")
