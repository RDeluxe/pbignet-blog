import antfu from '@antfu/eslint-config'

export default antfu({
  astro: true,
  // design/ = miroir distant (écrasé à chaque sync) + doc dont les blocs de code sont des
  // illustrations, pas du code exécuté. Rien à linter là-dedans.
  // .impeccable/ = cache de l'outil de design, hors git (.git/info/exclude).
  // .worktrees/ = les worktrees des crewmates : chacun se lint depuis le sien.
  ignores: ['design/**', '**/.impeccable/**', '.worktrees/**'],
})
