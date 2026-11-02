/* Grain + Topo — texture procédurale sans assets externes */

function makeNoise(seed: number) {
  function hash(x: number, y: number) {
    const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
    return h - Math.floor(h)
  }
  const fade = (t: number) => t * t * (3 - 2 * t)
  function val(x: number, y: number) {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const tl = hash(xi, yi)
    const tr = hash(xi + 1, yi)
    const bl = hash(xi, yi + 1)
    const br = hash(xi + 1, yi + 1)
    const u = fade(xf)
    const v = fade(yf)
    return tl + (tr - tl) * u + (bl - tl + tl - tr - bl + br) * u * v + (bl - tl) * v
  }
  return function (x: number, y: number) {
    let amp = 1
    let freq = 1
    let sum = 0
    let norm = 0
    for (let o = 0; o < 4; o++) {
      sum += amp * val(x * freq, y * freq)
      norm += amp
      amp *= 0.5
      freq *= 2
    }
    return sum / norm
  }
}

export interface TopoOptions {
  color?: string
  levels?: number
  cell?: number
  scale?: number
  seed?: number
  lineWidth?: number
  emphasizeEvery?: number
}

export const Topo = {
  draw(canvas: HTMLCanvasElement, opts: TopoOptions = {}) {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const cssW = canvas.clientWidth || 800
    const cssH = canvas.clientHeight || 600
    const W = Math.round(cssW * dpr)
    const H = Math.round(cssH * dpr)
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    const color = opts.color || 'rgba(37,48,194,0.06)'
    const cell = (opts.cell || 26) * dpr
    const scale = (opts.scale || 0.0022) / dpr
    const levels = opts.levels || 14
    const seed = opts.seed || 7
    const emph = opts.emphasizeEvery || 5
    const noise = makeNoise(seed)
    const cols = Math.ceil(W / cell) + 1
    const rows = Math.ceil(H / cell) + 1
    const field = new Float32Array(cols * rows)
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        field[j * cols + i] = noise(i * cell * scale, j * cell * scale)
      }
    }
    const at = (i: number, j: number) => field[j * cols + i]
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (let l = 1; l < levels; l++) {
      const iso = l / levels
      ctx.beginPath()
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const x0 = i * cell
          const y0 = j * cell
          const x1 = x0 + cell
          const y1 = y0 + cell
          // les quatre coins de la cellule, dans l'ordre horaire depuis le haut-gauche
          const a = at(i, j)
          const b = at(i + 1, j)
          const c = at(i + 1, j + 1)
          const d = at(i, j + 1)

          /* Chaque coin au-dessus de l'isoligne allume son bit : a=8, b=4, c=2, d=1.
           * 0 et 15 = cellule entièrement d'un côté, aucun segment à tracer.
           * Même raison que la table plus bas : quatre lignes alignées se lisent comme le
           * tableau de bits qu'elles sont, huit lignes ne se lisent plus. */
          /* eslint-disable antfu/if-newline */
          let idx = 0
          if (a > iso) idx |= 8
          if (b > iso) idx |= 4
          if (c > iso) idx |= 2
          if (d > iso) idx |= 1
          if (idx === 0 || idx === 15) continue
          /* eslint-enable antfu/if-newline */

          const lerp = (p: number, q: number, va: number, vb: number) => p + (q - p) * ((iso - va) / (vb - va))
          const top = (): [number, number] => [lerp(x0, x1, a, b), y0]
          const right = (): [number, number] => [x1, lerp(y0, y1, b, c)]
          const bottom = (): [number, number] => [lerp(x0, x1, d, c), y1]
          const left = (): [number, number] => [x0, lerp(y0, y1, a, d)]
          const seg = (p: [number, number], q: [number, number]) => {
            ctx.moveTo(p[0], p[1])
            ctx.lineTo(q[0], q[1])
          }

          /* La table des 16 configurations de marching squares. Elle se LIT comme une
           * table : un cas par ligne, les cas symétriques appariés. L'éclater sur quatre
           * lignes chacun donnerait 60 lignes où l'œil ne retrouve plus la symétrie —
           * c'est le seul endroit du projet où la règle nuit à la lisibilité. */
          /* eslint-disable style/max-statements-per-line */
          switch (idx) {
            case 1: case 14: seg(left(), bottom()); break
            case 2: case 13: seg(bottom(), right()); break
            case 3: case 12: seg(left(), right()); break
            case 4: case 11: seg(top(), right()); break
            case 5: seg(left(), top()); seg(bottom(), right()); break
            case 6: case 9: seg(top(), bottom()); break
            case 7: case 8: seg(left(), top()); break
            case 10: seg(left(), bottom()); seg(top(), right()); break
          }
          /* eslint-enable style/max-statements-per-line */
        }
      }
      ctx.lineWidth = (l % emph === 0 ? 1.6 : 1) * dpr
      ctx.strokeStyle = color
      ctx.globalAlpha = l % emph === 0 ? 1 : 0.7
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  },

  mount(canvas: HTMLCanvasElement, opts: TopoOptions = {}) {
    let raf = 0
    const render = () => Topo.draw(canvas, opts)
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(render)
    }
    render()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  },
}

export const Grain = {
  dataURL(size = 120, alpha = 22): string {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = (Math.random() * alpha) | 0
    }
    ctx.putImageData(img, 0, 0)
    return c.toDataURL('image/png')
  },

  apply(alpha = 22) {
    const url = Grain.dataURL(120, alpha)
    document.documentElement.style.setProperty('--grain', `url(${url})`)
  },
}
