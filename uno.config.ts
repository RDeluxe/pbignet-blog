import { defineConfig, presetMini } from 'unocss'

export default defineConfig({
  presets: [presetMini()],
  theme: {
    colors: {
      paper: 'var(--paper)',
      'paper-2': 'var(--paper-2)',
      ink: 'var(--ink)',
      'ink-2': 'var(--ink-2)',
      'ink-3': 'var(--ink-3)',
      accent: 'var(--accent)',
      line: 'var(--line)',
      'line-soft': 'var(--line-soft)',
    },
    fontFamily: {
      display: 'var(--display)',
      sans: 'var(--sans)',
      mono: 'var(--mono)',
      serif: 'var(--serif)',
    },
    maxWidth: {
      site: 'var(--maxw)',
    },
  },
})
