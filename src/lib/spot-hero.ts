/**
 * spot-hero.ts — rendu « couleur sélective sur fond dithéré », en direct.
 *
 * Port TypeScript de `assets/spot-hero.js` (miroir Claude Design). Le principe :
 * le SUJET reste en couleur parce que sa **teinte** correspond à `keepColor` (score par
 * direction de chroma, bord adouci), et tout le reste part en duotone dithéré (Bayer 8×8
 * ordonné). Aucun masque géométrique, aucune image pré-cuite : tout est paramétrable.
 *
 * Écarts assumés par rapport au JS d'origine, tous dans le sens de l'intention déclarée
 * (« pauses when off-screen », « honours prefers-reduced-motion ») :
 *   1. `IntersectionObserver` au lieu d'un rAF permanent qui teste getBoundingClientRect
 *      à chaque frame — hors écran, la boucle est réellement arrêtée.
 *   2. En reduced-motion (ou `boil: 0`), on rend UNE fois puis on s'arrête : sans boil, les
 *      frames sont identiques, donc la boucle ne faisait que chauffer le CPU.
 *   3. `destroy()` existe — indispensable côté Astro/Svelte pour ne pas fuir un rAF.
 *   4. Les couleurs acceptent hex, `'r,g,b'`, `[r,g,b]` ou `'var(--token)'` (résolu au
 *      moment du rendu), comme le fait désormais `dither.js`.
 */

/** Couleur acceptée : `'#c8321e'`, `'20,22,15'`, `[20, 22, 15]` ou `'var(--ink)'`. */
export type SpotColor = string | readonly [number, number, number]

export interface SpotHeroOptions {
  /** taille d'une cellule de trame, en px écran. Plus grand = trame plus grosse. */
  cell: number
  /** encre du fond dithéré (les cellules « allumées »). */
  ink: SpotColor
  /** papier du fond dithéré (les cellules « éteintes »). */
  paper: SpotColor
  contrast: number
  brightness: number
  /** frémissement de la trame. 0 = figé. Forcé à 0 en reduced-motion. */
  boil: number
  fps: number
  /** la couleur à CONSERVER : sa teinte définit ce qui reste en couleur. */
  keepColor: string
  /** seuil bas de correspondance de teinte (ex-`redLo` côté research). */
  hueLo: number
  /** largeur du dégradé de correspondance (ex-`span`). Plus grand = bord plus doux. */
  hueSpan: number
  /** saturation ajoutée aux pixels conservés. */
  satBoost: number
  /** point focal du recadrage, 0..1. Ne déforme jamais : ne fait que panner. */
  focalX: number
  focalY: number
}

export interface SpotHeroHandle {
  update: (next: Partial<SpotHeroOptions>) => void
  destroy: () => void
}

const DEFAULTS: SpotHeroOptions = {
  cell: 3,
  ink: [20, 22, 15],
  paper: [74, 78, 62],
  contrast: 1.3,
  brightness: -0.02,
  boil: 0.05,
  fps: 12,
  keepColor: '#c8321e',
  hueLo: 34,
  hueSpan: 62,
  satBoost: 0.35,
  focalX: 0.5,
  focalY: 0.5,
}

// matrice de seuils Bayer 8×8 ordonnée, normalisée sur 0..1
const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map(row => row.map(v => (v + 0.5) / 64))

function vnoise(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return s - Math.floor(s)
}

function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v
}

/** smoothstep — le bord adouci de la sélection de teinte. */
function smooth(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3)
    h = h.replace(/./g, c => c + c)
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ]
}

