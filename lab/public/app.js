// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// Taste lab client. Lists a batch, plays each item (rendered audio if the batch has it, otherwise live through the
// item's engine), and saves 1–5 stars, keep/bin and a comment. All text goes in with textContent: never innerHTML.
(() => {
  const $ = (id) => document.getElementById(id);
  const player = $('player');
  let config = null, batch = null, playing = null; // playing = { button, engine|null }

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  async function api(path, opts = {}) {
    const r = await fetch(path, { credentials: 'same-origin', ...opts });
    if (r.status === 401) { status('Session expired: open a fresh login link.'); throw new Error('401'); }
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  }
  const post = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab': '1' }, body: JSON.stringify(body) });
  const status = (t) => { $('engine-status').textContent = t; };

  // ---------- engines ----------
  const engineReady = {};
  function loadEngine(id) {
    const cfg = config?.engines?.[id]?.browser;
    const impl = window.TasteLoopEngines?.[id];
    if (!cfg || !impl) return Promise.reject(new Error(`engine "${id}" cannot play in the browser`));
    if (!engineReady[id]) {
      status(`Loading ${config.engines[id].name}…`);
      engineReady[id] = impl.load({ ...cfg, samples: config.samples })
        .then(() => { status(''); return impl; })
        .catch((e) => { delete engineReady[id]; status(`Could not load ${config.engines[id].name}. Check your connection.`); throw e; });
    }
    return engineReady[id];
  }

  function stopAll() {
    player.pause();
    if (playing?.engine) playing.engine.stop();
    if (playing) { playing.button.classList.remove('on'); playing.button.textContent = '▶'; }
    playing = null;
  }

  async function play(it, button) {
    const same = playing?.button === button;
    stopAll();
    if (same) return;
    playing = { button, engine: null };
    button.classList.add('on'); button.textContent = '■';
    try {
      if (it.hasAudio) {
        player.src = `/audio/${encodeURIComponent(batch.id)}/${encodeURIComponent(it.id)}`;
        await player.play();
      } else {
        const engine = await loadEngine(it.engine);
        const r = await fetch(`/api/code?b=${encodeURIComponent(batch.id)}&i=${encodeURIComponent(it.id)}`, { credentials: 'same-origin' });
        if (!r.ok) throw new Error('code');
        if (playing?.button !== button) return; // the user moved on while loading
        playing.engine = engine;
        await engine.play(await r.text());
      }
    } catch {
      if (playing?.button === button) stopAll();
      status('Could not play this item.');
    }
  }
  player.onended = () => { if (playing && !playing.engine) stopAll(); };

  // ---------- rating ----------
  async function save(it, ui, patch) {
    const next = { stars: it.rating?.stars ?? null, verdict: it.rating?.verdict ?? null, comment: ui.note.value, ...patch };
    const empty = next.stars === null && next.verdict === null && !next.comment.trim();
    ui.saved.textContent = 'saving…';
    try {
      const r = await post('/api/rate', empty ? { batch: batch.id, item: it.id, clear: true } : { batch: batch.id, item: it.id, ...next });
      it.rating = r.rating;
      ui.saved.textContent = r.rating ? 'saved' : 'cleared';
      paint(it, ui); progress();
    } catch { ui.saved.textContent = 'not saved, try again'; }
  }

  function paint(it, ui) {
    ui.stars.forEach((b, i) => {
      const on = it.rating?.stars === i + 1;
      b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on));
    });
    for (const [k, b] of Object.entries(ui.verdict)) {
      const on = it.rating?.verdict === k;
      b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on));
    }
  }

  function progress() {
    const n = batch.items.filter((i) => i.rating).length;
    $('progress').textContent = `${n} / ${batch.items.length} rated`;
    const opt = [...$('batch').options].find((o) => o.value === batch.id);
    if (opt) opt.textContent = `${batch.title} (${n}/${batch.items.length})`;
  }

  function render() {
    const list = $('list');
    list.replaceChildren();
    for (const it of batch.items) {
      const card = el('section', 'item'), top = el('div', 'top');
      const playBtn = el('button', 'play', '▶');
      playBtn.type = 'button';
      playBtn.setAttribute('aria-label', `Play ${it.title}`);
      playBtn.onclick = () => play(it, playBtn);
      const txt = el('div'), title = el('div', 't', it.title);
      if (it.wildcard) title.append(el('span', 'badge', 'wildcard'));
      txt.append(title, el('div', 'd', it.notes));
      top.append(playBtn, txt);

      const ui = { stars: [], verdict: {}, note: el('textarea'), saved: el('span', 'saved') };
      const stars = el('div', 'stars');
      stars.setAttribute('role', 'group'); stars.setAttribute('aria-label', 'Stars');
      for (let n = 1; n <= 5; n++) {
        const b = el('button', null, `${n} ★`);
        b.type = 'button'; b.setAttribute('aria-label', `${n} star${n > 1 ? 's' : ''}`);
        b.onclick = () => save(it, ui, { stars: it.rating?.stars === n ? null : n });
        ui.stars.push(b); stars.append(b);
      }
      const verdict = el('div', 'verdict');
      for (const [k, label] of [['keep', 'Keep'], ['bin', 'Bin']]) {
        const b = el('button', k, label);
        b.type = 'button';
        b.onclick = () => save(it, ui, { verdict: it.rating?.verdict === k ? null : k });
        ui.verdict[k] = b; verdict.append(b);
      }
      ui.note.placeholder = 'What worked? What didn\'t? (optional)';
      ui.note.maxLength = 1000;
      ui.note.value = it.rating?.comment || '';
      ui.note.setAttribute('aria-label', `Comment on ${it.title}`);
      const row = el('div', 'row'), saveBtn = el('button', null, 'Save comment');
      saveBtn.type = 'button';
      saveBtn.onclick = () => save(it, ui, {});
      row.append(saveBtn, ui.saved);
      paint(it, ui);
      card.append(top, stars, verdict, ui.note, row);
      list.append(card);
    }
    progress();
  }

  async function load(id) {
    stopAll();
    batch = await api('/api/batch?b=' + encodeURIComponent(id));
    render();
    // Preload live engines now (not on the first tap) so the tap itself can unlock audio on phones.
    for (const e of new Set(batch.items.filter((i) => !i.hasAudio).map((i) => i.engine))) loadEngine(e).catch(() => {});
  }

  async function refresh() {
    let bs;
    try { bs = await api('/api/batches'); } catch { return; }
    const sel = $('batch'), prev = sel.value;
    sel.replaceChildren(...bs.map((b) => { const o = el('option', null, `${b.title} (${b.rated}/${b.count})`); o.value = b.id; return o; }));
    if (!bs.length) { $('list').replaceChildren(el('p', 'sub', 'No batches yet. Ask your agent for one (agent/make-batch.md) or run: npm run demo')); return; }
    const pick = bs.some((b) => b.id === prev) ? prev : bs[0].id;
    sel.value = pick;
    if (pick !== batch?.id) load(pick);
  }

  $('batch').onchange = () => load($('batch').value);
  $('stop').onclick = stopAll;
  $('logout').onclick = async () => { stopAll(); try { await post('/api/logout', {}); } catch {} $('list').replaceChildren(el('p', 'sub', 'Logged out.')); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });

  (async () => {
    try { config = await api('/api/config'); } catch { return; }
    await refresh();
  })();
})();
