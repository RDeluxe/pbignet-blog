The **plate** — static presentation frame (case **B6** of the July 2026 box audit). A
borrowed-grid frame whose four strokes overshoot the corners, over an almost invisible squared
grid on bare paper.

```astro
<Plate tag="Fig · 01">…</Plate>
<Plate tag="Fig · 02" grid={false}>…</Plate>          {/* a chart brings its own grid */}
<Plate tag="Fig · 03" surface="recessed">…</Plate>    {/* B4, secondary only */}
```

Notes:

- **A plate only frames.** No photo floating inside it, no drop shadow, ever.
- **The frame overshoots by 13px on each side**, so the container must leave that margin. Two
  plates side by side in a `<Grid>` (12px gutter) would touch — stack them instead.
- `grid={false}` is case **C1**: a diagram keeps its own internal dot grid with its points
  snapped to it, and the plate adds nothing but the frame. Two overlaid grids read as noise.
- `surface="recessed"` is **B4**, a secondary for busy surroundings only. `--paper-2` stays
  reserved for recessed panels and hover fills — if the page hesitates, it is bare paper.
- The frame stroke follows `--ink` (via `--line-strong`), so it takes the page's ink rather
  than freezing the specimen's.
- If the squared grid is *noticeable*, it is too strong.
- `tag` ("Fig · 01") is readable reference data, not decoration — it is not `aria-hidden`.
