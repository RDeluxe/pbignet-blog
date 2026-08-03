/* dither.js — ordered (Bayer) dithering, two modes on window.Dither:
 *   Dither.ambient(canvas, opts)   procedural animated dither field — needs no photo
 *   Dither.photo(container, opts)  dithers a filled <image-slot> with a gentle boil
 *
 * Tuned for "light touch": chunky low-res dots, slow temporal shimmer, and a
 * hard stop under prefers-reduced-motion / when scrolled out of view. */
(() => {
  'use strict';

  const REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 8×8 Bayer threshold matrix, normalised to 0..1.
  const BAYER8 = (() => {
    const m = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21]
    ];
    return m.map((r) => r.map((v) => (v + 0.5) / 64));
  })();

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // colour spec: 'r,g,b' | '#hex' | 'var(--token)' — resolved at RENDER time so the
  // dither follows live token changes (e.g. the Paper colour bench). [r,g,b] | fallback.
  function resolveRGB(spec, fallback = null) {
    if (!spec) return fallback;
    let s = String(spec).trim();
    if (s.startsWith('var(')) {
      s = getComputedStyle(document.documentElement).getPropertyValue(s.slice(4, -1).trim()).trim();
    }
    if (s[0] === '#') {
      const h = s.length === 4 ? s.slice(1).split('').map((c) => c + c).join('') : s.slice(1);
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    }
    const m = s.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : fallback;
  }

  // small seeded noise for the ambient field
  function vnoise(x, y) {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }
  function fade(t) { return t * t * (3 - 2 * t); }
  function smoothNoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const tl = vnoise(xi, yi), tr = vnoise(xi + 1, yi);
    const bl = vnoise(xi, yi + 1), br = vnoise(xi + 1, yi + 1);
    const u = fade(xf), v = fade(yf);
    return (tl + (tr - tl) * u) + ((bl + (br - bl) * u) - (tl + (tr - tl) * u)) * v;
  }

  // ---- ambient procedural dither -----------------------------------------
  // A slowly flowing luminance field (radial-ish gradient + drifting noise)
  // rendered as 1-bit ordered dither. Two colours: ink dots on transparent,
  // or ink-on-paper depending on opts.
  function ambient(canvas, opts = {}) {
    const cell = opts.cell || 4;             // px per dither cell (chunkiness)
    const ink = opts.ink || '20,18,14';      // rgb of the dark dots
    const paper = opts.paper || null;        // rgb of light cells, null=transparent
    const speed = (opts.speed || 1) * (REDUCED ? 0 : 1);
    const bias = opts.bias != null ? opts.bias : 0.5; // overall darkness
    const contrast = opts.contrast || 1.15;
    const fps = opts.fps || 14;
    let raf = 0, last = 0, t = 0;
    function onScreenA() {
      const r = canvas.getBoundingClientRect();
      const vh = window.innerHeight || 800, vw = window.innerWidth || 1200;
      return r.bottom > -40 && r.top < vh + 40 && r.right > -40 && r.left < vw + 40;
    }

    function size() {
      const w = Math.max(1, Math.floor((canvas.clientWidth || 300) / cell));
      const h = Math.max(1, Math.floor((canvas.clientHeight || 200) / cell));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      return { w, h };
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!onScreenA()) return;
      if (now - last < 1000 / fps) return;
      last = now;
      t += 0.016 * speed;
      const { w, h } = size();
      const ctx = canvas.getContext('2d');
      const img = ctx.createImageData(w, h);
      const d = img.data;
      const inkRGB = resolveRGB(ink, [20, 18, 14]);
      const paperRGB = resolveRGB(paper);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x / w, ny = y / h;
          // drifting soft field
          const g = 0.5 + 0.5 * Math.sin((nx * 2.2 + t * 0.25) * Math.PI);
          const n = smoothNoise(nx * 6 + t * 0.4, ny * 6 - t * 0.2);
          let lum = (g * 0.55 + n * 0.45);
          lum = clamp((lum - 0.5) * contrast + 0.5, 0, 1);
          lum = clamp(lum * (1 - bias) + (1 - bias) * 0.15 + bias * 0.0, 0, 1);
          // invert so higher bias => more dots
          const level = 1 - lum;
          const thr = BAYER8[y & 7][x & 7];
          const on = level > thr;
          const i = (y * w + x) * 4;
          if (on) {
            d[i] = inkRGB[0]; d[i + 1] = inkRGB[1]; d[i + 2] = inkRGB[2]; d[i + 3] = 255;
          } else if (paperRGB) {
            d[i] = paperRGB[0]; d[i + 1] = paperRGB[1]; d[i + 2] = paperRGB[2]; d[i + 3] = 255;
          } else {
            d[i + 3] = 0;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    frame(performance.now());   // immediate first paint (rAF may be throttled)
    return () => { cancelAnimationFrame(raf); };
  }

  // ---- photo dither -------------------------------------------------------
  // container holds an <image-slot> and a <canvas class="dither-canvas">.
  // We read the slot's rendered <img> (open shadow root), build a cached
  // low-res luminance buffer, and re-threshold each frame with a tiny
  // animated jitter so a few near-threshold dots flip ("boil"). Falls silent
  // while the slot is empty.
  function photo(container, opts = {}) {
    const slot = container.querySelector('image-slot');
    const plain = container.querySelector('img.dsrc');
    const canvas = container.querySelector('canvas.dither-canvas');
    if ((!slot && !plain) || !canvas) return () => {};
    const cell = opts.cell || 3;
    const inkSpec = opts.ink || '24,22,17';
    const paperSpec = opts.paper || 'var(--paper)';
    const contrast = opts.contrast || 1.25;
    const brightness = opts.brightness != null ? opts.brightness : 0.04;
    const boil = (opts.boil != null ? opts.boil : 0.05) * (REDUCED ? 0 : 1);
    const fps = opts.fps || 12;
    // opt-in selective colour: keep saturated source pixels in their own colour and
    // only dither the desaturated rest. Lets the IMAGE FILE carry the spot-colour
    // (a selective-colour edit) while the page just dithers the neutral background.
    const preserveColor = !!opts.preserveColor;
    const satLo = opts.satLo != null ? opts.satLo : 0.14;
    const satHi = opts.satHi != null ? opts.satHi : 0.32;

    let lum = null, col = null, sat = null, lw = 0, lh = 0, curSrc = null, raf = 0, last = 0, t = 0;
    function onScreenP() {
      const r = container.getBoundingClientRect();
      const vh = window.innerHeight || 800, vw = window.innerWidth || 1200;
      return r.bottom > -60 && r.top < vh + 60 && r.right > -60 && r.left < vw + 60;
    }

    function getImg() {
      if (plain) return plain;
      try { return slot.shadowRoot && slot.shadowRoot.querySelector('img[part="image"]'); }
      catch (e) { return null; }
    }

    function buildBuffer() {
      const img = getImg();
      if (!img || !img.src || img.style.display === 'none' || !img.naturalWidth) {
        lum = null; canvas.style.display = 'none'; curSrc = null; return;
      }
      if (img.src === curSrc && lum) return;
      curSrc = img.src;
      const cw = container.clientWidth || 320, ch = container.clientHeight || 240;
      lw = Math.max(1, Math.floor(cw / cell));
      lh = Math.max(1, Math.floor(ch / cell));
      const off = document.createElement('canvas');
      off.width = lw; off.height = lh;
      const octx = off.getContext('2d');
      // cover-fit the source into the buffer
      const ir = img.naturalWidth / img.naturalHeight, br = lw / lh;
      let dw, dh, dx, dy;
      if (ir > br) { dh = lh; dw = lh * ir; dx = (lw - dw) / 2; dy = 0; }
      else { dw = lw; dh = lw / ir; dx = 0; dy = (lh - dh) / 2; }
      try { octx.drawImage(img, dx, dy, dw, dh); }
      catch (e) { lum = null; return; }
      let data;
      try { data = octx.getImageData(0, 0, lw, lh).data; }
      catch (e) { lum = null; return; } // tainted — skip
      // guard: if the image was not actually decoded yet, drawImage drew nothing and
      // the buffer is fully transparent. Bail WITHOUT caching (curSrc stays null) so the
      // rAF loop retries next frame — otherwise a degenerate buffer caches as all-ink /
      // a bare dot field ("que des points").
      let anyOpaque = false;
      for (let a = 3; a < data.length; a += 4) { if (data[a] !== 0) { anyOpaque = true; break; } }
      if (!anyOpaque) { lum = null; curSrc = null; canvas.style.display = 'none'; return; }
      lum = new Float32Array(lw * lh);
      col = new Uint8Array(lw * lh * 3);
      sat = new Float32Array(lw * lh);
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        let l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        l = clamp((l - 0.5) * contrast + 0.5 + brightness, 0, 1);
        lum[p] = l;
        col[p * 3] = r; col[p * 3 + 1] = g; col[p * 3 + 2] = b;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        sat[p] = mx ? (mx - mn) / mx : 0;
      }
      canvas.width = lw; canvas.height = lh;
      canvas.style.display = 'block';
    }

    function render() {
      if (!lum) return;
      const ink = resolveRGB(inkSpec, [24, 22, 17]);
      const paper = resolveRGB(paperSpec, [246, 245, 241]);
      const ctx = canvas.getContext('2d');
      const img = ctx.createImageData(lw, lh);
      const d = img.data;
      for (let y = 0; y < lh; y++) {
        for (let x = 0; x < lw; x++) {
          const p = y * lw + x;
          const level = 1 - lum[p];
          let thr = BAYER8[y & 7][x & 7];
          if (boil) thr += (vnoise(x + Math.floor(t), y - Math.floor(t * 1.3)) - 0.5) * boil;
          const on = level > thr;
          const i = p * 4;
          let R, G, B;
          if (on) { R = ink[0]; G = ink[1]; B = ink[2]; }
          else { R = paper[0]; G = paper[1]; B = paper[2]; }
          // selective colour: blend the original pixel back in where it is saturated
          if (preserveColor) {
            let k = (sat[p] - satLo) / (satHi - satLo);
            k = k < 0 ? 0 : k > 1 ? 1 : k;
            k = k * k * (3 - 2 * k); // smoothstep
            if (k > 0) {
              R += (col[p * 3] - R) * k;
              G += (col[p * 3 + 1] - G) * k;
              B += (col[p * 3 + 2] - B) * k;
            }
          }
          d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!onScreenP()) return;
      if (now - last < 1000 / fps) return;
      last = now;
      buildBuffer();
      if (!lum) return;
      t += 1;
      render();
    }

    // plain <img>: repaint when it loads (rAF may be throttled / reduced-motion)
    if (plain) {
      const onload = () => { buildBuffer(); render(); };
      if (plain.complete && plain.naturalWidth) onload();
      plain.addEventListener('load', onload);
    }
    // react to drops: image-slot re-renders its img; poll is handled in frame()
    frame(performance.now());   // immediate first paint
    return () => { cancelAnimationFrame(raf); };
  }

  window.Dither = { ambient, photo, BAYER8 };
})();
