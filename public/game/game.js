/* Pace Punks: Corridor Run.
 * Rendering, input, sound and screens. The rules live in sim.js, which the leaderboard server
 * replays to verify every submitted run. */
(function () {
  "use strict";
  var Sim = window.PacePunksSim, Board = window.PacePunksBoard;
  var VH = 540, GROUND = Sim.GROUND, P = Sim.PLAYER;
  var STEP_MS = 1000 / Sim.TPS;

  // The punk's run cycle is cut from the first clip of the brand video. The corridor is corridor.js.
  var Corridor = window.PacePunksCorridor;
  var FRAMES = 12, FRAME_W = 370, FRAME_H = 390;
  var STRIDE = 17.5;             // floor units per animation frame, so feet plant on the floor

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $("game"), ctx = canvas.getContext("2d");
  var stage = $("stage");
  var ui = {
    start: $("scrStart"), over: $("scrOver"), pause: $("scrPause"),
    overScore: $("overScore"), overBest: $("overBest"), overTag: $("overTag"), overStatus: $("overStatus"),
    nameForm: $("nameForm"), nameInput: $("nameInput"), emailInput: $("emailInput"), startBest: $("startBest"),
    again: $("btnAgain"), mute: $("btnMute"), music: $("btnMusic"), full: $("btnFull"), pauseCount: $("pauseCount"),
    board: $("boardList"), boardNote: $("boardNote"), boardYou: $("boardYou"), refresh: $("btnRefresh"),
    myName: $("myName"), editName: $("btnEditName"), mode: $("boardMode")
  };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // ---------- images ----------
  var punkImg = new Image();
  punkImg.src = "assets/punk-run.webp";

  // ---------- view ----------
  var dpr = 1, scale = 1, VW = 960, PXS = 120, offY = 0, dprCap = 2;
  function resize() {
    var r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    // Keep at least a 1.45:1 view so there is always room to see what is coming; letterbox if taller.
    scale = Math.min(canvas.height / VH, canvas.width / (VH * 1.45));
    VW = canvas.width / scale;
    offY = Math.max(0, (canvas.height - VH * scale) / 2);
    PXS = Math.round(Math.max(24, Math.min(150, VW * 0.1)));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (!running()) render(1);
  }

  // ---------- sprites ----------
  // Obstacles are corridor gear in pixel art on a 2-unit grid. Each one fills its exact hit box
  // from sim.js KINDS, with a soft dark edge so it stands out from the wall without shouting.
  var SPR = {};
  var INK = "#1C2128";
  function sprite(w, h, paint) {
    var k = 2, pad = 8, A = 2;
    var art = document.createElement("canvas"), c = document.createElement("canvas");
    art.width = c.width = (w + pad * 2) * k; art.height = c.height = (h + pad * 2) * k;
    var a = art.getContext("2d");
    a.imageSmoothingEnabled = false; a.scale(k * A, k * A); a.translate(pad / A, pad / A);
    paint(function (x, y, pw, ph, col) { a.fillStyle = col; a.fillRect(x, y, pw, ph); }, w / A, h / A, a);
    var g = c.getContext("2d");
    g.shadowColor = "rgba(14,18,24,.6)"; g.shadowBlur = 7; g.drawImage(art, 0, 0);
    g.shadowBlur = 0; g.drawImage(art, 0, 0);
    return { c: c, pad: pad, k: k };
  }
  function shadeOf(c, t) {
    var n = parseInt(c.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255, f = t < 0 ? 0 : 255, m = Math.abs(t);
    return "rgb(" + Math.round(r + (f - r) * m) + "," + Math.round(gg + (f - gg) * m) + "," + Math.round(b + (f - b) * m) + ")";
  }
  // cargo crate: steel box, light strip, ribbed panel, corner brackets
  function crate(P, x, y, w, h, body, strip, label) {
    var lite = shadeOf(body, 0.28), dark = shadeOf(body, -0.35), deep = shadeOf(body, -0.55);
    P(x, y, w, h, INK);
    P(x + 1, y + 1, w - 2, h - 2, body);
    P(x + 1, y + 1, w - 2, 2, lite); P(x + 1, y + 1, 1, h - 2, lite);
    P(x + w - 2, y + 1, 1, h - 2, dark); P(x + 1, y + h - 3, w - 2, 2, dark);
    P(x + 3, y + 5, w - 6, h - 9, dark);
    P(x + 4, y + 6, w - 8, h - 11, shadeOf(body, -0.12));
    for (var yy = y + 8; yy < y + h - 5; yy += 3) P(x + 4, yy, w - 8, 1, dark);
    [[x + 1, y + 1], [x + w - 4, y + 1], [x + 1, y + h - 4], [x + w - 4, y + h - 4]].forEach(function (q) { P(q[0], q[1], 3, 3, "#B4BEC6"); P(q[0] + 1, q[1] + 1, 1, 1, deep); });
    P(x + 4, y + 3, w - 8, 1, strip); P(x + 5, y + 3, w - 10, 1, shadeOf(strip, 0.5));
    if (label === "hazard") { for (var i = 0; i < 8; i += 2) { P(x + ((w - 8) >> 1) + i, y + h - 8, 1, 3, "#E8C04A"); P(x + ((w - 8) >> 1) + i + 1, y + h - 8, 1, 3, INK); } }
    else if (label === "logo") {
      // the Pace Punks P on a dark plate, with a one-pixel glow around it
      var lx = x + ((w - 8) >> 1), ly = y + ((h - 10) >> 1);
      P(lx - 2, ly - 2, 12, 14, INK); P(lx - 1, ly - 1, 10, 12, LOGO_BG);
      logoCells(function (cx, cy) { P(lx + cx - 1, ly + cy, 3, 1, LOGO_GLOW); P(lx + cx, ly + cy - 1, 1, 3, LOGO_GLOW); });
      logoCells(function (cx, cy) { P(lx + cx, ly + cy, 1, 1, LOGO); });
    }
  }
  // The Pace Punks P logo, 8 by 10 cells, cyan on dark navy.
  var LOGO = "#01F8FF", LOGO_BG = "#060E1E", LOGO_GLOW = "#0B4656";
  var LOGO_ROWS = ["#######.", ".#######", "......##", "..##..##", "..######", "...#####", "..#####.", "..##....", "..##....", "..##...."];
  function logoCells(fn) {
    for (var r = 0; r < 10; r++) for (var c = 0; c < 8; c++) if (LOGO_ROWS[r][c] === "#") fn(c, r);
  }
  // server box: grille and status lights
  function server(P, x, y, w, h) {
    P(x, y, w, h, INK);
    P(x + 1, y + 1, w - 2, h - 2, "#56616E"); P(x + 1, y + 1, w - 2, 2, "#7C8996"); P(x + w - 2, y + 1, 1, h - 2, "#38404A");
    P(x + 3, y + 4, w - 10, h - 8, "#2C333C");
    for (var yy = y + 5; yy < y + h - 4; yy += 2) P(x + 4, yy, w - 12, 1, "#46505C");
    var leds = ["#8CF5CF", "#8CF5CF", "#F3B95F", "#E8584A"];
    for (var i = 0; i < 6; i++) P(x + w - 5, y + 5 + i * 3, 2, 1, leds[i % leds.length]);
    P(x + 2, y + h - 3, w - 4, 1, "#8CF5CF");
  }
  function cell(P, x, y, w, h, core) {
    var glass = "#16302E", metal = "#8C98A4", mlite = "#C9D2D8";
    P(x, y, w, 5, INK); P(x + 1, y + 1, w - 2, 3, metal); P(x + 1, y + 1, w - 2, 1, mlite);
    P(x, y + 5, w, h - 11, INK); P(x + 2, y + 5, w - 4, h - 11, glass);
    P(x + ((w - 5) >> 1), y + 6, 5, h - 13, core); P(x + ((w - 5) >> 1) + 1, y + 6, 3, h - 13, shadeOf(core, 0.55));
    P(x + 3, y + 6, 1, h - 13, "rgba(255,255,255,.35)");
    P(x + 1, y + 13, w - 2, 2, "#5E6A76"); P(x + 1, y + h - 16, w - 2, 2, "#5E6A76");
    P(x, y + h - 6, w, 6, INK); P(x + 1, y + h - 5, w - 2, 4, "#5E6A76");
    for (var i = 1; i < w - 1; i += 2) P(x + i, y + h - 4, 1, 2, i % 4 === 1 ? "#E8C04A" : INK);
  }
  function droneArt(frame) {
    return function (P) {
      P(3, 4, 31, 2, INK); P(4, 4, 29, 1, "#76828E");
      P(2, 2, 5, 3, INK); P(30, 2, 5, 3, INK); P(3, 3, 3, 1, "#98A4AE"); P(31, 3, 3, 1, "#98A4AE");
      var blade = "rgba(215,225,230,.85)";
      if (frame) { P(0, 1, 9, 1, blade); P(28, 1, 9, 1, blade); } else { P(2, 1, 5, 1, blade); P(30, 1, 5, 1, blade); P(1, 0, 1, 1, blade); P(35, 0, 1, 1, blade); }
      P(8, 5, 21, 12, INK); P(9, 6, 19, 10, "#4A5560"); P(9, 6, 19, 2, "#6C7884"); P(9, 14, 19, 2, "#2C333B");
      P(12, 8, 13, 5, INK); P(13, 9, 11, 3, "#E8584A"); P(14, 9, 4, 1, "#FFD2C8"); P(20, 10, 3, 1, "#F08A7C");
      P(9, 10, 1, 2, "#F3B95F"); P(27, 10, 1, 2, "#F3B95F");
      P(18, 3, 1, 2, "#76828E");
      P(14, 17, 9, 1, "rgba(140,245,207,.7)"); P(15, 18, 7, 1, "rgba(140,245,207,.35)");
    };
  }
  function buildSprites() {
    var K = Sim.KINDS;
    var STEEL = "#7A8A96", RUST = "#B9783E", TEAL = "#5F7C7A", MINT = "#8CF5CF", AMBER = "#F3B95F";
    SPR.crate = [
      sprite(K.crate.w, K.crate.h, function (P, w, h) { crate(P, 0, 0, w, h, STEEL, MINT, "logo"); }),
      sprite(K.crate.w, K.crate.h, function (P, w, h) { crate(P, 0, 0, w, h, RUST, AMBER, "hazard"); }),
      sprite(K.crate.w, K.crate.h, function (P, w, h) { server(P, 0, 0, w, h); })
    ];
    SPR.crate2 = [
      sprite(K.crate2.w, K.crate2.h, function (P, w, h) { crate(P, 0, 0, 26, h, STEEL, MINT, "logo"); crate(P, 27, 0, 26, h, RUST, AMBER, "hazard"); }),
      sprite(K.crate2.w, K.crate2.h, function (P, w, h) { server(P, 0, 0, 26, h); crate(P, 27, 0, 26, h, TEAL, AMBER, "logo"); })
    ];
    SPR.stack = [
      sprite(K.stack.w, K.stack.h, function (P, w, h) { crate(P, 0, 25, w, 27, STEEL, MINT, "hazard"); crate(P, 2, 0, w - 4, 25, TEAL, AMBER, "logo"); }),
      sprite(K.stack.w, K.stack.h, function (P, w, h) { crate(P, 0, 25, w, 27, RUST, AMBER, "hazard"); server(P, 2, 0, w - 4, 25); })
    ];
    SPR.canister = [
      sprite(K.canister.w, K.canister.h, function (P, w, h) { cell(P, 0, 0, w, h, MINT); }),
      sprite(K.canister.w, K.canister.h, function (P, w, h) { cell(P, 0, 0, w, h, AMBER); })
    ];
    SPR.canister2 = [
      sprite(K.canister2.w, K.canister2.h, function (P, w, h) {
        cell(P, 0, 0, 15, h, MINT); cell(P, w - 15, 0, 15, h, MINT);
        P(15, 18, 8, 2, INK); P(15, 18, 8, 1, "#5E6A76"); P(15, 26, 8, 2, INK); P(15, 26, 8, 1, "#5E6A76");
      })
    ];
    SPR.barrier = [sprite(K.barrier.w, K.barrier.h, function (P, w, h) {
      P(2, 4, 5, h - 4, INK); P(3, 5, 3, h - 5, "#46505C"); P(3, 5, 1, h - 5, "#6C7884");
      P(w - 7, 4, 5, h - 4, INK); P(w - 6, 5, 3, h - 5, "#46505C"); P(w - 6, 5, 1, h - 5, "#6C7884");
      P(0, h - 3, 9, 3, INK); P(1, h - 2, 7, 2, "#76828E"); P(w - 9, h - 3, 9, 3, INK); P(w - 8, h - 2, 7, 2, "#76828E");
      P(2, 0, 5, 4, INK); P(3, 1, 3, 2, "#E8584A"); P(w - 7, 0, 5, 4, INK); P(w - 6, 1, 3, 2, "#F3B95F");
      P(0, 6, w, 11, INK);
      for (var r = 0; r < 9; r++) for (var x = 1; x < w - 1; x++) P(x, 7 + r, 1, 1, (x + r) % 8 < 3 ? "#262B33" : "#E0A23C");
      P(1, 7, w - 2, 1, "#F2C98A");
      P(1, 20, w - 2, 6, INK);
      for (var m = 0; m < 4; m++) for (var x2 = 2; x2 < w - 2; x2++) P(x2, 21 + m, 1, 1, (x2 - m + 12) % 6 < 2 ? "#262B33" : "#E8C04A");
    })];
    SPR.droneLow = [sprite(K.droneLow.w, K.droneLow.h, droneArt(0)), sprite(K.droneLow.w, K.droneLow.h, droneArt(1))];
    SPR.droneHigh = SPR.droneLow;
    SPR.chip = coinSprite();
  }
  // GP chip: a gold-rimmed token with the P logo glowing on a dark face. Drawn smooth at 4x so it
  // stays crisp at any screen size. 30 units across, plus room for the soft halo.
  function coinSprite() {
    var D = 30, pad = 8, k = 4, n = (D + pad * 2) * k;
    var c = document.createElement("canvas"); c.width = c.height = n;
    var g = c.getContext("2d"); g.scale(k, k); g.translate(pad + D / 2, pad + D / 2);
    function disc(r, col) { g.fillStyle = col; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); }
    g.shadowColor = "rgba(14,18,24,.55)"; g.shadowBlur = 6; disc(15, INK); g.shadowBlur = 0;
    var rim = g.createLinearGradient(0, -14, 0, 14);
    rim.addColorStop(0, "#FFE38A"); rim.addColorStop(0.45, "#FFC93D"); rim.addColorStop(1, "#C98512");
    disc(13.6, rim);
    disc(10.6, "#7A4A08");
    disc(9.8, LOGO_BG);
    var cs = 1.5, ox = -4 * cs + 0.4, oy = -5 * cs;
    g.shadowColor = "rgba(1,248,255,.9)"; g.shadowBlur = 3.5; g.fillStyle = LOGO;
    logoCells(function (cx, cy) { g.fillRect(ox + cx * cs, oy + cy * cs, cs + 0.02, cs + 0.02); });
    g.shadowBlur = 0;
    // a little shine on the rim
    g.strokeStyle = "rgba(255,250,225,.85)"; g.lineWidth = 1.3; g.lineCap = "round";
    g.beginPath(); g.arc(0, 0, 12.2, Math.PI * 1.08, Math.PI * 1.42); g.stroke();
    return { c: c, pad: pad, d: D };
  }
  // a chip centred on (x, y); t < 0 means no glint (the HUD icon)
  function drawChip(x, y, t, sc) {
    var C = SPR.chip, z = sc || 1, full = (C.d + C.pad * 2) * z;
    ctx.drawImage(C.c, x - full / 2, y - full / 2, full, full);
    if (t < 0) return;
    var ph = (t % 2400) / 2400;            // a glint crosses the face once every 2.4 s
    if (ph > 0.18) return;
    var gx = x - 12 + (ph / 0.18) * 24;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, 13.6, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "rgba(255,255,240,.35)";
    ctx.beginPath(); ctx.moveTo(gx - 3, y - 15); ctx.lineTo(gx + 2, y - 15); ctx.lineTo(gx + 6, y + 15); ctx.lineTo(gx + 1, y + 15); ctx.fill();
    ctx.restore();
  }
  function spriteFor(o, t) {
    var v = SPR[o.kind];
    if (o.lift) return v[Math.floor(t / 45) % 2];
    return v[o.id % v.length];
  }

  // ---------- sound ----------
  // Effects are synthesized; the soundtrack streams from assets/music.mp3 and runs under them,
  // muffled and quieter on the game over screen.
  var audio = null, sfxBus = null, muted = store("pp_run_muted") === "1", musicOff = store("pp_run_music") === "0";
  var MUSIC_VOL = 0.34, MUSIC_DUCK = 0.12, MUSIC_LOOP_AT = 15.6;
  var music = new Audio(), musicGain = null, musicFilter = null, musicWired = false, musicStarted = false;
  music.src = "assets/music.mp3"; music.preload = "none"; music.loop = false;
  music.addEventListener("ended", function () { music.currentTime = MUSIC_LOOP_AT; if (wantMusic()) music.play().catch(function () {}); });
  function ctxReady() {
    if (!audio) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
      sfxBus = audio.createGain(); sfxBus.gain.value = 1.6; sfxBus.connect(audio.destination);
    }
    if (audio.state !== "running" && audio.state !== "closed") { try { audio.resume(); } catch (e) {} }
    return audio;
  }
  function wireMusic() {
    if (musicWired || !ctxReady()) return;
    try {
      var src = audio.createMediaElementSource(music);
      musicFilter = audio.createBiquadFilter(); musicFilter.type = "lowpass"; musicFilter.frequency.value = 18000;
      musicGain = audio.createGain(); musicGain.gain.value = 0;
      src.connect(musicFilter); musicFilter.connect(musicGain); musicGain.connect(audio.destination);
      musicWired = true;
    } catch (e) { musicWired = false; }
  }
  function wantMusic() { return !musicOff && (mode === "playing" || mode === "over" || mode === "ready"); }
  function musicLevel(vol, cutoff, secs) {
    if (musicWired) {
      var t = audio.currentTime;
      musicGain.gain.cancelScheduledValues(t); musicGain.gain.setTargetAtTime(vol, t, secs / 3);
      musicFilter.frequency.cancelScheduledValues(t); musicFilter.frequency.setTargetAtTime(cutoff, t, secs / 3);
    } else music.volume = vol;
  }
  function musicPlay() {
    if (musicOff) return;
    wireMusic();
    if (!musicStarted) { musicStarted = true; music.preload = "auto"; }
    if (music.paused) music.play().catch(function () {});
    musicLevel(MUSIC_VOL, 18000, 0.6);
  }
  // Phones only let sound start on some touches (a finger lifting, not landing), and a slow
  // connection can leave the first play() waiting, so every tap or key, and a check every two
  // seconds, start the soundtrack again whenever it should be playing and is not.
  function kickMusic(gesture) {
    if (gesture && audio && audio.state !== "running" && audio.state !== "closed") { try { audio.resume(); } catch (e) {} }
    if (!musicStarted || musicOff || document.hidden || !(mode === "playing" || mode === "over")) return;
    if (music.paused) { music.play().catch(function () {}); if (mode === "over") musicDuck(); }
  }
  ["pointerup", "touchend", "click", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, function () { kickMusic(true); }, true);
  });
  setInterval(function () { kickMusic(false); }, 2000);
  // Buffer the soundtrack once the page has loaded, so the first run does not wait on the download.
  window.addEventListener("load", function () { if (!musicOff && !musicStarted) music.preload = "auto"; });
  function musicDuck() { if (!music.paused) musicLevel(MUSIC_DUCK, 650, 0.5); }
  function musicHold() { if (!music.paused) music.pause(); }
  function sfx(kind) {
    if (muted || !ctxReady()) return;
    try {
      var t = audio.currentTime;
      var tone = function (f0, f1, dur, type, vol, at) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = type; o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
        g.gain.setValueAtTime(vol, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
        o.connect(g); g.connect(sfxBus); o.start(t + at); o.stop(t + at + dur + 0.02);
      };
      if (kind === "jump") tone(300, 620, 0.12, "square", 0.05, 0);
      else if (kind === "chip") { tone(988, 988, 0.06, "square", 0.04, 0); tone(1319, 1319, 0.12, "square", 0.04, 0.06); }
      else if (kind === "mile") { tone(523, 523, 0.07, "square", 0.04, 0); tone(659, 659, 0.07, "square", 0.04, 0.07); tone(784, 784, 0.14, "square", 0.04, 0.14); }
      else if (kind === "hit") { tone(220, 50, 0.35, "sawtooth", 0.08, 0); tone(110, 40, 0.4, "square", 0.05, 0.02); }
    } catch (e) { /* sound is optional */ }
  }
  function setMute(m) {
    muted = m; store("pp_run_muted", m ? "1" : "0");
    ui.mute.setAttribute("aria-pressed", m ? "true" : "false");
    ui.mute.textContent = m ? "Sound off" : "Sound on";
  }
  function setMusic(on) {
    musicOff = !on; store("pp_run_music", on ? "1" : "0");
    ui.music.setAttribute("aria-pressed", on ? "false" : "true");
    ui.music.textContent = on ? "Music on" : "Music off";
    if (!on) musicHold();
    else if (mode === "playing") musicPlay();
    else if (mode === "over" && musicStarted) { musicPlay(); musicDuck(); }
  }

  // ---------- state ----------
  var mode = "ready";            // ready | playing | paused | over
  var s = Sim.create(1), events = [], queue = [];
  var prev = { dist: 0, y: 0 }, idleDist = 0;
  var best = parseInt(store("pp_run_best") || "0", 10) || 0;
  var ranked = false, runId = null, nextSession = null, sessionPending = false;
  var playStart = 0, pausedMs = 0, pauseAt = 0, overAt = 0, lastMile = 0, chipsSeen = 0;
  var shake = 0, flash = 0, particles = [], lastGrounded = true, countdown = 0;
  var name = store("pp_run_name") || "";
  var email = store("pp_run_email") || "";
  function running() { return mode === "playing" || mode === "ready"; }

  function prefetch() {
    if (nextSession || sessionPending) return;
    sessionPending = true;
    Board.session().then(function (r) {
      sessionPending = false;
      if (r && r.ok && r.v === Sim.VERSION) nextSession = { runId: r.runId, seed: r.seed >>> 0, at: Date.now() };
    }).catch(function () { sessionPending = false; });
  }

  function startRun() {
    var fresh = nextSession && Date.now() - nextSession.at < 5 * 3600 * 1000;
    if (fresh) { s = Sim.create(nextSession.seed); runId = nextSession.runId; ranked = true; Board.begin(runId); }
    else { s = Sim.create(Math.floor(Math.random() * 4294967296)); runId = null; ranked = false; }
    nextSession = null;
    events = []; queue = []; prev = { dist: 0, y: 0 };
    lastMile = 0; chipsSeen = 0; pausedMs = 0; particles = []; shake = 0; flash = 0;
    playStart = performance.now();
    mode = "playing";
    musicPlay();
    show(null);
    canvas.focus({ preventScroll: true });
  }

  function gameOver() {
    mode = "over"; overAt = performance.now();
    shake = 14; flash = 1; sfx("hit"); musicDuck();
    var sc = Sim.score(s), isBest = sc > best;
    if (isBest) { best = sc; store("pp_run_best", String(best)); }
    ui.overScore.textContent = pad(sc);
    ui.overBest.textContent = pad(best);
    ui.overTag.hidden = !isBest;
    ui.nameForm.hidden = true;
    if (sc <= 0) {
      status("");
    } else if (!name || !email) {
      status("Enter your username and email to submit your score.");
      ui.nameInput.value = name || "";
      if (ui.emailInput) ui.emailInput.value = email || "";
      ui.nameForm.hidden = false;
      if (!coarse) setTimeout(function () { if (!name) ui.nameInput.focus(); else if (ui.emailInput) ui.emailInput.focus(); }, 50);
    } else {
      submit();
    }
    setTimeout(function () { show(ui.over); }, 450);
    prefetch();
  }

  var submitted = false;
  function submit() {
    var sc = Sim.score(s);
    if (sc <= 0 || !name || !email) return;
    status("Verifying & recording score…");
    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: name,
        email: email,
        score: sc
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (r) {
      if (r && r.success) {
        var tot = r.totalPlayers || r.total || 1;
        status("Verified: " + pad(r.score) + " · rank #" + r.rank + " of " + tot + (r.bestScore > r.score ? " · your best " + pad(r.bestScore) : ""));
        try { window.parent.postMessage({ type: "PACE_PUNKS_SCORE_SUBMITTED", score: r.score, rank: r.rank }, "*"); } catch(e){}
        loadBoard();
      } else {
        status((r && r.message) || "Could not save to leaderboard.");
      }
    })
    .catch(function () {
      status("Offline: score saved locally on your device.");
    });
  }
  function status(t) { ui.overStatus.textContent = t; }

  function pause() {
    if (mode !== "playing") return;
    mode = "paused"; pauseAt = performance.now(); countdown = 0;
    musicHold();
    ui.pauseCount.textContent = "Paused";
    show(ui.pause);
  }
  function resume() {
    if (mode !== "paused" || countdown) return;
    var n = 3;
    countdown = setInterval(function () {
      n--;
      if (n <= 0) {
        clearInterval(countdown); countdown = 0;
        pausedMs += performance.now() - pauseAt;
        mode = "playing"; acc = 0; show(null); musicPlay();
      } else ui.pauseCount.textContent = String(n);
    }, 600);
    ui.pauseCount.textContent = "3";
  }

  function show(el) {
    [ui.start, ui.over, ui.pause].forEach(function (x) { x.hidden = x !== el; });
  }

  // ---------- input ----------
  function press(type) {
    if (mode === "playing") { queue.push(type); return; }
    if (type !== 1) return;
    if (mode === "ready") { startRun(); sfx("none"); return; }
    if (mode === "paused") { resume(); return; }
    // A tap or Space retries, unless the player is busy putting a name on the board.
    if (mode === "over" && performance.now() - overAt > 650 && (ui.nameForm.hidden || (!ui.nameInput.value && document.activeElement !== ui.nameInput))) startRun();
  }
  function release(type) { if (mode === "playing") queue.push(type); }
  var keyHeld = {};
  var coarse = !!(window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches);
  function typing(e) { var t = e.target; return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable); }
  function inView() { var r = stage.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; }
  window.addEventListener("keydown", function (e) {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.code;
    var jump = k === "Space" || k === "ArrowUp" || k === "KeyW";
    var dive = k === "ArrowDown" || k === "KeyS";
    if (!jump && !dive && k !== "KeyP" && k !== "Escape") return;
    if (!inView() && mode !== "playing") return;
    if (jump || dive) e.preventDefault();
    if (k === "KeyP" || k === "Escape") { if (mode === "playing") pause(); return; }
    if (e.repeat || keyHeld[k]) return;
    keyHeld[k] = true;
    press(jump ? 1 : 2);
  });
  window.addEventListener("keyup", function (e) {
    var k = e.code;
    if (!keyHeld[k]) return;
    keyHeld[k] = false;
    if (k === "Space" || k === "ArrowUp" || k === "KeyW") { if (!keyHeld.Space && !keyHeld.ArrowUp && !keyHeld.KeyW) release(0); }
    else if (k === "ArrowDown" || k === "KeyS") release(3);
  });
  var pointers = 0;
  var touchStartY = 0;
  var isDiving = false;
  stage.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button, input, a, form")) return;
    e.preventDefault();
    pointers++;
    touchStartY = e.clientY;
    isDiving = false;
    if (pointers === 1) press(1);
  });
  stage.addEventListener("pointermove", function (e) {
    if (pointers > 0 && !isDiving && (e.clientY - touchStartY > 26)) {
      isDiving = true;
      release(0);
      press(2); // dive!
    }
  });
  function up() {
    if (pointers > 0) {
      pointers = 0;
      if (isDiving) {
        release(3);
        isDiving = false;
      } else {
        release(0);
      }
    }
  }
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  stage.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { pause(); musicHold(); }
    else if (mode === "over" && musicStarted && !musicOff) { music.play().catch(function () {}); musicDuck(); }
  });
  window.addEventListener("blur", function () { keyHeld = {}; if (mode === "playing" && s.held) queue.push(0); pointers = 0; });

  ui.again.addEventListener("click", function () { startRun(); });
  ui.mute.addEventListener("click", function () { setMute(!muted); });
  ui.music.addEventListener("click", function () { setMusic(musicOff); });
  ui.pause.addEventListener("click", function () { resume(); });
  ui.full.addEventListener("click", function () {
    var el = $("arcade");
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else if (el.requestFullscreen || el.webkitRequestFullscreen) {
      var p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      if (p && p.then) p.then(function () { if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(function () {}); }).catch(function () {});
    } else {
      el.classList.toggle("is-max");
      setTimeout(resize, 50);
    }
  });
  ["fullscreenchange", "webkitfullscreenchange"].forEach(function (ev) { document.addEventListener(ev, function () { setTimeout(resize, 60); }); });

  function cleanName(v) { return (v || "").replace(/[^A-Za-z0-9 _.-]/g, "").replace(/\s+/g, " ").trim().slice(0, 14); }
  function cleanEmail(v) { return (v || "").trim().toLowerCase(); }
  ui.nameForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = cleanName(ui.nameInput.value);
    var em = cleanEmail(ui.emailInput ? ui.emailInput.value : "");
    if (v.length < 3) { status("Usernames require 3 to 14 letters or numbers."); return; }
    if (!em || !em.includes("@") || !em.includes(".")) { status("Valid email required to register score."); return; }
    name = v; store("pp_run_name", name); renderName();
    email = em; store("pp_run_email", email);
    ui.nameForm.hidden = true;
    submit();
  });
  var editForm = $("editForm"), editInput = $("editInput"), meLine = $("meLine");
  ui.editName.addEventListener("click", function () {
    editInput.value = name; editForm.hidden = false; meLine.hidden = true; editInput.focus();
  });
  editForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = cleanName(editInput.value);
    if (v.length < 3) { editInput.setCustomValidity("Use 3 to 14 letters or numbers."); editInput.reportValidity(); return; }
    editInput.setCustomValidity("");
    name = v; store("pp_run_name", name); renderName();
    editForm.hidden = true; meLine.hidden = false; loadBoard();
  });
  editInput.addEventListener("input", function () { editInput.setCustomValidity(""); });
  function renderName() { ui.myName.textContent = name || "not set"; }

  // ---------- leaderboard panel ----------
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function loadBoard() {
    ui.boardNote.textContent = "Loading…";
    fetch("/api/leaderboard")
      .then(function (res) { return res.json(); })
      .then(function (r) {
        if (!r || !r.success) throw new Error("bad");
        var me = (name || "").toLowerCase();
        var entries = r.leaderboard || [];
        if (!entries.length) { ui.board.innerHTML = ""; ui.boardNote.textContent = "No runs yet. Be the first on the board."; return; }
        ui.board.innerHTML = entries.map(function (e, i) {
          var mine = (e.username || "").toLowerCase() === me ? " is-me" : "";
          return '<li class="lb__row' + mine + '"><span class="lb__rank">' + (e.rank || (i + 1)) + '</span><span class="lb__name">' + esc(e.username) + '</span><span class="lb__score">' + pad(e.score) + "</span></li>";
        }).join("");
        ui.boardNote.textContent = r.total + (r.total === 1 ? " runner" : " runners") + " on the board";
      })
      .catch(function () {
        Board.top().then(function (r) {
          if (!r || !r.ok) return;
          var me = (name || "").toLowerCase();
          if (!r.entries.length) { ui.board.innerHTML = ""; ui.boardNote.textContent = "No runs yet."; return; }
          ui.board.innerHTML = r.entries.map(function (e, i) {
            var mine = (e.name || "").toLowerCase() === me ? " is-me" : "";
            return '<li class="lb__row' + mine + '"><span class="lb__rank">' + (i + 1) + '</span><span class="lb__name">' + esc(e.name) + '</span><span class="lb__score">' + pad(e.score) + "</span></li>";
          }).join("");
          ui.boardNote.textContent = r.total + " runners on the board";
        }).catch(function () {
          ui.boardNote.textContent = "Offline board active.";
        });
      });
  }
  ui.refresh.addEventListener("click", loadBoard);

  // ---------- loop ----------
  var acc = 0, last = performance.now(), avgDt = 16.7, slowFor = 0;
  // A device that can't keep up at full sharpness drops to fewer pixels instead of stuttering.
  function watchSpeed(dt) {
    avgDt += (Math.min(dt, 60) - avgDt) * 0.05;
    slowFor = avgDt > 23 ? slowFor + dt : 0;
    if (slowFor > 1500 && dpr > 1) { dprCap = dpr > 1.5 ? 1.5 : 1; slowFor = 0; avgDt = 16.7; resize(); }
  }
  function frame(now) {
    var dt = Math.min(250, now - last); last = now;
    if (mode === "playing") {
      watchSpeed(dt);
      acc += dt;
      while (acc >= STEP_MS && mode === "playing") { tick(); acc -= STEP_MS; }
    } else {
      acc = 0;
      if (mode === "ready") idleDist += dt * 0.12;
    }
    var a = mode === "playing" ? acc / STEP_MS : 1;
    shake *= 0.86; flash *= 0.9;
    render(a);
    requestAnimationFrame(frame);
  }

  function tick() {
    prev.dist = s.dist; prev.y = s.y;
    while (queue.length) {
      var t = queue.shift();
      var wasHeld = s.held;
      Sim.input(s, t);
      events.push({ t: s.tick, type: t });
      if (t === 1 && !wasHeld && s.grounded) sfx("jump");
    }
    var wasGrounded = s.grounded, chips = s.coinCount;
    Sim.step(s);
    if (!wasGrounded && s.grounded) dust(6);
    if (s.coinCount > chips) { sfx("chip"); popChip(); }
    var mile = Math.floor(Sim.score(s) / 100);
    if (mile > lastMile) { lastMile = mile; sfx("mile"); }
    if (s.dead) gameOver();
  }

  function dust(n) {
    for (var i = 0; i < n; i++) particles.push({ x: PXS + 90 + Math.random() * 50, y: GROUND - 2, vx: -1 - Math.random() * 3, vy: -Math.random() * 2.2, life: 1, r: 2 + Math.random() * 3, c: "rgba(200,214,226," });
  }
  function popChip() {
    for (var i = 0; i < 8; i++) particles.push({ x: PXS + 130, y: GROUND - s.y - 120, vx: Math.random() * 4 - 1, vy: Math.random() * -4, life: 1, r: 2 + Math.random() * 2, c: i % 2 ? "rgba(255,201,61," : "rgba(1,248,255," });
  }

  // ---------- drawing ----------
  function pad(n) { n = Math.max(0, n | 0); return (n < 10000 ? ("0000" + n).slice(-5) : String(n)); }

  function hash(i) { var h = Math.imul(i ^ 0x9E3779B9, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16; return (h >>> 0) / 4294967296; }

  function drawSprite(sp, x, yBottom, w, h) {
    ctx.drawImage(sp.c, x - sp.pad, yBottom - h - sp.pad, w + sp.pad * 2, h + sp.pad * 2);
  }
  // live touches on top of the obstacle art: glowing cells, blinking beacons, the drone's eye
  function glowRect(x, y, w, h, col, a) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(" + col + "," + a.toFixed(3) + ")"; ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  function drawObstacle(o, ox, yb, t) {
    drawSprite(spriteFor(o, t), ox, yb, o.w, o.h);
    var top = yb - o.h, pulse = 0.5 + 0.5 * Math.sin(t / 260 + o.id);
    if (o.kind === "canister" || o.kind === "canister2") {
      var cols = o.kind === "canister" ? [o.id % 2 ? "243,185,95" : "140,245,207"] : ["140,245,207", "140,245,207"];
      for (var i = 0; i < cols.length; i++) {
        var cx = o.kind === "canister" ? ox + o.w / 2 : (i ? ox + o.w - 15 : ox + 15);
        glowRect(cx - 12, top + 8, 24, o.h - 18, cols[i], 0.05 + 0.07 * pulse);
      }
    } else if (o.kind === "barrier") {
      var on = Math.floor(t / 320 + o.id) % 2;
      glowRect(ox + (on ? 0 : o.w - 14), top - 6, 14, 14, on ? "232,88,74" : "243,185,95", 0.25);
    } else if (o.lift) {
      glowRect(ox + o.w / 2 - 16, top + 12, 32, 16, "232,88,74", 0.08 + 0.08 * pulse);
    }
  }

  function render(alpha) {
    var dist, py, t = performance.now();
    if (mode === "ready") { dist = idleDist; py = 0; }
    else { dist = prev.dist + (s.dist - prev.dist) * alpha; py = prev.y + (s.y - prev.y) * alpha; }
    if (offY) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#0B0820"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.setTransform(scale, 0, 0, scale, 0, offY);
    var sx = shake > 0.3 ? (Math.random() - 0.5) * shake : 0, sy = shake > 0.3 ? (Math.random() - 0.5) * shake : 0;
    ctx.translate(sx, sy);
    Corridor.draw(ctx, dist, t, VW, scale);

    var showWorld = mode !== "ready";
    // shadow
    var sh = Math.max(0.25, 1 - py / 260);
    ctx.fillStyle = "rgba(20,26,32," + (0.4 * sh) + ")";
    ctx.beginPath(); ctx.ellipse(PXS + P.w * 0.53, GROUND + 3, 66 * sh, 9 * sh, 0, 0, Math.PI * 2); ctx.fill();

    if (showWorld) {
      var i, o;
      for (i = 0; i < s.obstacles.length; i++) {
        o = s.obstacles[i];
        var ox = PXS + (o.x - dist);
        if (ox > VW + 40 || ox + o.w < -40) continue;
        // drones bob by at most 2 units, inside the hit box margins, so what you see is what you hit
        var bob = o.lift ? Math.round(Math.sin(t / 180 + o.id) * 2) : 0;
        if (!o.lift) { ctx.fillStyle = "rgba(20,26,32,.35)"; ctx.fillRect(ox - 3, GROUND - 2, o.w + 8, 5); }
        else { ctx.fillStyle = "rgba(20,26,32,.22)"; ctx.beginPath(); ctx.ellipse(ox + o.w / 2, GROUND + 2, o.w * 0.4, 5, 0, 0, Math.PI * 2); ctx.fill(); }
        drawObstacle(o, ox, GROUND - o.lift + bob, t);
        if (mode === "over" && o.id === s.hit && flash > 0.05) {
          ctx.fillStyle = "rgba(255,79,163," + (flash * 0.6) + ")"; ctx.fillRect(ox - 4, GROUND - o.lift - o.h - 4, o.w + 8, o.h + 8);
        }
      }
      for (i = 0; i < s.coins.length; i++) {
        o = s.coins[i];
        var cx = PXS + (o.x - dist);
        if (cx > VW + 30 || cx < -30) continue;
        drawChip(cx, GROUND - o.y + Math.sin(t / 260 + o.id * 0.7) * 2, t + o.id * 300);
      }
    }

    // punk
    if (punkImg.complete && punkImg.naturalWidth) {
      var f;
      if (mode !== "ready" && (py > 0.5 || !s.grounded)) f = s.vy > 0 ? 5 : 4;
      else f = Math.floor(dist / STRIDE) % FRAMES;
      if (mode === "over") f = 0;
      var squash = (mode === "playing" && s.grounded && s.tick - s.landedAt < 6) ? 1 - (6 - (s.tick - s.landedAt)) * 0.012 : 1;
      var dh = P.h * squash, dw = P.w * (2 - squash);
      ctx.save();
      if (mode === "over") { ctx.translate(PXS + P.w * 0.5, GROUND - py); ctx.rotate(-0.08); ctx.translate(-(PXS + P.w * 0.5), -(GROUND - py)); }
      ctx.drawImage(punkImg, f * FRAME_W, 0, FRAME_W, FRAME_H, PXS - (dw - P.w) / 2, GROUND - py - dh + 3, dw, dh);
      ctx.restore();
    }

    // particles
    for (var j = particles.length - 1; j >= 0; j--) {
      var q = particles[j];
      q.x += q.vx; q.y += q.vy; q.vy += 0.12; q.life -= 0.03;
      if (q.life <= 0) { particles.splice(j, 1); continue; }
      ctx.fillStyle = q.c + q.life + ")"; ctx.fillRect(q.x, q.y, q.r, q.r);
    }

    // speed lines
    if (mode === "playing" && s.speed > 11) {
      var k2 = Math.min(1, (s.speed - 11) / 6);
      ctx.fillStyle = "rgba(255,243,222," + (0.10 + 0.12 * k2) + ")";
      for (var n = 0; n < 6; n++) {
        var ly = 60 + hash(n * 13 + (s.tick >> 3)) * 300, lx = (VW - ((s.tick * 22 + n * 337) % (VW + 300)));
        ctx.fillRect(lx, ly, 70 + 90 * k2, 2);
      }
    }

    ctx.setTransform(scale, 0, 0, scale, 0, offY);
    hud();
    if (flash > 0.02 && mode === "over") { ctx.fillStyle = "rgba(255,243,222," + flash * 0.35 + ")"; ctx.fillRect(0, 0, VW, VH); }
  }

  function hud() {
    if (mode === "ready") return;
    var sc = Sim.score(s);
    var blink = mode === "playing" && lastMile > 0 && sc - lastMile * 100 < 20 && (Math.floor(performance.now() / 120) % 2 === 0);
    ctx.font = '700 22px "Pixelify Sans", sans-serif';
    ctx.textAlign = "right"; ctx.textBaseline = "top";
    var txt = pad(sc), hi = "HI " + pad(Math.max(best, sc));
    ctx.fillStyle = "#0B0820";
    ctx.fillText(txt, VW - 22, 20); ctx.fillText(hi, VW - 22 - ctx.measureText(txt).width - 26, 20);
    ctx.fillStyle = "rgba(255,243,222,.62)";
    ctx.fillText(hi, VW - 24 - ctx.measureText(txt).width - 26, 18);
    ctx.fillStyle = blink ? "#FF7A3D" : "#FFF3DE";
    ctx.fillText(txt, VW - 24, 18);
    // chips
    ctx.textAlign = "left";
    drawChip(36, 34, -1, 0.95);
    ctx.fillStyle = "#0B0820"; ctx.fillText("x" + s.coinCount, 58, 22);
    ctx.fillStyle = "#FFC93D"; ctx.fillText("x" + s.coinCount, 56, 20);
    ctx.font = '700 13px "Pixelify Sans", sans-serif';
    ctx.fillStyle = ranked || (mode === "over" && runId) ? "rgba(62,230,210,.9)" : "rgba(189,179,217,.75)";
    ctx.fillText(runId ? "RANKED RUN" : "PRACTICE RUN", 20, 52);
  }

  // ---------- boot ----------
  buildSprites();
  setMute(muted);
  setMusic(!musicOff);
  renderName();
  ui.startBest.textContent = best ? "Your best " + pad(best) : "";
  ui.mode.hidden = !Board.isDemo;
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  resize();
  show(ui.start);
  prefetch();
  loadBoard();
  if (document.fonts && document.fonts.load) document.fonts.load("700 22px Silkscreen").then(function () { render(1); });
  requestAnimationFrame(function (n) { last = n; frame(n); });

  // read by the start screen copy
  window.addEventListener("load", function () { render(1); });
})();
