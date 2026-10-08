// Plain house: four-to-the-floor, offbeat bass, a two-hit chord stab. Five parts, nothing else.
// Built-in Strudel synths only (no samples). Example pattern code is dedicated to the public domain (CC0 1.0).
setcpm(122 / 4)

stack(
  // kick: Strudel's built-in synth kick
  s("sbd*4").decay(0.4).gain(0.9),
  // hats from filtered white noise, accents on the offbeats
  s("white*8").decay(0.03).sustain(0).hpf(8000).gain("[0.12 0.32]*4"),
  // clap-ish: band-passed pink noise on 2 and 4
  s("~ pink ~ pink").decay(0.12).sustain(0).bpf(1500).room(0.2).gain(0.4),
  // bass on the offbeat, root changes every bar
  note("<[~ a1]*4 [~ a1]*4 [~ f1]*4 [~ g1]*4>")
    .s("sawtooth").lpf(400).decay(0.15).sustain(0).gain(0.5),
  // stab: two hits per bar
  note("<[a3,c4,e4] [a3,c4,e4] [f3,a3,c4] [g3,b3,d4]>")
    .struct("~ x ~ ~ ~ x ~ ~")
    .s("square").lpf(1800).decay(0.2).sustain(0)
    .room(0.4).gain(0.22)
)
