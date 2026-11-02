/**
 * Les entrées de navigation du site, partagées.
 *
 * Deux composants les affichent : `MainNav` (la nav principale sous la metabar) et la
 * variante index d'`ArticleBar` (la barre fixe qui se résout au scroll). Les dupliquer
 * garantissait qu'un jour l'une aurait un lien que l'autre n'a pas.
 */
export interface NavItem {
  label: string
  href: string
  /** section annoncée mais pas encore construite : affichée, non cliquable */
  locked?: boolean
}

/** les sections principales, dans l'ordre du gold */
export const primary: NavItem[] = [
  { label: 'Writing', href: '/writing' },
  { label: 'Projects', href: '/projects', locked: true },
  { label: 'Now', href: '/now', locked: true },
  { label: 'Setup', href: '/setup', locked: true },
  { label: 'Photos', href: '/photos', locked: true },
]

/** poussées à droite dans la nav principale, par-dessus le séparateur */
export const secondary: NavItem[] = [
  { label: 'About', href: '/about', locked: true },
  { label: 'Travel ⌁', href: '/travel', locked: true },
]

/**
 * Ce que porte la barre index : les sections principales plus « About ». Le gold en donne
 * six, sans le « Travel ⌁ » verrouillé — une barre compacte n'est pas l'endroit pour
 * annoncer une section qui n'existe pas encore.
 */
export const barItems: NavItem[] = [
  ...primary,
  ...secondary,
].filter(i => !i.locked)

/** the footer's two columns; a locked entry shows as plain text */
export const footer: { title: string, items: NavItem[] }[] = [
  { title: 'Read', items: [
    primary[0],
    { label: 'Field Guides', href: '/guides', locked: true },
    primary[1],
    primary[2],
  ] },
  { title: 'Around', items: [secondary[0], primary[3], primary[4], secondary[1]] },
]
