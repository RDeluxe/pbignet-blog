/* texture.js — paper grain + topographic contour lines
 * Two exports on window: Grain, Topo.
 * Both are procedural (no external assets) and tuned to be FAINT — they sit
 * behind content as ambient paper/instrument texture. */
(() => {
  'use strict';

  // ---- seeded value noise -------------------------------------------------
  // Deterministic hash so the contour map is stable across reloads/resizes
  // (a wandering map would feel buggy). 2D value noise with smoothstep.
  function makeNoise(seed) {
    const s = seed || 1;
    function hash(x, y) {
      let h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
      return h - Math.floor(h); // 0..1
    }
    const fade = (t) => t * t * (3 - 2 * t);
    function val(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const tl = hash(xi, yi), tr = hash(xi + 1, yi);
      const bl = hash(xi, yi + 1), br = hash(xi + 1, yi + 1);
      const u = fade(xf), v = fade(yf);
      const top = tl + (tr - tl) * u;
      const bot = bl + (br - bl) * u;
      return top + (bot - top) * v;
    }
    // fractal sum for organic ridges
    return function (x, y) {
      let amp = 1, freq = 1, sum = 0, norm = 0;
      for (let o = 0; o < 4; o++) {
        sum += amp * val(x * freq, y * freq);
        norm += amp;
        amp *= 0.5; freq *= 2;
      }
      return sum / norm; // 0..1
    };
  }

  // ---- marching squares ---------------------------------------------------
  // Sample noise on a grid, then for each iso-level draw the contour line.
  // Crisp 1px strokes => "viewfinder panorama" contour look.
  const Topo = {
    /**
     * draw(canvas, opts)
     *   color      stroke colour (default faint ink)
     *   levels     how many contour bands (default 14)
     *   cell       grid cell size in px (default 26) — bigger = smoother/faster
     *   scale      noise zoom (default 0.0022) — smaller = broader landforms
     *   seed       noise seed (default 7)
     *   width/height optional; defaults to canvas client size * dpr
     *   lineWidth  px (default 1)
     *   emphasizeEvery  every Nth line drawn heavier (index contours)
     */
    draw(canvas, opts = {}) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = opts.width || canvas.clientWidth || 800;
      const cssH = opts.height || canvas.clientHeight || 600;
      const W = Math.round(cssW * dpr);
      const H = Math.round(cssH * dpr);
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const color = opts.color || 'rgba(40,38,32,0.5)';
      const cell = (opts.cell || 26) * dpr;
      const scale = (opts.scale || 0.0022) / dpr;
      const levels = opts.levels || 14;
      const seed = opts.seed || 7;
      const emph = opts.emphasizeEvery || 5;
      const noise = makeNoise(seed);

      const cols = Math.ceil(W / cell) + 1;
      const rows = Math.ceil(H / cell) + 1;
      // precompute noise field
      const field = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          field[j * cols + i] = noise(i * cell * scale, j * cell * scale);
        }
      }
      const at = (i, j) => field[j * cols + i];
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let l = 1; l < levels; l++) {
        const iso = l / levels;
        ctx.beginPath();
        for (let j = 0; j < rows - 1; j++) {
          for (let i = 0; i < cols - 1; i++) {
            const x0 = i * cell, y0 = j * cell, x1 = x0 + cell, y1 = y0 + cell;
            const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
            let idx = 0;
            if (a > iso) idx |= 8;
            if (b > iso) idx |= 4;
            if (c > iso) idx |= 2;
            if (d > iso) idx |= 1;
            if (idx === 0 || idx === 15) continue;
            // edge interpolation points
            const lerp = (p, q, va, vb) => p + (q - p) * ((iso - va) / (vb - va));
            const top = () => [lerp(x0, x1, a, b), y0];
            const right = () => [x1, lerp(y0, y1, b, c)];
            const bottom = () => [lerp(x0, x1, d, c), y1];
            const left = () => [x0, lerp(y0, y1, a, d)];
            const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
            switch (idx) {
              case 1: case 14: seg(left(), bottom()); break;
              case 2: case 13: seg(bottom(), right()); break;
              case 3: case 12: seg(left(), right()); break;
              case 4: case 11: seg(top(), right()); break;
              case 5: seg(left(), top()); seg(bottom(), right()); break;
              case 6: case 9: seg(top(), bottom()); break;
              case 7: case 8: seg(left(), top()); break;
              case 10: seg(left(), bottom()); seg(top(), right()); break;
            }
          }
        }
        ctx.lineWidth = (l % emph === 0 ? 1.6 : 1) * dpr;
        ctx.strokeStyle = color;
        ctx.globalAlpha = l % emph === 0 ? 1 : 0.7;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },

    /** Mount a contour canvas that fills its parent and redraws on resize. */
    mount(canvas, opts = {}) {
      let raf = 0;
      const render = () => { Topo.draw(canvas, opts); };
      const onResize = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(render);
      };
      render();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  };

  // ---- film grain ---------------------------------------------------------
  // A small tiling grain tile as a data URL. Cheap, applied via CSS bg.
  const Grain = {
    dataURL(size = 120, alpha = 22) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = (Math.random() * alpha) | 0;
      }
      ctx.putImageData(img, 0, 0);
      return c.toDataURL('image/png');
    },
    /** set --grain custom property on :root so CSS can use it as a bg image */
    apply(alpha = 22) {
      const url = Grain.dataURL(120, alpha);
      document.documentElement.style.setProperty('--grain', `url(${url})`);
      return url;
    }
  };

  window.Topo = Topo;
  window.Grain = Grain;
})();
