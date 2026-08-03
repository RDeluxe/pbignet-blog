The **spot-colour cover** of an article: the subject stays in colour because its *hue* matches
`keepColor`, everything else falls into a dithered duotone ground. Rendered live in canvas —
no pre-baked image, no geometric mask.

```astro
<HeroPopColor
  photo={{ src: '/photos/source/bridge-red-web.jpg', alt: 'A crimson bridge…' }}
  kicker="Field Note · One red thing"
  title="Shimanto"
  place="Crimson span"
  method="KŌCHI · iPHONE 13 · SPOT COLOUR ON DITHERED GROUND · ⓒ P. BIGNET"
  vcap="FIELD NOTE / ONE RED THING"
  titleY="11%"
  underBar
  spot={{ keepColor: '#c8321e', ink: [20, 22, 15], paper: [74, 78, 62],
          contrast: 1.3, brightness: -0.02, hueLo: 34, hueSpan: 62, satBoost: 0.35 }}
/>
```

Notes:

- **The source must be a colour photograph.** Never a pre-dithered PNG: the selection works on
  hue, so a monochrome source pops nothing and the component silently renders a flat duotone.
- **`spot.paper` sets the contrast ceiling of the title**, not the photo. It is the lightest
  value in the frame. A mid grey (`128,132,122`) caps around 3.4:1 and falls under 3:1 as soon
  as a kept-colour area is light — a sky, typically. Keep the ground dark (~`78,82,74`) or flip
  `titleInk` to `dark`. **Measure it at every breakpoint; do not trust a screenshot.**
- Moving the title does not rescue a ground that is too light: scanning 10%→75% of the height
  on a `128,132,122` ground never cleared 3.33:1.
- `titleY` / `titleYMobile` / `focal` take **real values** — a cover is art-directed per image,
  which is the one place this system accepts values instead of intentions.
- `focal` only pans the crop; the aspect ratio is always preserved, so changing `height`
  re-frames and never squashes.
- `underBar` lifts the cover under the reading bar, using the bar's **measured** height
  (`--bar-h`). Without it, the bar's cream type sits on the paper and is unreadable.
- Reduced motion freezes the boil and renders a single frame.
