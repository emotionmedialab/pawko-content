import wave, json, numpy as np
from faster_whisper import WhisperModel
w = wave.open("work/v16.wav"); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
m = WhisperModel("base.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(a, word_timestamps=True)
ws = [{"w": x.word.strip(), "s": round(x.start, 3), "e": round(x.end, 3)} for s in segs for x in s.words]
json.dump(ws, open("work/words.json", "w"), indent=1)
for x in ws: print(f"{x['s']:6.2f} {x['e']:6.2f} f{int(x['s']*30):4d} {x['w']}")