/** Résout une SpotColor en triplet. `var(--x)` est lu sur l'élément fourni. */
function toRgb(c: SpotColor, el: Element): [number, number, number] {
  if (Array.isArray(c))
    return [c[0], c[1], c[2]]
  const s = String(c).trim()
  if (s.startsWith('var(')) {
    const name = s.slice(4, -1).split(',')[0].trim()
    const resolved = getComputedStyle(el).getPropertyValue(name).trim()
    return resolved ? toRgb(resolved, el) : [0, 0, 0]
  }
  if (s.startsWith('#'))
    return hexToRgb(s)
  const m = s.match(/-?\d+(\.\d+)?/g)
  if (m && m.length >= 3)
    return [+m[0], +m[1], +m[2]]
  return [0, 0, 0]
}

/**
 * Direction de chroma unitaire d'une couleur : sert à scorer la proximité de teinte
 * de chaque pixel avec celle qu'on veut garder (généralise l'ancienne métrique
 * « rouge seulement »).
 */
function chromaDir(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  const l = 0.299 * r + 0.587 * g + 0.114 * b
  const dr = r - l
  const dg = g - l
  const db = b - l
  const n = Math.sqrt(dr * dr + dg * dg + db * db) || 1
  return [dr / n, dg / n, db / n]
}

/**
 * Monte le moteur sur un conteneur qui doit contenir `img.dsrc` et `canvas.dither-canvas`.
 * Sans l'un des deux, renvoie un handle inerte plutôt que de jeter.
 */
