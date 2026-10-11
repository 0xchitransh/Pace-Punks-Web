/* Pace Punks: Corridor Run leaderboard, Google Apps Script backend.
 *
 * Setup (about 3 minutes, free):
 *  1. Create a new Google Sheet. Extensions > Apps Script.
 *  2. Replace Code.gs with this file. Add a second script file named Sim and paste ../../sim.js into it unchanged.
 *  3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the /exec URL.
 *  4. In assets/js/config.js set leaderboard: { provider: "google-apps-script", endpoint: "<the /exec URL>" }.
 *
 * Every ranked run is replayed here with the same rules file the game uses. The replay sets the score.
 * A run is rejected if: its run id was never issued or was already used, the game version differs,
 * the input log does not replay to a crash at the claimed moment, or the real time between "begin"
 * and "submit" does not fit the length of the run (stops sped-up and slowed-down games).
 *
 * Sheets it creates: "Board" (one row per runner name, best score) and "Runs" (every accepted run, for review).
 * To remove a cheater: delete their row in "Board". To ban a name, put BANNED in its "status" column.
 */

var MAX_TOP = 50;
var SESSION_TTL = 6 * 3600;           // seconds a run id stays valid (CacheService maximum)
var SLOW_FACTOR = 1.25, SLACK_MS = 30000;
var BAD_WORDS = ["fuck", "shit", "cunt", "nigg", "fag", "rape", "hitler", "nazi", "bitch", "whore", "slut", "dick", "pussy", "cock"];

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: "Bad request." }); }
  try {
    switch (body.action) {
      case "session": return out(session(body));
      case "begin": return out(begin(body));
      case "submit": return out(submit(body));
      case "top": return out(top(body));
    }
  } catch (err) {
    console.error(err);
    return out({ ok: false, error: "Server error." });
  }
  return out({ ok: false, error: "Unknown action." });
}

function doGet(e) {
  return out(top({ key: e && e.parameter && e.parameter.key }));
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function session(body) {
  var cache = CacheService.getScriptCache();
  // Global cap on new runs per minute, so nobody can flood the cache.
  var minute = "rate_" + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(minute) || 0);
  if (n > 1500) return { ok: false, error: "Busy, try again in a minute." };
  cache.put(minute, String(n + 1), 120);
  var id = Utilities.getUuid().replace(/-/g, "");
  var seed = Math.floor(Math.random() * 4294967296);
  cache.put("run_" + id, JSON.stringify({ seed: seed, issued: Date.now() }), SESSION_TTL);
  return { ok: true, runId: id, seed: seed, v: PacePunksSim.VERSION };
}

function begin(body) {
  var id = String(body.runId || "");
  if (!/^[a-f0-9]{32}$/.test(id)) return { ok: false };
  var cache = CacheService.getScriptCache();
  var raw = cache.get("run_" + id);
  if (!raw) return { ok: false };
  var s = JSON.parse(raw);
  if (!s.begun) { s.begun = Date.now(); cache.put("run_" + id, JSON.stringify(s), SESSION_TTL); }
  return { ok: true };
}

function cleanName(v) {
  v = String(v || "").replace(/[^A-Za-z0-9 _.-]/g, "").replace(/\s+/g, " ").trim().slice(0, 14);
  if (v.length < 3) return null;
  var low = v.toLowerCase().replace(/[^a-z]/g, "");
  for (var i = 0; i < BAD_WORDS.length; i++) if (low.indexOf(BAD_WORDS[i]) >= 0) return null;
  return v;
}

function hashKey(k) {
  var d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, "pp-run:" + k);
  return d.map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join("").slice(0, 32);
}

function sheet(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(header); sh.setFrozenRows(1); }
  return sh;
}

