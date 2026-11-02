/**
 * Les entrées de navigation du site, partagées.
 *
 * Trois endroits les affichent : `Masthead` (la barre unique en haut de chaque page),
 * `IndexBar` (la barre fixe de la home, qui se résout au scroll) et le pied de page. Les
 * dupliquer garantissait qu'un jour l'un aurait un lien que l'autre n'a pas.
 *
 * A section not built yet is HIDDEN everywhere (Pierrick, 2026-11-02, replacing lot 2's
 * visible « soon » entries): it stays in these lists with `locked: true`, and showing it
 * again is deleting that flag.
 */
export interface NavItem {
  label: string
  href: string
  /** section not built yet: hidden from every nav until the flag goes */
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

const built = (items: NavItem[]): NavItem[] => items.filter(i => !i.locked)

/** what the masthead and the index bar carry: every built section, in order */
export const navItems: NavItem[] = built([...primary, ...secondary])
export const barItems: NavItem[] = navItems

/** the footer's two columns, built sections only; a column with none is left out */
export const footer: { title: string, items: NavItem[] }[] = [
  { title: 'Read', items: [
    primary[0],
    { label: 'Field Guides', href: '/guides', locked: true },
    primary[1],
    primary[2],
  ] },
  { title: 'Around', items: [secondary[0], primary[3], primary[4], secondary[1]] },
]
  .map(col => ({ ...col, items: built(col.items) }))
  .filter(col => col.items.length > 0)
