A **tile** — the interactive box (case **D2** of the July 2026 box audit). `CollCard` is the
collection card (Field Guides); `GearCard` is the same contract for the setup grid.

Bare at rest (1px hairline), then on hover **and on keyboard focus**: corner crosses + ink
border + `--paper-2` fill. **The corners are the focus signal.**

```astro
<CollCard tag="Guide" tagAccent title="…" description="…" footer="06 chapitres" href="/guides/x" />

<Grid cols={3} gap="hairline">
  <CollCard … bordered={false} />   {/* the grid draws the rules, not the card */}
</Grid>
```

Notes:

- **In a hairline grid, pass `bordered={false}`.** The card then drops its border *and* keeps an
  opaque `--paper` background — that opacity is what masks the grid's own rule showing through.
- In that mode the crosses **pull inside** the frame (`--cross-out: 0`): nine pixels of
  overshoot would draw onto the neighbouring cell across a 1px gutter.
- Also in that mode there is no ink border on hover — the grid owns the rules, and making one
  appear would need an inset shadow, which the brand bans.
- **No lift on hover.** The old `translateY(-3px)` is gone: the audit lists it among the
  problems, and D2 defines one unified hover without displacement.
- Hover and `:focus-visible` are deliberately identical — a keyboard user gets the same signal.
- The corner crosses are the same object as the callout's: they share `--cross-size`,
  `--cross-weight` and `--cross-out`. Change them in one place.
