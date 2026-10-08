// Wildcard example: five notes against four beats against three. Bell-ish lead, euclidean kick, nothing on the grid
// lines up for long. A wildcard tests an idea the rules don't cover yet (see agent/make-batch.md).
// Built-in Strudel synths only (no samples). Example pattern code is dedicated to the public domain (CC0 1.0).
setcpm(96 / 4)

stack(
  n("{0 3 5 7 9}%8").scale("F4:lydian")
    .s("triangle").decay(0.3).sustain(0)
    .room(0.6).pan(sine.slow(5))
    .gain(0.28),
  n("{0 -3 -1}%4").scale("F2:lydian").s("sine").release(0.4).gain(0.4),
  s("sbd(3,8,<0 2>)").decay(0.4).gain(0.7),
  s("white(5,16)").decay(0.03).sustain(0).hpf(7000).gain(0.18)
)