function submit(body) {
  if (body.v !== PacePunksSim.VERSION) return { ok: false, error: "The game was updated. Reload the page to keep playing ranked." };
  var id = String(body.runId || "");
  if (!/^[a-f0-9]{32}$/.test(id)) return { ok: false, error: "Run expired." };
  var name = cleanName(body.name);
  if (!name) return { ok: false, error: "Pick another name: 3 to 14 letters or numbers." };
  var key = String(body.key || "");
  if (key.length < 20 || key.length > 64) return { ok: false, error: "Bad request." };
  var ticks = Number(body.ticks);
  if (!(ticks > 0 && ticks <= PacePunksSim.MAX_TICKS && ticks % 1 === 0)) return { ok: false, error: "Run could not be verified." };

  // One use per run id: take it out of the cache first.
  var cache = CacheService.getScriptCache();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  var raw;
  try { raw = cache.get("run_" + id); if (raw) cache.remove("run_" + id); }
  finally { lock.releaseLock(); }
  if (!raw) return { ok: false, error: "This run was already posted or expired." };
  var s = JSON.parse(raw);
  if (!s.begun) return { ok: false, error: "Run could not be verified." };

  var now = Date.now(), elapsed = now - s.begun, runMs = ticks * 1000 / PacePunksSim.TPS;
  if (elapsed < runMs * 0.97 - 5000) return { ok: false, error: "Run could not be verified (too fast)." };
  if (elapsed > runMs * SLOW_FACTOR + SLACK_MS) return { ok: false, error: "Run could not be verified (too slow or paused too long)." };

  var r = PacePunksSim.replay(s.seed, body.log, ticks);
  if (!r || !r.dead || r.ticks !== ticks || r.unused > 0) return { ok: false, error: "Run could not be verified." };

  var kh = hashKey(key);
  lock.waitLock(15000);
  try {
    var board = sheet("Board", ["name", "score", "ticks", "updated", "owner", "status"]);
    var runs = sheet("Runs", ["at", "name", "score", "ticks", "chips", "jumps", "owner", "runId", "log"]);
    var data = board.getDataRange().getValues();
    var row = -1, low = name.toLowerCase();
    for (var i = 1; i < data.length; i++) if (String(data[i][0]).toLowerCase() === low) { row = i; break; }
    if (row >= 0 && data[row][4] && data[row][4] !== kh) return { ok: false, error: "That name belongs to another runner. Pick another name." };
    if (row >= 0 && String(data[row][5]).toUpperCase() === "BANNED") return { ok: false, error: "This name is not allowed on the board." };
    var logText = JSON.stringify(body.log);
    runs.appendRow([new Date(), name, r.score, ticks, r.coins, r.jumps, kh, id, logText.length < 45000 ? logText : "(too long)"]);
    var best = r.score;
    if (row < 0) board.appendRow([name, r.score, ticks, new Date(), kh, ""]);
    else {
      best = Math.max(Number(data[row][1]) || 0, r.score);
      if (r.score > (Number(data[row][1]) || 0)) board.getRange(row + 1, 2, 1, 3).setValues([[r.score, ticks, new Date()]]);
    }
    cache.remove("top");
    var list = ranked();
    var rank = 1 + list.findIndex(function (e) { return e.name.toLowerCase() === low; });
    return { ok: true, score: r.score, best: best, rank: rank, total: list.length };
  } finally { lock.releaseLock(); }
}

function ranked() {
  var board = sheet("Board", ["name", "score", "ticks", "updated", "owner", "status"]);
  var data = board.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][5]).toUpperCase() === "BANNED" || !data[i][0]) continue;
    list.push({ name: String(data[i][0]), score: Number(data[i][1]) || 0, at: data[i][3], owner: data[i][4] });
  }
  list.sort(function (a, b) { return b.score - a.score || (a.at < b.at ? -1 : 1); });
  return list;
}

function top(body) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("top");
  var list = cached ? JSON.parse(cached) : null;
  if (!list) { list = ranked(); try { cache.put("top", JSON.stringify(list), 20); } catch (e) { /* too big to cache */ } }
  var res = { ok: true, total: list.length, entries: list.slice(0, MAX_TOP).map(function (e) { return { name: e.name, score: e.score }; }) };
  var key = body && body.key ? String(body.key) : "";
  if (key.length >= 20) {
    var kh = hashKey(key);
    for (var i = 0; i < list.length; i++) if (list[i].owner === kh) { res.you = { rank: i + 1, name: list[i].name, score: list[i].score }; break; }
  }
  return res;
}
