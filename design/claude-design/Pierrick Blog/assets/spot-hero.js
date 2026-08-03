/* spot-hero.js — live "selective colour + dithered ground" renderer.
 *
 * Does the whole treatment in the browser so every parameter is tweakable in real
 * time: the SUBJECT is kept in colour by HUE (a red threshold with a soft edge), the
 * rest is dithered into a duotone ground. No pre-baked image, no geometric mask.
 *
 *   const spot = SpotHero.mount(container, opts);   // container holds img.dsrc + canvas.dither-canvas
 *   spot.update({ contrast: 1.4, ink: [20,22,15], ... });
 *
 * Honours prefers-reduced-motion (freezes the boil) and pauses when off-screen. */
(function () {
  'use strict';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 8x8 ordered (Bayer) threshold matrix, normalised to 0..1
  var RAW = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
  ];
  var BAYER = RAW.map(function (r) { return r.map(function (v) { return (v + 0.5) / 64; }); });

  function vnoise(x, y) { var s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(e0, e1, x) { var t = (x - e0) / (e1 - e0); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function hexToRgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; });
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  // unit chroma direction of a target colour, used to score how close each pixel's
  // hue is to the colour we want to KEEP (generalises the old red-only metric).
  function chromaDir(hex) {
    var c = hexToRgb(hex), L = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
    var dr = c[0] - L, dg = c[1] - L, db = c[2] - L;
    var n = Math.sqrt(dr * dr + dg * dg + db * db) || 1;
    return [dr / n, dg / n, db / n];
  }

  function mount(container, opts) {
    var img = container.querySelector('img.dsrc');
    var canvas = container.querySelector('canvas.dither-canvas');
    if (!img || !canvas) return { update: function () {} };

    var P = Object.assign({
      cell: 3,
      ink: [20, 22, 15], paper: [74, 78, 62],
      contrast: 1.3, brightness: -0.02, boil: 0.05, fps: 12,
      keepColor: '#c8321e', redLo: 34, span: 62, satBoost: 0.35,
      focalX: 0.5, focalY: 0.5
    }, opts || {});
    var dir = chromaDir(P.keepColor);

    var rgb = null, lw = 0, lh = 0, builtCell = 0, builtFx = 0.5, builtFy = 0.5, raf = 0, last = 0, t = 0;

    function onScreen() {
      var r = container.getBoundingClientRect();
      var vh = window.innerHeight || 800, vw = window.innerWidth || 1200;
      return r.bottom > -60 && r.top < vh + 60 && r.right > -60 && r.left < vw + 60;
    }

    function build() {
      if (!img.naturalWidth) { rgb = null; return; }
      var cw = container.clientWidth || 320, ch = container.clientHeight || 240;
      lw = Math.max(1, Math.floor(cw / P.cell));
      lh = Math.max(1, Math.floor(ch / P.cell));
      var off = document.createElement('canvas'); off.width = lw; off.height = lh;
      var o = off.getContext('2d');
      var ir = img.naturalWidth / img.naturalHeight, br = lw / lh, dw, dh, dx, dy;
      // cover-fit: aspect ratio is ALWAYS preserved; focalX/focalY only pan the crop
      // (whichever axis has slack), so changing hero height re-centres, never squishes.
      if (ir > br) { dh = lh; dw = lh * ir; dx = (lw - dw) * P.focalX; dy = 0; }
      else { dw = lw; dh = lw / ir; dx = 0; dy = (lh - dh) * P.focalY; }
      try { o.drawImage(img, dx, dy, dw, dh); } catch (e) { rgb = null; return; }
      var data;
      try { data = o.getImageData(0, 0, lw, lh).data; } catch (e) { rgb = null; return; }
      var anyOpaque = false;
      for (var a = 3; a < data.length; a += 4) { if (data[a] !== 0) { anyOpaque = true; break; } }
      if (!anyOpaque) { rgb = null; return; }  // not decoded yet — retry next frame
      rgb = data;
      canvas.width = lw; canvas.height = lh; canvas.style.display = 'block';
      builtCell = P.cell; builtFx = P.focalX; builtFy = P.focalY;
    }

    function render() {
      if (!rgb) return;
      var ctx = canvas.getContext('2d');
      var out = ctx.createImageData(lw, lh), d = out.data;
      var ink = P.ink, paper = P.paper, boil = REDUCED ? 0 : P.boil;
      var c = P.contrast, br = P.brightness, redLo = P.redLo, redHi = P.redLo + P.span, sb = P.satBoost;
      for (var y = 0; y < lh; y++) {
        for (var x = 0; x < lw; x++) {
          var p = y * lw + x, i = p * 4;
          var r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
          var L = 0.299 * r + 0.587 * g + 0.114 * b;
          var l = clamp((L / 255 - 0.5) * c + 0.5 + br, 0, 1);
          var thr = BAYER[y & 7][x & 7];
          if (boil) thr += (vnoise(x + (t | 0), y - ((t * 1.3) | 0)) - 0.5) * boil;
          var on = (1 - l) > thr;
          var R = on ? ink[0] : paper[0], G = on ? ink[1] : paper[1], B = on ? ink[2] : paper[2];
          // selective colour: keep pixels whose hue matches the target colour, soft edge
          var dr = r - L, dg = g - L, db = b - L;
          var match = dr * dir[0] + dg * dir[1] + db * dir[2];
          var w = smooth(redLo, redHi, match);
          if (w > 0) {
            var kr = clamp(r + (r - L) * sb, 0, 255);
            var kg = clamp(g + (g - L) * sb, 0, 255);
            var kb = clamp(b + (b - L) * sb, 0, 255);
            R += (kr - R) * w; G += (kg - G) * w; B += (kb - B) * w;
          }
          d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = 255;
        }
      }
      ctx.putImageData(out, 0, 0);
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!onScreen()) return;
      if (now - last < 1000 / P.fps) return;
      last = now;
      if (!rgb || builtCell !== P.cell || builtFx !== P.focalX || builtFy !== P.focalY) build();
      if (!rgb) return;
      t += 1;
      render();
    }

    if (img.complete && img.naturalWidth) { build(); render(); }
    img.addEventListener('load', function () { build(); render(); });
    window.addEventListener('resize', function () { build(); });
    frame(performance.now());

    return {
      update: function (np) {
        if (!np) return;
        var cellChanged = np.cell != null && np.cell !== P.cell;
        var focalChanged = (np.focalX != null && np.focalX !== P.focalX) || (np.focalY != null && np.focalY !== P.focalY);
        Object.assign(P, np);
        if (np.keepColor != null) dir = chromaDir(P.keepColor);
        if (cellChanged || focalChanged) build();
        render();
      }
    };
  }

  window.SpotHero = { mount: mount };
})();
