/* Pace Punks: Corridor Run leaderboard, self-hosted version (Node 18+, no dependencies).
 *
 *   node server.js                 listens on PORT (default 8787), stores data in ./leaderboard-data.json
 *   ALLOW_ORIGIN=https://your.site PORT=8787 DATA_FILE=/var/data/board.json node server.js
 *
 * Same protocol and the same checks as the Google Apps Script version (../apps-script/Leaderboard.gs),
 * plus a per-IP rate limit. Point config.js at it with provider "json" and endpoint "https://host/run".
 */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Sim = require("../../sim.js");

const PORT = Number(process.env.PORT || 8787);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "leaderboard-data.json");
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";
const SESSION_TTL_MS = 6 * 3600 * 1000, SLOW_FACTOR = 1.25, SLACK_MS = 30000, MAX_TOP = 50;
const BAD_WORDS = ["fuck", "shit", "cunt", "nigg", "fag", "rape", "hitler", "nazi", "bitch", "whore", "slut", "dick", "pussy", "cock"];

let db = { board: {}, runs: [] };
try { db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch (e) { /* fresh start */ }
let dirty = false;
setInterval(() => { if (dirty) { dirty = false; fs.writeFile(DATA_FILE + ".tmp", JSON.stringify(db), (err) => { if (!err) fs.rename(DATA_FILE + ".tmp", DATA_FILE, () => {}); }); } }, 2000);

const sessions = new Map();
const hits = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) if (now - s.issued > SESSION_TTL_MS) sessions.delete(id);
  hits.clear();
}, 60000);

function limited(ip, cost) {
  const n = (hits.get(ip) || 0) + cost;
  hits.set(ip, n);
  return n > 120;
}
function cleanName(v) {
  v = String(v || "").replace(/[^A-Za-z0-9 _.-]/g, "").replace(/\s+/g, " ").trim().slice(0, 14);
  if (v.length < 3) return null;
  const low = v.toLowerCase().replace(/[^a-z]/g, "");
  return BAD_WORDS.some((w) => low.includes(w)) ? null : v;
}
const hashKey = (k) => crypto.createHash("sha256").update("pp-run:" + k).digest("hex").slice(0, 32);
function ranked() {
  return Object.values(db.board).filter((e) => e.status !== "BANNED")
    .sort((a, b) => b.score - a.score || (a.at < b.at ? -1 : 1));
}

const actions = {
  session() {
    const runId = crypto.randomBytes(16).toString("hex");
    const seed = crypto.randomBytes(4).readUInt32BE(0);
    sessions.set(runId, { seed, issued: Date.now() });
    return { ok: true, runId, seed, v: Sim.VERSION };
  },
  begin(b) {
    const s = sessions.get(String(b.runId));
    if (s && !s.begun) s.begun = Date.now();
    return { ok: !!s };
  },
  submit(b) {
    if (b.v !== Sim.VERSION) return { ok: false, error: "The game was updated. Reload the page to keep playing ranked." };
    const name = cleanName(b.name);
    if (!name) return { ok: false, error: "Pick another name: 3 to 14 letters or numbers." };
    const key = String(b.key || "");
    if (key.length < 20 || key.length > 64) return { ok: false, error: "Bad request." };
    const ticks = Number(b.ticks);
    if (!(Number.isInteger(ticks) && ticks > 0 && ticks <= Sim.MAX_TICKS)) return { ok: false, error: "Run could not be verified." };
    const s = sessions.get(String(b.runId));
    sessions.delete(String(b.runId));
    if (!s) return { ok: false, error: "This run was already posted or expired." };
    if (!s.begun) return { ok: false, error: "Run could not be verified." };
    const elapsed = Date.now() - s.begun, runMs = ticks * 1000 / Sim.TPS;
    if (elapsed < runMs * 0.97 - 5000) return { ok: false, error: "Run could not be verified (too fast)." };
    if (elapsed > runMs * SLOW_FACTOR + SLACK_MS) return { ok: false, error: "Run could not be verified (too slow or paused too long)." };
    const r = Sim.replay(s.seed, b.log, ticks);
    if (!r || !r.dead || r.ticks !== ticks || r.unused > 0) return { ok: false, error: "Run could not be verified." };
    const kh = hashKey(key), low = name.toLowerCase();
    const cur = db.board[low];
    if (cur && cur.owner !== kh) return { ok: false, error: "That name belongs to another runner. Pick another name." };
    if (cur && cur.status === "BANNED") return { ok: false, error: "This name is not allowed on the board." };
    const at = new Date().toISOString();
    db.runs.push({ at, name, score: r.score, ticks, chips: r.coins, jumps: r.jumps, owner: kh, runId: b.runId });
    if (db.runs.length > 20000) db.runs.splice(0, db.runs.length - 20000);
    if (!cur || r.score > cur.score) db.board[low] = { name, score: r.score, ticks, at, owner: kh, status: cur ? cur.status : "" };
    dirty = true;
    const list = ranked();
    return { ok: true, score: r.score, best: db.board[low].score, rank: 1 + list.findIndex((e) => e.name.toLowerCase() === low), total: list.length };
  },
  top(b) {
    const list = ranked();
    const res = { ok: true, total: list.length, entries: list.slice(0, MAX_TOP).map((e) => ({ name: e.name, score: e.score })) };
    if (b.key && String(b.key).length >= 20) {
      const kh = hashKey(String(b.key));
      const i = list.findIndex((e) => e.owner === kh);
      if (i >= 0) res.you = { rank: i + 1, name: list[i].name, score: list[i].score };
    }
    return res;
  }
};
const COST = { session: 2, begin: 1, submit: 3, top: 1 };

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  const send = (o, code) => { res.writeHead(code || 200, { "Content-Type": "application/json" }); res.end(JSON.stringify(o)); };
  if (req.method === "GET") return send(actions.top({}));
  if (req.method !== "POST") return send({ ok: false }, 405);
  let body = "";
  req.on("data", (c) => { body += c; if (body.length > 400000) req.destroy(); });
  req.on("end", () => {
    let b;
    try { b = JSON.parse(body); } catch (e) { return send({ ok: false, error: "Bad request." }, 400); }
    const fn = actions[b && b.action];
    if (!fn) return send({ ok: false, error: "Unknown action." }, 400);
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    if (limited(ip, COST[b.action] || 1)) return send({ ok: false, error: "Slow down a little and try again." }, 429);
    try { send(fn(b)); } catch (e) { console.error(e); send({ ok: false, error: "Server error." }, 500); }
  });
}).listen(PORT, () => console.log("Corridor Run leaderboard on :" + PORT));
