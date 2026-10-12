/* Pace Punks: Corridor Run, game rules.
 *
 * This file is the single source of truth for how a run plays out. The browser runs it to play,
 * and the leaderboard backend runs the exact same code to replay a submitted run from its seed
 * and its list of button presses. The server's replay decides the score, so a score typed into
 * the browser console, an edited request, or a sped-up game never reaches the board.
 *
 * Rules for editing: keep it deterministic. Plain + - * / and Math.floor/min/max/abs/imul only
 * (no Math.sin, Math.random, Date, or anything that depends on screen size). If you change any
 * number here, bump VERSION and redeploy the backend with the new copy (see game/README.md).
 */
(function (root) {
  "use strict";

  var VERSION = 5;
  var TPS = 60;                 // simulation ticks per second

  // World units: the view is 540 units tall. The floor line (the punk's feet) is at GROUND.
  var GROUND = 436;
  var PLAYER = { w: 197, h: 208, hitX0: 64, hitX1: 148, hitTop: 22, hitBottom: 4 };

  // Speed climbs quickly to SPEED_MID (under a minute in), then keeps climbing to SPEED_MAX
  // (about three minutes in). Gaps between obstacles also tighten until RAMP_POINTS distance points.
  var SPEED0 = 10, SPEED_MID = 18, SPEED_MAX = 24, GAIN1 = 0.0028, GAIN2 = 0.0008;
  var T_MID = (SPEED_MID - SPEED0) / GAIN1;
  var RAMP_POINTS = 3000;
  var JUMP_V = 15.5, G_HOLD = 0.62, G_RISE = 1.25, G_FALL = 1.0, G_DIVE = 2.4;
  var JUMP_BUFFER = 8;          // ticks a press is remembered while still in the air
  var SPAWN_AHEAD = 1500;       // obstacles appear this far ahead of the punk, on every screen size
  var METERS_PER_POINT = 40;    // distance units per point
  var COIN_POINTS = 25;
  var MAX_TICKS = TPS * 60 * 60; // a run is capped at one hour

  // kind: w, h, lift (gap under it), min distance points before it can appear,
  // weight at the start and weight once the ramp is done (blended in between)
  var KINDS = {
    crate:     { w: 54,  h: 58,  lift: 0,   min: 0,   wt: 5, wt2: 3 },
    crate2:    { w: 106, h: 58,  lift: 0,   min: 40,  wt: 3, wt2: 3 },
    canister:  { w: 30,  h: 80,  lift: 0,   min: 0,   wt: 4, wt2: 3 },
    canister2: { w: 76,  h: 80,  lift: 0,   min: 70,  wt: 3, wt2: 4 },
    barrier:   { w: 80,  h: 66,  lift: 0,   min: 20,  wt: 4, wt2: 3 },
    stack:     { w: 58,  h: 104, lift: 0,   min: 110, wt: 3, wt2: 5 },
    droneLow:  { w: 74,  h: 40,  lift: 36,  min: 160, wt: 3, wt2: 5 },
    droneHigh: { w: 74,  h: 40,  lift: 224, min: 250, wt: 3, wt2: 4 }
  };
  var KIND_ORDER = ["crate", "crate2", "canister", "canister2", "barrier", "stack", "droneLow", "droneHigh"];

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function create(seed) {
    var s = {
      seed: seed >>> 0, rand: rng(seed),
      tick: 0, dist: 0, speed: SPEED0,
      y: 0, vy: 0, grounded: true,     // y = height of feet above the floor
      held: false, down: false, buffer: 0,
      obstacles: [], coins: [], nextSpawn: SPAWN_AHEAD, nextId: 1,
      coinCount: 0, dead: false, jumps: 0, landedAt: -99
    };
    return s;
  }

  function score(s) { return Math.floor(s.dist / METERS_PER_POINT) + s.coinCount * COIN_POINTS; }

  function weight(k, lvl) { return k.wt + (k.wt2 - k.wt) * lvl; }

  function pickKind(s, sc, lvl) {
    var total = 0, i, k;
    for (i = 0; i < KIND_ORDER.length; i++) { k = KINDS[KIND_ORDER[i]]; if (sc >= k.min) total += weight(k, lvl); }
    var r = s.rand() * total;
    for (i = 0; i < KIND_ORDER.length; i++) {
      k = KINDS[KIND_ORDER[i]];
      if (sc < k.min) continue;
      r -= weight(k, lvl);
      if (r < 0) return KIND_ORDER[i];
    }
    return "crate";
  }

  function addObstacle(s, kind, x) {
    var k = KINDS[kind];
    s.obstacles.push({ id: s.nextId++, kind: kind, x: x, w: k.w, h: k.h, lift: k.lift });
    return x + k.w;
  }

  function spawn(s) {
    // Harder kinds unlock by distance only, so grabbing chips never brings them on before the speed is there.
    var sc = Math.floor(s.dist / METERS_PER_POINT);
    var lvl = Math.min(1, sc / RAMP_POINTS);   // 0 at the start, 1 once the ramp is done
    var x = s.dist + s.nextSpawn;   // world x of the new group
    var kind = pickKind(s, sc, lvl);
    var end = addObstacle(s, kind, x);
    // Combo once the run is going: two ground obstacles close enough to clear in one long jump,
    // more often as the run goes on. A tall stack only leads a combo at speed 11 and up, where the
    // jump window is at least 14 ticks. From speed 14 a combo can grow to three (one held jump).
    var r = s.rand();
    if (sc > 200 && r < 0.3 + 0.3 * lvl && KINDS[kind].lift === 0 && KINDS[kind].w <= 58 && (kind !== "stack" || s.speed >= 11)) {
      end = addObstacle(s, s.rand() < 0.5 ? "crate" : "canister", end + 40 + Math.floor(s.rand() * 30));
      if (sc > 1000 && s.speed >= 15 && kind !== "stack" && s.rand() < 0.45 * lvl) {
        end = addObstacle(s, s.rand() < 0.5 ? "crate" : "canister", end + 40 + Math.floor(s.rand() * 30));
      }
    }
    // GP chips: an arc over the obstacle or a low line after it. Both sit where the punk's body
    // passes whatever jump clears the obstacle: the arc at head height (170 to 190 units up, which a
    // jump's peak and a run along the floor both reach), the line far enough out that a long jump
    // has landed by then, and the next obstacle waits until after the line.
    var c = s.rand();
    if (c < 0.42) {
      var n = 3 + Math.floor(s.rand() * 3), i;
      if (KINDS[kind].lift > 100 || c < 0.14) {
        var fx = end + 80 + Math.floor(s.speed * 20);
        for (i = 0; i < n; i++) s.coins.push({ id: s.nextId++, x: fx + i * 44, y: 60 });
        end = Math.max(end, fx + (n - 1) * 44 + 40);
      } else {
        var mid = (x + end) / 2;
        for (i = 0; i < n; i++) {
          var u = (i - (n - 1) / 2);
          s.coins.push({ id: s.nextId++, x: mid + u * 40, y: 190 - u * u * 5 });
        }
      }
    }
    // Gap to the next group, in ticks of running: 46 to 88 at the start, 30 to 56 once the ramp is done.
    var sp = s.speed;
    s.nextSpawn = (end - s.dist) + Math.floor(sp * (46 - 16 * lvl + s.rand() * (42 - 16 * lvl)) + 70);
  }

  function input(s, type) {
    if (s.dead) return;
    if (type === 1) { if (!s.held) { s.held = true; s.buffer = JUMP_BUFFER; } }
    else if (type === 0) { s.held = false; }
    else if (type === 2) { s.down = true; }
    else if (type === 3) { s.down = false; }
  }

  function overlap(ax0, ax1, ay0, ay1, bx0, bx1, by0, by1) {
    return ax0 < bx1 && ax1 > bx0 && ay0 < by1 && ay1 > by0;
  }

  function step(s) {
    if (s.dead) return s;
    s.tick++;
    // jump
    if (s.buffer > 0) {
      if (s.grounded) { s.vy = JUMP_V; s.grounded = false; s.buffer = 0; s.jumps++; }
      else s.buffer--;
    }
    if (!s.grounded) {
      var g = s.vy > 0 ? (s.held ? G_HOLD : G_RISE) : G_FALL;
      if (s.down) g = G_DIVE;
      s.y += s.vy;
      s.vy -= g;
      if (s.y <= 0) { s.y = 0; s.vy = 0; s.grounded = true; s.landedAt = s.tick; }
    }
    // run
    s.speed = s.tick < T_MID ? SPEED0 + s.tick * GAIN1 : Math.min(SPEED_MAX, SPEED_MID + (s.tick - T_MID) * GAIN2);
    s.dist += s.speed;
    s.nextSpawn -= s.speed;
    while (s.nextSpawn <= SPAWN_AHEAD) spawn(s);

    // collisions (world x of the punk's left edge is s.dist)
    var px0 = s.dist + PLAYER.hitX0, px1 = s.dist + PLAYER.hitX1;
    var py0 = s.y + PLAYER.hitBottom, py1 = s.y + PLAYER.h - PLAYER.hitTop;
    var i, o;
    for (i = 0; i < s.obstacles.length; i++) {
      o = s.obstacles[i];
      if (overlap(px0, px1, py0, py1, o.x + 6, o.x + o.w - 6, o.lift + 2, o.lift + o.h - 4)) {
        s.dead = true; s.hit = o.id; break;
      }
    }
    for (i = s.coins.length - 1; i >= 0; i--) {
      o = s.coins[i];
      if (overlap(px0 - 6, px1 + 6, py0, py1 + 10, o.x - 14, o.x + 14, o.y - 14, o.y + 14)) {
        s.coins.splice(i, 1); s.coinCount++;
      }
    }
    // forget what scrolled away
    while (s.obstacles.length && s.obstacles[0].x + s.obstacles[0].w < s.dist - 400) s.obstacles.shift();
    while (s.coins.length && s.coins[0].x < s.dist - 400) s.coins.shift();
    if (s.tick >= MAX_TICKS) s.dead = true;
    return s;
  }

  /* Input log format: one integer per event, (ticksSincePreviousEvent << 2) | type.
     type 0 jump released, 1 jump pressed, 2 dive pressed, 3 dive released.
     An event logged at tick t is applied before step t+1 runs. */
  function encode(events) {
    var out = [], prev = 0;
    for (var i = 0; i < events.length; i++) { out.push(((events[i].t - prev) << 2) | events[i].type); prev = events[i].t; }
    return out;
  }

  // Replays a run. Returns null if the log is malformed.
  function replay(seed, log, maxTicks) {
    if (!Array.isArray(log) || log.length > 40000) return null;
    var limit = Math.min(maxTicks || MAX_TICKS, MAX_TICKS);
    var s = create(seed), t = 0, i = 0;
    var events = [];
    for (i = 0; i < log.length; i++) {
      var v = log[i];
      if (typeof v !== "number" || v < 0 || v % 1 !== 0 || v > 4 * MAX_TICKS + 3) return null;
      t += v >> 2;
      events.push({ t: t, type: v & 3 });
    }
    i = 0;
    while (!s.dead && s.tick < limit) {
      while (i < events.length && events[i].t <= s.tick) { input(s, events[i].type); i++; }
      step(s);
    }
    return { dead: s.dead, ticks: s.tick, score: score(s), coins: s.coinCount, jumps: s.jumps, unused: events.length - i };
  }

  var Sim = {
    VERSION: VERSION, TPS: TPS, GROUND: GROUND, PLAYER: PLAYER, KINDS: KINDS,
    SPEED_MAX: SPEED_MAX, SPAWN_AHEAD: SPAWN_AHEAD, MAX_TICKS: MAX_TICKS, COIN_POINTS: COIN_POINTS,
    create: create, input: input, step: step, score: score, encode: encode, replay: replay
  };
  if (typeof module === "object" && module.exports) module.exports = Sim;
  else root.PacePunksSim = Sim;
})(typeof globalThis !== "undefined" ? globalThis : this);
