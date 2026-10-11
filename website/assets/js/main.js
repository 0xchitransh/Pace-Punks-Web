/* Pace Punks early access site */
(function () {
  "use strict";

  var CFG = window.PACE_PUNKS_CONFIG || { signup: { provider: "demo" }, social: {} };
  var PUNKS = window.PUNKS || [];
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var pad = function (n) { return String(n).padStart(4, "0"); };
  var full = function (id) { return "assets/punks/" + pad(id) + ".webp"; };
  var thumb = function (id) { return "assets/punks/thumb/" + pad(id) + ".webp"; };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };

  /* ---------- Hero skyline (drawn at low res, scaled up pixelated) ---------- */
  function drawSky() {
    var c = $("#sky"); if (!c) return;
    var g = c.getContext("2d"), W = c.width, H = c.height;
    var seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    g.clearRect(0, 0, W, H);
    // back layer
    var x = 0;
    while (x < W) {
      var w = 10 + Math.floor(rnd() * 18), h = 30 + Math.floor(rnd() * 55);
      g.fillStyle = "#2A1F5C"; g.fillRect(x, H - h, w, h);
      x += w + Math.floor(rnd() * 3);
    }
    // front layer with windows
    x = -4;
    var lights = ["#3EE6D2", "#FFC93D", "#FF4FA3", "#FF7A3D"];
    while (x < W) {
      var fw = 14 + Math.floor(rnd() * 22), fh = 18 + Math.floor(rnd() * 46);
      g.fillStyle = "#140F33"; g.fillRect(x, H - fh, fw, fh);
      if (rnd() > .6) { g.fillRect(x + Math.floor(fw / 2), H - fh - 6, 1, 6); g.fillStyle = "#FF4FA3"; g.fillRect(x + Math.floor(fw / 2), H - fh - 7, 1, 1); }
      for (var wy = H - fh + 3; wy < H - 4; wy += 4) {
        for (var wx = x + 2; wx < x + fw - 2; wx += 3) {
          if (rnd() > .78) { g.fillStyle = lights[Math.floor(rnd() * lights.length)]; g.globalAlpha = .55 + rnd() * .45; g.fillRect(wx, wy, 1, 2); g.globalAlpha = 1; }
        }
      }
      x += fw + Math.floor(rnd() * 4);
    }
    // street line
    g.fillStyle = "#0B0820"; g.fillRect(0, H - 3, W, 3);
  }

  /* ---------- Hero stage: pixel dissolve between featured Punks ---------- */
  function stage() {
    var c = $("#stageCanvas"); if (!c) return;
    var g = c.getContext("2d"); g.imageSmoothingEnabled = false;
    var picks = [8, 1, 16, 2, 17, 14];
    var imgs = {}, idx = 0, label = $("#stageName");
    function load(id) {
      if (imgs[id]) return imgs[id];
      var im = new Image(); im.decoding = "async"; im.src = full(id);
      imgs[id] = new Promise(function (res) { im.onload = function () { res(im); }; im.onerror = function () { res(null); }; });
      return imgs[id];
    }
    load(picks[0]).then(function (im) {
      if (im) g.drawImage(im, 0, 0, 627, 627);
      c.setAttribute("aria-label", "Pace Punk #" + pad(picks[0]));
      picks.slice(1).forEach(load);
      if (REDUCED) return;
      setInterval(next, 3600);
    });
    function next() {
      if (document.hidden) return;
      idx = (idx + 1) % picks.length;
      var id = picks[idx];
      load(id).then(function (im) {
        if (!im) return;
        var N = 33, S = 19, cells = [];
        for (var i = 0; i < N * N; i++) cells.push(i);
        for (var j = cells.length - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = cells[j]; cells[j] = cells[k]; cells[k] = t; }
        var per = Math.ceil(cells.length / 18), p = 0;
        (function step() {
          for (var q = 0; q < per && p < cells.length; q++, p++) {
            var cx = (cells[p] % N) * S, cy = Math.floor(cells[p] / N) * S;
            g.drawImage(im, cx, cy, S, S, cx, cy, S, S);
          }
          if (p < cells.length) requestAnimationFrame(step);
        })();
        if (label) label.textContent = "#" + pad(id);
        c.setAttribute("aria-label", "Pace Punk #" + pad(id));
      });
    }
  }

  /* ---------- Marquee ---------- */
  function marquee() {
    var a = $("#marqueeA"), b = $("#marqueeB"); if (!a || !b) return;
    function fill(el, ids) {
      var html = ids.concat(ids).map(function (id) { return '<img class="px" src="' + thumb(id) + '" alt="" width="88" height="88" decoding="async">'; }).join("");
      el.innerHTML = html;
    }
    var all = PUNKS.map(function (p) { return p.id; });
    fill(a, all.filter(function (id) { return id % 2; }));
    fill(b, all.filter(function (id) { return !(id % 2); }).reverse());
  }

  /* ---------- Attribute builds ---------- */
  var BUILDS = {
    start:    { E: 20, S: 20, R: 20, M: 20, F: 20, art: 16 },
    walker:   { E: 20, S: 36, R: 26, M: 26, F: 20, art: 8 },
    grinder:  { E: 38, S: 20, R: 20, M: 20, F: 30, art: 1 },
    balanced: { E: 32, S: 32, R: 32, M: 31, F: 31, art: 14 }
  };
  function builds() {
    var tabs = document.querySelectorAll("[data-build]"); if (!tabs.length) return;
    function apply(key) {
      var b = BUILDS[key];
      document.querySelectorAll("#attrs b[data-k]").forEach(function (el) {
        var v = b[el.getAttribute("data-k")];
        el.textContent = v;
        el.closest("li").querySelector(".meter i").style.width = v + "%";
      });
      var bat = Math.floor(30 + 0.15 * b.S);
      $("#batteryOut").textContent = bat; $("#batteryS").textContent = b.S;
      var art = $("#buildArt"); art.src = full(b.art); art.alt = "Pace Punk #" + pad(b.art);
      tabs.forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("data-build") === key ? "true" : "false"); });
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { apply(t.getAttribute("data-build")); }); });
    apply("start");
  }

  /* ---------- Releases (locked schedule from the final plan) ---------- */
  var EPOCHS = [
    { e: 1, price: 4.65, score: 60 }, { e: 2, price: 9.30, score: 120 }, { e: 3, price: 18.60, score: 200 },
    { e: 4, price: 37.20, score: 300 }, { e: 5, price: 74.40, score: 420 }, { e: 6, price: 148.80, score: 560 },
    { e: 7, price: 297.60, score: 720 }, { e: 8, price: 595.20, score: 900 }, { e: 9, price: 1190.40, score: 1100 },
    { e: 10, price: 2380.80, score: 1320 }
  ];
  var money = function (v) { return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  function epochs() {
    var el = $("#epochs"); if (!el) return;
    el.innerHTML = EPOCHS.map(function (ep) {
      var cls = ep.e === 1 ? "epoch epoch--first" : ep.e <= 6 ? "epoch epoch--target" : "epoch";
      return '<div class="' + cls + '"><span class="epoch__price">' + money(ep.price) + '</span>' +
        '<div class="epoch__col" style="--h:' + (ep.e * 10) + '"></div>' +
        '<span class="epoch__e">E' + ep.e + '</span><span class="epoch__s">' + ep.score.toLocaleString("en-US") + ' score</span></div>';
    }).join("");
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Ten releases of 600 Punks. Prices double from $4.65 for release 1 to $2,380.80 for release 10. Movement Score needed rises from 60 to 1,320.");
  }

  /* ---------- Movement Score calculator ---------- */
  function dailyScore(min) {
    if (min < 10) return 0;
    var m = Math.min(30, min);
    return m + (m >= 20 ? 5 : 0);
  }
  function calc() {
    var mins = $("#mins"), days = $("#days"), ladder = $("#ladder"); if (!mins) return;
    function render() {
      var m = +mins.value, d = +days.value, s = dailyScore(m);
      $("#minsOut").textContent = m; $("#daysOut").textContent = d;
      $("#dailyScore").textContent = s; $("#weeklyScore").textContent = s * d;
      var in30 = s * d * 30 / 7;
      var rows = EPOCHS.map(function (ep) {
        var t, pct;
        if (!s) { t = "Walk 10+ min a day"; pct = 0; }
        else {
          var active = Math.ceil(ep.score / s);
          t = active + (active === 1 ? " day" : " days");
          if (active > d) t += " · ~" + Math.ceil(active / d) + " wk";
          pct = Math.min(100, in30 / ep.score * 100);
        }
        return '<div class="rung' + (ep.e === 1 ? " rung--first" : "") + '"><span class="rung__e">E' + ep.e + '</span>' +
          '<div class="rung__bar"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
          '<span class="rung__s">' + ep.score.toLocaleString("en-US") + '</span>' +
          '<span class="rung__t">' + t + '</span></div>';
      }).join("");
      ladder.innerHTML = '<div class="ladder__cap"><span>Rel.</span><span>Your first 30 days</span><span style="text-align:right">Need</span><span>Active days</span></div>' + rows;
    }
    mins.addEventListener("input", render); days.addEventListener("input", render);
    render();
  }

  /* ---------- Collection ---------- */
  var TYPES = ["Background", "Body", "Outfit", "Sneakers", "Headwear", "Eyewear", "Mouth Accessory", "Earwear"];
  var shown = PUNKS.slice();
  function gallery() {
    var grid = $("#grid"), fType = $("#fType"), fValue = $("#fValue"), count = $("#fCount"); if (!grid) return;
    TYPES.forEach(function (t) { var o = document.createElement("option"); o.value = t; o.textContent = t; fType.appendChild(o); });
    function render() {
      var t = fType.value, v = fValue.value;
      shown = PUNKS.filter(function (p) { return !t || !v || p.traits[t] === v; });
      grid.innerHTML = shown.map(function (p, i) {
        return '<button class="tile" type="button" data-i="' + i + '" aria-label="' + p.name + ', ' + p.traits.Outfit + '">' +
          '<img class="px" src="' + thumb(p.id) + '" alt="" width="320" height="320" loading="lazy" decoding="async"><span>#' + pad(p.id) + '</span></button>';
      }).join("");
      count.textContent = shown.length + (shown.length === 1 ? " Punk" : " Punks");
    }
    fType.addEventListener("change", function () {
      var t = fType.value;
      fValue.innerHTML = '<option value="">Any</option>';
      fValue.disabled = !t;
      if (t) {
        var tally = {};
        PUNKS.forEach(function (p) { var v = p.traits[t]; tally[v] = (tally[v] || 0) + 1; });
        Object.keys(tally).sort().forEach(function (v) {
          var o = document.createElement("option"); o.value = v; o.textContent = v + " (" + tally[v] + ")"; fValue.appendChild(o);
        });
      }
      render();
    });
    fValue.addEventListener("change", render);
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".tile"); if (b) openViewer(+b.getAttribute("data-i"));
    });
    render();
  }

  var dlg, cur = 0;
  function buildViewer() {
    dlg = document.createElement("dialog");
    dlg.className = "viewer";
    dlg.setAttribute("aria-labelledby", "viewerTitle");
    dlg.innerHTML = '<button class="btn btn--sm btn--ghost viewer__close" type="button" data-close>Close</button>' +
      '<div class="viewer__body"><img class="px" id="viewerImg" alt="" width="627" height="627">' +
      '<div class="viewer__info"><p class="eyebrow" id="viewerSkin"></p><h3 id="viewerTitle" style="font-family:var(--f-label);font-weight:700;font-size:1.75rem"></h3><dl id="viewerTraits"></dl>' +
      '<div class="viewer__nav"><button class="btn btn--sm btn--ghost" type="button" data-prev>Previous</button><button class="btn btn--sm btn--ghost" type="button" data-next>Next</button></div></div></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
      else if (e.target.closest("[data-prev]")) show(cur - 1);
      else if (e.target.closest("[data-next]")) show(cur + 1);
    });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(cur + 1);
      if (e.key === "ArrowLeft") show(cur - 1);
    });
  }
  function show(i) {
    if (!shown.length) return;
    cur = (i + shown.length) % shown.length;
    var p = shown[cur];
    $("#viewerImg").src = full(p.id); $("#viewerImg").alt = p.name;
    $("#viewerTitle").textContent = "#" + pad(p.id);
    $("#viewerSkin").textContent = p.traits.Body;
    $("#viewerTraits").innerHTML = TYPES.map(function (t) { return "<div><dt>" + t + "</dt><dd>" + p.traits[t] + "</dd></div>"; }).join("");
  }
  function openViewer(i) {
    if (!dlg) buildViewer();
    show(i);
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }

  /* ---------- Signup ---------- */
  function refCode(email) {
    var h = 5381; for (var i = 0; i < email.length; i++) h = ((h << 5) + h + email.charCodeAt(i)) >>> 0;
    return h.toString(36).slice(0, 6);
  }
  function shareLink(email) {
    var base = CFG.siteUrl || (/^https?:/.test(location.protocol) ? location.origin + location.pathname : "");
    if (!base) return "";
    return base + (base.indexOf("?") > -1 ? "&" : "?") + "ref=" + refCode(email);
  }
  function params() {
    var out = {};
    try { new URLSearchParams(location.search).forEach(function (v, k) { if (/^(ref|utm_source|utm_medium|utm_campaign)$/.test(k)) out[k] = v.slice(0, 64); }); } catch (e) { /* no query */ }
    return out;
  }
  function send(data) {
    var s = CFG.signup || {}, p = s.provider || "demo", url = s.endpoint;
    if (p === "demo" || !url) {
      var list = []; try { list = JSON.parse(store.get("pp_signups") || "[]"); } catch (e) { list = []; }
      list.push(data); store.set("pp_signups", JSON.stringify(list));
      return new Promise(function (r) { setTimeout(function () { r("demo"); }, 500); });
    }
    if (p === "formspree") {
      var fd = new FormData(); Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
      return fetch(url, { method: "POST", body: fd, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return "sent"; });
    }
    if (p === "google-apps-script") {
      return fetch(url, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) }).then(function () { return "sent"; });
    }
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return "sent"; });
  }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function signup() {
    var form = $("#joinForm"); if (!form) return;
    var email = $("#email"), consent = $("#consent"), btn = $("#joinBtn");

    $("#quickForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = $("#quickEmail").value.trim();
      if (v) email.value = v;
      $("#join").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
      setTimeout(function () { (EMAIL_RE.test(email.value.trim()) ? $("#osIos") : email).focus({ preventScroll: true }); }, REDUCED ? 0 : 500);
    });

    var draft = store.get("pp_draft_email"); if (draft && !email.value) email.value = draft;
    email.addEventListener("input", function () { store.set("pp_draft_email", email.value); $("#emailErr").hidden = true; });
    consent.addEventListener("change", function () { $("#consentErr").hidden = true; });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = email.value.trim(), ok = true;
      $("#sendErr").hidden = true;
      if (!EMAIL_RE.test(v)) { $("#emailErr").hidden = false; ok = false; }
      if (!consent.checked) { $("#consentErr").hidden = false; ok = false; }
      if (!ok) { (EMAIL_RE.test(v) ? consent : email).focus(); return; }
      if ($("#company").value) return; // honeypot: silently drop bots

      var handle = $("#handle").value.trim().replace(/^@+/, "");
      var plat = form.querySelector('input[name="platform"]:checked');
      var data = Object.assign({
        email: v,
        x_handle: handle ? "@" + handle : "",
        platform: plat ? plat.value : "",
        activity: $("#move").value,
        invite_code: $("#code").value.trim(),
        playtest: $("#playtest").checked ? "yes" : "no",
        consent: "yes",
        submitted_at: new Date().toISOString(),
        page: "early-access"
      }, params());

      btn.disabled = true; btn.textContent = "Joining…";
      send(data).then(function (mode) {
        store.set("pp_joined", v); store.set("pp_draft_email", "");
        form.hidden = true;
        $("#doneEmail").textContent = v;
        $("#demoNote").hidden = mode !== "demo";
        var link = shareLink(v), share = $(".share");
        if (link) $("#shareUrl").value = link; else share.hidden = true;
        var done = $("#done"); done.hidden = false; done.focus();
      }).catch(function () {
        $("#sendErr").hidden = false;
      }).then(function () {
        btn.disabled = false; btn.textContent = "Join early access";
      });
    });

    $("#copyBtn").addEventListener("click", function () {
      var inp = $("#shareUrl"), b = this;
      var ok = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy link"; }, 1600); };
      var fallback = function () { inp.focus(); inp.select(); b.textContent = "Press Ctrl+C"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(inp.value).then(ok, fallback);
      else fallback();
    });
  }

  function joinPunks() {
    var el = $("#joinPunks"); if (!el) return;
    el.innerHTML = [2, 17, 5].map(function (id) { return '<img class="px" src="' + thumb(id) + '" alt="" width="320" height="320" loading="lazy">'; }).join("");
  }

  function socials() {
    var s = CFG.social || {};
    document.querySelectorAll("[data-social]").forEach(function (a) {
      var url = s[a.getAttribute("data-social")];
      if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
      else { a.classList.add("soon"); a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.title = "Coming soon"; a.textContent += " · soon"; }
    });
  }

  drawSky(); stage(); marquee(); builds(); epochs(); calc(); gallery(); signup(); joinPunks(); socials();
})();
