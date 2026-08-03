The **reading body** of long-form: measure, rhythm, hierarchy. Wrap rendered Markdown in it.

```astro
<Prose numbered dropCap>
  <Content />
</Prose>
```

Notes:

- Measure is **66ch of text**; the gutters add to it rather than eating it. (The gold article
  template writes `max-width: 66ch` *plus* gutters in `border-box`, which lands nearer 52ch —
  this follows the documented intent, not that implementation.)
- Body is Newsreader 16.5/1.55 at `--ink-2`; the first paragraph lifts to 18.5px at full ink.
- `dropCap` puts an Anton initial at the page's accent ink on that first paragraph. One per
  article, never more.
- `numbered` numbers the subheads 01/02/03 with a **CSS counter** — the Markdown stays plain.
  **Reserve it for real argumentative sequences**: as a reflex on every article it becomes a
  tic.
- Subheads are mono, tracked, on a rule — the "spec sheet" register, not a display title.
- A Markdown quote (`>`) gets the pull-quote treatment: two rules, top and bottom. **Never a
  left accent bar.**
- This is the one place where `:global()` is legitimate in this system: the HTML comes from
  Markdoc, so there is no component to pass a prop to. Prose *owns* its content — it is not
  reaching into another component.
