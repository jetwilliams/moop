// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// Engine registry. An engine turns pattern code (or a prompt) into sound. Swap any part: add a file that exports an
// object with the shape below and register it here. Strudel is the reference engine and the only one fully wired up.
//
// Engine shape:
//   id            string   unique id used in batch.json ("engine": "<id>")
//   name          string   human name
//   fileExt       string   extension of the pattern file an item points at (".js", ".tidal", ".rb", ".scd", ".json")
//   browserPlayer null | { script, integrity, origins[], player }   how the lab page plays code live (optional)
//   render        null | async ({ codeFile, outFile, seconds }) => void   headless render to audio (optional)
//   docs          string   where to read more
// If an engine has no browserPlayer, every item that uses it must ship a rendered audio file.
import strudel from './strudel/engine.mjs';
import tidal from './stubs/tidal.mjs';
import sonicPi from './stubs/sonic-pi.mjs';
import supercollider from './stubs/supercollider.mjs';
import aiApi from './stubs/ai-api.mjs';

export const DEFAULT_ENGINE = 'strudel';
const ENGINES = new Map([strudel, tidal, sonicPi, supercollider, aiApi].map((e) => [e.id, e]));

export const getEngine = (id) => ENGINES.get(id) || null;
export const listEngines = () => [...ENGINES.values()];
