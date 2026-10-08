// Slow tide: an ambient pad. Four chords, a soft high line that comes and goes, one low drone.
// Built-in Strudel synths only (no samples). Example pattern code is dedicated to the public domain (CC0 1.0).
setcpm(60 / 4)

stack(
  // one chord per bar, long attack and release so they blur together
  note("<[d3,a3,f4] [bb2,f3,d4] [g2,d3,bb3] [a2,e3,c#4]>")
    .s("triangle")
    .attack(1.5).release(3)
    .lpf(sine.range(500, 1400).slow(16))
    .room(0.8).size(0.9)
    .gain(0.35),
  // a sparse high line; degradeBy drops some notes so it never feels like a loop
  n("<0 ~ 4 ~ 2 ~ [1 0] ~>")
    .scale("D4:minor")
    .s("sine")
    .attack(0.3).release(2)
    .delay(0.4).delaytime(0.375).delayfeedback(0.45)
    .degradeBy(0.3)
    .gain(0.2),
  // the floor
  note("d2").s("sawtooth").lpf(220).attack(2).release(4).gain(0.18)
)
