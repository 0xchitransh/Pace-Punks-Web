# Pace Punks brand kit

Owned by the "Early access website" thread. Other threads read this folder; send change requests there.

## Look in one line
Night-city arcade. Deep indigo backgrounds lifted straight from the art, cream text like sneaker leather, a sunset-orange accent and a neon-pink pixel drop shadow. Hard pixel edges, no soft blur shadows, no glossy gradients on UI.

## Colors
See `tokens.json` (with usage notes) and `tokens.css`.

| Token | Hex | Use |
|---|---|---|
| night | #140F33 | Background (always dark; the brand has no light theme) |
| night-2 | #1E1749 | Cards, sheets, tab bar |
| night-3 | #2A2163 | Inputs, pressed states |
| line | #3B3180 | Borders |
| cream | #FFF3DE | Primary text |
| cream-dim | #BDB3D9 | Secondary text |
| sunset | #FF7A3D | Primary buttons, active state |
| neon-pink | #FF4FA3 | Pixel shadow, highlights |
| aqua-pulse | #3EE6D2 | Verified movement, progress |
| gold | #FFC93D | XP, levels, GP |

Attribute colors (use for stat bars everywhere): Efficiency sunset, Stamina aqua, Resilience #8C7CFF, Momentum pink, Focus gold.

Button recipe: sunset fill, night text in Silkscreen, 2px night border, `4px 4px 0` neon-pink shadow; on press translate 2px,2px and shrink the shadow to 2px.

## Type
- Display: **Pixelify Sans** 500/700. Headlines and big numbers only.
- Label: **Silkscreen** 400/700. Tiny uppercase labels, chips, button text, letter-spacing 0.04em.
- Body: **Sora** 400/600. Everything people read.
- Numbers: never set digits in Pixelify Sans (its 2 and 5 read as 8 and S). Use **Silkscreen Bold** for prices, stats, scores and edition numbers.
All three are free on Google Fonts (OFL). For native apps, bundle the TTFs from fonts.google.com.

## Logo files (`logo/`)
- `wordmark.svg`: one-line PACE PUNKS for dark backgrounds. `wordmark-light-bg.svg` for light backgrounds. `wordmark-1200.png` raster.
- `stacked.svg`: two-line lockup.
- `mark.svg` / `mark-transparent.svg`: the speed-line P. `mark-512.png`.
- `app-icon-1024.png`: square, full-bleed (iOS/Android masks it). `apple-touch-icon-180.png`, `favicon-32.png`.
Always render pixel logos with `image-rendering: pixelated` / crisp edges. Minimum wordmark width 112px (1px per logo cell). Keep clear space of one P-height around the mark.

## Artwork
- Web-ready previews: `/mnt/project-files/pace-punks/website/assets/punks/0001.webp` … `0100.webp` (627×627, the true pixel grid, lossless downscale from 1254) and `thumb/` (320×320).
- Trait data for all 100: `/mnt/project-files/pace-punks/website/assets/data/punks.json` (`id`, `name`, `traits{Background, Body, Outfit, Sneakers, Headwear, Eyewear, Mouth Accessory, Earwear}`).
- Hero picks used on the site: #0008 (neon city), #0001 (desert), #0016 (lava), #0002 (aurora), #0017 (palms), #0014 (wisteria).
- Display art with `image-rendering: pixelated` when scaled up.

## Voice
Short, energetic, honest. Talk about walking, levelling up and the character. Never promise earnings, returns, floor prices or "passive income"; the final plan (Pace Punks Final/plan.md) says the product must stand on its own with zero speculative value. GP is an in-game currency. Say "early access" and "playtest", not "presale".

## Terms
GP = in-game points earned by verified movement. Movement Score = 0–35 per day, unlocks  mint eligibility. Battery = daily rewardable minutes. Durability = 0–100 condition meter. Pace Box = free mystery item box. Epoch = one release of 600 Punks (E1 to E10).
