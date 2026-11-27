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

/**
 * What a zone does. `in`/`out` shape the colour selection: with at least one `in`, the
 * selection is restricted to their union; `out` zones are removed from it. `photo` and
 * `dither` carry their own treatment and ignore the colour selection: `photo` keeps the
 * zone as the full-resolution photograph, `dither` gives it its own screen.
 */
export type SpotMaskMode = 'in' | 'out' | 'photo' | 'dither'

/** Polygone de zone, en coordonnées NORMALISÉES sur l'image naturelle (0..1). */
export interface SpotMask {
  mode: SpotMaskMode
  pts: [number, number][]
  /* `dither` zones only: the zone's own screen. Unset fields fall back to the global ones. */
  ink?: SpotColor
  paper?: SpotColor
  contrast?: number
  brightness?: number
  /** px; rounded to a whole multiple of the global `cell` (the zone can only be coarser) */
  cell?: number
  /** a smooth outline through the points (a closed Catmull-Rom curve) instead of straight edges */
  curve?: boolean
}

/** what a zone's outline is drawn with: a canvas context, or the editor's SVG path builder */
export interface ZonePen {
  moveTo: (x: number, y: number) => void
  lineTo: (x: number, y: number) => void
  bezierCurveTo: (c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) => void
  closePath: () => void
}

/**
 * Traces a zone's outline, its points already in pen coordinates. Straight edges by default;
 * with `curve`, a closed uniform Catmull-Rom curve through every point, as cubic Béziers.
 * The engine and the editor's overlay both draw through here, so they draw the same shape.
 */
export function traceZone(pen: ZonePen, pts: [number, number][], curve = false): void {
  const n = pts.length
  if (!curve || n < 3) {
    pts.forEach(([x, y], j) => j ? pen.lineTo(x, y) : pen.moveTo(x, y))
    pen.closePath()
    return
  }
  const at = (j: number) => pts[(j + n) % n]
  pen.moveTo(pts[0][0], pts[0][1])
  for (let j = 0; j < n; j++) {
    const [p0, p1, p2, p3] = [at(j - 1), at(j), at(j + 1), at(j + 2)]
    pen.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6,
      p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6,
      p2[1] - (p3[1] - p1[1]) / 6,
      p2[0],
      p2[1],
    )
  }
  pen.closePath()
}

