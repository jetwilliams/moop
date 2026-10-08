// Late bus: a low-key broken beat. Lazy kick pattern, swung hats, a sub that follows the kick, one dorian chord stab.
// Built-in Strudel synths only (no samples). Example pattern code is dedicated to the public domain (CC0 1.0).
setcpm(88 / 4)

stack(
  s("sbd ~ ~ sbd ~ ~ [~ sbd] ~").decay(0.5).gain(0.85),
  // snare-ish on 2 and 4
  s("~ ~ pink ~ ~ ~ pink ~").decay(0.15).sustain(0).bpf(1200).room(0.3).gain(0.45),
  // hats: random drops and a little swing keep them human
  s("white*16").decay(0.02).sustain(0).hpf(9000)
    .gain(perlin.range(0.06, 0.22))
    .degradeBy(0.25)
    .swingBy(1 / 48, 8),
  // sub locked to the kick
  note("<d1 d1 f1 c1>").struct("x ~ ~ x ~ ~ ~ ~").s("sine").release(0.6).gain(0.55),
  // one chord on the "and" of 3
  n("<[0,2,4] [-1,1,3]>").scale("D3:dorian")
    .struct("~ ~ ~ ~ ~ x ~ ~")
    .s("triangle").release(0.8).room(0.5).gain(0.25)
)
