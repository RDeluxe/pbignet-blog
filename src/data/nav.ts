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
  { label: 'Projects', href: '/projects' },
  { label: 'Now', href: '/now' },
  { label: 'Setup', href: '/setup' },
  { label: 'Photos', href: '/photos' },
]

/** poussées à droite dans la nav principale, par-dessus le séparateur */
export const secondary: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Travel ⌁', href: '/travel', locked: true },
]

/**
 * Ce que porte la barre index : les sections principales plus « About ». Le gold en donne
 * six, sans le « Travel ⌁ » verrouillé — une barre compacte n'est pas l'endroit pour
 * annoncer une section qui n'existe pas encore.
 */
export const barItems: NavItem[] = [
  ...primary,
  ...secondary.filter(i => !i.locked),
]