export function mount(container: HTMLElement, opts: Partial<SpotHeroOptions> = {}): SpotHeroHandle {
  const img = container.querySelector<HTMLImageElement>('img.dsrc')
  const canvas = container.querySelector<HTMLCanvasElement>('canvas.dither-canvas')
  if (!img || !canvas)
    return { update: () => {}, destroy: () => {} }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const P: SpotHeroOptions = { ...DEFAULTS, ...opts }
  let dir = chromaDir(P.keepColor)

  let src: Uint8ClampedArray | null = null
  let lw = 0
  let lh = 0
  let builtCell = 0
  let builtFocalX = 0.5
  let builtFocalY = 0.5
  let raf = 0
  let last = 0
  let tick = 0
  let visible = false
  let alive = true

  /** échantillonne la photo dans une grille basse résolution (1 px = 1 cellule) */
  function build(): void {
    if (!img!.naturalWidth) {
      src = null
      return
    }
    const cw = container.clientWidth || 320
    const ch = container.clientHeight || 240
    lw = Math.max(1, Math.floor(cw / P.cell))
    lh = Math.max(1, Math.floor(ch / P.cell))

    const off = document.createElement('canvas')
    off.width = lw
    off.height = lh
    const o = off.getContext('2d')
    if (!o) {
      src = null
      return
    }

    // cover-fit : le ratio est TOUJOURS préservé ; focalX/focalY ne pannent que l'axe
    // qui a du mou. Changer la hauteur du hero recadre, ça n'écrase jamais l'image.
    const ir = img!.naturalWidth / img!.naturalHeight
    const br = lw / lh
    // le ratio est TOUJOURS préservé ; seul l'axe qui a du mou est panné
    let dw: number
    let dh: number
    let dx: number
    let dy: number
    if (ir > br) {
      dh = lh
      dw = lh * ir
      dx = (lw - dw) * P.focalX
      dy = 0
    }
    else {
      dw = lw
      dh = lw / ir
      dx = 0
      dy = (lh - dh) * P.focalY
    }

    try {
      o.drawImage(img!, dx, dy, dw, dh)
      const data = o.getImageData(0, 0, lw, lh).data
      // une image pas encore décodée donne un buffer entièrement transparent
      let opaque = false
      for (let a = 3; a < data.length; a += 4) {
        if (data[a] !== 0) {
          opaque = true
          break
        }
      }
      if (!opaque) {
        src = null
        return
      }
      src = data
    }
    catch {
      // canvas taint (image cross-origin) : on renonce sans casser la page
      src = null
      return
    }

    canvas!.width = lw
    canvas!.height = lh
    canvas!.style.display = 'block'
    builtCell = P.cell
    builtFocalX = P.focalX
    builtFocalY = P.focalY
  }

  function render(): void {
    if (!src)
      return
    const ctx = canvas!.getContext('2d')
    if (!ctx)
      return

    const out = ctx.createImageData(lw, lh)
    const d = out.data
    const ink = toRgb(P.ink, container)
    const paper = toRgb(P.paper, container)
    const boil = reduced ? 0 : P.boil
    const hueHi = P.hueLo + P.hueSpan

    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        const i = (y * lw + x) * 4
        const r = src[i]
        const g = src[i + 1]
        const b = src[i + 2]
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        const l = clamp((lum / 255 - 0.5) * P.contrast + 0.5 + P.brightness, 0, 1)

        let thr = BAYER[y & 7][x & 7]
        if (boil)
          thr += (vnoise(x + (tick | 0), y - ((tick * 1.3) | 0)) - 0.5) * boil

        const on = 1 - l > thr
        let R = on ? ink[0] : paper[0]
        let G = on ? ink[1] : paper[1]
        let B = on ? ink[2] : paper[2]

        // couleur sélective : on garde les pixels dont la teinte correspond, bord adouci
        const match = (r - lum) * dir[0] + (g - lum) * dir[1] + (b - lum) * dir[2]
        const w = smooth(P.hueLo, hueHi, match)
        if (w > 0) {
          const kr = clamp(r + (r - lum) * P.satBoost, 0, 255)
          const kg = clamp(g + (g - lum) * P.satBoost, 0, 255)
          const kb = clamp(b + (b - lum) * P.satBoost, 0, 255)
          R += (kr - R) * w
          G += (kg - G) * w
          B += (kb - B) * w
        }

        d[i] = R
        d[i + 1] = G
        d[i + 2] = B
        d[i + 3] = 255
      }
    }
    ctx.putImageData(out, 0, 0)
  }

  /** rebuild si la géométrie a changé, puis rend une image */
  function draw(): void {
    if (!src || builtCell !== P.cell || builtFocalX !== P.focalX || builtFocalY !== P.focalY)
      build()
    if (src)
      render()
  }

  /** true si la trame doit s'animer : sinon une seule image suffit */
  function animated(): boolean {
    return !reduced && P.boil > 0
  }

  function frame(now: number): void {
    if (!alive)
      return
    raf = requestAnimationFrame(frame)
    if (now - last < 1000 / P.fps)
      return
    last = now
    tick += 1
    draw()
  }

  function start(): void {
    if (!alive || raf)
      return
    // sans boil (ou en reduced-motion), une seule image suffit : pas de boucle
    if (!animated()) {
      draw()
      return
    }
    raf = requestAnimationFrame(frame)
  }

  function stop(): void {
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  // la boucle ne tourne que quand le hero est à l'écran
  const io = new IntersectionObserver((entries) => {
    visible = entries.some(e => e.isIntersecting)
    if (visible)
      start()
    else stop()
  }, { rootMargin: '60px' })
  io.observe(container)

  const onLoad = (): void => {
    build()
    draw()
    if (visible)
      start()
  }
  const onResize = (): void => {
    build()
    draw()
  }
  img.addEventListener('load', onLoad)
  window.addEventListener('resize', onResize)
  if (img.complete && img.naturalWidth) {
    build()
    draw()
  }

  return {
    update(next) {
      if (!next)
        return
      const geometryChanged
        = (next.cell != null && next.cell !== P.cell)
          || (next.focalX != null && next.focalX !== P.focalX)
          || (next.focalY != null && next.focalY !== P.focalY)
      Object.assign(P, next)
      if (next.keepColor != null)
        dir = chromaDir(P.keepColor)
      if (geometryChanged)
        build()
      draw()
      if (animated() && visible)
        start()
      else if (!animated())
        stop()
    },
    destroy() {
      alive = false
      stop()
      io.disconnect()
      img.removeEventListener('load', onLoad)
      window.removeEventListener('resize', onResize)
    },
  }
}

export const SpotHero = { mount }
