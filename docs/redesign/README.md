# Redesign, October 2026: after the printed illumos books

The printed illumos books (the Modular Debugger Guide, the Dynamic Tracing
Guide and Writing Device Drivers) share one visual language: a hand-painted
phoenix in warm oranges and reds, one bold flat colour field per book, quiet
type and plenty of space. The phoenix is also illumos's own mascot, so taking
the site there places OIDA visibly inside the illumos community, next to
illumos.org, the illumos books and openindiana.org.

## What changed

**Palette.** The brand core is a phoenix palette: deep flame (`#b43a0e`) for
small text, numbers and rules, flame (`#c2410c`) for buttons, ember
(`#f5b640`) as a highlight, on warm paper (`#faf6ee`) with warm near-black
ink. The dark scheme is the debugger cover: warm black paper with the same
flame accents.

**One colour field per section, from the covers.**

| Section | Field | Cover |
| --- | --- | --- |
| Hero | paper, phoenix crossing a mint beam of light | the DTrace beam |
| 01 What we do | mint with orange/red stripes along its edge and a green beam across it | Dynamic Tracing Guide |
| 02 Membership | paper | — |
| 03 Finances | deep blue into violet | Writing Device Drivers |
| 04 News | paper | — |
| Footer and the `pkg info` card | black, ember labels | Modular Debugger Guide |

A thin strip of the DTrace stripes runs along the top of every page; the
bylaws page carries the stripes vertically beside its title, like a spine.

A field (`.band-mint`, `.band-night`, `.band-coal` in `src/styles/global.css`)
re-maps the whole token set: `--paper`, `--ink`, `--ink-2`, `--rule`,
`--accent`, `--brand` and `--focus`. Buttons, rules, labels and links inside a
field therefore use that field's own ink, in both colour schemes, without
per-element overrides. Every text/background pair is checked by
`scripts/contrast.py` against WCAG AA (small text 4.5:1, large text and focus
rings 3:1); run it after changing a token.

**Typography** stays IBM Plex Sans, Mono and Serif, self-hosted. Sizes and
measures are unchanged; the type was already quiet.

**Logo slot.** The OIDA logo is being designed in the brand repository
(https://src.oida.foundation/oida/brand). `src/components/Logo.astro` renders
the text wordmark until that is decided; replacing its inside is the only
change needed. The favicon is still a placeholder letter, recoloured. The
illumos phoenix logo itself is not used: it is a trademark whose use outside
"powered by" badges needs approval (https://illumos.org/docs/about/logo/).

**Illustration slots.** Every picture goes through
`src/components/Illustration.astro` (`hero` and `mark`). Both are the site's
own abstract phoenix, built by `scripts/phoenix.py` from tapered feather
strokes along Bézier centre-lines and committed as SVG in `src/assets/`. It is
inlined, so the pages make no image requests, and the site works with images
disabled. Nothing is animated beyond the existing hover transitions, which
`prefers-reduced-motion` switches off.

## The cover artwork

The paintings on the printed books are somebody's artwork. They are not in the
books' source (github.com/illumos/illumos-docbooks has no cover files), not on
illumos.org, and no print edition, artist or licence turned up anywhere
public. The site therefore does not copy them: the phoenix here is an original
figure in the same spirit (warm palette, raised wings, trailing tail, a beam of
light), not a trace.

If the original files are freely licensed and the artist agrees, they can
replace the `hero` branch of `Illustration.astro`, with attribution added to
the footer. Until then this question is open with the board.

## Screenshots

Light scheme, 1280 px and 390 px wide, from `astro build` + `astro preview`:

| | Before | After |
| --- | --- | --- |
| Home, desktop | `before-home-desktop.png` | `after-home-desktop.png` |
| Home, mobile | `before-home-mobile.png` | `after-home-mobile.png` |
| Bylaws, desktop | `before-bylaws-desktop.png` | `after-bylaws-desktop.png` |
| Bylaws, mobile | `before-bylaws-mobile.png` | `after-bylaws-mobile.png` |
| Home, desktop, dark scheme | — | `after-home-desktop-dark.png` |

## Checks done

- `npm run build` succeeds; `dist/` contains no `<script>` element.
- The only external URLs in the built pages are links (`<a href>`, canonical,
  `rel=me`); fonts come from `/_astro/`, and there are no image requests.
- `src/texts/bylaws.md` is byte-identical to `main`.
- `scripts/contrast.py` passes for every pair in both schemes.
