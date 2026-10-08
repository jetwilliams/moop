// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// Browser adapter for the Strudel engine. Every browser engine registers the same three calls on
// window.TasteLoopEngines[<id>]:  load(config) → Promise,  play(code) → Promise,  stop().
// Strudel itself is fetched at runtime from the URL in /api/config (pinned version + Subresource Integrity).
(() => {
  let ready = null;

  function loadScript(src, integrity) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      if (integrity) s.integrity = integrity;
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
      s.onload = resolve;
      s.onerror = () => reject(new Error('could not load Strudel'));
      document.head.append(s);
    });
  }

  async function load(cfg) {
    if (ready) return ready;
    ready = (async () => {
      await loadScript(cfg.script, cfg.integrity);
      const prebake = cfg.samples ? () => window.samples(cfg.samples) : undefined;
      await window.initStrudel({ prebake });
    })();
    ready.catch(() => { ready = null; });
    return ready;
  }

  async function play(code) {
    if (!ready) throw new Error('Strudel is not loaded');
    await ready;
    window.hush();
    await window.evaluate(code);
  }

  function stop() { if (typeof window.hush === 'function') window.hush(); }

  window.TasteLoopEngines = window.TasteLoopEngines || {};
  window.TasteLoopEngines.strudel = { load, play, stop };
})();
