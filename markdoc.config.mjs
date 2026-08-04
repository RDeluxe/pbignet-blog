import { component, defineMarkdocConfig, nodes } from '@astrojs/markdoc/config'

/**
 * Markdoc — le pont entre le contenu d'un article et nos composants Astro.
 *
 * Pourquoi ce fichier existe : dans un `.astro`, on appelle un composant comme le dit la
 * doc Astro — `<Callout title="…">`. Dans un fichier de contenu, non : un `.md` n'a ni
 * `import` ni balise de composant, c'est du texte. Ce n'est pas une limite d'Astro mais de
 * Markdown. Markdoc rétablit le pont : `{% callout %}` rend le composant, avec ses props.
 *
 * `component()` pointe le MÊME fichier `.astro` que les pages : il n'y a pas deux versions
 * d'un composant, une pour les pages et une pour le contenu. Les `attributes` ci-dessous ne
 * sont donc pas une seconde API, seulement la déclaration des props que le contenu peut
 * passer — Markdoc les valide et refuse le build sur un attribut inconnu ou mal typé.
 *
 * ⚠️ Les valeurs de `matches` doivent rester d'accord avec les unions TypeScript des props.
 * Un `matches` plus permissif que l'union laisserait passer une variante qui n'existe pas
 * en CSS ; c'est la seule duplication de vérité de ce fichier, et elle est volontaire —
 * Markdoc ne lit pas nos types.
 */
export default defineMarkdocConfig({
  nodes: {
    /**
     * Markdoc enveloppe par défaut tout le document dans un `<article>`. On le retire, pour
     * deux raisons :
     *
     * 1. **`Prose` cible ses enfants directs.** Ses règles de bloc sont en `> p`, `> h2`…
     *    afin qu'une boîte imbriquée (`{% callout %}`) garde sa propre typographie. Un
     *    conteneur intercalé les fait toutes tomber : mesuré, le corps repassait à 16px
     *    Archivo interligne normal au lieu de 16,5px Newsreader à 1.55.
     * 2. **Cohérence entre `.md` et `.mdoc`.** Le Markdown natif d'Astro n'ajoute pas de
     *    conteneur ; sans ça, deux articles de la même collection auraient deux structures
     *    selon leur extension.
     *
     * Le `<article>` sémantique existe déjà dans le gabarit de page, autour du hero et du
     * corps — ce n'est pas au contenu de le poser.
     */
    document: { render: null },

    // le rendu par défaut des titres reste celui de Markdoc, mais on garde ses ancres
    heading: nodes.heading,
  },

  tags: {
    /**
     * note épinglée E1. L'étiquette est un mot de RÔLE (Caveat, Méthode, Source) —
     * « N.B. » n'est que le défaut du specimen (arbitrage CD, 2026-08-04).
     */
    callout: {
      render: component('./src/components/print/Callout.astro'),
      attributes: {
        tag: { type: String },
        title: { type: String },
        titleAs: { type: String, matches: ['h2', 'h3', 'h4'] },
        as: { type: String, matches: ['aside', 'div'] },
      },
    },

    /**
     * plate B6 — dans un corps d'article, c'est un REGISTRE (mono-notes), pas une image.
     * Le gold en donne le patron : `ptag` « Ledger · One Week » + trois lignes.
     */
    plate: {
      render: component('./src/components/print/Plate.astro'),
      attributes: {
        surface: { type: String, matches: ['paper', 'recessed'] },
        grid: { type: Boolean },
        tag: { type: String },
        as: { type: String, matches: ['figure', 'div'] },
      },
    },

    /** citation détachée — deux filets, JAMAIS de barre d'accent à gauche */
    pullquote: {
      render: component('./src/components/article/PullQuote.astro'),
      attributes: {
        source: { type: String },
      },
    },

    /** image du corps d'article. `wide` la fait déborder de la mesure de lecture. */
    plateimage: {
      render: component('./src/components/article/ArticlePlate.astro'),
      attributes: {
        src: { type: String, required: true },
        alt: { type: String, required: true },
        caption: { type: String },
        plate: { type: String },
        wide: { type: Boolean },
      },
    },

    /** libellé mono — les lignes d'un registre de plate */
    monolabel: {
      render: component('./src/components/print/MonoLabel.astro'),
      attributes: {
        tone: { type: String, matches: ['default', 'quiet'] },
        as: { type: String, matches: ['div', 'span', 'p'] },
      },
    },
  },
})
