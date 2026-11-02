/* diagram.js — "exhale" diagram language.
 * One generator renders the Context Pyramid in four artistic treatments that
 * all share the page palette (paper / ink / fir-green) and the paper+dither
 * motif. The triangle is *constructed on dotted paper*: a faint dot grid sits
 * behind, and the three vertices snap to grid dots rendered darker, with the
 * edges drawn as dashes between them.
 *
 *   Diagram.pyramid(container, { style })
 *     style ∈ 'dot' | 'dither' | 'blueprint' | 'riso'  */
(() => {
  'use strict';

  // ---- palette (from the page, with fallbacks) ----------------------------
  const cs = getComputedStyle(document.documentElement);
  const tok = (n, f) => (cs.getPropertyValue(n).trim() || f);
  const PAPER = tok('--paper', '#f6f5f1');
  const INK = tok('--ink', '#18170f');
  const INK2 = tok('--ink-2', '#4a4636');
  const INK3 = tok('--ink-3', '#8b8672');
  const ACCENT = tok('--accent', '#1f4a37');     // fir green
  const ACCENT_RGB = tok('--accent-rgb', '31,74,55');

  // ---- content: bottom (1) → top (8) --------------------------------------
  const LAYERS = [
    { n: 1, label: 'Contexte de l\u2019entreprise' },
    { n: 2, label: 'Contexte du projet', sub: 'client' },
    { n: 3, label: 'Contexte du projet', sub: 'm\u00e9tier' },
    { n: 4, label: 'Contexte du projet', sub: 'architecture & choix techniques' },
    { n: 5, label: 'Contexte de la codebase', sub: 'doc' },
    { n: 6, label: 'Contexte de la codebase', sub: 'structure fichiers' },
    { n: 7, label: 'Contexte de la codebase', sub: 'rules / skills' },
    { n: 8, label: 'Votre prompt' }
  ];
  const CODEBASE = [5, 6, 7];

  // ---- geometry (vertices snap to the dot grid) ---------------------------
  // grid step G=16, dots centered at (8 + 16k). Vertices chosen on those dots.
  const G = 16;
  const VBW = 1060, VBH = 600;
  const APEXX = 296, APEXY = 56;          // 8+16·18 , 8+16·3
  const BASEY = 520, BASEL = 56, BASER = 536; // 8+16·32 ; 8+16·3 ; 8+16·33
  const CX = APEXX, BASEHALF = (BASER - BASEL) / 2, H = BASEY - APEXY;
  const LABELX = 600, N = 8;

  const lerp = (a, b, t) => a + (b - a) * t;
  function band(k) {
    const fT = k / N, fB = (k + 1) / N;
    return {
      k, layerNum: N - k,
      yT: APEXY + fT * H, yB: APEXY + fB * H,
      hT: fT * BASEHALF, hB: fB * BASEHALF,
      yMid: APEXY + ((fT + fB) / 2) * H, hMid: ((fT + fB) / 2) * BASEHALF
    };
  }
  const bands = Array.from({ length: N }, (_, k) => band(k));
  const layerToBand = (num) => bands.find((b) => b.layerNum === num);
  const bandPoly = (b) =>
    `${CX - b.hT},${b.yT} ${CX + b.hT},${b.yT} ${CX + b.hB},${b.yB} ${CX - b.hB},${b.yB}`;
  // gap-aware polygon: insets internal edges so bare paper shows between slices
  function bandPolyG(b, gap) {
    if (!gap) return bandPoly(b);
    let yT = b.yT, yB = b.yB;
    if (b.k !== 0) yT += gap / 2;       // keep the apex tip sharp
    if (b.k !== N - 1) yB -= gap / 2;   // keep the base slice on the base line
    const hT = ((yT - APEXY) / H) * BASEHALF, hB = ((yB - APEXY) / H) * BASEHALF;
    return `${CX - hT},${yT} ${CX + hT},${yT} ${CX + hB},${yB} ${CX - hB},${yB}`;
  }
  const TRI = `${APEXX},${APEXY} ${BASEL},${BASEY} ${BASER},${BASEY}`;

  const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // ---- defs ---------------------------------------------------------------
  function gridDef() {
    return `<pattern id="grid" width="${G}" height="${G}" patternUnits="userSpaceOnUse">`
      + `<circle cx="8" cy="8" r="1" fill="${INK}" opacity="0.18"/></pattern>`;
  }
  function halftoneDefs() {
    let p = '';
    for (let k = 1; k < N; k++) {
      const r = (0.9 + k * 0.42).toFixed(2), g = 9;
      p += `<pattern id="ht${k}" width="${g}" height="${g}" patternUnits="userSpaceOnUse">`
        + `<circle cx="${g / 2}" cy="${g / 2}" r="${r}" fill="${INK}"/></pattern>`;
    }
    return p;
  }
  function ditherDefs() {
    let p = '';
    for (let k = 1; k < N; k++) {
      const cov = 0.16 + k * 0.095, thr = cov * 16, cell = 4, tile = cell * 4;
      let rects = '';
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        if (BAYER4[y][x] < thr) rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${ACCENT}"/>`;
      }
      p += `<pattern id="dt${k}" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse">${rects}</pattern>`;
    }
    return p;
  }

  // ---- labels + leaders ---------------------------------------------------
  function labelsSVG() {
    let s = '';
    bands.forEach((b) => {
      const L = LAYERS[b.layerNum - 1];
      const edgeX = CX + b.hMid, y = b.yMid;
      let s2 = `<line x1="${edgeX}" y1="${y}" x2="${LABELX - 14}" y2="${y}" stroke="${INK3}" stroke-width="1"/>`
        + `<circle cx="${edgeX}" cy="${y}" r="2.4" fill="${ACCENT}"/>`;
      const isCode = CODEBASE.includes(b.layerNum), isApex = b.layerNum === 8;
      const badgeFill = isApex ? ACCENT : 'none';
      const badgeStroke = isApex ? ACCENT : (isCode ? ACCENT : INK2);
      const numColor = isApex ? '#fff' : (isCode ? ACCENT : INK);
      s2 += `<rect x="${LABELX}" y="${y - 13}" width="26" height="26" rx="3" fill="${badgeFill}" stroke="${badgeStroke}" stroke-width="1.3"/>`
        + `<text x="${LABELX + 13}" y="${y + 5}" text-anchor="middle" font-family="'Space Mono',monospace" font-size="15" font-weight="700" fill="${numColor}">${b.layerNum}</text>`;
      const tx = LABELX + 40;
      if (L.sub) {
        s2 += `<text x="${tx}" y="${y - 3}" font-family="'Space Mono',monospace" font-size="16" font-weight="700" fill="${INK}">${esc(L.label)}</text>`
          + `<text x="${tx}" y="${y + 15}" font-family="'Space Mono',monospace" font-size="13" fill="${INK2}">${esc(L.sub)}</text>`;
      } else {
        s2 += `<text x="${tx}" y="${y + 5}" font-family="'Space Mono',monospace" font-size="16" font-weight="700" fill="${isApex ? ACCENT : INK}">${esc(L.label)}</text>`;
      }
      s += `<g class="dp-label" data-layer="${b.layerNum}">${s2}</g>`;
    });
    return s;
  }

  // codebase brace, snug against the labels
  function codebaseBrace() {
    const b5 = layerToBand(5), b7 = layerToBand(7);
    const yTop = b7.yMid - 14, yBot = b5.yMid + 14, yMid = (yTop + yBot) / 2;
    const x = 872, w = 9;
    let s = `<g class="dp-brace"><path d="M ${x} ${yTop} q ${w} 0 ${w} 9 L ${x + w} ${yMid - 8} q 0 8 ${w} 8 q -${w} 0 -${w} 8 L ${x + w} ${yBot - 9} q 0 9 -${w} 9" fill="none" stroke="${ACCENT}" stroke-width="1.4"/>`;
    s += `<g transform="translate(${x + 30},${yMid}) rotate(90)">`
      + `<text text-anchor="middle" font-family="'Space Mono',monospace" font-size="12.5" font-weight="700" letter-spacing="0.03em" fill="${ACCENT}">CODEBASE CONTEXT</text>`
      + `<text text-anchor="middle" y="16" font-family="'Space Mono',monospace" font-size="12.5" font-weight="700" letter-spacing="0.03em" fill="${ACCENT}">ENGINEERING</text></g></g>`;
    return s;
  }

  // ---- bands per style ----------------------------------------------------
  function bandsSVG(style, opts) {
    const gap = opts.gap || 0;
    let s = '';
    // faint green wash behind the codebase group ties it to the brace
    if (style === 'blueprint' || style === 'dot') {
      CODEBASE.forEach((num) => {
        const b = layerToBand(num);
        s += `<polygon points="${bandPolyG(b, gap)}" fill="rgba(${ACCENT_RGB},0.06)" stroke="none"/>`;
      });
    }
    if (style === 'riso') {
      bands.forEach((b) => {
        if (b.layerNum === 8) return;
        s += `<polygon points="${bandPolyG(b, gap)}" fill="rgba(24,23,15,0.30)" transform="translate(5,5)"/>`;
      });
    }
    bands.forEach((b) => {
      const isApex = b.layerNum === 8;
      let fill = 'none';
      if (style === 'dot') fill = isApex ? `rgba(${ACCENT_RGB},0.82)` : `url(#ht${b.k})`;
      else if (style === 'dither') fill = isApex ? `rgba(${ACCENT_RGB},0.82)` : PAPER;
      else if (style === 'blueprint') fill = isApex ? `rgba(${ACCENT_RGB},0.82)` : 'none';
      else if (style === 'riso') {
        const a = isApex ? 0.9 : lerp(0.20, 0.9, b.k / (N - 1));
        fill = `rgba(${ACCENT_RGB},${a.toFixed(2)})`;
      }
      let g = `<polygon points="${bandPolyG(b, gap)}" fill="${fill}" stroke="none"/>`;
      if (style === 'dither' && !isApex) {
        g += `<polygon points="${bandPolyG(b, gap)}" fill="url(#dt${b.k})" fill-opacity="0.7" stroke="none"/>`;
      }
      s += `<g class="dp-band" data-layer="${b.layerNum}">${g}</g>`;
    });

    // blueprint contour fill, clipped
    if (style === 'blueprint') {
      let contours = '';
      for (let i = 1; i <= 22; i++) {
        const yy = APEXY + (i / 23) * H, amp = 5 + (i % 3) * 3;
        let d = `M ${CX - BASEHALF} ${yy}`;
        for (let x = -BASEHALF; x <= BASEHALF; x += 28)
          d += ` Q ${CX + x + 14} ${yy + (((x / 28) % 2) ? amp : -amp)} ${CX + x + 28} ${yy}`;
        contours += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="0.8" opacity="0.30"/>`;
      }
      s += `<g clip-path="url(#pyrclip)">${contours}</g>`;
      const my = (APEXY + BASEY) / 2;
      s += `<line x1="30" y1="${APEXY}" x2="30" y2="${BASEY}" stroke="${INK2}" stroke-width="1"/>`
        + `<line x1="26" y1="${APEXY}" x2="34" y2="${APEXY}" stroke="${INK2}" stroke-width="1"/>`
        + `<line x1="26" y1="${BASEY}" x2="34" y2="${BASEY}" stroke="${INK2}" stroke-width="1"/>`
        + `<text x="20" y="${my}" text-anchor="middle" transform="rotate(-90,20,${my})" font-family="'Space Mono',monospace" font-size="10" letter-spacing="0.14em" fill="${INK3}">8 COUCHES \u00b7 PROFONDEUR</text>`;
    }

    // band separators
    const dv = opts.divider || (gap ? 'none' : 'faint');
    if (dv !== 'none') {
      for (let k = 1; k < N; k++) {
        const f = k / N, half = f * BASEHALF, y = APEXY + f * H;
        let col = 'rgba(24,23,15,0.20)', sw = 1;
        if (dv === 'ink') { col = 'rgba(24,23,15,0.55)'; sw = 1.6; }
        else if (dv === 'keyline') { col = PAPER; sw = 3.2; }
        s += `<line x1="${CX - half}" y1="${y}" x2="${CX + half}" y2="${y}" stroke="${col}" stroke-width="${sw}"/>`;
      }
    }
    // dashed outer triangle, between the three anchor dots.
    // dp-tri-draw is a hidden solid path used only by Diagram.play() to "draw"
    // the outline; the dashed dp-tri is the resting state.
    s += `<path class="dp-tri-draw" d="M ${APEXX} ${APEXY} L ${BASEL} ${BASEY} L ${BASER} ${BASEY} Z" fill="none" stroke="${ACCENT}" stroke-width="1.8" stroke-linejoin="round" style="opacity:0"/>`;
    s += `<polygon class="dp-tri" points="${TRI}" fill="none" stroke="${ACCENT}" stroke-width="1.6" stroke-dasharray="7 6" stroke-linejoin="round"/>`;
    // anchor dots (darker than their grid neighbours)
    [[APEXX, APEXY], [BASEL, BASEY], [BASER, BASEY]].forEach(([x, y]) => {
      s += `<circle class="dp-anchor" cx="${x}" cy="${y}" r="4" fill="${INK}"/>`;
    });
    return s;
  }

  function pyramid(container, opts = {}) {
    const style = opts.style || 'dot';
    let defs = gridDef()
      + `<clipPath id="pyrclip"><polygon points="${TRI}"/></clipPath>`;
    if (style === 'dot') defs += halftoneDefs();
    if (style === 'dither') defs += ditherDefs();
    const svg = `<svg viewBox="0 0 ${VBW} ${VBH}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pyramide du contexte">`
      + `<defs>${defs}</defs>`
      + `<rect class="dp-grid" x="0" y="0" width="${VBW}" height="${VBH}" fill="url(#grid)"/>`
      + bandsSVG(style, opts) + labelsSVG() + codebaseBrace()
      + `</svg>`;
    container.innerHTML = svg;
  }

  // ---- animated reveal: "drawn on the paper" -----------------------------
  // grid → anchor dots → triangle outline drawn → strata stack bottom→top
  // → labels slide in → codebase brace. Re-callable to replay.
  function play(container, opts = {}) {
    const svg = container.querySelector('svg');
    if (!svg) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const grid = svg.querySelector('.dp-grid');
    const draw = svg.querySelector('.dp-tri-draw');
    const tri = svg.querySelector('.dp-tri');
    const anchors = [...svg.querySelectorAll('.dp-anchor')];
    const bandEls = [...svg.querySelectorAll('.dp-band')]
      .sort((a, b) => (+a.dataset.layer) - (+b.dataset.layer)); // 1 (base) → 8 (apex)
    const labelEls = [...svg.querySelectorAll('.dp-label')]
      .sort((a, b) => (+a.dataset.layer) - (+b.dataset.layer));
    const brace = svg.querySelector('.dp-brace');
    const all = [grid, tri, brace, ...anchors, ...bandEls, ...labelEls].filter(Boolean);

    // reveal the resting state instantly (no animation) when we can't or
    // shouldn't animate: reduced-motion, or the page is hidden (a paused
    // timeline would otherwise leave everything stuck at opacity 0).
    const reveal = () => { all.forEach((e) => { e.style.opacity = ''; }); if (draw) draw.style.opacity = '0'; };
    if (reduce || document.hidden) { reveal(); return; }

    // reset to hidden
    all.forEach((e) => { e.style.opacity = '0'; });
    anchors.forEach((e) => { e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center'; });
    const A = (el, kf, o) => el && el.animate(kf, { fill: 'both', ...o });

    A(grid, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
    anchors.forEach((el, i) => A(el, [
      { opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1)' }
    ], { duration: 300, delay: 320 + i * 90, easing: 'cubic-bezier(.2,1.5,.4,1)' }));

    // draw the outline, then cross-fade to the dashed resting stroke
    const len = draw ? draw.getTotalLength() : 0;
    if (draw) {
      draw.style.opacity = '1';
      draw.style.strokeDasharray = len;
      draw.style.strokeDashoffset = len;
      const d = draw.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: 880, delay: 620, fill: 'both', easing: 'ease-in-out' });
      d.onfinish = () => {
        tri.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'both' });
        draw.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'both' });
      };
    } else if (tri) { tri.style.opacity = '1'; }

    const bandStart = 1560;
    bandEls.forEach((el, i) => A(el, [
      { opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 360, delay: bandStart + i * 110, easing: 'cubic-bezier(.2,.8,.2,1)' }));

    const labelStart = bandStart + 240;
    labelEls.forEach((el, i) => A(el, [
      { opacity: 0, transform: 'translateX(10px)' }, { opacity: 1, transform: 'translateX(0)' }
    ], { duration: 300, delay: labelStart + i * 95, easing: 'ease-out' }));

    A(brace, [{ opacity: 0 }, { opacity: 1 }],
      { duration: 520, delay: labelStart + labelEls.length * 95 + 150, easing: 'ease-out' });

    // safety net: if the animation timeline is throttled/unavailable, make
    // sure the finished diagram is visible regardless.
    clearTimeout(play._fb);
    play._fb = setTimeout(reveal, 4400);
  }

  window.Diagram = { pyramid, play, LAYERS };
})();
