// Glass stairs: an eight-step arpeggio that shifts every bar, a filter that breathes, a bass and a kick under it.
// Built-in Strudel synths only (no samples). Example pattern code is dedicated to the public domain (CC0 1.0).
setcpm(110 / 4)

stack(
  n("0 2 4 7 4 2 <5 6> 4".add("<0 -2 -3 1>"))
    .scale("A3:minor")
    .s("square")
    .lpf(sine.range(900, 3000).slow(8))
    .decay(0.12).sustain(0.2)
    .delay(0.3).delaytime(0.1875).delayfeedback(0.3)
    .gain(0.28),
  note("<a1 f1 c2 g1>").s("sawtooth").lpf(300).release(0.5).gain(0.4),
  s("sbd ~ sbd ~").decay(0.35).gain(0.7)
)
