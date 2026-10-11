/* Pace Punks: Corridor Run, leaderboard client.
 *
 * Provider comes from window.PACE_PUNKS_CONFIG.leaderboard (assets/js/config.js):
 *   "demo"               Scores stay in this browser. Runs are still checked by replaying them, same as the server.
 *   "google-apps-script" Free Google Sheet backend. See game/README.md, paste the /exec URL as endpoint.
 *   "json"               Your own server (game/backend/node/server.js or anything speaking the same protocol).
 *
 * Protocol (both servers): POST endpoint, body is JSON sent as text/plain (no CORS preflight).
 *   {action:"session"}                                       -> {ok, runId, seed, v}
 *   {action:"begin", runId}                                  -> {ok}
 *   {action:"submit", runId, name, key, log, ticks, v}       -> {ok, score, best, rank, total} | {ok:false, error}
 *   {action:"top", key?}                                     -> {ok, entries:[{name, score, at}], total, you?:{rank, name, score}}
 */
(function () {
  "use strict";
  var Sim = window.PacePunksSim;
  var cfg = (window.PACE_PUNKS_CONFIG && window.PACE_PUNKS_CONFIG.leaderboard) || {};
  var provider = cfg.provider || "demo";
  var endpoint = (cfg.endpoint || "").trim();
  if (provider !== "demo" && !endpoint) provider = "demo";

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function playerKey() {
    var k = store("pp_run_key");
    if (!k || k.length < 20) {
      var b = new Uint8Array(18);
      (window.crypto || window.msCrypto).getRandomValues(b);
      k = Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
      store("pp_run_key", k);
    }
    return k;
  }

  // ---- remote ----
  function post(body, timeoutMs) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 12000) : null;
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow",
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  // ---- demo: same checks as the server, stored in this browser ----
  var demo = {
    read: function () { try { return JSON.parse(store("pp_run_demo_board") || "{}"); } catch (e) { return {}; } },
    write: function (b) { store("pp_run_demo_board", JSON.stringify(b)); },
    sessions: {},
    session: function () {
      var id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      var seed = Math.floor(Math.random() * 4294967296);
      this.sessions[id] = { seed: seed, issued: Date.now() };
      return Promise.resolve({ ok: true, runId: id, seed: seed, v: Sim.VERSION });
    },
    begin: function (id) { var s = this.sessions[id]; if (s && !s.begun) s.begun = Date.now(); return Promise.resolve({ ok: true }); },
    submit: function (p) {
      var s = this.sessions[p.runId]; delete this.sessions[p.runId];
      if (!s || !s.begun) return Promise.resolve({ ok: false, error: "Run expired." });
      var r = Sim.replay(s.seed, p.log, p.ticks);
      if (!r || !r.dead || r.ticks !== p.ticks) return Promise.resolve({ ok: false, error: "Run could not be verified." });
      var b = this.read(), name = p.name, k = name.toLowerCase();
      var prev = b[k];
      if (!prev || r.score > prev.score) b[k] = { name: name, score: r.score, at: new Date().toISOString() };
      this.write(b);
      var list = this.list();
      var rank = 1 + list.findIndex(function (e) { return e.name.toLowerCase() === k; });
      return Promise.resolve({ ok: true, score: r.score, best: b[k].score, rank: rank, total: list.length });
    },
    list: function () {
      var b = this.read();
      return Object.keys(b).map(function (k) { return b[k]; }).sort(function (a, z) { return z.score - a.score; });
    },
    top: function () { var l = this.list(); return Promise.resolve({ ok: true, entries: l.slice(0, 50), total: l.length }); }
  };

  var api = {
    provider: provider,
    isDemo: provider === "demo",
    key: playerKey,
    session: function () {
      if (api.isDemo) return demo.session();
      return post({ action: "session", v: Sim.VERSION }, 8000);
    },
    begin: function (runId) {
      if (api.isDemo) return demo.begin(runId);
      return post({ action: "begin", runId: runId }, 8000).catch(function () { return { ok: false }; });
    },
    submit: function (p) {
      p.key = playerKey(); p.v = Sim.VERSION;
      if (api.isDemo) return demo.submit(p);
      p.action = "submit";
      return post(p, 15000).catch(function () { return { ok: false, error: "Could not reach the leaderboard. Check your connection." }; });
    },
    top: function () {
      if (api.isDemo) return demo.top();
      return post({ action: "top", key: playerKey() }, 10000);
    }
  };
  window.PacePunksBoard = api;
})();
