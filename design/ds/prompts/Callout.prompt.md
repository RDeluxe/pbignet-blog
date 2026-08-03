The **callout** — a pinned note (case **E1** of the July 2026 box audit): hairline box, two
registration crosses (top-left and bottom-right), faint dots, and a mono tag that **breaks the
top rule**.

```astro
<Callout title="La règle d'or">Chaque page choisit une encre…</Callout>
<Callout tag="Méthode · 02">Sans titre, autre étiquette.</Callout>
```

Notes:

- **Never a left accent bar.** This is the brand's most explicit ban — it is also the single
  most recognisable machine-written tell. The gold article template still carries one; the
  decision that removes it is newer than the template.
- The tag's opaque paper background is *what* breaks the top rule. Don't give the box a
  background that would defeat it.
- Two crosses only — top-left and bottom-right. Four would read as a plate.
- `tag` defaults to `N.B.` and is a prop: a note can announce something else ("Méthode · 02").
- `title` is optional; without it the note is a single paragraph.
- The slot does not reset margins on its children (no `:global()` in this system). Pass running
  text, or handle the spacing in the caller.
- The tag sits at `--accent`, so it follows the page ink like the rest of the furniture.
