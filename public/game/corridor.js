/* Pace Punks: Corridor Run, "ink" corridor.
 * One endless station corridor drawn in code, in a clean inked illustration style.
 * The run passes through twelve zones (each about 5000 run units long). Every zone has its own palette,
 * wall panels, pillars, ceiling lights, floor features and its own set of wall modules. Each bay belongs
 * wholly to one zone (modules, pillar, wall treatment, kit colours), so structure only changes at a
 * pillar; the room colour (wall, ceiling, trim, light, floor) rolls continuously across the boundary in
 * narrow pixel-aligned strips, so the scenery changes gradually with no visible cut and no transition.
 * Layout is a seeded hash of the zone and bay index: the corridor never repeats exactly, and after the
 * last zone it carries on with the first one again.
 *
 * Layers: far space (seen only through windows: each window owns one complete planet or plain stars, and
 * the sunset deck looks out on one huge gas giant), floor in perspective (1.0x at the ground line),
 * back wall (0.69x) rendered into cached chunk canvases, then a few gentle live touches (slow LEDs,
 * bubbles, a turning reactor ring).
 */
(function () {
  "use strict";

  // ---------- geometry (view units) ----------
  var WD = 0.69, HOR = 160, GROUND = 436;
  var TOP = 76, FRIEZE = 108, BASE = 336, WB = 350;  // wall top, frieze line, baseboard top, wall base
  var LY = 14;                                        // ceiling lights hang this much lower than in v1, below the HUD band
  var CY0 = -14, CYB = 372;                           // chunk canvases cover y CY0..CYB
  var CW = 160;                                       // chunk width in wall units
  var ZL = 5000, ZW = Math.round(ZL * WD), HB = 0.10;             // zone length (run units / wall units), blend half width
  var NBAY = 7;
  var T = 132, ROWS = [393, 404, 418, 438, 466, 502, 540];
  var FARS = 0.15, FARN = 0.22;                       // far stars, near stars
  var STW = 520, STY = 96, STH = 250;                 // star tile (units)
  var TAU = Math.PI * 2;

  // ---------- hashing ----------
  function hash(i) { var h = Math.imul(i ^ 0x9E3779B9, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function h2(a, b) { return hash(Math.imul(a | 0, 0x27D4EB2D) ^ Math.imul(b | 0, 0x165667B1) ^ 0x5BD1E995); }
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
  function seedOf(a, b) { return (h2(a, b) * 4294967296) >>> 0; }
  function sstep(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }

  // ---------- colour ----------
  function hex(s) { var n = parseInt(s.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  var WHITE = [255, 255, 255], CREAM = [255, 243, 222], GOLD = [255, 201, 61];
  function lit(a, t) { return mix(a, WHITE, t); }
  function css(a, al) {
    var r = Math.round(a[0]), g = Math.round(a[1]), b = Math.round(a[2]);
    if (al == null || al >= 1) return "rgb(" + r + "," + g + "," + b + ")";
    return "rgba(" + r + "," + g + "," + b + "," + (al < 0 ? 0 : al).toFixed(3) + ")";
  }
  function wh(a) { return "rgba(255,255,255," + a + ")"; }

  // ---------- zones ----------
  var KEYS = ["ceil", "wallT", "wallB", "trim", "ink", "metal", "pil", "light", "glow", "feat", "feat2", "led", "floorA", "floorB", "grout", "space"];
  var ZDEF = [
    { // mint concourse: the calm teal corridor of the first version
      pal: { ceil: "#323B46", wallT: "#6A8D86", wallB: "#4B5E68", trim: "#3E4C57", ink: "#1A2229", metal: "#67767F", pil: "#72838C", light: "#E2F8EE", glow: "#8CF5CF", feat: "#3EE6D2", feat2: "#F0D58A", led: "#3EE6D2", floorA: "#7C889A", floorB: "#596374", grout: "#363D4B", space: "#0D1426" },
      pillar: "col", wall: "mint", pw: 132, light: "tube", floor: "std", grate: 0.07,
      upper: ["pipes", 0.7], pipe: { y1: 120, r1: 6.5, y2: 136, r2: 5 },
      mains: [["doorway", 3], ["blastDoor", 2], ["viewport", 3]], smalls: [["vent", 4], ["panelBox", 2], ["sign", 1]]
    },
    { // amber engineering: ochre plates, copper pipes, gauges and a boiler
      pal: { ceil: "#362E2A", wallT: "#9A7B58", wallB: "#5D4C41", trim: "#4A3C34", ink: "#21170F", metal: "#8E5D3D", pil: "#7E6D5E", light: "#FFEDD0", glow: "#FFC983", feat: "#E8964A", feat2: "#EFE4CC", led: "#FFC93D", floorA: "#878178", floorB: "#625C55", grout: "#3B342F", space: "#160F14" },
      pillar: "girder", wall: "amber", pw: 112, light: "tube", floor: "lane", grate: 0,
      upper: ["pipes", 0.92], pipe: { y1: 118, r1: 7, y2: 136, r2: 5.5, valve: true, up: true },
      mains: [["boiler", 3], ["gauges", 2], ["blastDoor", 2]], smalls: [["panelBox", 3], ["vent", 2], ["sign", 1]]
    },
    { // violet research labs: lavender walls, sample cases, soft screens
      pal: { ceil: "#2C2940", wallT: "#8C85B5", wallB: "#565177", trim: "#464065", ink: "#19152A", metal: "#726D93", pil: "#8079A6", light: "#F2EEFF", glow: "#C6B6FF", feat: "#8EE3F2", feat2: "#FF9FCF", led: "#B9A3FF", floorA: "#878699", floorB: "#605F76", grout: "#38364D", space: "#120D26" },
      pillar: "slab", wall: "violet", pw: 176, light: "panel", floor: "check", grate: 0,
      upper: null,
      mains: [["labWindow", 3], ["sampleCase", 3], ["screenWide", 2], ["holoRing", 2], ["blastDoor", 1]], smalls: [["panelBox", 2], ["screen", 2], ["sign", 1]]
    },
    { // hydroponics: deep green walls, plant beds behind glass under grow light
      pal: { ceil: "#1E3135", wallT: "#46766A", wallB: "#2D4A4B", trim: "#263F3F", ink: "#0E1C1D", metal: "#567670", pil: "#5D7F77", light: "#EEFFE8", glow: "#BDF5A9", feat: "#74C77E", feat2: "#E3A2DA", led: "#A6F07E", floorA: "#6F8681", floorB: "#4F6460", grout: "#2A3836", space: "#0A1A1C" },
      pillar: "col", wall: "hydro", pw: 140, light: "tube", floor: "std", grate: 0.06, vines: true,
      upper: ["pipes", 0.6], pipe: { y1: 120, r1: 4.5, y2: 132, r2: 3.5 },
      mains: [["plantBed", 5], ["herbWall", 3]], smalls: [["planter", 3], ["level", 2], ["panelBox", 1]]
    },
    { // sunset observation deck: peach and rose, big windows on a ringed planet
      pal: { ceil: "#3A2B38", wallT: "#BD8A82", wallB: "#785763", trim: "#5C4350", ink: "#24141D", metal: "#91707A", pil: "#A48286", light: "#FFF0E2", glow: "#FFC9A2", feat: "#FF9F7A", feat2: "#FFD79C", led: "#FFB38A", floorA: "#93858F", floorB: "#6D606A", grout: "#43363F", space: "#2B1A3D" },
      pillar: "round", wall: "sunset", pw: 200, light: "tube", floor: "check", grate: 0, rail: true,
      upper: null,
      mains: [["bigWindow", 5], ["portRow", 2]], smalls: [["lamp", 2], ["screen", 1]]
    },
    { // cryo bay: icy pale cyan, frosted pods
      pal: { ceil: "#2D3947", wallT: "#7C96A4", wallB: "#516976", trim: "#4E667D", ink: "#172433", metal: "#768C9B", pil: "#839AA8", light: "#F3FBFF", glow: "#C9F0FF", feat: "#9BE7FF", feat2: "#FFFFFF", led: "#7ED8FF", floorA: "#808D9B", floorB: "#5F6C7B", grout: "#384350", space: "#0B1626" },
      pillar: "slab", wall: "cryo", pw: 120, light: "panel", floor: "grid", grate: 0.04,
      upper: ["pipes", 0.5], pipe: { y1: 119, r1: 5.5, y2: 133, r2: 4 },
      mains: [["cryoPods", 4], ["frostWindow", 3], ["blastDoor", 2]], smalls: [["thermo", 3], ["panelBox", 2]]
    },
    { // habitat quarters: warm sand, numbered cabin doors
      pal: { ceil: "#39332F", wallT: "#A49174", wallB: "#746552", trim: "#605142", ink: "#281E16", metal: "#807360", pil: "#8F8068", light: "#FFF5E4", glow: "#FFE1AE", feat: "#5E9F98", feat2: "#D9735E", led: "#84E0C4", floorA: "#8E8882", floorB: "#6A645E", grout: "#423B35", space: "#141018" },
      pillar: "round", wall: "habitat", pw: 150, light: "pods", floor: "check", grate: 0, mainN: 2,
      upper: null,
      mains: [["cabinDoor", 5], ["cabinWindow", 4]], smalls: [["notice", 2], ["lamp", 3]]
    },
    { // server hall: navy, recessed racks with tiny calm LEDs
      pal: { ceil: "#151B2D", wallT: "#36466B", wallB: "#222C47", trim: "#1C243E", ink: "#0A0F1C", metal: "#42527A", pil: "#485980", light: "#E3EEFF", glow: "#8DB1FF", feat: "#3EE6D2", feat2: "#9A84FF", led: "#3EE6D2", floorA: "#646E88", floorB: "#474F6B", grout: "#252B41", space: "#070B18" },
      pillar: "slab", wall: "server", pw: 96, light: "panel", floor: "grid", grate: 0.05,
      upper: ["tray", 1],
      mains: [["racks", 5], ["screenWide", 2]], smalls: [["screen", 2], ["panelBox", 2], ["sign", 1]]
    },
    { // rose lounge: soft brand pink, round windows, art and lamps
      pal: { ceil: "#392532", wallT: "#B4718D", wallB: "#764862", trim: "#5B394E", ink: "#22111B", metal: "#8E6379", pil: "#A0738A", light: "#FFEEF5", glow: "#FFB4D6", feat: "#FF4FA3", feat2: "#8E74FF", led: "#FF8FC4", floorA: "#8D7E89", floorB: "#685B66", grout: "#41343E", space: "#1A1030" },
      pillar: "round", wall: "rose", pw: 160, light: "pods", floor: "check", grate: 0, runner: [104, 44, 70],
      upper: null,
      mains: [["posters", 3], ["portRow", 3], ["gallery", 2]], smalls: [["lamp", 2], ["poster", 2]]
    },
    { // archive: slate walls, gold data cores in arched niches
      pal: { ceil: "#21252D", wallT: "#5C6772", wallB: "#3C444F", trim: "#323843", ink: "#11151B", metal: "#716750", pil: "#66707A", light: "#FFF3D6", glow: "#FFD98B", feat: "#FFC93D", feat2: "#BE9A55", led: "#FFC93D", floorA: "#737984", floorB: "#555B66", grout: "#2F343D", space: "#0E1018" },
      pillar: "arch", wall: "archive", pw: 150, light: "pods", floor: "std", grate: 0, mainN: 2, runner: [44, 56, 92],
      upper: null,
      mains: [["dataShelf", 5], ["screenWide", 1], ["viewport", 1]], smalls: [["lamp", 2], ["screen", 1], ["sign", 1]]
    },
    { // reactor ring: muted coral, big round reactor viewport
      pal: { ceil: "#382927", wallT: "#A66C5E", wallB: "#6B463F", trim: "#533632", ink: "#21120F", metal: "#7E5D53", pil: "#8F6B61", light: "#FFEFE4", glow: "#FFB28C", feat: "#FF8B5E", feat2: "#FFE1A3", led: "#FFB273", floorA: "#89807C", floorB: "#655D59", grout: "#3F3532", space: "#170C10" },
      pillar: "girder", wall: "reactor", pw: 120, light: "tube", floor: "gutter", grate: 0,
      upper: ["pipes", 0.5], pipe: { y1: 120, r1: 8, y2: 138, r2: 5.5, up: true },
      mains: [["reactor", 4], ["coolantBank", 2], ["blastDoor", 2]], smalls: [["coolant", 3], ["gauges", 2], ["panelBox", 1]]
    },
    { // aqua reservoir: sea blue, water tanks with slow bubbles
      pal: { ceil: "#1B2D3F", wallT: "#3E7A99", wallB: "#294F68", trim: "#22415A", ink: "#0B1825", metal: "#4D7289", pil: "#5B8199", light: "#EFFAFF", glow: "#A1E1FF", feat: "#4FC8E8", feat2: "#C2F4FF", led: "#71E8FF", floorA: "#6D8394", floorB: "#506474", grout: "#293746", space: "#071322" },
      pillar: "col", wall: "aqua", pw: 140, light: "tube", floor: "grid", grate: 0.08,
      upper: ["pipes", 0.6], pipe: { y1: 120, r1: 6.5, y2: 136, r2: 5 },
      mains: [["tank", 5], ["aquaPorts", 3], ["blastDoor", 1]], smalls: [["level", 3], ["porthole", 1], ["panelBox", 1]]
    }
  ];
  var NZ = ZDEF.length;
  (function () {
    for (var i = 0; i < NZ; i++) {
      var z = ZDEF[i]; z.p = {};
      for (var k = 0; k < KEYS.length; k++) z.p[KEYS[k]] = hex(z.pal[KEYS[k]]);
    }
  })();
  var PILW = { col: 72, slab: 86, round: 64, girder: 76, arch: 80 };

  function derive(P) {
    P.ceilLo = mix(P.ceil, P.ink, 0.45); P.ceilHi = lit(P.ceil, 0.08);
    P.wallM = mix(P.wallT, P.wallB, 0.5);
    P.metalHi = lit(P.metal, 0.28); P.metalLo = mix(P.metal, P.ink, 0.3); P.metalDk = mix(P.metal, P.ink, 0.58);
    P.pilHi = lit(P.pil, 0.18); P.pilLo = mix(P.pil, P.ink, 0.26); P.pilDk = mix(P.pil, P.ink, 0.46);
    P.recess = mix(P.wallB, P.ink, 0.5);
    P.seam = mix(P.wallB, P.ink, 0.55);
    return P;
  }
  var palCache = {};
  function palBlend(a, b, q) {
    if (q <= 0 || a === b) { b = a; q = 0; } else if (q >= 64) { a = b; q = 0; }
    var key = a * 10000 + b * 100 + q, P = palCache[key];
    if (P) return P;
    var A = ZDEF[a].p, B = ZDEF[b].p, t = q / 64;
    P = { key: key };
    for (var i = 0; i < KEYS.length; i++) P[KEYS[i]] = mix(A[KEYS[i]], B[KEYS[i]], t);
    palCache[key] = derive(P);
    return P;
  }
  function zt(k) { return ((k % NZ) + NZ) % NZ; }
  function blendAt(k, lx) {
    var f = lx / ZW;
    if (f < HB && k > 0) return [zt(k - 1), zt(k), sstep(0.5 + f / (2 * HB))];
    if (f > 1 - HB) return [zt(k), zt(k + 1), sstep((f - 1 + HB) / (2 * HB))];
    return [zt(k), zt(k), 0];
  }
  // The room colours (wall, ceiling, trim, light, floor, space) roll smoothly across a zone boundary.
  function palAt(k, lx) { var b = blendAt(k, lx); return palBlend(b[0], b[1], Math.round(b[2] * 64)); }
  function palAtU(u) { var k = Math.floor(u / ZL); return palAt(k, (u - k * ZL) * WD); }
  // The kit (metal, pillars, accents, LEDs) always belongs wholly to the bay's own zone, so a bay never
  // shows a washed in-between module: only the room around it carries the gradual colour roll.
  var KIT = ["metal", "pil", "feat", "feat2", "led"], kitCache = {};
  function bpal(b, lx) {
    var R = palAt(b.k, lx), key = R.key * 16 + b.zt, P2 = kitCache[key];
    if (P2) return P2;
    P2 = { key: key };
    for (var i = 0; i < KEYS.length; i++) P2[KEYS[i]] = R[KEYS[i]];
    var Zp = ZDEF[b.zt].p;
    for (i = 0; i < KIT.length; i++) P2[KIT[i]] = Zp[KIT[i]];
    kitCache[key] = derive(P2);
    return P2;
  }

  // ---------- module catalogue (widths, top edge) ----------
  function fixedW(w) { return { w: [w, w] }; }
  var MT = {
    doorway: { w: [150, 170], top: 172 },
    blastDoor: { w: [150, 170], top: 166 },
    viewport: { w: [196, 280], top: 140 },
    bigWindow: { w: [300, 400], top: 116 },
    portRow: { w: [222, 344], top: 150 },
    porthole: fixedW(104),
    screen: { w: [100, 128], top: 158 },
    screenWide: { w: [150, 200], top: 150 },
    sampleCase: { w: [150, 196], top: 162 },
    holoRing: { w: [104, 112], top: 150 },
    plantBed: { w: [220, 320], top: 176 },
    planter: fixedW(60),
    cryoPods: { w: [146, 226], top: 148 },
    thermo: fixedW(30),
    cabinDoor: { w: [118, 126], top: 158 },
    notice: { w: [86, 98], top: 196 },
    lamp: fixedW(30),
    racks: { w: [152, 312], top: 136 },
    dataShelf: { w: [140, 176], top: 146 },
    art: { w: [86, 120], top: 164 },
    posters: fixedW(216),
    poster: fixedW(96),
    frostWindow: { w: [190, 250], top: 144 },
    cabinWindow: { w: [150, 170], top: 160 },
    reactor: { w: [212, 236], top: 90 },
    coolant: fixedW(44),
    tank: { w: [190, 250], top: 150 },
    level: fixedW(30),
    vent: { w: [104, 116], top: 158 },
    panelBox: { w: [46, 54], top: 216 },
    sign: { w: [66, 74], top: 152 },
    gauges: { w: [116, 128], top: 176 },
    boiler: { w: [180, 236], top: 150 },
    herbWall: { w: [132, 168], top: 150 },
    coolantBank: fixedW(140),
    aquaPorts: { w: [222, 344], top: 150 },
    labWindow: { w: [210, 290], top: 148 },
    gallery: { w: [196, 236], top: 160 }
  };
  MT.poster.top = 158; MT.posters.top = 158; MT.porthole.top = 150; MT.planter.top = 140; MT.thermo.top = 168; MT.lamp.top = 180; MT.coolant.top = 62; MT.level.top = 160; MT.coolantBank.top = 62;
  // group widths
  MT.portRow.fit = function (r, len) { var n = len >= 344 && r() < 0.6 ? 3 : 2; return n === 3 ? 344 : 222; };
  MT.aquaPorts.fit = MT.portRow.fit;
  // families: a bay never shows two modules of one family
  (function () {
    var F = { screen: ["screen", "screenWide"], pipe: ["coolant", "coolantBank"], port: ["porthole", "portRow", "aquaPorts"], lamp: ["lamp", "gallery"], art: ["art", "poster", "posters"], green: ["planter", "herbWall"], gauge: ["gauges", "boiler"] };
    for (var f in F) for (var i = 0; i < F[f].length; i++) MT[F[f][i]].fam = f;
  })();
  MT.cryoPods.fit = function (r, len) { return len >= 226 && r() < 0.65 ? 226 : 146; };
  MT.racks.fit = function (r, len) { var n = Math.min(4, Math.floor((len + 8) / 80)); if (n > 2 && r() < 0.35) n--; return n * 80 - 8; };

  // ---------- layout ----------
  var zcache = {}, zorder = [];
  function zone(k) {
    var L = zcache[k];
    if (L) {
      if (zorder[zorder.length - 1] !== k) { zorder.splice(zorder.indexOf(k), 1); zorder.push(k); }
      return L;
    }
    L = buildZone(k); zcache[k] = L; zorder.push(k);
    if (zorder.length > 12) delete zcache[zorder.shift()];
    return L;
  }
  function buildZone(k) {
    var r = rng(seedOf(k + 1013, 0x2545F491)), ws = [], sum = 0, i;
    for (i = 0; i < NBAY; i++) { ws.push(0.74 + 0.52 * r()); sum += ws[i]; }
    var bays = [], x = 0, prev = null, prev2 = null;
    for (i = 0; i < NBAY; i++) {
      var w = i === NBAY - 1 ? ZW - x : Math.round(ws[i] / sum * ZW / 2) * 2;
      var br = rng(seedOf(k * 16 + i, 0x51ED27)), ztp = zt(k);
      // every bay belongs wholly to its zone; the structure only ever changes at the boundary pillar
      var b = { k: k, i: i, x0: x, w: w, zt: ztp, Z: ZDEF[ztp], items: [], lights: [], upper: null, deco: [] };
      b.pw = PILW[b.Z.pillar];
      planBay(b, br, prev, prev2);
      prev2 = prev; prev = b.main;
      bays.push(b); x += w;
    }
    return { k: k, oz: k * ZW, bays: bays };
  }
  function planBay(b, r, prev, prev2) {
    var Z = b.Z, xs = b.x0 + b.pw, xe = b.x0 + b.w, M = 36, GAP = 40, i;
    var free = [[xs + M, xe - M]], items = b.items, used = {}, fams = {};
    function place(list, isMain) {
      var bi = -1, bl = 0, j;
      for (j = 0; j < free.length; j++) if (free[j][1] - free[j][0] > bl) { bl = free[j][1] - free[j][0]; bi = j; }
      if (bi < 0) return false;
      var f = free[bi], len = f[1] - f[0], cands = [], tot = 0;
      for (j = 0; j < list.length; j++) {
        var t = list[j][0];
        if (MT[t].w[0] > len || used[t] || (MT[t].fam && fams[MT[t].fam])) continue;
        var wt = list[j][1] * (isMain && t === prev2 ? 0.4 : 1);
        if (isMain && t === prev) { if (list.length > 1) continue; }
        cands.push([t, wt]); tot += wt;
      }
      if (!cands.length) return false;
      var pick = r() * tot, c = cands[0];
      if (!(tot > 0)) return false;
      for (j = 0; j < cands.length; j++) { pick -= cands[j][1]; if (pick < 0) { c = cands[j]; break; } }
      var mt = MT[c[0]];
      var w = mt.fit ? mt.fit(r, len) : Math.round(mt.w[0] + (Math.min(mt.w[1], len) - mt.w[0]) * r());
      if (w > len) return false;
      var x = Math.round(f[0] + (len - w) * (isMain ? 0.2 + 0.6 * r() : 0.3 + 0.4 * r()));
      var m = { t: c[0], x: x, w: w, s: (r() * 4294967296) >>> 0, top: mt.top, lv: null };
      if (INIT[c[0]]) INIT[c[0]](m, rng(seedOf(m.s, 0x55AA)), b.zt);
      items.push(m); used[c[0]] = 1; if (mt.fam) fams[mt.fam] = 1;
      if (isMain && !b.main) b.main = c[0];
      var nf = [];
      if (x - GAP - f[0] > 8) nf.push([f[0], x - GAP]);
      if (f[1] - (x + w + GAP) > 8) nf.push([x + w + GAP, f[1]]);
      free.splice.apply(free, [bi, 1].concat(nf));
      return true;
    }
    // every bay gets its main piece and usually one small companion: calm, never empty
    var nMain = Z.mainN || 1;
    for (i = 0; i < nMain; i++) place(Z.mains, true);
    var nSmall = items.length ? (r() < 0.8 ? 1 : 0) : 2;
    for (i = 0; i < nSmall; i++) place(Z.smalls, false);
    items.sort(function (a, c) { return a.x - c.x; });
    // hydroponics: pothos vines trail from little lip planters in the open gaps
    if (Z.vines) {
      var vg2 = [];
      for (i = 0; i < free.length; i++) if (free[i][1] - free[i][0] >= 30) vg2.push(free[i]);
      vg2.sort(function (a, c) { return (c[1] - c[0]) - (a[1] - a[0]); });
      for (i = 0; i < Math.min(2, vg2.length); i++) {
        var vw = Math.min(58, vg2[i][1] - vg2[i][0]), vx = Math.round(vg2[i][0] + (vg2[i][1] - vg2[i][0] - vw) / 2);
        b.deco.push({ t: "vine", x: vx, w: vw, s: (r() * 4294967296) >>> 0, top: 118 });
      }
    }
    // ceiling lights, evenly spaced over the span
    var span = xe - xs, n = span > 470 ? 2 : 1, tall = [];
    for (i = 0; i < items.length; i++) if (items[i].top < 80) tall.push(items[i]);
    if (tall.length) {
      // light only the open wall beside a full height module
      var gaps = [[xs + 20, tall[0].x - 24]];
      for (i = 0; i < tall.length; i++) gaps.push([tall[i].x + tall[i].w + 24, i + 1 < tall.length ? tall[i + 1].x - 24 : xe - 20]);
      for (i = 0; i < gaps.length; i++) {
        var gl = gaps[i][1] - gaps[i][0];
        if (gl >= 110) b.lights.push({ x: Math.round((gaps[i][0] + gaps[i][1]) / 2), L: Math.round(Math.min(gl - 40, 150 + 60 * r())) });
      }
    } else {
      for (i = 0; i < n; i++) {
        var L = Math.round(Math.min(span / n - 70, 150 + 60 * r()));
        b.lights.push({ x: Math.round(xs + span * (i + 0.5) / n), L: L });
      }
    }
    // upper band (pipes or cable tray) only over a bay whose modules sit low enough
    if (Z.upper && r() < Z.upper[1]) {
      var ok = true;
      for (i = 0; i < items.length; i++) if (items[i].top < 146) ok = false;
      if (ok) {
        b.upper = { t: Z.upper[0], drops: [] };
        if (Z.upper[0] === "pipes" && !Z.vines && r() < 0.75) {
          var opts = [];
          for (i = 0; i < free.length; i++) if (free[i][1] - free[i][0] >= 26) opts.push(free[i]);
          if (opts.length) {
            var fo = opts[Math.floor(r() * opts.length)];
            b.upper.drops.push(Math.round(fo[0] + 13 + (fo[1] - fo[0] - 26) * r()));
          }
        }
      }
    }
  }

  // module init: geometry the painter and the far layer both need
  // Far content of a window: each window owns one complete object (a small planet or moon that fits
  // inside the glass with room to drift a little for depth) or shows plain stars. Nothing is ever cut by
  // the frame, so no stray ring fragments.
  function farObj(win, r, z, maxR, round) {
    z = (z + 1 + Math.floor(r() * (NZ - 1))) % NZ;   // any body but the zone's own landmark colour twice in a row
    var sp = PLAN[z], ring = sp.ring && !round && maxR >= 22, R, ext, eh;
    if (round) {
      R = Math.min(maxR, 14 + Math.floor(r() * 4)); ext = R + 2; eh = R + 2;
      win.obj = { z: z, R: R, ring: false, fy: 0.5, A: Math.max(0, win.w / 2 - ext - 9) };
      return;
    }
    R = ring ? Math.min(maxR, Math.floor((win.w / 2 - 30) / 1.8), Math.floor(win.h / 2 - 20)) : Math.min(maxR, Math.floor(win.h / 2 - 22), Math.floor(win.w / 2 - 34));
    if (R < 10) { win.obj = null; return; }
    ext = ring ? R * 1.8 + 2 : R + 2; eh = ring ? R + 7 : R + 2;
    var fy = 0.5 + (r() - 0.5) * Math.max(0, (win.h - 2 * eh - 24) / win.h);
    win.obj = { z: z, R: R, ring: ring, fy: fy, A: Math.max(0, win.w / 2 - ext - 12) };
  }
  var INIT = {
    viewport: function (m, r, z) {
      m.win = [{ x: m.x + 13, y: 153, w: m.w - 26, h: 126 }];
      if (r() < 0.8) farObj(m.win[0], r, z, 30, false);
    },
    bigWindow: function (m, r, z) {
      m.win = [{ x: m.x + 14, y: 130, w: m.w - 28, h: 152, giant: z === 4 }];
      if (z !== 4) farObj(m.win[0], r, z, 34, false);
    },
    frostWindow: function (m, r, z) {
      m.win = [{ x: m.x + 14, y: 160, w: m.w - 28, h: 112 }];
      if (r() < 0.7) farObj(m.win[0], r, z, 22, false);
    },
    cabinWindow: function (m, r, z) {
      m.cur = r() < 0.5 ? 0 : 1; m.pl = r() < 0.5 ? 0 : 1;
      m.win = [{ x: m.x + 12, y: 182, w: m.w - 24, h: 62 }];
      if (r() < 0.55) { farObj(m.win[0], r, z, 12, true); m.win[0].obj.A = Math.max(0, m.win[0].w / 2 - 30 - m.win[0].obj.R - 4); }
    },
    portRow: function (m, r, z) {
      var n = m.w > 300 ? 3 : 2, R = 38, gap = (m.w - n * 102) / (n - 1);
      m.n = n; m.R = R; m.ports = []; m.win = [];
      var withMoon = r() < 0.75 ? Math.floor(r() * n) : -1;
      for (var i = 0; i < n; i++) {
        var cx = m.x + 51 + i * (102 + gap);
        m.ports.push(cx); m.win.push({ x: cx - R, y: 210 - R, w: 2 * R, h: 2 * R });
        if (i === withMoon) farObj(m.win[i], r, z, 16, true);
      }
    },
    aquaPorts: function (m, r) { INIT.portRow(m, r, 0); m.win = null; },
    porthole: function (m, r, z) {
      m.win = [{ x: m.x + 52 - 37, y: 212 - 37, w: 74, h: 74 }];
      if (r() < 0.5) farObj(m.win[0], r, z, 15, true);
    },
    screen: function (m, r) { m.h = 64 + Math.round(r() * 3) * 6; m.y = 162 + Math.round(r() * 3) * 8; m.v = Math.floor(r() * 3); },
    screenWide: function (m, r) { m.h = 96; m.y = 154; m.v = Math.floor(r() * 3); },
    gallery: function (m, r) { m.art = { x: m.x + 44, w: m.w - 88, h: 84 + Math.round(r() * 2) * 8, y: 164, v: Math.floor(r() * 5), s: m.s }; },
    art: function (m, r) { m.h = 70 + Math.round(r() * 3) * 8; m.y = 168 + Math.round(r() * 2) * 6; m.v = Math.floor(r() * 5); },
    poster: function (m, r) { m.v = Math.floor(r() * 3); },
    posters: function (m, r) { m.v = Math.floor(r() * 3); },
    racks: function (m) { m.n = Math.round((m.w + 8) / 80); },
    cryoPods: function (m) { m.n = m.w > 200 ? 3 : 2; },
    reactor: function (m) { m.R = (m.w - 44) / 2; m.cx = m.x + m.w / 2; m.cy = 212; }
  };

  // ---------- drawing toolkit (G = chunk context, P = palette) ----------
  var G = null, P = null, REG = false, LIVE = null;
  function poly(a) { G.beginPath(); G.moveTo(a[0], a[1]); for (var i = 2; i < a.length; i += 2) G.lineTo(a[i], a[i + 1]); G.closePath(); }
  function rrAdd(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    G.moveTo(x + r, y); G.lineTo(x + w - r, y); G.arcTo(x + w, y, x + w, y + r, r);
    G.lineTo(x + w, y + h - r); G.arcTo(x + w, y + h, x + w - r, y + h, r);
    G.lineTo(x + r, y + h); G.arcTo(x, y + h, x, y + h - r, r);
    G.lineTo(x, y + r); G.arcTo(x, y, x + r, y, r); G.closePath();
  }
  function rr(x, y, w, h, r) { G.beginPath(); rrAdd(x, y, w, h, r); }
  function ch(x, y, w, h, c) { poly([x + c, y, x + w - c, y, x + w, y + c, x + w, y + h - c, x + w - c, y + h, x + c, y + h, x, y + h - c, x, y + c]); }
  function topCh(x, y, w, h, c) { poly([x + c, y, x + w - c, y, x + w, y + c, x + w, y + h, x, y + h, x, y + c]); }
  function topRd(x, y, w, h, r) {
    G.beginPath(); G.moveTo(x, y + h); G.lineTo(x, y + r); G.arcTo(x, y, x + r, y, r);
    G.lineTo(x + w - r, y); G.arcTo(x + w, y, x + w, y + r, r); G.lineTo(x + w, y + h); G.closePath();
  }
  function circ(x, y, r) { G.beginPath(); G.arc(x, y, r, 0, TAU); }
  function fill(c) { G.fillStyle = (c instanceof Array) ? css(c) : c; G.fill(); }
  function ink(lw, a) { G.lineWidth = lw || 1.7; G.strokeStyle = css(P.ink, a == null ? 1 : a); G.stroke(); }
  function strk(c, lw) { G.lineWidth = lw; G.strokeStyle = (c instanceof Array) ? css(c) : c; G.stroke(); }
  function line(x0, y0, x1, y1, c, lw) { G.beginPath(); G.moveTo(x0, y0); G.lineTo(x1, y1); strk(c, lw); }
  function rect(x, y, w, h, c) { G.fillStyle = (c instanceof Array) ? css(c) : c; G.fillRect(x, y, w, h); }
  function grad(g, args, from) {
    var n = args.length - from;
    for (var i = 0; i < n; i++) { var c = args[i + from]; g.addColorStop(n === 1 ? 0 : i / (n - 1), typeof c === "string" ? c : css(c)); }
    return g;
  }
  function vg(y0, y1) { return grad(G.createLinearGradient(0, y0, 0, y1), arguments, 2); }
  function hg(x0, x1) { return grad(G.createLinearGradient(x0, 0, x1, 0), arguments, 2); }
  function drop(fn, a, dx, dy) { G.save(); G.translate(dx == null ? 3 : dx, dy == null ? 4 : dy); fn(); G.fillStyle = css(P.ink, a == null ? 0.24 : a); G.fill(); G.restore(); }
  function cut(fn) { G.save(); G.globalCompositeOperation = "destination-out"; fn(); G.fillStyle = "#000"; G.fill(); G.restore(); }
  function pool(cx, cy, rx, ry, col, a) {
    G.save(); G.translate(cx, cy); G.scale(rx / 100, ry / 100);
    var g = G.createRadialGradient(0, 0, 0, 0, 0, 100);
    g.addColorStop(0, css(col, a)); g.addColorStop(0.45, css(col, a * 0.45)); g.addColorStop(1, css(col, 0));
    G.fillStyle = g; G.fillRect(-100, -100, 200, 200); G.restore();
  }
  function bolt(x, y, r) { circ(x, y, r || 1.7); fill(lit(P.metal, 0.4)); ink(0.9, 0.8); }
  var LIVEPH = 0;
  function led(x, y, col, live, r0) {
    circ(x, y, r0 || 1.9); fill(mix(col, P.ink, 0.35)); ink(0.8, 0.7);
    if (live && REG) { LIVEPH = (LIVEPH * 7 + 3) % 11; LIVE.push({ k: "led", x: x, y: y, r: r0 || 1.9, c: css(col), c2: css(col, 0.18), ph: LIVEPH / 11, per: 2300 + LIVEPH * 260 }); }
  }
  // tiny 3x5 digits, crisp
  var DIG = ["111101101101111", "010110010010111", "111001111100111", "111001111001111", "101101111001001", "111100111001111", "111100111101111", "111001001001001", "111101111101111", "111101111001111"];
  function digits(str, x, y, px, col) {
    G.fillStyle = col;
    for (var i = 0; i < str.length; i++) {
      var d = DIG[str.charCodeAt(i) - 48];
      if (!d) continue;
      for (var j = 0; j < 15; j++) if (d.charAt(j) === "1") G.fillRect(x + i * px * 4 + (j % 3) * px, y + Math.floor(j / 3) * px, px, px);
    }
  }

  // ---------- pipes ----------
  function pipeH(x0, x1, y, r, col) {
    rect(x0, y - r - 1, x1 - x0, 2 * r + 2, P.ink);
    G.fillStyle = vg(y - r, y + r, lit(col, 0.36), col, mix(col, P.ink, 0.42)); G.fillRect(x0, y - r, x1 - x0, 2 * r);
    rect(x0, y - r * 0.6, x1 - x0, Math.max(1, r * 0.28), wh(0.2));
  }
  function pipeV(x, y0, y1, r, col) {
    rect(x - r - 1, y0, 2 * r + 2, y1 - y0, P.ink);
    G.fillStyle = hg(x - r, x + r, lit(col, 0.36), col, mix(col, P.ink, 0.42)); G.fillRect(x - r, y0, 2 * r, y1 - y0);
    rect(x - r * 0.6, y0, Math.max(1, r * 0.28), y1 - y0, wh(0.2));
  }
  function collar(x, y, r, col) { rr(x - 3.5, y - r - 2.2, 7, 2 * r + 4.4, 1.5); fill(hg(x - 3.5, x + 3.5, lit(col, 0.3), mix(col, P.ink, 0.2))); ink(1.1); }
  function valve(x, y, R, col) {
    circ(x, y, R); strk(P.ink, 4.6); circ(x, y, R); strk(col, 2.6);
    G.beginPath(); G.moveTo(x - R, y); G.lineTo(x + R, y); G.moveTo(x, y - R); G.lineTo(x, y + R); strk(P.ink, 1.6);
    circ(x, y, 2.6); fill(lit(col, 0.2)); ink(1);
  }

  // ---------- module painters ----------
  var PT = {};

  PT.vent = function (m) {
    var x = m.x, w = m.w, y = 160, h = 40, gw = Math.round(w * 0.64);
    drop(function () { rr(x, y, w, h, 3); });
    rr(x, y, w, h, 3); fill(vg(y, y + h, P.metalHi, P.metal)); ink();
    rr(x + 5, y + 6, gw, h - 12, 2); fill(P.metalDk); ink(1.1, 0.8);
    for (var yy = y + 9.5; yy < y + h - 7; yy += 3.6) rect(x + 7, yy, gw - 4, 1.4, css(P.metal, 0.85));
    var cx = x + gw + 10, cw = w - gw - 15;
    rr(cx, y + 6, cw, h - 12, 2); fill(mix(P.metal, P.ink, 0.18)); ink(1, 0.6);
    led(cx + 6, y + 12.5, P.led, true); led(cx + cw - 6, y + 12.5, P.feat2, false);
    rect(cx + 3.5, y + 20, 6, 4, P.metalHi); rect(cx + cw - 9.5, y + 20, 6, 4, P.metalHi);
    rect(x + 3, y + 1.4, w - 6, 1, wh(0.28));
  };

  PT.panelBox = function (m) {
    var x = m.x, w = m.w, y = 218, h = 70, v = m.s % 3, i;
    drop(function () { rr(x, y, w, h, 3); });
    rr(x, y, w, h, 3); fill(vg(y, y + h, P.metalHi, P.metal)); ink();
    if (v === 1) {
      // intercom: speaker grille, call button, status light
      rr(x + 6, y + 6, w - 12, h - 12, 3); ink(1, 0.4);
      circ(x + w / 2, y + 26, 13); fill(P.metalLo); ink(1.1);
      for (i = -2; i <= 2; i++) rect(x + w / 2 - 9 + Math.abs(i) * 1.5, y + 25 + i * 4, 18 - Math.abs(i) * 3, 1.5, css(P.ink, 0.6));
      rr(x + w / 2 - 7, y + 46, 14, 9, 2); fill(lit(P.metal, 0.4)); ink(1);
      led(x + w / 2, y + 61, P.led, true, 1.6);
      return;
    }
    if (v === 2) {
      // breaker: three toggle switches under a label strip
      rr(x + 6, y + 6, w - 12, 9, 1.5); fill(lit(P.metal, 0.55)); ink(0.9, 0.6);
      for (i = 0; i < 3; i++) {
        var sx = x + (w - 33) / 2 + i * 13;
        rr(sx, y + 22, 7, 22, 2); fill(P.metalDk); ink(1);
        rr(sx + 1.5, y + (i === 1 ? 33 : 24), 4, 9, 1.5); fill(i === 1 ? lit(P.feat2, 0.1) : P.metalHi); ink(0.8);
      }
      for (i = 0; i < 3; i++) rect(x + 9, y + 51 + i * 3.6, w - 18, 1.3, css(P.ink, 0.35));
      led(x + w - 10, y + 10.5, P.led, true, 1.5);
      return;
    }
    rr(x + 5, y + 5, w - 10, h - 10, 2); ink(1, 0.4);
    line(x + 6, y + 6.2, x + w - 6, y + 6.2, wh(0.22), 1);
    rr(x + 10, y + 11, w - 20, 9, 1.5); fill(lit(P.metal, 0.55)); ink(0.9, 0.6);
    rect(x + 13, y + 14, w - 30, 1.2, css(P.ink, 0.45)); rect(x + 13, y + 16.6, w - 36, 1.2, css(P.ink, 0.45));
    rr(x + w - 13, y + 30, 4.5, 18, 2); fill(P.metalLo); ink(0.9);
    led(x + 13, y + 31, P.led, true); led(x + 13, y + 39, P.feat2, false);
    for (var i = 0; i < 3; i++) rect(x + 11, y + 52 + i * 3.6, w - 22, 1.3, css(P.ink, 0.35));
  };

  PT.sign = function (m) {
    var x = m.x, w = m.w, y = 152, h = 22, r = rng(m.s);
    drop(function () { rr(x, y, w, h, 3); }, 0.2);
    rr(x, y, w, h, 3); fill(mix(P.trim, P.ink, 0.3)); ink();
    rr(x + 3, y + 3, w - 6, h - 6, 2); strk(css(P.light, 0.18), 1);
    var n = 10 + Math.floor(r() * 89);
    digits(String(n), x + 9, y + 6, 2, css(CREAM, 0.9));
    rect(x + 9 + 30, y + 10, 8, 2, css(P.led, 0.8));
    G.beginPath(); G.moveTo(x + w - 17, y + 6.5); G.lineTo(x + w - 10.5, y + 11); G.lineTo(x + w - 17, y + 15.5); strk(css(P.led, 0.9), 2);
  };

  function doorFrame(x, y, w, yb, c) {
    drop(function () { topCh(x, y, w, yb - y, c); }, 0.2);
    topCh(x, y, w, yb - y, c); fill(vg(y, yb, P.metalHi, P.metal, P.metalLo)); ink();
  }
  function sill(x, w) { rr(x - 5, BASE - 4, w + 10, 8, 2); fill(vg(BASE - 4, BASE + 4, P.metalHi, P.metal)); ink(1.3); }

  PT.doorway = function (m) {
    var x = m.x, w = m.w, y = 172, yb = BASE + 1, c = 22, ft = 10;
    doorFrame(x, y, w, yb, c);
    var ix = x + ft, iy = y + ft, iw = w - 2 * ft, ih = yb - iy, ic = c - 5;
    var bx0 = ix + iw * 0.27, bx1 = ix + iw * 0.73, by0 = iy + ih * 0.2, by1 = iy + ih * 0.68;
    G.save(); topCh(ix, iy, iw, ih, ic); G.clip();
    rect(ix, iy, iw, ih, mix(P.wallB, P.ink, 0.4));
    poly([ix, iy, ix + iw, iy, bx1, by0, bx0, by0]); fill(mix(P.ceil, P.ink, 0.25));
    poly([ix, iy, bx0, by0, bx0, by1, ix, yb]); fill(mix(P.wallB, P.ink, 0.48));
    poly([ix + iw, iy, ix + iw, yb, bx1, by1, bx1, by0]); fill(mix(P.wallB, P.ink, 0.32));
    poly([ix, yb, ix + iw, yb, bx1, by1, bx0, by1]); fill(vg(by1, yb, mix(P.floorB, P.ink, 0.4), mix(P.floorB, P.ink, 0.12)));
    rect(bx0, by0, bx1 - bx0, by1 - by0, mix(P.wallB, P.ink, 0.22));
    // far door at the end of the side passage
    var dw = (bx1 - bx0) * 0.42, dx = (bx0 + bx1) / 2 - dw / 2;
    rect(dx, by0 + (by1 - by0) * 0.22, dw, (by1 - by0) * 0.78, mix(P.glow, P.wallB, 0.55));
    rect(dx, by0 + (by1 - by0) * 0.22, dw, 1.2, css(P.ink, 0.5));
    // side wall panel lines in perspective
    G.beginPath();
    for (var i = 1; i < 3; i++) {
      var f = i / 3, lx = ix + (bx0 - ix) * f, rx = ix + iw + (bx1 - ix - iw) * f;
      G.moveTo(lx, iy + (by0 - iy) * f); G.lineTo(lx, yb + (by1 - yb) * f);
      G.moveTo(rx, iy + (by0 - iy) * f); G.lineTo(rx, yb + (by1 - yb) * f);
    }
    strk(css(P.ink, 0.35), 1);
    G.beginPath(); G.moveTo(ix, iy); G.lineTo(bx0, by0); G.lineTo(bx1, by0); G.lineTo(ix + iw, iy);
    G.moveTo(ix, yb); G.lineTo(bx0, by1); G.lineTo(bx1, by1); G.lineTo(ix + iw, yb);
    G.moveTo(bx0, by0); G.lineTo(bx0, by1); G.moveTo(bx1, by0); G.lineTo(bx1, by1);
    strk(css(P.ink, 0.55), 1.1);
    // interior ceiling light and its pool on the floor
    var lx0 = ix + iw * 0.36, lx1 = ix + iw * 0.64, ly = iy + (by0 - iy) * 0.45;
    poly([lx0, ly - 2, lx1, ly - 2, lx1 - 3, ly + 2, lx0 + 3, ly + 2]); fill(P.light);
    pool((bx0 + bx1) / 2, yb - 8, iw * 0.45, 22, P.glow, 0.22);
    G.restore();
    topCh(ix, iy, iw, ih, ic); ink(1.5);
    G.beginPath(); G.moveTo(x + 2, yb - 2); G.lineTo(x + 2, y + c); G.lineTo(x + c, y + 2); G.lineTo(x + w - c, y + 2); strk(wh(0.2), 1.1);
    rr(x + 3, y + 40, 4, 26, 2); fill(css(P.led, 0.75));
    sill(x, w);
  };

  PT.blastDoor = function (m) {
    var x = m.x, kw = 20, dw = m.w - kw - 10, y = 166, yb = BASE + 1, c = 18, ft = 11;
    doorFrame(x, y, dw, yb, c);
    var ix = x + ft, iy = y + ft, iw = dw - 2 * ft, ic = c - 6, mx = Math.round(ix + iw / 2);
    var leaf = lit(mix(P.wallT, P.metal, 0.5), 0.08);
    topCh(ix, iy, iw, yb - iy, ic); fill(vg(iy, yb, lit(leaf, 0.08), mix(leaf, P.wallB, 0.45))); ink(1.4);
    var g1 = iy + (yb - iy) * 0.58, g2 = iy + (yb - iy) * 0.82;
    rect(ix + 2, g1, iw - 4, 1.3, css(P.ink, 0.4)); rect(ix + 2, g1 + 1.3, iw - 4, 1, wh(0.14));
    rect(ix + 2, g2, iw - 4, 1.3, css(P.ink, 0.4)); rect(ix + 2, g2 + 1.3, iw - 4, 1, wh(0.14));
    G.beginPath(); G.moveTo(mx, iy); G.lineTo(mx, iy + 58); G.lineTo(mx + 6, iy + 64); G.lineTo(mx + 6, yb); strk(P.ink, 1.7);
    G.beginPath(); G.moveTo(mx + 1.4, iy + 1); G.lineTo(mx + 1.4, iy + 57.4); G.lineTo(mx + 7.4, iy + 63.4); G.lineTo(mx + 7.4, yb); strk(wh(0.16), 1);
    var ww = iw / 2 - 22;
    for (var i = 0; i < 2; i++) {
      var wx = i ? mx + 14 : ix + 9;
      rr(wx, iy + 16, ww, 26, 4); fill(vg(iy + 16, iy + 42, mix(P.space, P.wallB, 0.45), mix(P.space, P.wallB, 0.2))); ink(1.2);
      line(wx + 4, iy + 37, wx + 12, iy + 21, wh(0.16), 2);
    }
    rr(mx - 16, y + 3, 32, 5, 2); fill(css(P.led, 0.85)); ink(1, 0.6);
    rect(x + 2, y + c, 1.2, yb - y - c - 2, wh(0.2));
    var kx = x + dw + 10, ky = 236;
    drop(function () { rr(kx, ky, kw, 36, 3); }, 0.2);
    rr(kx, ky, kw, 36, 3); fill(vg(ky, ky + 36, P.metalHi, P.metal)); ink(1.4);
    led(kx + kw / 2, ky + 7, P.led, true);
    for (var a = 0; a < 3; a++) for (var b2 = 0; b2 < 2; b2++) rect(kx + 5 + b2 * 6.5, ky + 14 + a * 6, 3.5, 3.5, P.metalDk);
    sill(x, dw);
  };

  function glassShade(fn, x, y, w, h) {
    G.save(); fn(); G.clip();
    G.fillStyle = vg(y, y + 22, css(P.ink, 0.45), css(P.ink, 0)); G.fillRect(x, y, w, 22);
    poly([x + w * 0.12, y + h, x + w * 0.12 + h * 0.5, y, x + w * 0.12 + h * 0.5 + 18, y, x + w * 0.12 + 18, y + h]); fill(wh(0.05));
    poly([x + w * 0.12 + 26, y + h, x + w * 0.12 + h * 0.5 + 26, y, x + w * 0.12 + h * 0.5 + 32, y, x + w * 0.12 + 32, y + h]); fill(wh(0.05));
    G.restore();
  }
  PT.viewport = function (m) {
    var x = m.x, w = m.w, y = 140, h = 152, c = 22, g = m.win[0], gc = 14;
    drop(function () { ch(x, y, w, h, c); });
    ch(x, y, w, h, c); fill(vg(y, y + h, P.metalHi, P.metal, P.metalLo)); ink();
    ch(g.x - 4, g.y - 4, g.w + 8, g.h + 8, gc + 2); fill(P.metalDk);
    var gp = function () { ch(g.x, g.y, g.w, g.h, gc); };
    cut(gp); glassShade(gp, g.x, g.y, g.w, g.h);
    var nm = g.w > 200 ? 2 : 1;
    for (var i = 1; i <= nm; i++) {
      var mxx = Math.round(g.x + g.w * i / (nm + 1));
      rect(mxx - 4, g.y, 8, g.h, P.metal); rect(mxx - 4, g.y, 2, g.h, wh(0.18));
      G.beginPath(); G.rect(mxx - 4, g.y, 8, g.h); ink(1.2);
    }
    gp(); ink(1.6);
    G.beginPath(); G.moveTo(x + 2, y + h - c); G.lineTo(x + 2, y + c); G.lineTo(x + c, y + 2); G.lineTo(x + w - c, y + 2); strk(wh(0.22), 1.1);
    rr(x - 5, y + h - 3, w + 10, 8, 2); fill(vg(y + h - 3, y + h + 5, P.metalHi, P.metalLo)); ink(1.3);
  };

  PT.bigWindow = function (m) {
    var x = m.x, w = m.w, y = 116, h = 180, c = 24, g = m.win[0], gc = 16;
    drop(function () { ch(x, y, w, h, c); });
    ch(x, y, w, h, c); fill(vg(y, y + h, P.metalHi, P.metal, P.metalLo)); ink();
    ch(g.x - 4, g.y - 4, g.w + 8, g.h + 8, gc + 2); fill(P.metalDk);
    var gp = function () { ch(g.x, g.y, g.w, g.h, gc); };
    cut(gp);
    G.save(); gp(); G.clip();
    G.fillStyle = vg(g.y + g.h - 60, g.y + g.h, css(P.feat, 0), css(P.feat, 0.16)); G.fillRect(g.x, g.y + g.h - 60, g.w, 60);
    G.restore();
    glassShade(gp, g.x, g.y, g.w, g.h);
    var nm = g.w > 330 ? 3 : 2;
    for (var i = 1; i <= nm; i++) {
      var mxx = Math.round(g.x + g.w * i / (nm + 1));
      rect(mxx - 4.5, g.y, 9, g.h, P.metal); rect(mxx - 4.5, g.y, 2, g.h, wh(0.18));
      G.beginPath(); G.rect(mxx - 4.5, g.y, 9, g.h); ink(1.2);
    }
    rect(g.x, g.y + g.h * 0.3, g.w, 1, wh(0.0));
    gp(); ink(1.6);
    G.beginPath(); G.moveTo(x + 2, y + h - c); G.lineTo(x + 2, y + c); G.lineTo(x + c, y + 2); G.lineTo(x + w - c, y + 2); strk(wh(0.22), 1.1);
    rr(x - 6, y + h - 3, w + 12, 9, 2); fill(vg(y + h - 3, y + h + 6, P.metalHi, P.metalLo)); ink(1.3);
  };

  function port(cx, cy, R, water) {
    drop(function () { circ(cx, cy, R + 13); });
    circ(cx, cy, R + 13); fill(vg(cy - R - 13, cy + R + 13, P.metalHi, P.metal, P.metalLo)); ink();
    circ(cx, cy, R + 4.5); fill(P.metalDk); ink(1.1, 0.6);
    for (var i = 0; i < 8; i++) { var a = i / 8 * TAU + 0.39; bolt(cx + Math.cos(a) * (R + 9), cy + Math.sin(a) * (R + 9), 1.6); }
    var gp = function () { circ(cx, cy, R); };
    if (water) {
      G.save(); gp(); G.clip();
      rect(cx - R, cy - R, 2 * R, 2 * R, vg(cy - R, cy + R, mix(P.feat, P.ink, 0.3), mix(P.feat, P.ink, 0.52), mix(P.feat, P.ink, 0.74)));
      poly([cx - R * 0.2, cy - R, cx + R * 0.05, cy - R, cx - R * 0.5, cy + R, cx - R * 0.85, cy + R]); fill(wh(0.07));
      poly([cx + R * 0.25, cy - R, cx + R * 0.38, cy - R, cx + R * 0.05, cy + R, cx - R * 0.15, cy + R]); fill(wh(0.05));
      var kc = mix(mix(P.feat, [80, 170, 120], 0.55), P.ink, 0.3);
      for (var s2 = 0; s2 < 2; s2++) {
        var kx = cx + (s2 ? R * 0.35 : -R * 0.3);
        G.beginPath(); G.moveTo(kx, cy + R);
        for (var yy = cy + R; yy > cy + R * (s2 ? 0.1 : -0.15); yy -= 5) G.lineTo(kx + Math.sin(yy * 0.16 + s2 * 2) * 3.5, yy);
        strk(P.ink, 4.6); G.stroke(); strk(kc, 2.8);
      }
      G.restore();
      if (REG) LIVE.push({ k: "bub", x: cx - R * 0.7, y: cy - R * 0.7, w: R * 1.4, h: R * 1.4, r: 10, s: (cx * 7) % 9973 });
    } else {
      cut(gp);
      G.save(); gp(); G.clip();
      G.fillStyle = vg(cy - R, cy - R + 26, css(P.ink, 0.5), css(P.ink, 0)); G.fillRect(cx - R, cy - R, 2 * R, 26);
      G.restore();
    }
    G.beginPath(); G.arc(cx, cy, R - 7, 3.6, 4.4); strk(wh(0.16), 3);
    G.beginPath(); G.arc(cx, cy, R - 7, 4.6, 4.75); strk(wh(0.16), 3);
    gp(); ink(1.6);
    G.beginPath(); G.arc(cx, cy, R + 12, 3.4, 4.9); strk(wh(0.2), 1.1);
  }
  PT.portRow = function (m) { for (var i = 0; i < m.n; i++) port(m.ports[i], 210, m.R); };
  PT.porthole = function (m) { port(m.x + 52, 212, 37); };
  PT.aquaPorts = function (m) { for (var i = 0; i < m.n; i++) port(m.ports[i], 210, m.R, true); };

  function screenFace(x, y, w, h, v, r) {
    G.save(); rr(x, y, w, h, 3); G.clip();
    rect(x, y, w, h, vg(y, y + h, mix(P.feat, P.ink, 0.6), mix(P.feat, P.ink, 0.78)));
    G.beginPath();
    for (var gx = x + 12; gx < x + w; gx += 12) { G.moveTo(gx, y); G.lineTo(gx, y + h); }
    for (var gy = y + 10; gy < y + h; gy += 10) { G.moveTo(x, gy); G.lineTo(x + w, gy); }
    strk(css(P.feat, 0.1), 1);
    var i, n;
    if (v === 0) {
      n = 9; G.beginPath();
      for (i = 0; i < n; i++) { var px = x + 6 + (w - 12) * i / (n - 1), py = y + h * (0.28 + 0.48 * r()); if (i) G.lineTo(px, py); else G.moveTo(px, py); }
      strk(css(P.feat, 0.9), 1.6);
      rect(x + 6, y + h - 8, (w - 12) * 0.4, 2.4, css(P.feat2, 0.75));
    } else if (v === 1) {
      n = Math.floor((w - 12) / 10);
      for (i = 0; i < n; i++) { var bh = (h - 18) * (0.25 + 0.7 * r()); rect(x + 7 + i * 10, y + h - 6 - bh, 6, bh, css(i % 4 === 3 ? P.feat2 : P.feat, 0.72)); }
    } else {
      rect(x + 7, y + 7, w * 0.4, 3, css(P.feat2, 0.85));
      for (i = 0; i < 5 && y + 16 + i * 8 < y + h - 6; i++) rect(x + 7, y + 16 + i * 8, (w - 18) * (0.35 + 0.6 * r()), 2.4, css(P.feat, 0.7));
    }
    poly([x + w * 0.55, y, x + w, y, x + w, y + h * 0.45]); fill(wh(0.05));
    G.restore();
    rr(x, y, w, h, 3); ink(1.2);
  }
  PT.screen = function (m) {
    var x = m.x, w = m.w, h = m.h, y = m.y, r = rng(m.s);
    drop(function () { rr(x, y, w, h, 5); });
    rr(x, y, w, h, 5); fill(vg(y, y + h, P.metal, P.metalLo)); ink();
    rect(x + 4, y + 1.6, w - 8, 1, wh(0.22));
    screenFace(x + 6, y + 6, w - 12, h - 15, m.v, r);
    led(x + w - 9, y + h - 4.5, P.led, true, 1.5);
    rect(x + 8, y + h - 5.5, 10, 2, css(P.ink, 0.5));
    if (REG) LIVE.push({ k: "cur", x: x + 12, y: y + h - 21, c: css(P.feat, 0.9) });
  };
  PT.screenWide = function (m) {
    var x = m.x, w = m.w, h = m.h, y = m.y, r = rng(m.s);
    drop(function () { rr(x, y, w, h, 6); });
    rr(x, y, w, h, 6); fill(vg(y, y + h, P.metal, P.metalLo)); ink();
    rect(x + 5, y + 1.6, w - 10, 1, wh(0.22));
    var sw = Math.round((w - 20) * 0.62);
    screenFace(x + 7, y + 7, sw, h - 18, m.v, r);
    screenFace(x + 13 + sw, y + 7, w - 20 - sw, (h - 18) / 2 - 3, 2, r);
    screenFace(x + 13 + sw, y + 7 + (h - 18) / 2 + 3, w - 20 - sw, (h - 18) / 2 - 3, 1, r);
    led(x + w - 10, y + h - 5, P.led, true, 1.5);
    rr(x + w / 2 - 14, y + h, 28, 8, 2); fill(P.metalLo); ink(1.1);
  };

  PT.gauges = function (m) {
    var x = m.x, w = m.w, y = 178, h = 52, r = rng(m.s);
    drop(function () { rr(x, y, w, h, 4); });
    rr(x, y, w, h, 4); fill(vg(y, y + h, P.metalHi, P.metal)); ink();
    bolt(x + 5, y + 5); bolt(x + w - 5, y + 5); bolt(x + 5, y + h - 5); bolt(x + w - 5, y + h - 5);
    for (var i = 0; i < 3; i++) {
      var cx = x + w * (i + 0.5) / 3, cy = y + h / 2, R = i === 1 ? 15 : 12.5;
      circ(cx, cy, R + 3); fill(P.metalLo); ink(1.2);
      circ(cx, cy, R); fill(vg(cy - R, cy + R, lit(P.feat2, 0.35), P.feat2)); ink(1);
      G.beginPath(); G.arc(cx, cy, R * 0.74, 0.25, 0.85); strk(css(P.feat, 0.95), 2.2);
      G.beginPath();
      for (var a = 0; a <= 6; a++) { var an = 2.36 + a * 0.785; G.moveTo(cx + Math.cos(an) * R * 0.62, cy + Math.sin(an) * R * 0.62); G.lineTo(cx + Math.cos(an) * R * 0.86, cy + Math.sin(an) * R * 0.86); }
      strk(css(P.ink, 0.7), 1);
      var na = 2.6 + r() * 3.6;
      line(cx, cy, cx + Math.cos(na) * R * 0.8, cy + Math.sin(na) * R * 0.8, mix(P.feat, P.ink, 0.35), 1.6);
      circ(cx, cy, 2); fill(P.ink);
    }
  };

  PT.boiler = function (m) {
    var x = m.x, w = m.w, y = 176, h = 84, r = rng(m.s), body = mix(P.metal, P.wallT, 0.2);
    for (var s = 0; s < 2; s++) {
      var sx = x + w * (s ? 0.76 : 0.24) - 10;
      drop(function () { rr(sx, y + h - 14, 20, 40, 3); }, 0.2);
      rr(sx, y + h - 14, 20, 40, 3); fill(vg(y + h, y + h + 26, P.metalLo, P.metalDk)); ink(1.4);
      rect(sx - 4, y + h + 22, 28, 5, P.metalLo); G.beginPath(); G.rect(sx - 4, y + h + 22, 28, 5); ink(1.1);
    }
    var sp = x + w * 0.62;
    pipeV(sp, 146, y + 4, 5, P.metal);
    rr(sp - 9, 142, 18, 7, 2); fill(P.metalHi); ink(1.1);
    drop(function () { rr(x, y, w, h, h / 2); });
    rr(x, y, w, h, h / 2); fill(vg(y, y + h, lit(body, 0.3), lit(body, 0.12), body, mix(body, P.ink, 0.45))); ink();
    rect(x + 24, y + h * 0.2, w - 48, 2, wh(0.22));
    var bands = [x + 26, x + w - 30];
    if (w > 210) bands.push(x + w * 0.45);
    for (var i = 0; i < bands.length; i++) {
      var bx = bands[i];
      rr(bx, y - 1, 7, h + 2, 2); fill(vg(y, y + h, lit(P.metal, 0.35), P.metal, mix(P.metal, P.ink, 0.45))); ink(1.2);
      for (var j = 0; j < 4; j++) bolt(bx + 3.5, y + 12 + j * (h - 24) / 3, 1.3);
    }
    var gx = x + w * 0.5 + (w > 210 ? 22 : 0), gy = y + h * 0.48;
    circ(gx, gy, 14); fill(P.metalLo); ink(1.2);
    circ(gx, gy, 11); fill(vg(gy - 11, gy + 11, lit(P.feat2, 0.3), P.feat2)); ink(1);
    G.beginPath(); G.arc(gx, gy, 8, 0.3, 0.9); strk(css(P.feat, 0.95), 2);
    var na = 3 + r() * 2.6; line(gx, gy, gx + Math.cos(na) * 8.5, gy + Math.sin(na) * 8.5, P.ink, 1.5);
    rr(x + w * 0.2, y + h * 0.58, 30, 12, 2); fill(lit(P.feat2, 0.1)); ink(1);
    rect(x + w * 0.2 + 5, y + h * 0.58 + 4, 20, 1.4, css(P.ink, 0.5)); rect(x + w * 0.2 + 5, y + h * 0.58 + 7, 13, 1.4, css(P.ink, 0.5));
    led(x + w - 44, y + h * 0.3, P.led, true);
  };

  function vial(x, yb, kind, col) {
    if (kind === 0) {
      rr(x, yb - 24, 7, 24, 3.5); fill(css(lit(col, 0.6), 0.55)); ink(0.9);
      rr(x + 0.8, yb - 13, 5.4, 12.2, 2.7); fill(col);
      rect(x - 1, yb - 26, 9, 3, P.metalLo);
      return 9;
    }
    if (kind === 1) {
      G.beginPath(); G.moveTo(x + 6, yb - 26); G.lineTo(x + 6, yb - 17); G.lineTo(x, yb - 2); G.quadraticCurveTo(x, yb, x + 2, yb);
      G.lineTo(x + 16, yb); G.quadraticCurveTo(x + 18, yb, x + 18, yb - 2); G.lineTo(x + 12, yb - 17); G.lineTo(x + 12, yb - 26); G.closePath();
      fill(css(lit(col, 0.6), 0.5)); ink(0.9);
      poly([x + 2.6, yb - 7, x + 15.4, yb - 7, x + 17, yb - 1.2, x + 1, yb - 1.2]); fill(col);
      return 20;
    }
    if (kind === 2) {
      rr(x, yb - 19, 12, 19, 3); fill(col); ink(0.9);
      rr(x + 3, yb - 23, 6, 4.5, 1); fill(P.metalLo); ink(0.8);
      rect(x + 2.5, yb - 15, 1.4, 10, wh(0.35));
      return 14;
    }
    for (var i = 0; i < 3; i++) { rr(x, yb - 4 - i * 4.4, 17, 4, 2); fill(css(lit(col, 0.45 - i * 0.1), 0.9)); ink(0.8); }
    return 19;
  }
  PT.sampleCase = function (m) {
    var x = m.x, w = m.w, y = 164, h = 116, r = rng(m.s), ft = 8;
    drop(function () { rr(x, y, w, h, 5); });
    rr(x, y, w, h, 5); fill(vg(y, y + h, P.metalHi, P.metal)); ink();
    var ix = x + ft, iy = y + ft, iw = w - 2 * ft, ih = h - 2 * ft;
    G.save(); rr(ix, iy, iw, ih, 3); G.clip();
    rect(ix, iy, iw, ih, vg(iy, iy + ih, lit(mix(P.wallT, P.glow, 0.45), 0.18), mix(P.wallB, P.ink, 0.3)));
    rect(ix + 6, iy, iw - 12, 4, P.light);
    pool(ix + iw / 2, iy + 4, iw * 0.5, 50, P.glow, 0.22);
    var cols = [P.feat2, P.feat, P.led, lit(P.feat2, 0.2)];
    for (var s = 0; s < 2; s++) {
      var sy = s ? iy + ih - 5 : Math.round(iy + ih * 0.5);
      var px = ix + 6 + r() * 6;
      while (px < ix + iw - 22) {
        if (r() < 0.82) px += vial(px, sy, Math.floor(r() * 4), cols[Math.floor(r() * cols.length)]) + 4 + r() * 5;
        else px += 12;
      }
      rect(ix, sy, iw, 5, P.metal); G.beginPath(); G.rect(ix - 1, sy, iw + 2, 5); ink(1);
      rect(ix, sy, iw, 1, wh(0.25));
    }
    poly([ix + iw * 0.6, iy, ix + iw * 0.6 + 16, iy, ix + iw * 0.6 - 30, iy + ih, ix + iw * 0.6 - 46, iy + ih]); fill(wh(0.07));
    G.restore();
    rr(ix, iy, iw, ih, 3); ink(1.4);
    rect(x + 4, y + 1.6, w - 8, 1, wh(0.22));
  };

  PT.holoRing = function (m) {
    var x = m.x, w = m.w, cx = x + w / 2, cy = 206, R = w / 2 - 5;
    drop(function () { circ(cx, cy, R + 4); });
    circ(cx, cy, R + 4); fill(vg(cy - R, cy + R, P.metalHi, P.metal, P.metalLo)); ink();
    circ(cx, cy, R - 5); fill(vg(cy - R, cy + R, mix(P.feat, P.ink, 0.66), mix(P.feat, P.ink, 0.8))); ink(1.2);
    G.beginPath(); G.arc(cx, cy, R * 0.78, 0.3, 2.4); strk(css(P.feat, 0.8), 2);
    G.beginPath(); G.arc(cx, cy, R * 0.78, 2.9, 4.6); strk(css(P.feat, 0.8), 2);
    G.beginPath(); G.arc(cx, cy, R * 0.52, 1.2, 5.6); strk(css(P.feat2, 0.75), 2);
    G.beginPath();
    for (var i = 0; i < 24; i++) { var a = i / 24 * TAU; G.moveTo(cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8)); G.lineTo(cx + Math.cos(a) * (R - 11), cy + Math.sin(a) * (R - 11)); }
    strk(css(P.feat, 0.4), 1);
    circ(cx, cy, 5); fill(lit(P.feat, 0.3)); ink(1);
    G.beginPath(); G.arc(cx, cy, R + 1, 3.5, 4.6); strk(wh(0.25), 1.2);
    rr(cx - 12, cy + R + 3, 24, 8, 2); fill(P.metalLo); ink(1.1);
    if (REG) LIVE.push({ k: "holo", x: cx, y: cy, r: R * 0.32, c: css(P.feat, 0.6) });
  };

  function leaf(x, y, L, ang, col) {
    G.save(); G.translate(x, y); G.rotate(ang);
    G.beginPath(); G.moveTo(0, 0); G.quadraticCurveTo(L * 0.45, -L * 0.42, L, 0); G.quadraticCurveTo(L * 0.45, L * 0.42, 0, 0); G.closePath();
    fill(col); ink(0.9, 0.85);
    line(1.5, 0, L * 0.75, 0, css(P.ink, 0.3), 0.8);
    G.restore();
  }
  function plant(x, yb, H, r) {
    var lean = (r() - 0.5) * 8, cA = lit(P.feat, 0.12), cB = mix(P.feat, P.ink, 0.22), cC = mix(P.feat, [190, 220, 120], 0.25);
    G.beginPath(); G.moveTo(x, yb); G.quadraticCurveTo(x, yb - H * 0.5, x + lean, yb - H); strk(mix(P.feat, P.ink, 0.45), 1.7);
    var n = 3 + Math.floor(r() * 3);
    for (var i = 0; i < n; i++) {
      var f = 0.3 + 0.7 * (i + 1) / n, side = i % 2 ? 1 : -1, lx = x + lean * f * f;
      var ang = side > 0 ? -0.35 - r() * 0.5 : Math.PI + 0.35 + r() * 0.5;
      leaf(lx, yb - H * f, 10 + r() * 6, ang, [cA, cB, cC][Math.floor(r() * 3)]);
    }
    leaf(x + lean, yb - H, 9 + r() * 4, -Math.PI / 2 + (r() - 0.5) * 0.6, cA);
  }
  PT.plantBed = function (m) {
    var x = m.x, w = m.w, y = 178, h = 118, r = rng(m.s), ft = 9;
    drop(function () { rr(x, y, w, h, 6); });
    rr(x, y, w, h, 6); fill(vg(y, y + h, P.metalHi, P.metal, P.metalLo)); ink();
    var ix = x + ft, iy = y + ft, iw = w - 2 * ft, ih = h - 2 * ft;
    G.save(); rr(ix, iy, iw, ih, 3); G.clip();
    rect(ix, iy, iw, ih, vg(iy, iy + ih, mix(P.feat2, P.wallB, 0.3), mix(P.wallB, P.ink, 0.35)));
    G.beginPath();
    for (var sx = ix + 16; sx < ix + iw; sx += 16) { G.moveTo(sx, iy + 6); G.lineTo(sx, iy + ih); }
    strk(css(P.ink, 0.12), 1);
    rect(ix, iy, iw, 5, lit(P.feat2, 0.55)); rect(ix, iy + 5, iw, 1.2, css(P.ink, 0.5));
    pool(ix + iw / 2, iy + 6, iw * 0.6, 60, P.feat2, 0.2);
    var sy = iy + ih - 15;
    var px = ix + 10 + r() * 6;
    while (px < ix + iw - 8) { plant(px, sy + 2, 26 + r() * 38, r); px += 17 + r() * 9; }
    rect(ix, sy, iw, 15, vg(sy, sy + 15, mix(P.trim, [92, 64, 48], 0.55), mix(P.trim, [60, 42, 34], 0.6)));
    rect(ix, sy, iw, 1.4, css(P.ink, 0.6));
    poly([ix + iw * 0.7, iy, ix + iw * 0.7 + 18, iy, ix + iw * 0.7 - 34, iy + ih, ix + iw * 0.7 - 52, iy + ih]); fill(wh(0.07));
    G.restore();
    rr(ix, iy, iw, ih, 3); ink(1.4);
    rect(x + 4, y + 1.6, w - 8, 1, wh(0.22));
    var tx = x + w / 2 - 18;
    rr(tx, y + h + 7, 36, 11, 2); fill(lit(P.metal, 0.15)); ink(1.1);
    led(tx + 7, y + h + 12.5, P.led, true, 1.5);
    rect(tx + 13, y + h + 11.5, 17, 1.4, css(P.ink, 0.45));
  };

  PT.planter = function (m) {
    var x = m.x, w = m.w, y = 144, h = 158, r = rng(m.s);
    drop(function () { rr(x + 8, y, w - 16, h, 6); }, 0.2);
    rr(x + 14, y + 6, w - 28, h - 12, 4); fill(P.metalDk);
    var tx = x + 9, tw = w - 18, ty = y + 14, th = h - 30;
    G.save(); rr(tx, ty, tw, th, 6); G.clip();
    rect(tx, ty, tw, th, vg(ty, ty + th, mix(P.feat2, P.wallB, 0.45), mix(P.wallB, P.ink, 0.3)));
    var cx = tx + tw / 2;
    G.beginPath(); G.moveTo(cx, ty + th);
    for (var yy = ty + th; yy > ty + 6; yy -= 6) G.lineTo(cx + Math.sin(yy * 0.12) * 4, yy);
    strk(mix(P.feat, P.ink, 0.45), 1.6);
    for (var i = 0; i < 8; i++) {
      var ly = ty + th - 10 - i * (th - 18) / 8, side = i % 2 ? 1 : -1;
      leaf(cx + Math.sin(ly * 0.12) * 4, ly, 10 + r() * 3, side > 0 ? -0.4 : Math.PI + 0.4, i % 3 ? lit(P.feat, 0.1) : mix(P.feat, P.ink, 0.2));
    }
    rect(tx + 4, ty, 2, th, wh(0.25));
    G.restore();
    rr(tx, ty, tw, th, 6); ink(1.4);
    rr(x + 4, y, w - 8, 16, 4); fill(vg(y, y + 16, P.metalHi, P.metal)); ink(1.4);
    rr(x + 4, y + h - 18, w - 8, 18, 4); fill(vg(y + h - 18, y + h, P.metal, P.metalLo)); ink(1.4);
    led(x + w / 2, y + h - 9, P.led, true, 1.6);
  };

  PT.level = function (m) {
    var x = m.x, w = m.w, y = 160, h = 146;
    drop(function () { rr(x, y, w, h, 5); }, 0.2);
    rr(x, y, w, h, 5); fill(vg(y, y + h, P.metalHi, P.metal)); ink();
    var tx = x + 9, tw = 12, ty = y + 10, th = h - 20;
    rr(tx, ty, tw, th, 6); fill(mix(P.space, P.wallB, 0.4));
    var lv = ty + th * 0.38;
    G.save(); rr(tx, ty, tw, th, 6); G.clip();
    rect(tx, lv, tw, th, vg(lv, ty + th, lit(P.feat, 0.15), mix(P.feat, P.ink, 0.3)));
    rect(tx, lv, tw, 1.4, lit(P.feat2, 0.3));
    rect(tx + 2.5, ty, 1.6, th, wh(0.3));
    G.restore();
    rr(tx, ty, tw, th, 6); ink(1.2);
    G.beginPath();
    for (var i = 0; i < 9; i++) { var yy = ty + 10 + i * (th - 20) / 8; G.moveTo(x + w - 7, yy); G.lineTo(x + w - (i % 2 ? 4.5 : 3), yy); }
    strk(css(P.ink, 0.6), 1);
  };

  PT.thermo = function (m) {
    var x = m.x, w = m.w, y = 170, h = 130;
    drop(function () { rr(x, y, w, h, 6); }, 0.2);
    rr(x, y, w, h, 6); fill(vg(y, y + h, P.metalHi, P.metal)); ink();
    var tx = x + 11, ty = y + 10, th = h - 36;
    rr(tx, ty, 8, th, 4); fill(lit(P.feat, 0.6)); ink(1);
    rr(tx + 1.5, ty + th * 0.55, 5, th * 0.45 + 2, 2.5); fill(P.feat);
    circ(tx + 4, y + h - 15, 8); fill(vg(y + h - 23, y + h - 7, lit(P.feat, 0.2), mix(P.feat, P.ink, 0.15))); ink(1.2);
    circ(tx + 1.5, y + h - 17.5, 2); fill(wh(0.5));
    G.beginPath();
    for (var i = 0; i < 7; i++) { var yy = ty + 6 + i * (th - 12) / 6; G.moveTo(x + 4, yy); G.lineTo(x + (i % 2 ? 7 : 9), yy); }
    strk(css(P.ink, 0.6), 1);
  };

  PT.cryoPods = function (m) {
    var r = rng(m.s), y = 148, ph = 184, pw = 66;
    for (var i = 0; i < m.n; i++) {
      var px = m.x + i * 80;
      drop(function () { rr(px, y, pw, ph, 33); }, 0.2);
      rr(px, y, pw, ph, 33); fill(vg(y, y + ph, P.metalHi, P.metal, P.metalLo)); ink();
      rr(px + 6, y + 6, pw - 12, ph - 12, 27); fill(vg(y, y + ph, P.recess, mix(P.recess, P.ink, 0.3))); ink(1.1, 0.7);
      var gx = px + 11, gy = y + 14, gw = pw - 22, gh = ph - 46;
      G.save(); rr(gx, gy, gw, gh, gw / 2); G.clip();
      rect(gx, gy, gw, gh, vg(gy, gy + gh, lit(P.feat, 0.4), mix(P.feat, P.wallB, 0.35), mix(P.feat, P.wallB, 0.75), mix(P.wallB, P.ink, 0.25)));
      pool(gx + gw / 2, gy + gh * 0.28, gw * 0.55, gh * 0.25, WHITE, 0.2);
      G.beginPath();
      for (var f = 0; f < 6; f++) {
        var fx = gx + (f % 2 ? gw - 5 - r() * 6 : 5 + r() * 6), fy = gy + 24 + r() * (gh * 0.45), fl = 3 + r() * 3;
        G.moveTo(fx - fl, fy); G.lineTo(fx + fl, fy); G.moveTo(fx, fy - fl); G.lineTo(fx, fy + fl);
        G.moveTo(fx - fl * 0.7, fy - fl * 0.7); G.lineTo(fx + fl * 0.7, fy + fl * 0.7);
      }
      strk(wh(0.45), 0.9);
      rect(gx + 7, gy + 22, 2.4, gh * 0.4, wh(0.3));
      G.restore();
      rr(gx, gy, gw, gh, gw / 2); ink(1.4);
      var by = y + ph - 30;
      rr(px + 12, by, pw - 24, 14, 3); fill(P.metalLo); ink(1.1);
      led(px + 20, by + 7, P.led, i === 1 || m.n === 2, 1.5); led(px + 28, by + 7, P.led, false, 1.5); led(px + 36, by + 7, P.feat2, false, 1.5);
    }
  };

  PT.cabinDoor = function (m) {
    var r = rng(m.s), x = m.x, dw = m.w - 22, y = 180, yb = BASE + 1, R = 18;
    var cols = [mix(P.feat, P.wallB, 0.25), mix(P.feat2, P.wallB, 0.3), lit(mix(P.trim, P.wallT, 0.5), 0.05)];
    var dc = cols[Math.floor(r() * 3)];
    var nx = x + dw / 2 - 19;
    drop(function () { rr(nx, 158, 38, 15, 3); }, 0.2);
    rr(nx, 158, 38, 15, 3); fill(mix(P.trim, P.ink, 0.35)); ink(1.3);
    digits(String(100 + Math.floor(r() * 4) * 100 + Math.floor(r() * 40)), nx + 8, 160.5, 2, css(CREAM, 0.9));
    drop(function () { topRd(x, y, dw, yb - y, R); }, 0.2);
    topRd(x, y, dw, yb - y, R); fill(vg(y, yb, P.metalHi, P.metal, P.metalLo)); ink();
    var lx = x + 8, ly = y + 8, lw = dw - 16;
    topRd(lx, ly, lw, yb - ly, R - 7); fill(vg(ly, yb, lit(dc, 0.12), dc, mix(dc, P.ink, 0.25))); ink(1.4);
    rr(lx + 8, ly + 56, lw - 16, yb - ly - 70, 4); ink(1, 0.35);
    rect(lx + 9, ly + 57, lw - 18, 1, wh(0.15));
    var px = lx + lw / 2, py = ly + 28;
    circ(px, py, 13); fill(P.metal); ink(1.3);
    circ(px, py, 9.5); fill(vg(py - 9, py + 9, lit(P.glow, 0.2), mix(P.glow, P.wallB, 0.55))); ink(1.1);
    G.beginPath(); G.arc(px, py, 6.5, 3.6, 4.6); strk(wh(0.45), 1.6);
    rr(lx + lw - 14, ly + 92, 5, 24, 2.5); fill(P.metalHi); ink(1.1);
    rect(x + 2, y + R, 1.2, yb - y - R - 2, wh(0.2));
    var bx = x + dw + 8;
    drop(function () { rr(bx, 236, 14, 28, 3); }, 0.2);
    rr(bx, 236, 14, 28, 3); fill(vg(236, 264, P.metalHi, P.metal)); ink(1.3);
    led(bx + 7, 243, P.led, true, 1.7);
    circ(bx + 7, 255, 3); fill(P.metalLo); ink(0.9);
    sill(x, dw);
  };

  PT.notice = function (m) {
    var x = m.x, w = m.w, y = 200, h = 58, r = rng(m.s);
    var wood = mix(P.trim, [150, 108, 70], 0.4), cork = mix([200, 164, 116], P.wallT, 0.3);
    drop(function () { rr(x, y, w, h, 3); });
    rr(x, y, w, h, 3); fill(vg(y, y + h, lit(wood, 0.1), wood)); ink();
    rr(x + 5, y + 5, w - 10, h - 10, 2); fill(cork); ink(1, 0.6);
    var cols = [CREAM, lit(P.feat, 0.45), lit(P.feat2, 0.45), lit(GOLD, 0.35), lit(P.led, 0.5)];
    var nx = x + 9;
    while (nx < x + w - 24) {
      var nw = 14 + r() * 7, nh = 13 + r() * 9, ny = y + 9 + r() * (h - 22 - nh), a = (r() - 0.5) * 0.2;
      G.save(); G.translate(nx + nw / 2, ny + nh / 2); G.rotate(a);
      G.beginPath(); G.rect(-nw / 2, -nh / 2, nw, nh); fill(cols[Math.floor(r() * cols.length)]); ink(0.9, 0.8);
      rect(-nw / 2 + 3, -nh / 2 + 5, nw - 6, 1.1, css(P.ink, 0.3)); rect(-nw / 2 + 3, -nh / 2 + 8, nw - 9, 1.1, css(P.ink, 0.3));
      circ(0, -nh / 2 + 2, 1.6); fill(P.feat2);
      G.restore();
      nx += nw + 4 + r() * 4;
    }
  };

  PT.lamp = function (m) {
    var cx = m.x + 15, y = 186;
    rr(cx - 6, y + 20, 12, 22, 3); fill(vg(y + 20, y + 42, P.metalHi, P.metal)); ink(1.3);
    rr(cx - 2, y + 15, 4, 8, 1); fill(P.metalLo); ink(0.9);
    poly([cx - 13, y, cx + 13, y, cx + 8, y + 16, cx - 8, y + 16]); fill(vg(y, y + 16, lit(P.light, 0.0), mix(P.light, P.glow, 0.5))); ink(1.4);
    rect(cx - 12, y - 1.5, 24, 2.2, P.light);
    line(cx - 9, y + 3, cx - 6, y + 13, wh(0.5), 1.2);
  };
  PT.lamp.glow = function (m) {
    // two clean washes of light, up the wall and a short one down: no blobby halo
    var cx = m.x + 15, y = 186;
    poly([cx - 13, y, cx + 13, y, cx + 32, y - 62, cx - 32, y - 62]); fill(vg(y - 62, y, css(P.glow, 0), css(P.glow, 0.24)));
    poly([cx - 8, y + 16, cx + 8, y + 16, cx + 17, y + 44, cx - 17, y + 44]); fill(vg(y + 16, y + 44, css(P.glow, 0.14), css(P.glow, 0)));
  };

  PT.racks = function (m) {
    var r = rng(m.s), y = 136, yb = 332;
    for (var i = 0; i < m.n; i++) {
      var rx = m.x + i * 80, rw = 72;
      drop(function () { rr(rx, y, rw, yb - y, 4); }, 0.2);
      rr(rx, y, rw, yb - y, 4); fill(vg(y, yb, P.metalHi, P.metal, P.metalLo)); ink();
      for (var v = 0; v < 6; v++) rect(rx + 10 + v * 9, y + 5, 5, 4, P.metalDk);
      var ix = rx + 6, iy = y + 14, iw = rw - 12, ih = yb - y - 22;
      rr(ix, iy, iw, ih, 2); fill(mix(P.wallB, P.ink, 0.62)); ink(1.1);
      for (var uy = iy + 4; uy + 11 < iy + ih - 2; uy += 13) {
        var kind = r();
        rr(ix + 3, uy, iw - 6, 10.5, 1.5); fill(mix(P.metal, P.ink, kind < 0.2 ? 0.45 : 0.22)); ink(0.8, 0.8);
        if (kind < 0.2) continue;
        G.beginPath();
        for (var gx = ix + iw - 20; gx < ix + iw - 6; gx += 3) { G.moveTo(gx, uy + 2.5); G.lineTo(gx, uy + 8); }
        strk(css(P.ink, 0.5), 1);
        var c1 = kind < 0.75 ? P.led : P.feat2;
        led(ix + 9, uy + 5.2, c1, r() < 0.22, 1.5);
        led(ix + 15, uy + 5.2, kind < 0.5 ? P.led : mix(P.led, P.ink, 0.3), false, 1.5);
        rect(ix + 21, uy + 4.5, 12 + r() * 10, 1.4, css(P.feat, 0.25));
      }
      G.save(); rr(ix, iy, iw, ih, 2); G.clip();
      poly([ix + iw * 0.55, iy, ix + iw * 0.55 + 12, iy, ix - 20, iy + ih * 0.8, ix - 32, iy + ih * 0.8]); fill(wh(0.05));
      G.restore();
      rr(rx + rw - 5, y + 120, 2.4, 40, 1.2); fill(P.metalHi);
    }
  };

  function core(x, yb, bright) {
    var c = bright ? mix(P.feat, P.recess, 0.12) : mix(P.feat, P.recess, 0.62);
    rr(x, yb - 22, 9, 22, 2.5); fill(vg(yb - 22, yb, lit(c, 0.35), mix(c, P.ink, 0.15))); ink(0.9);
    rect(x, yb - 22, 9, 4, P.metalDk); rect(x + 2, yb - 16, 1.4, 13, wh(bright ? 0.45 : 0.18));
  }
  PT.dataShelf = function (m) {
    var x = m.x, w = m.w, y = 148, yb = 322, R = 28, r = rng(m.s);
    drop(function () { topRd(x, y, w, yb - y, R); });
    topRd(x, y, w, yb - y, R); fill(vg(y, yb, P.metalHi, P.metal, P.metalLo)); ink();
    var ix = x + 8, iy = y + 8, iw = w - 16, ih = yb - y - 14;
    G.save(); topRd(ix, iy, iw, ih, R - 7); G.clip();
    rect(ix, iy, iw, ih, vg(iy, iy + ih, mix(P.feat, P.recess, 0.62), P.recess, mix(P.recess, P.ink, 0.25)));
    pool(ix + iw / 2, iy + 10, iw * 0.6, 70, P.glow, 0.2);
    for (var j = 0; j < 4; j++) {
      var sy = iy + 46 + j * 37;
      var n = Math.floor((iw - 10) / 13), off = ix + (iw - n * 13 + 4) / 2;
      for (var c = 0; c < n; c++) if (r() < 0.88) core(off + c * 13, sy, r() < (j < 2 ? 0.7 : 0.18));   // lower shelves stay dim
      rect(ix, sy, iw, 4, P.feat2); G.beginPath(); G.rect(ix - 1, sy, iw + 2, 4); ink(0.9);
      rect(ix, sy, iw, 1, wh(0.3));
    }
    poly([ix + iw * 0.65, iy, ix + iw * 0.65 + 14, iy, ix + iw * 0.65 - 40, iy + ih, ix + iw * 0.65 - 54, iy + ih]); fill(wh(0.05));
    G.restore();
    topRd(ix, iy, iw, ih, R - 7); ink(1.4);
    G.beginPath(); G.moveTo(x + 2, yb - 2); G.lineTo(x + 2, y + R); G.arcTo(x + 2, y + 2, x + R, y + 2, R - 2); G.lineTo(x + w - R, y + 2); strk(wh(0.2), 1.1);
    rect(x + w / 2 - 10, y + 2, 20, 3, css(P.feat2, 0.9));
  };

  PT.art = function (m) {
    var x = m.x, w = m.w, h = m.h, y = m.y, fr = mix(P.metal, GOLD, 0.35), bg = mix(P.wallT, CREAM, 0.55);
    drop(function () { G.beginPath(); G.rect(x, y, w, h); });
    G.beginPath(); G.rect(x, y, w, h); fill(vg(y, y + h, lit(fr, 0.2), fr)); ink();
    rect(x + 6, y + 6, w - 12, h - 12, lit(bg, 0.1));
    var ax = x + 12, ay = y + 12, aw = w - 24, ah = h - 24;
    G.save(); G.beginPath(); G.rect(ax, ay, aw, ah); G.clip();
    rect(ax, ay, aw, ah, bg);
    if (m.v === 0) {
      circ(ax + aw * 0.62, ay + ah * 0.42, ah * 0.3); fill(mix(P.feat, bg, 0.25));
      rect(ax, ay + ah * 0.66, aw, ah * 0.12, mix(P.feat2, bg, 0.25));
      circ(ax + aw * 0.26, ay + ah * 0.3, ah * 0.1); fill(mix(GOLD, bg, 0.2));
    } else if (m.v === 1) {
      var bw = aw / 5;
      rect(ax + bw * 0.6, ay + ah * 0.35, bw, ah * 0.65, mix(P.feat, bg, 0.2));
      rect(ax + bw * 2, ay + ah * 0.15, bw, ah * 0.85, mix(P.feat2, bg, 0.2));
      rect(ax + bw * 3.4, ay + ah * 0.5, bw, ah * 0.5, mix(GOLD, bg, 0.25));
    } else if (m.v === 3) {
      rect(ax, ay + ah * 0.62, aw, ah * 0.38, mix(P.feat2, bg, 0.3));
      G.beginPath(); G.arc(ax + aw * 0.5, ay + ah * 0.62, ah * 0.3, Math.PI, 0); G.closePath(); fill(mix(GOLD, bg, 0.15));
      for (var k = 0; k < 3; k++) rect(ax + aw * 0.2, ay + ah * (0.7 + k * 0.09), aw * 0.6 - k * aw * 0.12, ah * 0.035, mix(GOLD, bg, 0.35));
    } else if (m.v === 4) {
      rect(ax, ay, aw, ah, mix(P.feat2, bg, 0.55));
      G.beginPath(); G.moveTo(ax, ay + ah); G.lineTo(ax + aw * 0.35, ay + ah * 0.4); G.lineTo(ax + aw * 0.55, ay + ah * 0.7); G.lineTo(ax + aw * 0.75, ay + ah * 0.3); G.lineTo(ax + aw, ay + ah); G.closePath(); fill(mix(P.feat, bg, 0.25));
      circ(ax + aw * 0.2, ay + ah * 0.25, ah * 0.09); fill(CREAM);
    } else {
      for (var i = 0; i < 3; i++) {
        G.beginPath(); G.moveTo(ax, ay + ah * (0.35 + i * 0.2));
        G.bezierCurveTo(ax + aw * 0.3, ay + ah * (0.15 + i * 0.2), ax + aw * 0.6, ay + ah * (0.55 + i * 0.2), ax + aw, ay + ah * (0.3 + i * 0.2));
        strk(mix([P.feat, P.feat2, GOLD][i], bg, 0.15), 3);
      }
      circ(ax + aw * 0.75, ay + ah * 0.25, ah * 0.12); fill(mix(P.feat, bg, 0.2));
    }
    G.restore();
    G.beginPath(); G.rect(ax, ay, aw, ah); ink(1);
    G.beginPath(); G.rect(x + 6, y + 6, w - 12, h - 12); ink(0.9, 0.5);
    rect(x + 2, y + 2, w - 4, 1, wh(0.3));
  };

  PT.reactor = function (m) {
    var cx = m.cx, cy = m.cy, R = m.R, x = m.x, w = m.w, top = cy - R - 22, h = 2 * R + 44;
    drop(function () { ch(x, top, w, h, 30); });
    ch(x, top, w, h, 30); fill(vg(top, top + h, P.metalHi, P.metal, P.metalLo)); ink();
    bolt(x + 14, top + 14, 2); bolt(x + w - 14, top + 14, 2); bolt(x + 14, top + h - 14, 2); bolt(x + w - 14, top + h - 14, 2);
    G.beginPath(); G.moveTo(x + 2, top + h - 30); G.lineTo(x + 2, top + 30); G.lineTo(x + 30, top + 2); G.lineTo(x + w - 30, top + 2); strk(wh(0.22), 1.1);
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * TAU + 0.39;
      G.save(); G.translate(cx + Math.cos(a) * (R + 11), cy + Math.sin(a) * (R + 11)); G.rotate(a);
      G.beginPath(); G.rect(-6, -7, 12, 14); fill(P.metalLo); ink(1.1);
      G.restore();
    }
    circ(cx, cy, R + 9); fill(vg(cy - R, cy + R, P.metalHi, P.metal, P.metalDk)); ink();
    var g = G.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, css(P.feat)); g.addColorStop(0.2, css(mix(P.feat, P.ink, 0.18))); g.addColorStop(0.46, css(mix(P.feat, P.ink, 0.3))); g.addColorStop(0.75, css(mix(P.feat, P.ink, 0.58))); g.addColorStop(1, css(mix(P.feat, P.ink, 0.74)));
    circ(cx, cy, R); fill(g);
    G.beginPath(); G.arc(cx, cy, R * 0.74, 0, TAU); strk(css(P.ink, 0.42), 2.2);
    G.beginPath(); G.arc(cx, cy, R * 0.44, 0, TAU); strk(css(P.ink, 0.42), 2);
    G.beginPath();
    for (var s = 0; s < 6; s++) { var sa = s / 6 * TAU; G.moveTo(cx + Math.cos(sa) * R * 0.44, cy + Math.sin(sa) * R * 0.44); G.lineTo(cx + Math.cos(sa) * R * 0.74, cy + Math.sin(sa) * R * 0.74); }
    strk(css(P.ink, 0.42), 2);
    circ(cx, cy, R * 0.2); fill(lit(P.feat, 0.08)); ink(1.3);
    G.beginPath(); G.arc(cx, cy, R - 8, 3.7, 4.5); strk(wh(0.2), 4);
    circ(cx, cy, R); ink(1.7);
    if (REG) LIVE.push({ k: "ring", x: cx, y: cy, r: R, c: css(mix(P.feat, P.feat2, 0.3), 0.4), g: css(P.feat2, 1) });
  };

  PT.coolant = function (m) {
    var x = m.x, y0 = TOP + 2, y1 = BASE - 2;
    pipeV(x + 13, y0, y1, 8, P.metal);
    pipeV(x + 32, y0, y1, 5.5, mix(P.metal, P.feat, 0.3));
    for (var by = 120; by < y1 - 20; by += 74) { rr(x + 1, by, 42, 8, 2); fill(vg(by, by + 8, P.metalHi, P.metalLo)); ink(1.2); bolt(x + 5, by + 4, 1.3); bolt(x + 39, by + 4, 1.3); }
    rr(x, y1 - 10, 44, 10, 2); fill(vg(y1 - 10, y1, P.metalHi, P.metalLo)); ink(1.3);
    valve(x + 13, 236, 11, P.feat);
  };

  PT.tank = function (m) {
    var x = m.x, w = m.w, y = 150, h = 156, ft = 12, r = rng(m.s);
    drop(function () { rr(x, y, w, h, 18); });
    rr(x, y, w, h, 18); fill(vg(y, y + h, P.metalHi, P.metal, P.metalLo)); ink();
    for (var bx = x + 22; bx < x + w - 16; bx += 24) { bolt(bx, y + 6, 1.4); bolt(bx, y + h - 6, 1.4); }
    var ix = x + ft, iy = y + ft, iw = w - 2 * ft, ih = h - 2 * ft, sy = iy + 15;
    G.save(); rr(ix, iy, iw, ih, 10); G.clip();
    rect(ix, iy, iw, ih, mix(P.space, P.wallB, 0.5));
    var wa = mix(P.feat, P.ink, 0.4), wb2 = mix(P.feat, P.ink, 0.6);
    rect(ix, sy, iw, ih, vg(sy, iy + ih, wa, wb2, mix(P.feat, P.ink, 0.78)));
    for (var k = 0; k < 3; k++) {
      var rx = ix + iw * (0.15 + k * 0.3 + r() * 0.08);
      poly([rx, sy, rx + 14, sy, rx - 10, iy + ih, rx - 30, iy + ih]); fill(wh(0.05));
    }
    G.beginPath();
    for (var wx = ix; wx <= ix + iw; wx += 4) { var wy = sy + Math.sin(wx * 0.18) * 1.2; if (wx === ix) G.moveTo(wx, wy); else G.lineTo(wx, wy); }
    strk(css(lit(P.feat2, 0.2), 0.75), 1.4);
    for (var c = 0; c < 5; c++) {
      var cx0 = ix + r() * (iw - 30), cy0 = sy + 10 + r() * 30;
      G.beginPath(); G.moveTo(cx0, cy0); G.quadraticCurveTo(cx0 + 8, cy0 - 4, cx0 + 16, cy0); G.quadraticCurveTo(cx0 + 22, cy0 + 3, cx0 + 28, cy0);
      strk(wh(0.14), 1.2);
    }
    rect(ix, iy + ih - 12, iw, 12, vg(iy + ih - 12, iy + ih, mix(P.feat2, P.ink, 0.55), mix(P.feat2, P.ink, 0.72)));
    for (var s = 0; s < 3 + Math.floor(r() * 2); s++) {
      var kx = ix + 18 + r() * (iw - 36), kh = 40 + r() * 50, kc = mix(mix(P.feat, [80, 170, 120], 0.55), P.ink, 0.3);
      G.beginPath(); G.moveTo(kx, iy + ih - 6);
      for (var yy = iy + ih - 6; yy > iy + ih - 6 - kh; yy -= 6) G.lineTo(kx + Math.sin(yy * 0.15 + s) * 4, yy);
      strk(P.ink, 5);
      G.beginPath(); G.moveTo(kx, iy + ih - 6);
      for (yy = iy + ih - 6; yy > iy + ih - 6 - kh; yy -= 6) G.lineTo(kx + Math.sin(yy * 0.15 + s) * 4, yy);
      strk(kc, 3);
    }
    poly([ix + iw * 0.72, iy, ix + iw * 0.72 + 16, iy, ix + iw * 0.72 - 40, iy + ih, ix + iw * 0.72 - 56, iy + ih]); fill(wh(0.06));
    G.restore();
    rr(ix, iy, iw, ih, 10); ink(1.6);
    G.beginPath(); G.moveTo(x + 2, y + h - 18); G.lineTo(x + 2, y + 18); G.arcTo(x + 2, y + 2, x + 18, y + 2, 16); G.lineTo(x + w - 18, y + 2); strk(wh(0.22), 1.1);
    if (REG) LIVE.push({ k: "bub", x: ix, y: sy + 4, w: iw, h: ih - 30, r: 10, s: m.s % 9973 });
  };

  PT.herbWall = function (m) {
    var x = m.x, w = m.w, y = 152, h = 150, r = rng(m.s), ft = 8;
    drop(function () { rr(x, y, w, h, 6); });
    rr(x, y, w, h, 6); fill(vg(y, y + h, P.metalHi, P.metal, P.metalLo)); ink();
    var ix = x + ft, iy = y + ft, iw = w - 2 * ft, ih = h - 2 * ft;
    G.save(); rr(ix, iy, iw, ih, 3); G.clip();
    rect(ix, iy, iw, ih, vg(iy, iy + ih, mix(P.feat2, P.wallB, 0.3), mix(P.wallB, P.ink, 0.35)));
    rect(ix, iy, iw, 5, lit(P.feat2, 0.55)); rect(ix, iy + 5, iw, 1.2, css(P.ink, 0.5));
    pool(ix + iw / 2, iy + 6, iw * 0.6, 60, P.feat2, 0.2);
    for (var k = 0; k < 2; k++) {
      var tb = iy + (k + 1) * ih / 2 - (k ? 2 : 4);
      var px = ix + 9 + r() * 5;
      while (px < ix + iw - 8) { plant(px, tb - 9, 20 + r() * 20, r); px += 15 + r() * 8; }
      rect(ix, tb - 11, iw, 11, vg(tb - 11, tb, mix(P.trim, [92, 64, 48], 0.55), mix(P.trim, [60, 42, 34], 0.6)));
      rect(ix, tb - 11, iw, 3, P.metal); rect(ix, tb - 11, iw, 1, wh(0.25)); rect(ix, tb - 8, iw, 1.2, css(P.ink, 0.6));
    }
    poly([ix + iw * 0.7, iy, ix + iw * 0.7 + 16, iy, ix + iw * 0.7 - 50, iy + ih, ix + iw * 0.7 - 66, iy + ih]); fill(wh(0.06));
    G.restore();
    rr(ix, iy, iw, ih, 3); ink(1.4);
    rect(x + 4, y + 1.6, w - 8, 1, wh(0.22));
    var tx = x + w / 2 - 18;
    rr(tx, y + h + 7, 36, 11, 2); fill(lit(P.metal, 0.15)); ink(1.1);
    led(tx + 7, y + h + 12.5, P.led, true, 1.5);
    rect(tx + 13, y + h + 11.5, 17, 1.4, css(P.ink, 0.45));
  };

  PT.gallery = function (m) {
    PT.lamp({ x: m.x + 2 }); PT.lamp({ x: m.x + m.w - 32 });
    PT.art(m.art);
  };
  PT.gallery.glow = function (m) { PT.lamp.glow({ x: m.x + 2 }); PT.lamp.glow({ x: m.x + m.w - 32 }); };

  PT.labWindow = function (m) {
    var x = m.x, w = m.w, y = 148, h = 152, c = 16, ft = 11, r = rng(m.s);
    drop(function () { ch(x, y, w, h, c); });
    ch(x, y, w, h, c); fill(vg(y, y + h, P.metalHi, P.metal, P.metalLo)); ink();
    var ix = x + ft, iy = y + ft, iw = w - 2 * ft, ih = h - 2 * ft, ic = c - 6;
    var gp = function () { ch(ix, iy, iw, ih, ic); };
    G.save(); gp(); G.clip();
    var room = lit(mix(P.wallT, P.glow, 0.3), 0.1);
    rect(ix, iy, iw, ih, vg(iy, iy + ih, room, mix(room, P.wallB, 0.5), mix(P.wallB, P.ink, 0.2)));
    G.beginPath();
    for (var px = ix + 34; px < ix + iw; px += 44) { G.moveTo(px, iy); G.lineTo(px, iy + ih - 34); }
    strk(css(P.ink, 0.14), 1.2);
    // back shelf with jars
    var sy = iy + 44;
    rect(ix + 10, sy, iw * 0.45, 4, mix(P.metal, room, 0.3)); G.beginPath(); G.rect(ix + 10, sy, iw * 0.45, 4); ink(0.9, 0.7);
    var jx = ix + 16;
    while (jx < ix + 10 + iw * 0.45 - 14) { rr(jx, sy - 12, 9, 12, 2); fill(mix([P.feat, P.feat2, P.led][Math.floor(r() * 3)], room, 0.35)); ink(0.8, 0.7); jx += 13 + r() * 6; }
    // hanging lamps
    for (var l = 0; l < 2; l++) {
      var lx = ix + iw * (l ? 0.72 : 0.3);
      line(lx, iy, lx, iy + 16, css(P.ink, 0.6), 1.2);
      poly([lx - 10, iy + 26, lx + 10, iy + 26, lx + 5, iy + 16, lx - 5, iy + 16]); fill(mix(P.metal, room, 0.2)); ink(1);
      pool(lx, iy + 30, 46, 60, P.light, 0.22);
      rect(lx - 8, iy + 25.4, 16, 1.6, P.light);
    }
    // bench
    var by = iy + ih - 36;
    rect(ix, by + 6, iw, ih - 42 + 36, vg(by, iy + ih, mix(P.metal, P.wallB, 0.4), mix(P.metal, P.ink, 0.45)));
    rect(ix, by, iw, 7, lit(mix(P.metal, room, 0.4), 0.15)); G.beginPath(); G.rect(ix - 1, by, iw + 2, 7); ink(1.1);
    G.beginPath();
    for (var dx = ix + iw / 4; dx < ix + iw - 4; dx += iw / 4) { G.moveTo(dx, by + 7); G.lineTo(dx, iy + ih); }
    strk(css(P.ink, 0.45), 1);
    // microscope
    var mx = ix + iw * 0.2;
    rr(mx - 9, by - 4, 22, 4, 1.5); fill(P.metalLo); ink(0.9);
    G.beginPath(); G.moveTo(mx + 9, by - 4); G.quadraticCurveTo(mx + 13, by - 18, mx + 4, by - 26); strk(P.ink, 4.6); 
    G.beginPath(); G.moveTo(mx + 9, by - 4); G.quadraticCurveTo(mx + 13, by - 18, mx + 4, by - 26); strk(P.metal, 2.8);
    G.save(); G.translate(mx + 1, by - 22); G.rotate(-0.5); rr(-3, -12, 6, 16, 2); fill(P.metalHi); ink(0.9); G.restore();
    rect(mx - 4, by - 12, 12, 2.4, P.metalLo);
    // monitor
    var sx2 = ix + iw * 0.48;
    rr(sx2, by - 30, 34, 24, 2); fill(P.metalDk); ink(1);
    rect(sx2 + 3, by - 27, 28, 17, mix(P.feat, P.ink, 0.45));
    G.beginPath(); G.moveTo(sx2 + 5, by - 15); G.lineTo(sx2 + 11, by - 21); G.lineTo(sx2 + 17, by - 17); G.lineTo(sx2 + 23, by - 24); G.lineTo(sx2 + 29, by - 19); strk(css(P.feat, 0.9), 1.2);
    rect(sx2 + 15, by - 6, 4, 6, P.metalLo);
    // flasks
    var fx = ix + iw * 0.72;
    fx += vial(fx, by, 1, P.feat2) + 4; fx += vial(fx, by, 0, P.feat) + 3; vial(fx, by, 2, P.led);
    poly([ix + iw * 0.62, iy, ix + iw * 0.62 + 18, iy, ix + iw * 0.62 - 50, iy + ih, ix + iw * 0.62 - 68, iy + ih]); fill(wh(0.07));
    G.fillStyle = vg(iy, iy + 18, css(P.ink, 0.3), css(P.ink, 0)); G.fillRect(ix, iy, iw, 18);
    G.restore();
    gp(); ink(1.5);
    G.beginPath(); G.moveTo(x + 2, y + h - c); G.lineTo(x + 2, y + c); G.lineTo(x + c, y + 2); G.lineTo(x + w - c, y + 2); strk(wh(0.22), 1.1);
    rr(x - 5, y + h - 3, w + 10, 8, 2); fill(vg(y + h - 3, y + h + 5, P.metalHi, P.metalLo)); ink(1.3);
    led(x + w - 9, y + 8, P.led, true, 1.5);
  };

  PT.coolantBank = function (m) {
    var x = m.x, y0 = TOP + 2, y1 = BASE - 2, xs = [x + 18, x + 52, x + 88, x + 122];
    for (var i = 0; i < 4; i++) pipeV(xs[i], y0, y1, i % 2 ? 6 : 8, i % 2 ? mix(P.metal, P.feat, 0.3) : P.metal);
    for (var by = 118; by < y1 - 30; by += 76) {
      rr(x + 2, by, 136, 9, 2); fill(vg(by, by + 9, P.metalHi, P.metalLo)); ink(1.2);
      bolt(x + 7, by + 4.5, 1.3); bolt(x + 133, by + 4.5, 1.3);
    }
    rr(x, y1 - 10, 140, 10, 2); fill(vg(y1 - 10, y1, P.metalHi, P.metalLo)); ink(1.3);
    valve(x + 52, 238, 11, P.feat);
    var gx = x + 105, gy = 238;
    rr(gx - 13, gy - 13, 26, 26, 3); fill(P.metal); ink(1.2);
    circ(gx, gy, 9); fill(vg(gy - 9, gy + 9, lit(P.feat2, 0.3), P.feat2)); ink(1);
    line(gx, gy, gx + 5, gy - 5, P.ink, 1.4);
    led(gx, gy + 18, P.led, true, 1.6);
  };

  // cryo: a frosted window, milky at the edges with rime in the corners
  PT.frostWindow = function (m) {
    var x = m.x, w = m.w, y = 146, h = 140, c = 18, g = m.win[0], gc = 12, r = rng(m.s);
    drop(function () { ch(x, y, w, h, c); });
    ch(x, y, w, h, c); fill(vg(y, y + h, P.metalHi, P.metal, P.metalLo)); ink();
    ch(g.x - 4, g.y - 4, g.w + 8, g.h + 8, gc + 2); fill(P.metalDk);
    var gp = function () { ch(g.x, g.y, g.w, g.h, gc); };
    cut(gp);
    G.save(); gp(); G.clip();
    var fr = lit(P.feat, 0.55);
    G.fillStyle = vg(g.y, g.y + 30, css(fr, 0.42), css(fr, 0)); G.fillRect(g.x, g.y, g.w, 30);
    G.fillStyle = vg(g.y + g.h - 34, g.y + g.h, css(fr, 0), css(fr, 0.5)); G.fillRect(g.x, g.y + g.h - 34, g.w, 34);
    G.fillStyle = hg(g.x, g.x + 34, css(fr, 0.4), css(fr, 0)); G.fillRect(g.x, g.y, 34, g.h);
    G.fillStyle = hg(g.x + g.w - 34, g.x + g.w, css(fr, 0), css(fr, 0.4)); G.fillRect(g.x + g.w - 34, g.y, 34, g.h);
    // rime: little crystal fans growing from each corner
    for (var k = 0; k < 4; k++) {
      var sx = k & 1 ? -1 : 1, sy = k & 2 ? -1 : 1, ox = k & 1 ? g.x + g.w : g.x, oy = k & 2 ? g.y + g.h : g.y;
      G.save(); G.translate(ox, oy); G.scale(sx, sy);
      G.beginPath();
      for (var f = 0; f < 5; f++) {
        var a = 0.12 + f * 0.33 + (r() - 0.5) * 0.12, L = 13 + r() * 13, ca = Math.cos(a), sa = Math.sin(a);
        G.moveTo(2, 2); G.lineTo(2 + ca * L, 2 + sa * L);
        var bx = 2 + ca * L * 0.55, by = 2 + sa * L * 0.55, bl = L * 0.3;
        G.moveTo(bx, by); G.lineTo(bx + Math.cos(a + 0.7) * bl, by + Math.sin(a + 0.7) * bl);
        G.moveTo(bx, by); G.lineTo(bx + Math.cos(a - 0.7) * bl, by + Math.sin(a - 0.7) * bl);
      }
      strk(wh(0.55), 1);
      G.restore();
    }
    poly([g.x + g.w * 0.16, g.y + g.h, g.x + g.w * 0.16 + g.h * 0.5, g.y, g.x + g.w * 0.16 + g.h * 0.5 + 16, g.y, g.x + g.w * 0.16 + 16, g.y + g.h]); fill(wh(0.06));
    G.restore();
    gp(); ink(1.6);
    G.beginPath(); G.moveTo(x + 2, y + h - c); G.lineTo(x + 2, y + c); G.lineTo(x + c, y + 2); G.lineTo(x + w - c, y + 2); strk(wh(0.22), 1.1);
    rr(x - 5, y + h - 3, w + 10, 8, 2); fill(vg(y + h - 3, y + h + 5, P.metalHi, P.metalLo)); ink(1.3);
    led(x + w - 12, y + 9, P.led, true, 1.5);
  };

  // habitat: a cabin window with curtains and a little potted plant on the sill
  PT.cabinWindow = function (m) {
    var x = m.x, w = m.w, y = 172, h = 84, g = m.win[0];
    var cloth = m.cur ? mix(P.feat, P.wallB, 0.2) : mix(P.feat2, P.wallB, 0.25);
    drop(function () { rr(x, y, w, h, 14); });
    rr(x, y, w, h, 14); fill(vg(y, y + h, P.metalHi, P.metal, P.metalLo)); ink();
    rr(g.x - 3, g.y - 3, g.w + 6, g.h + 6, 10); fill(P.metalDk);
    var gp = function () { rr(g.x, g.y, g.w, g.h, 8); };
    cut(gp);
    G.save(); gp(); G.clip();
    G.fillStyle = vg(g.y, g.y + 18, css(P.ink, 0.45), css(P.ink, 0)); G.fillRect(g.x, g.y, g.w, 18);
    poly([g.x + g.w * 0.42, g.y + g.h, g.x + g.w * 0.42 + 30, g.y, g.x + g.w * 0.42 + 44, g.y, g.x + g.w * 0.42 + 14, g.y + g.h]); fill(wh(0.05));
    G.restore();
    gp(); ink(1.4);
    // curtains, tied back
    for (var s2 = 0; s2 < 2; s2++) {
      G.save();
      if (s2) { G.translate(2 * x + w, 0); G.scale(-1, 1); }
      var cx0 = x + 7, ty = 178, tb = 226, by2 = 252;
      G.beginPath(); G.moveTo(cx0, ty); G.lineTo(cx0 + 34, ty);
      G.quadraticCurveTo(cx0 + 26, tb - 14, cx0 + 15, tb);
      G.quadraticCurveTo(cx0 + 22, by2 - 10, cx0 + 26, by2);
      G.lineTo(cx0, by2); G.closePath();
      fill(vg(ty, by2, lit(cloth, 0.12), cloth, mix(cloth, P.ink, 0.2))); ink(1.3);
      G.beginPath(); G.moveTo(cx0 + 10, ty + 2); G.quadraticCurveTo(cx0 + 9, tb - 10, cx0 + 7, tb); G.moveTo(cx0 + 20, ty + 2); G.quadraticCurveTo(cx0 + 16, tb - 12, cx0 + 11, tb);
      G.moveTo(cx0 + 8, tb + 4); G.lineTo(cx0 + 9, by2 - 2); G.moveTo(cx0 + 15, tb + 4); G.lineTo(cx0 + 18, by2 - 2);
      strk(css(P.ink, 0.28), 1);
      rr(cx0 + 9, tb - 3, 10, 6, 3); fill(lit(cloth, 0.3)); ink(1);
      G.restore();
    }
    rr(x + 3, 175, w - 6, 4, 2); fill(vg(175, 179, lit(P.metal, 0.4), P.metalLo)); ink(1.1);
    circ(x + 4, 177, 3.2); fill(P.metalHi); ink(1); circ(x + w - 4, 177, 3.2); fill(P.metalHi); ink(1);
    rr(x - 6, y + h - 4, w + 12, 9, 2); fill(vg(y + h - 4, y + h + 5, P.metalHi, P.metalLo)); ink(1.3);
    // potted plant standing on the sill
    var px = m.pl ? x + w - 40 : x + 40, py = y + h - 4, r = rng(m.s ^ 0x77);
    var oldF = P.feat; P.feat = [96, 158, 104];
    for (var l = 0; l < 5; l++) leaf(px + (l - 2) * 2, py - 12, 10 + r() * 5, -Math.PI / 2 + (l - 2) * 0.48 + (r() - 0.5) * 0.2, l % 2 ? lit(P.feat, 0.1) : mix(P.feat, P.ink, 0.15));
    P.feat = oldF;
    poly([px - 9, py - 14, px + 9, py - 14, px + 6.5, py, px - 6.5, py]); fill(vg(py - 14, py, [196, 116, 84], [150, 82, 62])); ink(1.2);
    rect(px - 9, py - 14, 18, 3, css(P.ink, 0.2));
  };

  // lounge: brand posters, a pink synthwave sunset in a brass frame
  function posterArt(x, y, w, h, v) {
    var fr = mix(P.metal, GOLD, 0.45);
    drop(function () { G.beginPath(); G.rect(x, y, w, h); });
    G.beginPath(); G.rect(x, y, w, h); fill(vg(y, y + h, lit(fr, 0.25), fr, mix(fr, P.ink, 0.2))); ink();
    var ax = x + 6, ay = y + 6, aw = w - 12, ah = h - 12, hz = ay + ah * (v === 2 ? 0.56 : 0.6);
    var mute = function (c) { return mix(c, P.wallB, 0.18); };
    G.save(); G.beginPath(); G.rect(ax, ay, aw, ah); G.clip();
    rect(ax, ay, aw, hz - ay, vg(ay, hz, mute([46, 26, 82]), mute([150, 52, 128]), mute([250, 128, 112])));
    // the sun, striped
    var sr = aw * (v === 1 ? 0.27 : 0.33), sx = ax + aw * (v === 1 ? 0.62 : 0.5);
    G.save(); G.beginPath(); G.rect(ax, ay, aw, hz - ay); G.clip();
    circ(sx, hz, sr); fill(vg(hz - sr, hz, mute([255, 222, 120]), mute([255, 92, 150])));
    for (var k = 0; k < 4; k++) rect(sx - sr, hz - sr * 0.5 + k * sr * 0.14, 2 * sr, 1.3 + k * 0.5, css(mute([150, 52, 128])));
    G.restore();
    if (v !== 0) {
      G.beginPath(); G.moveTo(ax, hz); G.lineTo(ax + aw * 0.18, hz - ah * 0.12); G.lineTo(ax + aw * 0.32, hz - ah * 0.05); G.lineTo(ax + aw * 0.46, hz - ah * 0.16); G.lineTo(ax + aw * 0.62, hz); G.closePath();
      fill(mute([70, 30, 96]));
    }
    rect(ax, hz, aw, ay + ah - hz, vg(hz, ay + ah, mute([58, 22, 78]), mute([26, 12, 44])));
    G.beginPath();
    var cxp = ax + aw / 2;
    for (var gx = -4; gx <= 4; gx++) { G.moveTo(cxp + gx * aw * 0.08, hz); G.lineTo(cxp + gx * aw * 0.34, ay + ah); }
    for (var gy = 0; gy < 4; gy++) { var yy = hz + (ay + ah - hz) * (gy * gy + 1) / 17; G.moveTo(ax, yy); G.lineTo(ax + aw, yy); }
    strk(css(mute([255, 92, 170]), 0.7), 1);
    rect(ax, hz - 0.6, aw, 1.4, css(mute([255, 170, 200])));
    // a tiny cream title block
    rect(ax + aw * 0.2, ay + 7, aw * 0.6, 3, css(CREAM, 0.85)); rect(ax + aw * 0.3, ay + 13, aw * 0.4, 2, css(CREAM, 0.55));
    G.restore();
    G.beginPath(); G.rect(ax, ay, aw, ah); ink(1);
    rect(x + 2, y + 2, w - 4, 1, wh(0.35));
  }
  PT.poster = function (m) { posterArt(m.x + 8, 160, 80, 108, m.v); };
  PT.posters = function (m) { posterArt(m.x, 160, 96, 112, m.v); posterArt(m.x + 120, 160, 96, 112, (m.v + 1) % 3); };

  // hydroponics: pothos trailing from a little hanging planter
  PT.vine = function (m) {
    var x = m.x, w = m.w, r = rng(m.s), py = 140;
    line(x + 6, FRIEZE, x + 6, py, P.metalLo, 1.4); line(x + w - 6, FRIEZE, x + w - 6, py, P.metalLo, 1.4);
    var n = Math.max(2, Math.round(w / 18));
    for (var i = 0; i < n; i++) {
      var vx = x + 8 + (w - 16) * (i + 0.5) / n, L = 40 + r() * 40, ph = r() * 6, sd = 1;
      G.beginPath(); G.moveTo(vx, py + 8);
      for (var t = 0; t <= L; t += 4) G.lineTo(vx + Math.sin(t * 0.08 + ph) * 3, py + 8 + t);
      strk(P.ink, 3); G.stroke(); strk(mix(P.feat, P.ink, 0.35), 1.6);
      for (t = 6; t < L + 4; t += 10 + r() * 3) {
        var lx = vx + Math.sin(t * 0.08 + ph) * 3; sd = -sd;
        leaf(lx, py + 8 + t, 10 + r() * 3, sd > 0 ? 0.55 + r() * 0.35 : Math.PI - 0.55 - r() * 0.35, r() < 0.5 ? lit(P.feat, 0.08) : mix(P.feat, P.ink, 0.18));
      }
    }
    rr(x, py, w, 12, 3); fill(vg(py, py + 12, P.metalHi, P.metal)); ink(1.3);
    rect(x + 3, py + 1.5, w - 6, 1, wh(0.25));
  };

  // ---------- wall, ceiling, lights, pillars ----------
  var LC0 = 0, LC1 = 0;   // the chunk's range in zone local coordinates
  function rivetRow(x0, x1, y, step, r) {
    var n = Math.max(1, Math.round((x1 - x0) / step)), sp = (x1 - x0) / n;
    for (var i = 0; i <= n; i++) bolt(x0 + i * sp, y, r);
  }
  function panelDeco(st, x0, x1, j, n) {
    var w = x1 - x0, i;
    if (st === "mint") {
      rect(x0, 318, w, 1.2, css(P.ink, 0.3)); rect(x0, 319.2, w, 1, wh(0.08));
    } else if (st === "amber") {
      rect(x0, 222, w, 1.4, css(P.seam, 0.7)); rect(x0, 223.4, w, 1, wh(0.1));
      bolt(x0 + 8, 214); bolt(x1 - 8, 214); bolt(x0 + 8, 328); bolt(x1 - 8, 328);
    } else if (st === "violet") {
      rr(x0 + 12, FRIEZE + 12, w - 24, 202, 9); strk(css(P.ink, 0.22), 1.2);
      rr(x0 + 13.2, FRIEZE + 13.2, w - 24, 202, 9); strk(wh(0.06), 1);
    } else if (st === "hydro") {
      for (i = 270; i < 334; i += 11) { rect(x0, i, w, 1.2, css(P.ink, 0.22)); rect(x0, i + 1.2, w, 1, wh(0.05)); }
    } else if (st === "cryo") {
      rect(x0, FRIEZE, w, 70, vg(FRIEZE, FRIEZE + 70, wh(0.12), wh(0)));
      rect(x0 + 3, FRIEZE, 1, BASE - FRIEZE, wh(0.1));
    } else if (st === "habitat") {
      rect(x0, 254, w, BASE - 254, vg(254, BASE, mix(P.wallB, P.trim, 0.35), mix(P.wallB, P.trim, 0.6)));
      var ns = Math.max(1, Math.round((w - 12) / 24));
      for (i = 1; i < ns; i++) rect(x0 + 6 + (w - 12) * i / ns, 258, 1.1, BASE - 260, css(P.ink, 0.16));
      rect(x0, 250, w, 6, vg(250, 256, lit(P.trim, 0.3), P.trim)); rect(x0, 249.4, w, 1.2, css(P.ink, 0.6)); rect(x0, 256, w, 1.2, css(P.ink, 0.45));
    } else if (st === "server") {
      // fluted lower panels under a quiet seam
      rect(x0, 256, w, 1.4, css(P.seam, 0.6)); rect(x0, 257.4, w, 1, wh(0.06));
      var nf = Math.max(1, Math.round((w - 16) / 14));
      for (i = 1; i < nf; i++) { var fx = x0 + 8 + (w - 16) * i / nf; rect(fx - 0.6, 264, 1.2, BASE - 272, css(P.ink, 0.22)); rect(fx + 0.6, 264, 1, BASE - 272, wh(0.04)); }
    } else if (st === "rose") {
      rr(x0 + 10, FRIEZE + 10, w - 20, 206, 16); strk(css(P.ink, 0.2), 1.3);
      rr(x0 + 11.3, FRIEZE + 11.3, w - 20, 206, 16); strk(wh(0.07), 1);
    } else if (st === "archive") {
      rect(x0, FRIEZE + 6, w, 1.4, css(P.feat2, 0.7)); rect(x0, 316, w, 1.4, css(P.feat2, 0.7));
      rr(x0 + 12, FRIEZE + 16, w - 24, 184, 2); strk(css(P.ink, 0.25), 1.1);
    } else if (st === "reactor") {
      ch(x0 + 9, FRIEZE + 10, w - 18, 206, 12); strk(css(P.ink, 0.28), 1.3);
      bolt(x0 + 16, FRIEZE + 17); bolt(x1 - 16, FRIEZE + 17); bolt(x0 + 16, 317); bolt(x1 - 16, 317);
    } else if (st === "aqua") {
      rect(x0, 232, w, 1.4, css(P.seam, 0.65)); rect(x0, 233.4, w, 1, wh(0.08));
      rivetRow(x0 + 12, x1 - 12, 240, 20, 1.3);
    }
  }
  function paintPanel(b, j, n, px0, px1, xs) {
    var Z = b.Z, w = px1 - px0 + 0.75;
    // ceiling: a dark band behind the HUD in every zone (coffers, cornice, shadow strip)
    rect(px0, CY0, w, TOP - CY0, vg(CY0, TOP, P.ceilLo, P.ceil));
    var cx0 = j === 0 ? xs : px0;
    rr(cx0 + 8, 4, px1 - cx0 - 16, 32, 3); fill(vg(4, 36, mix(P.ceil, P.ink, 0.3), P.ceilHi)); ink(1.2, 0.7);
    rect(cx0 + 11, 34, px1 - cx0 - 22, 1, wh(0.05));
    rect(px0, 44, w, 18, vg(44, 62, mix(P.ceil, P.trim, 0.42), mix(P.ceil, P.trim, 0.2)));
    rect(px0, 43.3, w, 1.4, P.ink); rect(px0, 45, w, 1, wh(0.08)); rect(px0, 61.3, w, 1.6, P.ink);
    rect(px0, 62.9, w, TOP - 62.9, P.ceilLo);
    // frieze, field, baseboard
    rect(px0, TOP, w, FRIEZE - TOP, vg(TOP, FRIEZE, lit(P.wallT, 0.1), P.wallT));
    rect(px0, FRIEZE, w, BASE - FRIEZE, vg(FRIEZE, BASE, P.wallT, P.wallM, P.wallB));
    var tone = (h2(b.k * 131 + b.i, j) - 0.5) * 0.08;
    if (tone > 0) rect(px0, FRIEZE, w, BASE - FRIEZE, wh(tone * 0.6)); else rect(px0, FRIEZE, w, BASE - FRIEZE, css(P.ink, -tone));
    rect(px0, TOP, w, 12, vg(TOP, TOP + 12, css(P.ink, 0.28), css(P.ink, 0)));
    rect(px0, BASE - 26, w, 26, vg(BASE - 26, BASE, css(P.ink, 0), css(P.ink, 0.16)));
    rect(px0, BASE, w, WB - BASE, vg(BASE, WB, lit(P.trim, 0.1), P.trim));
    rect(px0, TOP, w, 1.6, P.ink);
    rect(px0, FRIEZE - 0.7, w, 1.4, css(P.seam, 0.8)); rect(px0, FRIEZE + 0.7, w, 1, wh(0.1));
    rect(px0, BASE - 0.8, w, 1.6, P.ink); rect(px0, BASE + 0.8, w, 1, wh(0.14));
    // the zone's thin inlay line along the wall base
    rect(px0, 342.6, w, 1.8, css(mix(P.led, P.trim, 0.45), 0.85)); rect(px0, 344.4, w, 0.8, css(P.ink, 0.35));
    rect(px0, WB - 1.2, w, 1.2, css(P.ink, 0.7));
    if (j > 0) { rect(px0 - 0.7, TOP, 1.4, BASE - TOP, css(P.seam, 0.85)); rect(px0 + 0.7, TOP, 1, BASE - TOP, wh(0.09)); rect(px0 - 0.6, BASE, 1.2, WB - BASE, css(P.ink, 0.5)); }
    panelDeco(Z.wall, j === 0 ? xs : px0, px1, j, n);
  }
  var SW = 32;   // strip width (wall units) for the colour roll inside a blend
  function wallPass(b) {
    var Z = b.Z, xs = b.x0 + b.pw, xe = b.x0 + b.w, span = xe - xs;
    var n = Math.max(1, Math.round(span / Z.pw)), e = G.getTransform().e;
    for (var j = 0; j < n; j++) {
      var px0 = j === 0 ? b.x0 : Math.round(xs + span * j / n), px1 = Math.round(xs + span * (j + 1) / n);
      if (px1 < LC0 - 4 || px0 > LC1 + 4) continue;
      var PA = bpal(b, px0), PB = bpal(b, px1);
      if (PA === PB) { P = PA; paintPanel(b, j, n, px0, px1, xs); continue; }
      // in a blend the panel is painted in narrow pixel-aligned strips, each in its own step of the
      // roll (a few percent apart), so the room colour changes continuously with no visible edge
      var ns = Math.max(2, Math.round((px1 - px0) / SW)), prev = -1e9;
      for (var q = 0; q < ns; q++) {
        var sa = px0 + (px1 - px0) * q / ns, sb = px0 + (px1 - px0) * (q + 1) / ns;
        if (sb < LC0 - 4 || sa > LC1 + 4) continue;
        var ra = q === 0 ? sa - 3 : (Math.round(sa * SX + e) - e) / SX, rb = q === ns - 1 ? sb + 3 : (Math.round(sb * SX + e) - e) / SX;
        P = bpal(b, (sa + sb) / 2);
        G.save(); G.beginPath(); G.rect(ra, CY0 - 2, rb - ra, WB - CY0 + 4); G.clip();
        paintPanel(b, j, n, px0, px1, xs);
        G.restore();
      }
    }
  }
  function glowPass(b) {
    G.save(); G.beginPath(); G.rect(b.x0, TOP, b.w, BASE - TOP); G.clip();
    for (var i = 0; i < b.lights.length; i++) {
      var l = b.lights[i];
      P = bpal(b, l.x);
      pool(l.x, TOP + 4, l.L * 0.5 + 90, 160, P.glow, 0.26);
      pool(l.x, TOP + 3, l.L * 0.5 + 34, 24, P.glow, 0.32);
    }
    for (i = 0; i < b.items.length; i++) {
      var m = b.items[i];
      if (PT[m.t].glow && m.x < LC1 + 80 && m.x + m.w > LC0 - 80) { P = bpal(b, m.x + m.w / 2); PT[m.t].glow(m); }
    }
    G.restore();
  }
  function pipePath(xL, xR, y, Rb) {
    G.beginPath(); G.moveTo(xL, TOP - 8); G.lineTo(xL, y - Rb); G.arcTo(xL, y, xL + Rb, y, Rb);
    G.lineTo(xR - Rb, y); G.arcTo(xR, y, xR, y - Rb, Rb); G.lineTo(xR, TOP - 8);
  }
  function pipeBent(xL, xR, y, r, col, Rb) {
    G.lineJoin = "round";
    pipePath(xL, xR, y, Rb); strk(P.ink, 2 * r + 2.2);
    pipePath(xL, xR, y, Rb); strk(mix(col, P.ink, 0.4), 2 * r);
    G.save(); G.translate(-r * 0.22, -r * 0.22); pipePath(xL, xR, y, Rb); strk(col, r * 1.3); G.restore();
    G.save(); G.translate(-r * 0.42, -r * 0.42); pipePath(xL, xR, y, Rb); strk(wh(0.24), Math.max(1, r * 0.28)); G.restore();
    G.lineJoin = "miter";
  }
  function flange(x, r, col) { rr(x - r - 4, TOP - 0.5, 2 * r + 8, 7, 1.5); fill(vg(TOP, TOP + 7, lit(col, 0.3), mix(col, P.ink, 0.25))); ink(1.2); }
  function upperPass(b) {
    var u = b.upper, Z = b.Z;
    P = bpal(b, b.x0 + b.w / 2);
    var x0 = b.x0 + 18, x1 = b.x0 + b.w + 22, i;
    if (Z.rail) {
      for (i = x0 + 70; i < x1 - 40; i += 110) { rr(i - 3, 314, 6, 14, 2); fill(P.metalLo); ink(1.1); }
      rect(x0, 309.5, x1 - x0, 7, P.ink);
      rect(x0, 310.5, x1 - x0, 5, vg(310.5, 315.5, lit(P.metal, 0.4), mix(P.metal, P.ink, 0.25)));
      rect(x0, 311.4, x1 - x0, 1, wh(0.3));
    }
    if (!u) return;
    if (u.t === "tray") {
      // cable tray tucked into the frieze, hung from the ceiling, running behind the pillars
      var tx0 = b.x0 + 8, tx1 = b.x0 + b.w + 8, ty = 94;
      for (i = b.x0 + b.pw + 40; i < tx1 - 30; i += 120) { rect(i - 1.2, TOP, 2.4, ty - TOP, P.metalLo); G.beginPath(); G.rect(i - 1.2, TOP, 2.4, ty - TOP); ink(0.8); }
      var cc = [mix(P.feat2, P.ink, 0.35), mix(P.feat, P.ink, 0.45), P.metalDk];
      for (var c = 0; c < 3; c++) {
        var cy = ty - 1.5 - c * 2.6;
        G.beginPath(); G.moveTo(tx0, cy);
        for (var hx = tx0; hx < tx1; hx += 60) G.quadraticCurveTo(hx + 30, cy - 1.6 + c * 0.6, hx + 60, cy);
        strk(P.ink, 4.4); G.stroke(); strk(cc[c], 2.6);
      }
      rect(tx0, ty, tx1 - tx0, 9, P.ink);
      rect(tx0, ty + 1, tx1 - tx0, 7, vg(ty + 1, ty + 8, P.metalHi, P.metalLo));
      rect(tx0, ty + 1.6, tx1 - tx0, 1, wh(0.22));
      for (i = tx0 + 8; i < tx1 - 6; i += 16) rect(i, ty + 4, 7, 2, css(P.ink, 0.45));
      return;
    }
    var pc = Z.pipe, c2 = mix(P.metal, P.trim, 0.25);
    if (pc.up) {
      // copper pipes that run along the bay and turn up into the ceiling at each pillar
      var xs = b.x0 + b.pw, xe = b.x0 + b.w, Rb1 = pc.r1 + 8, Rb2 = Rb1 + (pc.y2 - pc.y1);
      G.save(); G.beginPath(); G.rect(b.x0, TOP + 0.5, b.w + 40, BASE - TOP); G.clip();
      pipeBent(xs + 34, xe - 34, pc.y1, pc.r1, P.metal, Rb1);
      pipeBent(xs + 34 - (pc.y2 - pc.y1), xe - 34 + (pc.y2 - pc.y1), pc.y2, pc.r2, c2, Rb2);
      G.restore();
      flange(xs + 34, pc.r1, P.metal); flange(xe - 34, pc.r1, P.metal);
      flange(xs + 34 - (pc.y2 - pc.y1), pc.r2, c2); flange(xe - 34 + (pc.y2 - pc.y1), pc.r2, c2);
      x0 = xs + 34 + Rb1 + 20; x1 = xe - 34 - Rb1 - 20;
      var nb = Math.max(1, Math.round((x1 - x0) / 140));
      for (i = 0; i <= nb; i++) {
        var bx = x0 + (x1 - x0) * i / nb, near2 = false;
        for (var d2 = 0; d2 < u.drops.length; d2++) if (Math.abs(u.drops[d2] - bx) < 24) near2 = true;
        if (near2) continue;
        rr(bx - 3.5, pc.y1 - pc.r1 - 3, 7, pc.y2 + pc.r2 - pc.y1 + pc.r1 + 6, 1.5); fill(vg(pc.y1 - pc.r1, pc.y2 + pc.r2, P.metalHi, P.metalLo)); ink(1.1);
      }
    } else {
      pipeH(x0, x1, pc.y1, pc.r1, P.metal);
      pipeH(x0, x1, pc.y2, pc.r2, c2);
      for (i = x0 + 64; i < x1 - 20; i += 128) {
        var near = false;
        for (var d = 0; d < u.drops.length; d++) if (Math.abs(u.drops[d] - i) < 24) near = true;
        if (near) continue;
        rr(i - 3.5, pc.y1 - pc.r1 - 3, 7, pc.y2 + pc.r2 - pc.y1 + pc.r1 + 6, 1.5); fill(vg(pc.y1 - pc.r1, pc.y2 + pc.r2, P.metalHi, P.metalLo)); ink(1.1);
      }
    }
    for (d = 0; d < u.drops.length; d++) {
      var dx = u.drops[d], r2 = pc.r2;
      pipeV(dx, pc.y2, BASE - 6, r2, c2);
      rr(dx - r2 - 3, pc.y2 - r2 - 3, 2 * r2 + 6, 2 * r2 + 8, 2); fill(vg(pc.y2 - r2, pc.y2 + r2, lit(c2, 0.3), c2)); ink(1.2);
      collar(dx, 220, r2, c2);
      rr(dx - r2 - 5, BASE - 10, 2 * r2 + 10, 10, 2); fill(vg(BASE - 10, BASE, P.metalHi, P.metalLo)); ink(1.2);
      if (pc.valve) valve(dx, 262, 9, P.feat);
    }
  }
  function itemPass(b) {
    var i, m;
    for (i = 0; i < b.deco.length; i++) {
      m = b.deco[i];
      if (m.x > LC1 + 12 || m.x + m.w < LC0 - 12) continue;
      P = bpal(b, m.x + m.w / 2); PT[m.t](m);
    }
    for (i = 0; i < b.items.length; i++) {
      m = b.items[i];
      if (m.x > LC1 + 12 || m.x + m.w < LC0 - 12) continue;
      P = bpal(b, m.x + m.w / 2);
      REG = !m.lv; if (REG) m.lv = [];
      LIVE = m.lv;
      PT[m.t](m);
      REG = false;
    }
  }
  function lightPass(b) {
    var st = b.Z.light, y = 55 + LY;
    for (var i = 0; i < b.lights.length; i++) {
      var l = b.lights[i], x0 = l.x - l.L / 2;
      if (x0 > LC1 + 10 || x0 + l.L < LC0 - 10) continue;
      P = bpal(b, l.x);
      if (st === "tube") {
        rr(x0 - 6, y, l.L + 12, 8, 2); fill(vg(y, y + 8, P.metalLo, P.metalDk)); ink(1.3);
        rr(x0, y + 6, l.L, 6, 3); fill(vg(y + 6, y + 12, lit(P.light, 0.5), P.light, mix(P.light, P.glow, 0.45))); ink(1.2);
        rect(x0 + 4, y + 7.4, l.L - 8, 1.2, wh(0.7));
        rect(x0 - 2, y + 6, 3, 6, P.metalLo); rect(x0 + l.L - 1, y + 6, 3, 6, P.metalLo);
      } else if (st === "panel") {
        rr(x0 - 4, y, l.L + 8, 6, 2); fill(P.metalDk); ink(1.2);
        rr(x0, y + 4, l.L, 8, 2); fill(vg(y + 4, y + 12, lit(P.light, 0.3), mix(P.light, P.glow, 0.4))); ink(1.2);
        G.beginPath(); for (var gx = x0 + 14; gx < x0 + l.L - 4; gx += 14) { G.moveTo(gx, y + 4.5); G.lineTo(gx, y + 11.5); } strk(css(P.ink, 0.18), 1);
      } else {
        var n = Math.max(2, Math.round(l.L / 56)), sp = l.L / n;
        for (var k = 0; k < n; k++) {
          var px = x0 + sp * (k + 0.5);
          rr(px - 10, y, 20, 5, 2); fill(P.metalDk); ink(1.1);
          G.beginPath(); G.moveTo(px - 9, y + 5); G.arc(px, y + 5, 9, Math.PI, 0, true); G.closePath();
          fill(vg(y + 5, y + 14, lit(P.light, 0.3), mix(P.light, P.glow, 0.5))); ink(1.2);
          rect(px - 6, y + 6, 12, 1, wh(0.6));
        }
      }
    }
  }
  // pillars
  // the ceiling beam over a pillar stays as dark as the ceiling band, whatever the pillar colour
  function beam(x, w) {
    var c = mix(P.ceil, P.pil, 0.14);
    rect(x - 5, CY0, w + 10, TOP - 4 - CY0, vg(CY0, TOP, mix(c, P.ink, 0.3), c));
    G.beginPath(); G.rect(x - 5, CY0 - 2, w + 10, TOP - 2 - CY0); ink(1.6);
    rect(x - 3.5, CY0, 1, TOP - 6 - CY0, wh(0.06));
    circ(x + 6, 26, 1.6); fill(lit(c, 0.12)); ink(0.8, 0.8); circ(x + w - 6, 26, 1.6); fill(lit(c, 0.12)); ink(0.8, 0.8);
  }
  function aoSides(a, e) {
    rect(a - 16, TOP, 16, BASE - TOP, hg(a - 16, a, css(P.ink, 0), css(P.ink, 0.2)));
    rect(e, TOP, 16, BASE - TOP, hg(e, e + 16, css(P.ink, 0.2), css(P.ink, 0)));
  }
  function floorShadow(x, w) { rr(x - 8, WB - 1, w + 16, 12, 5); fill(css(P.ink, 0.22)); rr(x - 3, WB, w + 6, 8, 4); fill(css(P.ink, 0.22)); }
  var PIL = {};
  PIL.col = function (b) {
    var x = b.x0, w = b.pw, sw = Math.round(w * 0.72), a = x + (w - sw) / 2, e = a + sw, bv = Math.round(sw * 0.2);
    aoSides(a, e); floorShadow(x, w); beam(x, w);
    var st = TOP + 30, sb = 296;
    rect(a, st, bv, sb - st, vg(st, sb, P.pilLo, mix(P.pilLo, P.ink, 0.12)));
    rect(a + bv, st, sw - 2 * bv, sb - st, vg(st, sb, P.pilHi, P.pil, mix(P.pil, P.ink, 0.12)));
    rect(e - bv, st, bv, sb - st, vg(st, sb, P.pilDk, mix(P.pilDk, P.ink, 0.15)));
    rect(a + bv + 1.5, st, 1.2, sb - st, wh(0.22));
    G.beginPath(); G.moveTo(a + bv, st); G.lineTo(a + bv, sb); G.moveTo(e - bv, st); G.lineTo(e - bv, sb); strk(css(P.ink, 0.5), 1.1);
    G.beginPath(); G.rect(a, st, sw, sb - st); ink(1.7);
    var cx = (a + e) / 2;
    rect(cx - 0.6, st + 16, 1.2, 84, css(P.ink, 0.35)); rect(cx - 0.6, 256, 1.2, 30, css(P.ink, 0.35));
    // capital
    poly([x - 4, TOP - 3, x + w + 4, TOP - 3, x + w + 4, TOP + 10, e, st, a, st, x - 4, TOP + 10]);
    fill(vg(TOP - 3, st, P.pilHi, P.pil)); ink(1.7);
    rect(x - 3, TOP - 1.6, w + 6, 1, wh(0.22));
    line(x - 4, TOP + 10, x + w + 4, TOP + 10, css(P.ink, 0.45), 1);
    // collar
    ch(a - 3, 198, sw + 6, 16, 3); fill(vg(198, 214, P.pilHi, P.pilLo)); ink(1.4);
    rect(a - 1, 199.5, sw + 2, 1, wh(0.25));
    // base
    poly([a, sb - 4, e, sb - 4, x + w + 2, 312, x + w + 2, WB + 6, x - 2, WB + 6, x - 2, 312]);
    fill(vg(sb - 4, WB + 6, P.pilHi, P.pil, P.pilLo)); ink(1.7);
    rect(x - 2, 312, 8, WB + 6 - 312, css(P.ink, 0.18)); rect(x + w - 6, 312, 8, WB + 6 - 312, css(P.ink, 0.32));
    G.beginPath(); G.moveTo(x + 6, 312); G.lineTo(x + 6, WB + 6); G.moveTo(x + w - 6, 312); G.lineTo(x + w - 6, WB + 6); G.moveTo(x - 2, 312); G.lineTo(x + w + 2, 312); strk(css(P.ink, 0.5), 1.1);
    line(x - 2, 342, x + w + 2, 342, css(P.ink, 0.5), 1.1);
    rect(x + 7, 313.5, w - 14, 1, wh(0.22));
  };
  PIL.slab = function (b) {
    var x = b.x0, w = b.pw, fb = 10;
    aoSides(x, x + w); floorShadow(x, w); beam(x, w);
    var y0 = TOP - 3, y1 = WB + 6;
    rect(x, y0, fb, y1 - y0, vg(y0, y1, P.pilLo, mix(P.pilLo, P.ink, 0.15)));
    rect(x + fb, y0, w - 2 * fb, y1 - y0, vg(y0, y1, P.pilHi, P.pil, mix(P.pil, P.ink, 0.15)));
    rect(x + w - fb, y0, fb, y1 - y0, vg(y0, y1, P.pilDk, mix(P.pilDk, P.ink, 0.2)));
    G.beginPath(); G.moveTo(x + fb, y0); G.lineTo(x + fb, y1); G.moveTo(x + w - fb, y0); G.lineTo(x + w - fb, y1); strk(css(P.ink, 0.5), 1.1);
    rect(x + fb + 1.5, y0, 1.2, y1 - y0, wh(0.2));
    G.beginPath(); G.rect(x, y0, w, y1 - y0); ink(1.7);
    for (var k = 0; k < 2; k++) {
      var by = k ? 318 : FRIEZE - 6;
      rect(x, by, w, 10, vg(by, by + 10, P.pilLo, P.pilDk)); G.beginPath(); G.rect(x, by, w, 10); ink(1.3);
      rect(x + 1, by + 1, w - 2, 1, wh(0.16));
    }
    var cx = x + w / 2;
    rr(cx - 5, 132, 10, 96, 5); fill(P.pilDk); ink(1.2);
    rr(cx - 2, 136, 4, 88, 2); fill(css(mix(P.led, P.pilDk, 0.3), 0.7));
    rect(cx - 0.5, 138, 1, 84, css(lit(P.led, 0.3), 0.5));
    rr(cx - 5, 250, 10, 46, 5); fill(P.pilLo); ink(1, 0.6);
    bolt(x + 17, 112); bolt(x + w - 17, 112); bolt(x + 17, 306); bolt(x + w - 17, 306);
    rr(x - 3, 338, w + 6, WB + 8 - 338, 2); fill(vg(338, WB + 8, P.pilLo, P.pilDk)); ink(1.4);
    rect(x - 2, 339.4, w + 4, 1, wh(0.18));
  };
  PIL.round = function (b) {
    var x = b.x0, w = b.pw;
    aoSides(x + 6, x + w - 6); floorShadow(x, w); beam(x, w);
    var cyl = function (x0, x1) { return hg(x0, x1, P.pilDk, P.pil, P.pilHi, P.pil, P.pilLo, mix(P.pilDk, P.ink, 0.2)); };
    rect(x + 7, TOP + 14, w - 14, 300 - TOP - 14, cyl(x + 7, x + w - 7));
    G.beginPath(); G.rect(x + 7, TOP + 14, w - 14, 300 - TOP - 14); ink(1.7);
    rect(x + w * 0.42, TOP + 16, 2, 300 - TOP - 18, wh(0.25));
    var ring = function (y, h, inset) { rr(x + inset, y, w - 2 * inset, h, 4); fill(cyl(x + inset, x + w - inset)); ink(1.5); rect(x + inset + 3, y + 1.5, w - 2 * inset - 6, 1, wh(0.25)); };
    ring(TOP - 3, 22, 0); ring(TOP + 15, 8, 4); ring(196, 14, 3);
    ring(296, 12, 3);
    rr(x - 2, 306, w + 4, WB + 6 - 306, 6); fill(cyl(x - 2, x + w + 2)); ink(1.7);
    rect(x + 3, 308, w - 6, 1, wh(0.25)); line(x - 2, 340, x + w + 2, 340, css(P.ink, 0.45), 1.1);
  };
  PIL.girder = function (b) {
    var x = b.x0, w = b.pw, fw = 12, y0 = TOP - 3, y1 = WB + 4;
    aoSides(x, x + w); floorShadow(x, w); beam(x, w);
    rect(x + fw, y0, w - 2 * fw, y1 - y0, mix(P.pil, P.ink, 0.5));
    rect(x + fw, y0, 6, y1 - y0, css(P.ink, 0.3));
    G.save(); G.beginPath(); G.rect(x + fw, y0, w - 2 * fw, y1 - y0); G.clip();
    G.beginPath();
    for (var yy = TOP + 20; yy < y1; yy += 64) { G.moveTo(x + fw, yy); G.lineTo(x + w - fw, yy + 52); G.moveTo(x + w - fw, yy); G.lineTo(x + fw, yy + 52); }
    strk(P.ink, 7); strk(P.pilLo, 4.4);
    G.beginPath();
    for (yy = TOP + 20; yy < y1; yy += 64) { G.moveTo(x + fw, yy - 1.6); G.lineTo(x + w - fw, yy + 50.4); }
    strk(wh(0.12), 1);
    G.restore();
    for (var s = 0; s < 2; s++) {
      var fx = s ? x + w - fw : x;
      rect(fx, y0, fw, y1 - y0, hg(fx, fx + fw, s ? P.pilLo : P.pilHi, s ? P.pilDk : P.pil));
      G.beginPath(); G.rect(fx, y0, fw, y1 - y0); ink(1.6);
      for (yy = TOP + 14; yy < y1 - 8; yy += 22) bolt(fx + fw / 2, yy, 1.4);
    }
    for (var k = 0; k < 2; k++) {
      var py = k ? 338 : TOP - 3;
      rr(x - 4, py, w + 8, k ? WB + 8 - 338 : 14, 2); fill(vg(py, py + 14, P.pilHi, P.pilLo)); ink(1.5);
      rect(x - 3, py + 1.4, w + 6, 1, wh(0.2));
    }
  };
  PIL.arch = function (b) {
    var x = b.x0, w = b.pw;
    aoSides(x + 6, x + w - 6); floorShadow(x, w); beam(x, w);
    var y0 = TOP + 16, y1 = 300;
    rect(x + 6, y0, w - 12, y1 - y0, hg(x + 6, x + w - 6, P.pilLo, P.pilHi, P.pil, P.pilLo));
    G.beginPath(); G.rect(x + 6, y0, w - 12, y1 - y0); ink(1.7);
    for (var f = 0; f < 4; f++) {
      var fx = x + 17 + f * (w - 34) / 3;
      rr(fx - 3, y0 + 14, 6, y1 - y0 - 28, 3); fill(mix(P.pil, P.ink, 0.25)); ink(1, 0.6);
      rect(fx + 1, y0 + 16, 1, y1 - y0 - 32, wh(0.15));
    }
    rr(x, TOP - 3, w, 24, 3); fill(vg(TOP - 3, TOP + 18, P.pilHi, P.pilLo)); ink(1.6);
    rect(x, TOP + 8, w, 3, css(P.feat2, 0.95)); line(x, TOP + 11, x + w, TOP + 11, css(P.ink, 0.6), 1);
    rr(x - 3, y1, w + 6, WB + 6 - y1, 3); fill(vg(y1, WB + 6, P.pilHi, P.pil, P.pilLo)); ink(1.7);
    rect(x - 3, y1 + 8, w + 6, 3, css(P.feat2, 0.95)); line(x - 3, y1 + 11, x + w + 3, y1 + 11, css(P.ink, 0.6), 1);
    rect(x, y1 + 1.5, w, 1, wh(0.25));
    line(x - 3, 342, x + w + 3, 342, css(P.ink, 0.45), 1.1);
  };
  function plate(b) {
    var n = String(1000 + ((b.k * NBAY + b.i) % 9000)).slice(1), cx = b.x0 + b.pw / 2;
    var y = b.Z.pillar === "slab" ? 114 : 236;
    rr(cx - 13, y, 26, 13, 2); fill(mix(P.pil, P.ink, 0.62)); ink(1.1);
    digits(n, cx - 10.6, y + 3, 1.6, css(CREAM, 0.72));
  }
  function pillarPass(b) {
    if (b.x0 > LC1 + 20 || b.x0 + b.pw < LC0 - 30) return;
    P = bpal(b, b.x0 + b.pw / 2);
    PIL[b.Z.pillar](b);
    plate(b);
  }

  // ---------- chunk cache ----------
  var S = 0, SX = 1, NPX = 0, MPX = 0, YPX0 = 0;
  var chunks = {}, pool_ = [], nChunks = 0;
  var PASSES = [wallPass, glowPass, upperPass, itemPass, lightPass, pillarPass];
  function setScale(scale) {
    S = scale; NPX = Math.max(8, Math.round(CW * scale)); SX = NPX / CW;
    YPX0 = Math.round(CY0 * scale); MPX = Math.ceil(CYB * scale) - YPX0;
    for (var k in chunks) pool_.push(chunks[k]);
    chunks = {}; nChunks = 0;
    starA = starB = null; planetCache = {}; giantSprite = null; reactorGrad = null; hazeGrad = {};
  }
  function renderChunk(ci) {
    var cv = pool_.pop() || document.createElement("canvas");
    if (cv.width !== NPX || cv.height !== MPX) { cv.width = NPX; cv.height = MPX; }
    var g = cv.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, NPX, MPX);
    G = g;
    var cx0 = ci * CW, cx1 = cx0 + CW, list = [], k, i;
    for (k = Math.floor((cx0 - 80) / ZW); k <= Math.floor((cx1 + 80) / ZW); k++) {
      var L = zone(k);
      for (i = 0; i < L.bays.length; i++) {
        var b = L.bays[i];
        if (L.oz + b.x0 - 60 < cx1 && L.oz + b.x0 + b.w + 60 > cx0) list.push(b);
      }
    }
    // base fill so nothing is ever left transparent
    var kc = Math.floor((cx0 + CW / 2) / ZW);
    g.setTransform(SX, 0, 0, S, 0, -YPX0);
    P = palAt(kc, cx0 + CW / 2 - kc * ZW);
    g.fillStyle = css(P.wallB); g.fillRect(-1, CY0, CW + 2, WB - CY0);
    for (var p = 0; p < PASSES.length; p++) {
      for (i = 0; i < list.length; i++) {
        var bb = list[i], oz = bb.k * ZW;
        g.setTransform(SX, 0, 0, S, (oz - cx0) * SX, -YPX0);
        LC0 = cx0 - oz; LC1 = cx1 - oz;
        PASSES[p](bb);
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    chunks[ci] = cv; nChunks++;
    return cv;
  }

  // ---------- far layer (seen through windows) ----------
  var starA = null, starB = null, planetCache = {}, reactorGrad = null, hazeGrad = {};
  function makeStars(seed, n, big) {
    var c = document.createElement("canvas");
    c.width = Math.round(STW * S); c.height = Math.round(STH * S);
    var g = c.getContext("2d"); g.scale(c.width / STW, c.height / STH);
    var cols = ["255,243,222", "255,255,255", "140,245,207", "255,190,220", "200,190,255"];
    for (var i = 0; i < n; i++) {
      var x = hash(seed + i * 3) * STW, y = hash(seed + i * 3 + 1) * STH, s = hash(seed + i * 3 + 2);
      var col = cols[s < 0.55 ? 0 : s < 0.75 ? 1 : s < 0.85 ? 2 : s < 0.93 ? 3 : 4];
      var rad = big ? 0.8 + s * 0.9 : 0.5 + s * 0.45, a = big ? 0.55 + 0.4 * s : 0.35 + 0.35 * s;
      for (var d = -1; d <= 1; d++) {
        var xx = x + d * STW;
        if (xx < -6 || xx > STW + 6) continue;
        g.fillStyle = "rgba(" + col + "," + a.toFixed(2) + ")";
        g.beginPath(); g.arc(xx, y, rad, 0, TAU); g.fill();
        if (big && s > 0.86) {
          g.strokeStyle = "rgba(" + col + ",0.45)"; g.lineWidth = 0.7;
          g.beginPath(); g.moveTo(xx - 4, y); g.lineTo(xx + 4, y); g.moveTo(xx, y - 4); g.lineTo(xx, y + 4); g.stroke();
        }
      }
    }
    return c;
  }
  var PLAN = [
    { r: 30, a: "#86D9C8", b: "#3E8584" },
    { r: 44, a: "#E3B577", b: "#9C5F3A", bands: 1 },
    { r: 38, a: "#B9A8F2", b: "#5F4CB0", ring: 1 },
    { r: 40, a: "#93D3A3", b: "#3D7A6C", bands: 1 },
    { r: 84, a: "#FFBC92", b: "#C4607A", ring: 1, bands: 1 },
    { r: 34, a: "#E4F6FF", b: "#86AFCF" },
    { r: 46, a: "#A6CBE8", b: "#5D8C7B", bands: 1 },
    { r: 24, a: "#8EA3DA", b: "#3D4B88", ring: 1 },
    { r: 50, a: "#FFA6CA", b: "#AA4C84", ring: 1 },
    { r: 40, a: "#F2D48C", b: "#9C733A" },
    { r: 32, a: "#FFB28E", b: "#B94E3A", bands: 1 },
    { r: 54, a: "#86D3F0", b: "#2D6C98", bands: 1 }
  ];
  function planetSprite(z, R, ring) {
    var key = z * 1000 + R * 2 + (ring ? 1 : 0);
    if (planetCache[key]) return planetCache[key];
    var sp = PLAN[z], ext = ring ? R * 1.8 + 3 : R + 3, hgt = ring ? R + 8 : R + 3;
    var c = document.createElement("canvas");
    c.width = Math.ceil(ext * 2 * S); c.height = Math.ceil(hgt * 2 * S);
    var g = c.getContext("2d"); g.scale(S, S); g.translate(ext, hgt);
    var A = hex(sp.a), B = hex(sp.b), D = mix(B, [10, 8, 30], 0.6);
    function ringPath(front) {
      g.save(); g.rotate(-0.18); g.beginPath();
      g.ellipse(0, 0, R * 1.72, R * 0.36, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
      g.restore();
    }
    if (ring) { ringPath(false); g.strokeStyle = css(D, 0.9); g.lineWidth = Math.max(3, R * 0.14); g.stroke(); g.strokeStyle = css(mix(A, B, 0.3), 0.85); g.lineWidth = Math.max(1.6, R * 0.08); g.stroke(); }
    var gr = g.createRadialGradient(-R * 0.35, -R * 0.35, R * 0.1, 0, 0, R);
    gr.addColorStop(0, css(lit(A, 0.2))); gr.addColorStop(0.6, css(A)); gr.addColorStop(1, css(mix(A, B, 0.55)));
    g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fillStyle = gr; g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
    if (sp.bands && R > 14) {
      g.fillStyle = css(B, 0.26);
      for (var i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(0, i * R * 0.36, R * 1.2, R * 0.07 + Math.abs(i) * R * 0.012, -0.08, 0, TAU); g.fill(); }
    }
    g.beginPath(); g.arc(R * 0.55, R * 0.42, R * 1.18, 0, TAU); g.fillStyle = css(D, 0.5); g.fill();
    g.restore();
    g.beginPath(); g.arc(0, 0, R, 0, TAU); g.strokeStyle = css(D, 0.9); g.lineWidth = 1.4; g.stroke();
    if (ring) { ringPath(true); g.strokeStyle = css(D, 0.9); g.lineWidth = Math.max(3, R * 0.14); g.stroke(); g.strokeStyle = css(lit(mix(A, B, 0.3), 0.15), 0.9); g.lineWidth = Math.max(1.6, R * 0.08); g.stroke(); }
    planetCache[key] = { c: c, ext: ext, hgt: hgt };
    return planetCache[key];
  }
  // the once-per-loop landmark: a huge banded gas giant rising beyond the sunset deck
  // Huge and far: through the deck windows it reads as a broad banded horizon dome, never a thin sliver.
  var GR = 430, GTOP = 178, GH = 120, giantSprite = null;
  function makeGiant() {
    var c = document.createElement("canvas"), W = 2 * GR + 8;
    c.width = Math.ceil(W * S); c.height = Math.ceil(GH * S);
    var g = c.getContext("2d"); g.scale(S, S); g.translate(W / 2, GR);   // the sprite holds only the top GH units of the disc
    var A = [214, 140, 128], B = [160, 84, 118], D = [56, 30, 72];   // dusky, so the punk's cap stays the brighter shape
    var gr = g.createRadialGradient(-GR * 0.2, -GR * 0.75, GR * 0.05, 0, 0, GR);
    gr.addColorStop(0, css(mix(A, [255, 220, 196], 0.22))); gr.addColorStop(0.7, css(A)); gr.addColorStop(1, css(mix(A, B, 0.55)));
    g.beginPath(); g.arc(0, 0, GR, 0, TAU); g.fillStyle = gr; g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, GR, 0, TAU); g.clip();
    var bands = [[14, 7, 0.22], [30, 12, 0.3], [52, 6, 0.2], [68, 15, 0.32], [92, 8, 0.24], [108, 12, 0.28]];
    for (var i = 0; i < bands.length; i++) {
      var by = -GR + bands[i][0];
      g.beginPath(); g.moveTo(-GR, by);
      for (var x = -GR; x <= GR; x += 20) g.lineTo(x, by + Math.sin(x * 0.011 + i) * 2.2);
      for (x = GR; x >= -GR; x -= 20) g.lineTo(x, by + bands[i][1] + Math.sin(x * 0.013 + i * 2) * 2.2);
      g.closePath(); g.fillStyle = css(B, bands[i][2]); g.fill();
    }
    g.beginPath(); g.ellipse(GR * 0.18, -GR + 76, 30, 9, 0, 0, TAU); g.fillStyle = css(mix(B, A, 0.25), 0.5); g.fill();
    g.strokeStyle = css(D, 0.3); g.lineWidth = 1; g.stroke();
    // limb darkening and the night side to the right
    var lg = g.createRadialGradient(0, 0, GR * 0.86, 0, 0, GR);
    lg.addColorStop(0, css(D, 0)); lg.addColorStop(1, css(D, 0.45));
    g.fillStyle = lg; g.fillRect(-GR, -GR, 2 * GR, GH);
    g.fillStyle = hg2(g, GR * 0.15, GR * 0.75, css(D, 0), css(D, 0.42)); g.fillRect(GR * 0.15, -GR, GR, GH);
    g.restore();
    g.beginPath(); g.arc(0, 0, GR, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = css(D, 0.85); g.lineWidth = 1.6; g.stroke();
    giantSprite = { c: c, W: W };
  }
  function hg2(g, x0, x1, a, b) { var q = g.createLinearGradient(x0, 0, x1, 0); q.addColorStop(0, a); q.addColorStop(1, b); return q; }
  function tileLayer(ctx, img, off, x0, x1) {
    var o = -(((off % STW) + STW) % STW), start = o + Math.floor((x0 - o) / STW) * STW;
    for (var x = start; x < x1; x += STW) ctx.drawImage(img, Math.round(x * S) / S, STY, STW, STH);
  }
  function drawFar(ctx, wins, dist, VW) {
    if (!starA) { starA = makeStars(101, 150, false); starB = makeStars(907, 46, true); }
    for (var i = 0; i < wins.length; i++) {
      var w = wins[i], x0 = w.x - 2, x1 = w.x + w.w + 2;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, w.y - 2, w.w + 4, w.h + 4); ctx.clip();
      ctx.fillStyle = css(w.P.space); ctx.fillRect(x0, w.y - 2, w.w + 4, w.h + 4);
      tileLayer(ctx, starA, dist * FARS, x0, x1);
      tileLayer(ctx, starB, dist * FARN, x0, x1);
      var o = w.spec.obj;
      if (w.spec.giant) {
        if (!giantSprite) makeGiant();
        // the dome's crest always sits inside its own glass and lags the frame a little for depth
        var gc = w.x + w.w / 2, gN = (gc - VW / 2) / (VW / 2 + w.w / 2);
        gN = gN < -1 ? -1 : gN > 1 ? 1 : gN;
        var gx = gc - w.w * 0.38 * gN;
        ctx.drawImage(giantSprite.c, Math.round((gx - giantSprite.W / 2) * S) / S, GTOP, giantSprite.c.width / S, giantSprite.c.height / S);
        var hy = w.y + w.h, hz = hazeGrad[hy];
        if (!hz) {
          hz = hazeGrad[hy] = ctx.createLinearGradient(0, hy - 70, 0, hy);
          hz.addColorStop(0, "rgba(255,160,130,0)"); hz.addColorStop(1, "rgba(255,160,130,0.09)");
        }
        ctx.fillStyle = hz; ctx.fillRect(x0, hy - 70, w.w + 4, 72);
      } else if (o) {
        // a complete object that drifts a little inside its window for depth, never cut by the frame
        var cxw = w.x + w.w / 2, sN = (cxw - VW / 2) / (VW / 2 + w.w / 2);
        sN = sN < -1 ? -1 : sN > 1 ? 1 : sN;
        var ps = planetSprite(o.z, o.R, o.ring), px = cxw - o.A * w.kx * sN, py = w.y + w.h * o.fy;
        ctx.drawImage(ps.c, Math.round((px - ps.ext) * S) / S, Math.round((py - ps.hgt) * S) / S, ps.c.width / S, ps.c.height / S);
      }
      ctx.restore();
    }
  }

  // ---------- floor ----------
  var FFADE = 600, floorKey = -1, gFloor = null, gSheen = null, gChan = null, reflSprite = null;
  function persp(gx, y, vx) { return vx + (gx - vx) * (y - HOR) / (GROUND - HOR); }
  function quad(ctx, xa, xb, ya, yb, vx) {
    ctx.moveTo(persp(xa, ya, vx), ya); ctx.lineTo(persp(xb, ya, vx), ya);
    ctx.lineTo(persp(xb, yb, vx), yb); ctx.lineTo(persp(xa, yb, vx), yb); ctx.closePath();
  }
  function drawFloor(ctx, dist, VW, vis) {
    var PF = palAtU(dist + VW * 0.55), vx = VW / 2, i, r, gx;
    if (PF.key !== floorKey) {
      floorKey = PF.key;
      gFloor = ctx.createLinearGradient(0, 346, 0, 552);
      gFloor.addColorStop(0, css(mix(PF.floorB, PF.ink, 0.5)));
      gFloor.addColorStop(0.05, css(mix(PF.floorB, PF.ink, 0.22)));
      gFloor.addColorStop(0.09, css(PF.floorB));
      gFloor.addColorStop(0.2, css(mix(PF.floorB, PF.floorA, 0.55)));
      gFloor.addColorStop(0.23, css(mix(PF.floorB, PF.floorA, 0.8)));
      gFloor.addColorStop(0.45, css(lit(PF.floorA, 0.04)));
      gFloor.addColorStop(1, css(mix(PF.floorA, PF.floorB, 0.4)));
      gSheen = ctx.createLinearGradient(0, 393, 0, 470);
      gSheen.addColorStop(0, css(PF.glow, 0.1)); gSheen.addColorStop(1, css(PF.glow, 0));
      gChan = css(mix(PF.grout, PF.floorB, 0.3));
      if (!reflSprite) {
        reflSprite = document.createElement("canvas"); reflSprite.width = 32; reflSprite.height = 64;
        var rg = reflSprite.getContext("2d"), id = rg.createImageData(32, 64);
        for (var yy = 0; yy < 64; yy++) for (var xx = 0; xx < 32; xx++) {
          var fx = 1 - Math.abs((xx + 0.5) / 16 - 1), fy = 1 - (yy + 0.5) / 64, k = (yy * 32 + xx) * 4;
          id.data[k] = id.data[k + 1] = id.data[k + 2] = 255; id.data[k + 3] = Math.round(255 * 0.11 * Math.min(1, fx * 2.2) * fy * fy);
        }
        rg.putImageData(id, 0, 0);
      }
    }
    ctx.fillStyle = gFloor; ctx.fillRect(-14, 346, VW + 28, 208);
    // pillar reflections (they move with the wall)
    for (i = 0; i < vis.length; i++) {
      var v = vis[i], b = v.b;
      var pc = v.zb + (b.x0 + b.pw / 2) * v.kx, pw2 = b.pw * 0.5 * v.kx;
      if (pc + pw2 < -14 || pc - pw2 > VW + 14) continue;
      ctx.drawImage(reflSprite, pc - pw2, 352, pw2 * 2, 120);
    }
    var fmin = (356 - HOR) / (GROUND - HOR);
    var gx0 = vx - (vx + 20) / fmin - T, gx1 = vx + (VW - vx + 20) / fmin + T;
    var i0 = Math.floor((gx0 + dist) / T), i1 = Math.ceil((gx1 + dist) / T);
    // tile shading by zone style; the style changes once, at the zone's own threshold tile
    var pathL = new Path2D(), pathD = new Path2D(), pathI = new Path2D(), grates = [], segs = [];
    var ROWS2 = [356, 384, 393, 404, 418, 438, 466, 502, 540];
    var lastGrate = -9;
    for (i = i0; i <= i1; i++) {
      var xa = i * T - dist, xb = xa + T, zk = Math.floor((i * T + T / 2) / ZL), zz = ZDEF[zt(zk)], st = zz.floor;
      var sg = segs[segs.length - 1];
      if (!sg || sg.zk !== zk) segs.push({ zk: zk, Z: zz, xa: xa, xb: xb, i0: i, i1: i });
      else { sg.xb = xb; sg.i1 = i; }
      for (r = 0; r < ROWS2.length - 1; r++) {
        if (r === 1) continue;
        var ya = ROWS2[r], yb = ROWS2[r + 1], h = h2(i, r);
        if (st === "check") { if ((i + r) & 1) quad(pathD, xa, xb, ya, yb, vx); else if (h < 0.3) quad(pathL, xa, xb, ya, yb, vx); }
        else if (h > 0.55) quad(h > 0.8 ? pathD : pathL, xa, xb, ya, yb, vx);
        if (st === "grid" && r >= 4) {
          var mxp = xa + T / 2;
          pathI.moveTo(persp(mxp, ya, vx), ya); pathI.lineTo(persp(mxp, yb, vx), yb);
        }
      }
      if (zz.grate && i - lastGrate > 3 && hash(i * 31 + 5) < zz.grate) { grates.push(xa); lastGrate = i; }
    }
    ctx.fillStyle = "rgba(255,255,255,0.04)"; ctx.fill(pathL);
    ctx.fillStyle = css(PF.ink, 0.06); ctx.fill(pathD);
    ctx.strokeStyle = css(PF.grout, 0.3); ctx.lineWidth = 1; ctx.stroke(pathI);
    // grout
    ctx.beginPath();
    for (i = i0; i <= i1; i++) {
      gx = i * T - dist;
      ctx.moveTo(persp(gx, 356, vx), 356); ctx.lineTo(persp(gx, 384, vx), 384);
      ctx.moveTo(persp(gx, 393, vx), 393); ctx.lineTo(persp(gx, 552, vx), 552);
    }
    for (r = 3; r < ROWS2.length - 1; r++) { ctx.moveTo(-14, ROWS2[r]); ctx.lineTo(VW + 14, ROWS2[r]); }
    ctx.strokeStyle = css(PF.grout, 0.55); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath();
    for (r = 3; r < ROWS2.length - 1; r++) { ctx.moveTo(-14, ROWS2[r] + 1.4); ctx.lineTo(VW + 14, ROWS2[r] + 1.4); }
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1; ctx.stroke();
    // zone floor features: muted runners (lounge, archive), a painted lane (engineering), a gutter (reactor).
    // Each one fades in over the first FFADE run units of its zone and out over the last, so nothing
    // on the floor ever starts or stops with a hard edge.
    for (i = 0; i < segs.length; i++) {
      var sgm = segs[i], Zf = sgm.Z;
      if (!Zf.runner && Zf.floor !== "lane" && Zf.floor !== "gutter") continue;
      var za = sgm.zk * ZL - dist, zb2 = za + ZL;
      var fa = Math.max(za, -T - 40), fb = Math.min(zb2, VW + T + 40);
      if (fb <= fa) continue;
      var fade = za + FFADE > -40 || zb2 - FFADE < VW + 40;
      var fs = function (col, a) {
        if (!fade) return css(col, a);
        var q = ctx.createLinearGradient(za, 0, zb2, 0), f0 = FFADE / ZL;
        q.addColorStop(0, css(col, 0)); q.addColorStop(f0, css(col, a));
        q.addColorStop(1 - f0, css(col, a)); q.addColorStop(1, css(col, 0));
        return q;
      };
      if (Zf.runner) {
        var rc = mix(Zf.runner, PF.floorA, 0.42), edge = Zf.wall === "archive" ? mix(Zf.p.feat2, rc, 0.2) : mix(Zf.p.feat, rc, 0.5);
        ctx.beginPath(); quad(ctx, fa, fb, 422, 474, vx); ctx.fillStyle = fs(rc, 0.7); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(persp(fa, 422, vx), 422); ctx.lineTo(persp(fb, 422, vx), 422);
        ctx.moveTo(persp(fa, 474, vx), 474); ctx.lineTo(persp(fb, 474, vx), 474);
        ctx.strokeStyle = fs(PF.ink, 0.32); ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(persp(fa, 426.5, vx), 426.5); ctx.lineTo(persp(fb, 426.5, vx), 426.5);
        ctx.moveTo(persp(fa, 469.5, vx), 469.5); ctx.lineTo(persp(fb, 469.5, vx), 469.5);
        ctx.strokeStyle = fs(edge, 0.62); ctx.lineWidth = 1.1; ctx.stroke();
      } else if (Zf.floor === "lane") {
        ctx.fillStyle = fs(mix(Zf.p.led, PF.floorA, 0.5), 0.55);
        ctx.fillRect(persp(fa, 408, vx), 408, persp(fb, 408, vx) - persp(fa, 408, vx), 1.6);
        ctx.fillRect(persp(fa, 496, vx), 496, persp(fb, 496, vx) - persp(fa, 496, vx), 2.2);
      } else {
        ctx.fillStyle = fs(PF.ink, 0.22); ctx.fillRect(persp(fa, 519, vx), 519, persp(fb, 519, vx) - persp(fa, 519, vx), 3);
        ctx.fillStyle = fs(WHITE, 0.08); ctx.fillRect(persp(fa, 522, vx), 522, persp(fb, 522, vx) - persp(fa, 522, vx), 1);
      }
    }
    // small, low contrast drain grates, only in the back rows behind the feet line
    for (i = 0; i < grates.length; i++) {
      var ga = grates[i] + 20, gb = grates[i] + T - 20;
      ctx.beginPath(); quad(ctx, ga, gb, 396, 416, vx); ctx.fillStyle = css(PF.grout, 0.22); ctx.fill();
      ctx.beginPath();
      for (var gy = 400; gy < 415; gy += 4) { ctx.moveTo(persp(ga + 3, gy, vx), gy); ctx.lineTo(persp(gb - 3, gy, vx), gy); }
      ctx.strokeStyle = css(PF.grout, 0.3); ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); quad(ctx, ga, gb, 396, 416, vx); ctx.strokeStyle = css(PF.ink, 0.25); ctx.lineWidth = 1; ctx.stroke();
    }
    // walkway lip and guide channel along the wall
    ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(-14, 356, VW + 28, 1);
    ctx.fillStyle = gChan; ctx.fillRect(-14, 385, VW + 28, 7.4);
    ctx.fillStyle = "rgba(255,255,255,0.13)"; ctx.fillRect(-14, 383.2, VW + 28, 1);
    ctx.fillStyle = css(PF.glow, 0.42); ctx.fillRect(-14, 387.6, VW + 28, 1.6);
    ctx.fillStyle = css(PF.ink, 0.5); ctx.fillRect(-14, 392.2, VW + 28, 1);
    ctx.fillStyle = gSheen; ctx.fillRect(-14, 393.5, VW + 28, 78);
  }

  // ---------- live touches ----------
  function drawLive(ctx, vis, t) {
    for (var i = 0; i < vis.length; i++) {
      var v = vis[i], items = v.b.items;
      for (var j = 0; j < items.length; j++) {
        var lv = items[j].lv;
        if (!lv || !lv.length) continue;
        ctx.save(); ctx.translate(v.zb, 0); ctx.scale(v.kx, 1);
        for (var q = 0; q < lv.length; q++) {
          var l = lv[q], a;
          if (l.k === "led") {
            a = 0.5 + 0.5 * Math.sin((t / l.per + l.ph) * TAU); a = a * a * (3 - 2 * a);
            ctx.globalAlpha = a;
            ctx.fillStyle = l.c2; ctx.beginPath(); ctx.arc(l.x, l.y, l.r + 1.8, 0, TAU); ctx.fill();
            ctx.fillStyle = l.c; ctx.beginPath(); ctx.arc(l.x, l.y, l.r * 0.85, 0, TAU); ctx.fill();
            ctx.globalAlpha = 1;
          } else if (l.k === "cur") {
            a = 0.5 + 0.5 * Math.sin(t / 1400 * TAU); a = a * a * (3 - 2 * a);
            ctx.globalAlpha = 0.25 + 0.75 * a; ctx.fillStyle = l.c; ctx.fillRect(l.x, l.y, 5, 2.4); ctx.globalAlpha = 1;
          } else if (l.k === "holo") {
            ctx.strokeStyle = l.c; ctx.lineWidth = 2; ctx.beginPath();
            var ha = t * 0.0006; ctx.arc(l.x, l.y, l.r, ha, ha + 1.6); ctx.stroke();
          } else if (l.k === "ring") {
            var ra = t * 0.00022;
            ctx.strokeStyle = l.c; ctx.lineWidth = 3;
            for (var s = 0; s < 3; s++) { ctx.beginPath(); ctx.arc(l.x, l.y, l.r * 0.6, ra + s * TAU / 3, ra + s * TAU / 3 + 1.1); ctx.stroke(); }
            if (!reactorGrad) {
              reactorGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
              reactorGrad.addColorStop(0, "rgba(255,186,150,0.2)"); reactorGrad.addColorStop(1, "rgba(255,186,150,0)");
            }
            ctx.save(); ctx.translate(l.x, l.y); ctx.scale(l.r * 0.5, l.r * 0.5);
            ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t / 2600 * TAU);
            ctx.fillStyle = reactorGrad; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
            ctx.restore(); ctx.globalAlpha = 1;
          } else if (l.k === "bub") {
            ctx.save(); ctx.beginPath(); ctx.rect(l.x + 2, l.y, l.w - 4, l.h); ctx.clip();
            ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1;
            ctx.beginPath();
            for (var bq = 0; bq < 9; bq++) {
              var bx = l.x + 10 + (l.w - 20) * hash(l.s * 31 + bq), sp = 0.012 + 0.01 * hash(l.s * 17 + bq);
              var by = l.y + l.h - ((t * sp + hash(l.s * 7 + bq) * l.h) % l.h), br = 1.4 + 2 * hash(l.s + bq * 13);
              bx += Math.sin(t / 900 + bq) * 2.5;
              ctx.moveTo(bx + br, by); ctx.arc(bx, by, br, 0, TAU);
            }
            ctx.stroke(); ctx.restore();
          }
        }
        ctx.restore();
      }
    }
  }

  // ---------- frame ----------
  var visBays = [];
  function draw(ctx, dist, t, VW, scale) {
    if (scale !== S) setScale(scale);
    var m = ctx.getTransform ? ctx.getTransform() : null;
    var fe = m ? m.e - Math.round(m.e) : 0, ff = m ? m.f - Math.round(m.f) : 0;
    var scroll = dist * WD, spx = Math.round(scroll * SX);
    var c0 = Math.floor((spx - 16 * S) / NPX), c1 = Math.floor((spx + (VW + 16) * S) / NPX), c;
    for (c = c0; c <= c1; c++) if (!chunks[c]) renderChunk(c);
    for (c = c1 + 1; c <= c1 + 2; c++) if (!chunks[c]) { renderChunk(c); break; }
    if (nChunks > c1 - c0 + 6) {
      for (var key in chunks) {
        var kn = +key;
        if (kn < c0 - 1 || kn > c1 + 3) { pool_.push(chunks[key]); delete chunks[key]; nChunks--; }
      }
    }
    // visible bays, with their screen mapping
    visBays.length = 0;
    var wx0 = (spx - 20 * S) / SX, wx1 = (spx + (VW + 20) * S) / SX, kx = SX / S;
    for (var k = Math.floor(wx0 / ZW); k <= Math.floor(wx1 / ZW); k++) {
      var L = zone(k), zb = (L.oz * SX - spx - fe) / S;
      for (var i = 0; i < L.bays.length; i++) {
        var b = L.bays[i];
        if (L.oz + b.x0 < wx1 + 40 && L.oz + b.x0 + b.w > wx0 - 40) visBays.push({ b: b, zb: zb, kx: kx });
      }
    }
    // far layer through the windows
    var wins = [];
    for (i = 0; i < visBays.length; i++) {
      var v = visBays[i], it = v.b.items;
      for (var j = 0; j < it.length; j++) {
        var wl = it[j].win;
        if (!wl) continue;
        for (var q = 0; q < wl.length; q++) {
          var wn = wl[q], sx = v.zb + wn.x * v.kx;
          if (sx > VW + 14 || sx + wn.w * v.kx < -14) continue;
          wins.push({ x: sx, y: wn.y, w: wn.w * v.kx, h: wn.h, kx: v.kx, spec: wn, dmid: v.b.k * ZL + ZL * 0.5 - 942, P: bpal(v.b, wn.x + wn.w / 2) });
        }
      }
    }
    if (wins.length) drawFar(ctx, wins, dist, VW);
    drawFloor(ctx, dist, VW, visBays);
    // wall chunks, pixel aligned
    var yTop = (YPX0 - ff) / S, cw = NPX / S, chh = MPX / S;
    for (c = c0; c <= c1; c++) ctx.drawImage(chunks[c], (c * NPX - spx - fe) / S, yTop, cw, chh);
    drawLive(ctx, visBays, t);
  }

  window.PacePunksCorridor = { draw: draw };
})();
