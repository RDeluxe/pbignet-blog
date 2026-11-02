import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

/**
 * La recipe de cover, keyée à l'image (cf. HeroPopColor et PIPELINE §4.6b).
 * Tout est optionnel : les défauts du moteur viennent du banc research.
 */
const spotRecipe = z.object({
  keepColor: z.string().optional(),
  ink: z.tuple([z.number(), z.number(), z.number()]).optional(),
  paper: z.tuple([z.number(), z.number(), z.number()]).optional(),
  cell: z.number().optional(),
  contrast: z.number().optional(),
  brightness: z.number().optional(),
  boil: z.number().optional(),
  hueLo: z.number().optional(),
  hueSpan: z.number().optional(),
  satBoost: z.number().optional(),
  /** mode INVERT : la teinte keyée part dans le dither, tout le reste garde sa couleur */
  invert: z.boolean().optional(),
  /** la zone gardée en couleur reste à la résolution native de la photo (pas de trame) */
  keepSharp: z.boolean().optional(),
})

/**
 * Chaque hero d'article a SON schéma — pas de contrat commun (décision 2026-08-05) :
 * les heros peuvent être très différents. Le frontmatter porte `kind`, et
 * `CoverSlot.astro` assemble le bon composant. Ajouter un hero = un membre d'union
 * ici + une branche dans CoverSlot.
 */
const popColorCover = z.object({
  kind: z.literal('pop-color').default('pop-color'),
  /** source EN COULEUR, jamais un PNG déjà dithéré — cf. `public/photos/source/` */
  src: z.string(),
  alt: z.string(),
  /** le mot de couverture. À défaut, le titre de l'article. */
  word: z.string().optional(),
  kicker: z.string().optional(),
  place: z.string().optional(),
  method: z.string().optional(),
  vcap: z.string().optional(),
  /** art direction par image — vérifier ≥3:1 à CHAQUE breakpoint */
  titleX: z.string().optional(),
  titleY: z.string().optional(),
  titleYMobile: z.string().optional(),
  titleInk: z.enum(['light', 'dark']).optional(),
  height: z.string().optional(),
  focal: z.object({ x: z.number(), y: z.number() }).partial().optional(),
  spot: spotRecipe.optional(),
})

const cover = popColorCover // z.discriminatedUnion('kind', [...]) dès le deuxième hero

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tag: z.enum(['Essay', 'Note']),
    readTime: z.number(),
    /** language of the text; the site chrome stays in English */
    lang: z.enum(['en', 'fr']).default('en'),
    /** a run of posts, e.g. « You are the CEO » */
    series: z.string().optional(),
    /** the post's URL on the old Ghost blog, kept for future redirects */
    link: z.string().url().optional(),

    /* ---- champs de page d'article (optionnels : l'index n'en a pas besoin) ---- */
    /** chapeau sous le titre. À défaut, `description` est réutilisée. */
    dek: z.string().optional(),
    /** lieu affiché dans la barre de statistiques */
    place: z.string().optional(),
    /** numéro d'édition du mobilier print, ex. « Nº 014 » */
    edition: z.string().optional(),
    /** tags secondaires — `tag` reste le principal et porte l'accent */
    tags: z.array(z.string()).default([]),
    /** numéroter les sous-titres 01/02/03. À réserver aux vraies séquences. */
    numbered: z.boolean().default(false),
    cover: cover.optional(),
    /** kept in the repo, out of every list, the sitemap and the production build */
    draft: z.boolean().default(false),
  }),
})

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tag: z.enum(['Guide']),
    chapters: z.string(),
  }),
})

export const collections = { writing, guides }