/** Ce que devient une cellule « éteinte » du dither (voir `SpotHeroOptions.ground`). */
export type SpotGround = 'flat' | 'photo' | 'transparent'

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
  /**
   * Mode INVERT (décision 2026-08-05) : le masque se retourne — c'est la teinte keyée
   * qui part dans le duotone dithéré, et tout le RESTE qui garde sa couleur.
   */
  invert: boolean
  /**
   * keepSharp (décision 2026-08-05, optionnel — à l'essai) : la zone gardée en couleur
   * n'est PAS dégradée à la taille de cellule. Le canvas devient transparent là où la
   * couleur est conservée (alpha = 1−w) et la photo PLEINE RÉSOLUTION transparaît —
   * elle vit déjà sous le canvas. Nuance assumée : `satBoost` ne s'applique plus à
   * cette zone (c'est la photo brute qu'on voit).
   */
  keepSharp: boolean
  /**
   * Sélection par ANGLE de teinte (opt-in). `match` est une projection, pas une teinte :
   * un jaune saturé score plus haut qu'un rouge délavé. En `hueMode`, on compare l'angle
   * entre la chroma du pixel et celle de `keepColor`, et `hueLo`/`hueSpan` sont ignorés.
   */
  hueMode: boolean
  /** demi-angle (°) entièrement gardé */
  hueTol: number
  /** degrés de bord doux au-delà de `hueTol` */
  hueSoft: number
  /** longueur de chroma mini (0..255) : sous ce seuil, le pixel est trop gris pour avoir une teinte */
  satMin: number
  /** bord doux de ce seuil */
  satSoft: number
  /**
   * Zones dessinées (opt-in). Coordonnées normalisées sur l'image naturelle : elles
   * survivent au recadrage, au `cell` et au point focal. S'il existe au moins un `in`,
   * tout le reste est hors sélection ; les `out` se soustraient. Appliquées avant
   * `invert` et `keepSharp`. Rasterisées une fois par build.
   */
  masks: SpotMask[] | null
  /**
   * `false` = no colour pops anywhere: the whole frame is screened, except `photo` zones.
   * Applied after `invert`.
   */
  pop: boolean
  /**
   * Fond des cellules éteintes (opt-in). `flat` = la couleur `paper` · `photo` = le pixel
   * d'origine (désaturé par `groundSat`, éclairci par `groundLift`, mixé vers `paper` par
   * `groundMix`) · `transparent` = alpha 0 : le fond de la section transparaît, et l'`img`
   * est masquée (sauf en keepSharp, qui a besoin d'elle).
   */
  ground: SpotGround
  /** 0 = photo pure → 1 = `paper` (ground `photo`) */
  groundMix: number
  groundSat: number
  groundLift: number
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
  invert: false,
  keepSharp: false,
  hueMode: false,
  hueTol: 20,
  hueSoft: 12,
  satMin: 40,
  satSoft: 20,
  masks: null,
  pop: true,
  ground: 'flat',
  groundMix: 0,
  groundSat: 1,
  groundLift: 0,
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
  // bord de largeur nulle (hueSoft ou satSoft à 0) : un seuil net, pas un NaN
  if (e1 === e0)
    return x >= e1 ? 1 : 0
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
  // le topo (canvas.topo-on) vit AU-DESSUS du canvas dither : en keepSharp, ses traits
  // se retrouveraient devant la photo nette. On le masque avec l'ALPHA du canvas dither
  // lui-même (opaque = sol tramé, troué = zone nette). L'alpha ne dépend pas du boil,
  // donc le masque n'est régénéré que quand les paramètres de sélection changent.
  let topoMaskDirty = true
  let topoMasked = false
  let lw = 0
  let lh = 0
  let builtCell = 0
  let builtFocalX = 0.5
  let builtFocalY = 0.5
  // masque rasterisé (1 octet par cellule) et cover-fit qui l'a placé
  let mask: Uint8Array | null = null
  // treated zones (`photo`, `dither`): per cell, 1 + the zone's index in `zones`, 0 = none
  let zoneMap: Uint8Array | null = null
  let zones: SpotMask[] = []
  let hasPhotoZone = false
  let fit: { dx: number, dy: number, dw: number, dh: number } | null = null
  let imgHidden = false
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

    fit = { dx, dy, dw, dh }
    // the img under the canvas shows through its holes (photo zones, keepSharp): it must
    // be panned like the canvas, object-position x% being the same (frame - drawn) * x offset
    img!.style.objectPosition = `${P.focalX * 100}% ${P.focalY * 100}%`
    buildMask()

    canvas!.width = lw
    canvas!.height = lh
    canvas!.style.display = 'block'
    topoMaskDirty = true
    builtCell = P.cell
    builtFocalX = P.focalX
    builtFocalY = P.focalY
  }

  /**
   * Rasterise les polygones dans une grille `lw×lh` (canal R → 1 octet par cellule).
   * Point image (0..1) → grille : on passe par le cover-fit de `build()`.
   */
  function buildMask(): void {
    mask = null
    zoneMap = null
    zones = []
    hasPhotoZone = false
    const ms = (P.masks ?? []).filter(m => m.pts && m.pts.length >= 3)
    if (!ms.length || !fit)
      return
    const off = document.createElement('canvas')
    off.width = lw
    off.height = lh
    const o = off.getContext('2d', { willReadFrequently: true })
    if (!o)
      return
    const path = (m: SpotMask): void => {
      o.beginPath()
      traceZone(o, m.pts.map(([px, py]) => [fit!.dx + px * fit!.dw, fit!.dy + py * fit!.dh]), m.curve)
      o.fill()
    }

    const sel = ms.filter(m => m.mode === 'in' || m.mode === 'out')
    if (sel.length) {
      const hasIn = sel.some(m => m.mode === 'in')
      o.fillStyle = hasIn ? '#000' : '#fff'
      o.fillRect(0, 0, lw, lh)
      for (const m of sel) {
        o.fillStyle = m.mode === 'in' ? '#fff' : '#000'
        path(m)
      }
      const d = o.getImageData(0, 0, lw, lh).data
      mask = new Uint8Array(lw * lh)
      for (let k = 0; k < mask.length; k++)
        mask[k] = d[k * 4]
    }

    // treated zones: one pass each, hard edge at half coverage, the later zone wins
    zones = ms.filter(m => m.mode === 'photo' || m.mode === 'dither')
    if (!zones.length)
      return
    zoneMap = new Uint8Array(lw * lh)
    zones.forEach((m, z) => {
      o.fillStyle = '#000'
      o.fillRect(0, 0, lw, lh)
      o.fillStyle = '#fff'
      path(m)
      const d = o.getImageData(0, 0, lw, lh).data
      for (let k = 0; k < zoneMap!.length; k++) {
        if (d[k * 4] >= 128)
          zoneMap![k] = z + 1
      }
    })
    hasPhotoZone = zones.some(m => m.mode === 'photo')
  }

  /** a photo zone is a hole in the canvas, like keepSharp: both need the img and a masked topo */
  function hasHoles(): boolean {
    return P.keepSharp || hasPhotoZone
  }

  /** l'`img` ne doit pas transparaître sous un fond `transparent` — sauf là où le canvas se troue */
  function syncImgVisibility(): void {
    const hide = P.ground === 'transparent' && !hasHoles()
    if (hide === imgHidden)
      return
    img!.style.visibility = hide ? 'hidden' : ''
    imgHidden = hide
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
    const cosHi = Math.cos(P.hueTol * Math.PI / 180)
    const cosLo = Math.cos((P.hueTol + P.hueSoft) * Math.PI / 180)
    const satHi = P.satMin + P.satSoft
    const gPhoto = P.ground === 'photo'
    const gClear = P.ground === 'transparent'
    const gl = P.groundLift * 255
    syncImgVisibility()

    // the screen of each cell: the global one, or that of the `dither` zone it falls in
    interface Screen { ink: number[], paper: number[], contrast: number, brightness: number, k: number }
    const base: Screen = { ink, paper, contrast: P.contrast, brightness: P.brightness, k: 1 }
    const screens: (Screen | null)[] = zones.map(m => m.mode === 'dither'
      ? {
          ink: m.ink != null ? toRgb(m.ink, container) : ink,
          paper: m.paper != null ? toRgb(m.paper, container) : paper,
          contrast: m.contrast ?? P.contrast,
          brightness: m.brightness ?? P.brightness,
          k: Math.max(1, Math.round((m.cell ?? P.cell) / P.cell)),
        }
      : null)

    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        const i = (y * lw + x) * 4
        const z = zoneMap ? zoneMap[y * lw + x] : 0
        if (z && zones[z - 1].mode === 'photo') {
          // the canvas is a hole here: the full-resolution photo shows through
          d[i + 3] = 0
          continue
        }
        const sc = z ? screens[z - 1]! : base
        // a coarser zone screen samples and thresholds per block of k×k cells
        const bx = sc.k > 1 ? (x / sc.k) | 0 : x
        const by = sc.k > 1 ? (y / sc.k) | 0 : y
        const si = sc.k > 1
          ? (Math.min(lh - 1, by * sc.k + (sc.k >> 1)) * lw + Math.min(lw - 1, bx * sc.k + (sc.k >> 1))) * 4
          : i
        const r = src[si]
        const g = src[si + 1]
        const b = src[si + 2]
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        const l = clamp((lum / 255 - 0.5) * sc.contrast + 0.5 + sc.brightness, 0, 1)

        let thr = BAYER[by & 7][bx & 7]
        if (boil)
          thr += (vnoise(bx + (tick | 0), by - ((tick * 1.3) | 0)) - 0.5) * boil

        const on = 1 - l > thr
        let R = on ? sc.ink[0] : sc.paper[0]
        let G = on ? sc.ink[1] : sc.paper[1]
        let B = on ? sc.ink[2] : sc.paper[2]
        let A = 255
        if (!on) {
          if (gPhoto) {
            // pixel d'origine, désaturé par groundSat, éclairci par groundLift, mixé vers paper
            const pr = clamp(lum + (r - lum) * P.groundSat + gl, 0, 255)
            const pg = clamp(lum + (g - lum) * P.groundSat + gl, 0, 255)
            const pb = clamp(lum + (b - lum) * P.groundSat + gl, 0, 255)
            R = pr + (sc.paper[0] - pr) * P.groundMix
            G = pg + (sc.paper[1] - pg) * P.groundMix
            B = pb + (sc.paper[2] - pb) * P.groundMix
          }
          else if (gClear) {
            A = 0
          }
        }

        // couleur sélective : on garde les pixels dont la teinte correspond, bord adouci.
        // En invert, le masque se retourne : la teinte keyée part dans le duotone,
        // tout le reste garde sa couleur.
        const dr = r - lum
        const dg = g - lum
        const db = b - lum
        const match = dr * dir[0] + dg * dir[1] + db * dir[2]
        let w: number
        if (P.hueMode) {
          // cosinus de l'angle entre la chroma du pixel et celle de keepColor ; la
          // saturation est une porte à part
          const len = Math.hypot(dr, dg, db)
          w = len < 1 ? 0 : smooth(cosLo, cosHi, match / len) * smooth(P.satMin, satHi, len)
        }
        else {
          w = smooth(P.hueLo, hueHi, match)
        }
        if (mask)
          w *= mask[y * lw + x] / 255
        if (P.invert)
          w = 1 - w
        // a `dither` zone takes its own screen, never the colour selection
        if (!P.pop || z)
          w = 0

        if (P.keepSharp) {
          // la zone gardée n'est pas repeinte : le canvas s'y troue (alpha = 1−w) et
          // la photo pleine résolution transparaît par en dessous
          d[i] = R
          d[i + 1] = G
          d[i + 2] = B
          d[i + 3] = gClear && !on ? 0 : Math.round((1 - w) * 255)
          continue
        }

        if (w > 0) {
          const kr = clamp(r + (r - lum) * P.satBoost, 0, 255)
          const kg = clamp(g + (g - lum) * P.satBoost, 0, 255)
          const kb = clamp(b + (b - lum) * P.satBoost, 0, 255)
          if (gClear && !on) {
            // fond transparent : la couleur gardée se pose seule, son opacité est w
            R = kr
            G = kg
            B = kb
            A = Math.round(w * 255)
          }
          else {
            R += (kr - R) * w
            G += (kg - G) * w
            B += (kb - B) * w
          }
        }

        d[i] = R
        d[i + 1] = G
        d[i + 2] = B
        d[i + 3] = A
      }
    }
    ctx.putImageData(out, 0, 0)
    syncTopoMask()
  }

  /** applique (ou retire) le masque alpha du dither sur le canvas topo sibling */
  function syncTopoMask(): void {
    const topo = container.querySelector<HTMLCanvasElement>('canvas.topo-on')
    if (!topo)
      return
    if (hasHoles()) {
      if (!topoMaskDirty)
        return
      const url = `url(${canvas!.toDataURL()})`
      topo.style.webkitMaskImage = url
      topo.style.maskImage = url
      topo.style.webkitMaskSize = '100% 100%'
      topo.style.maskSize = '100% 100%'
      topoMaskDirty = false
      topoMasked = true
    }
    else if (topoMasked) {
      topo.style.webkitMaskImage = ''
      topo.style.maskImage = ''
      topo.style.webkitMaskSize = ''
      topo.style.maskSize = ''
      topoMasked = false
    }
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
      topoMaskDirty = true
      if (geometryChanged)
        build()
      else if ('masks' in next)
        buildMask()
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
      if (imgHidden)
        img.style.visibility = ''
      img.style.objectPosition = ''
      img.removeEventListener('load', onLoad)
      window.removeEventListener('resize', onResize)
    },
  }
}

export const SpotHero = { mount }
