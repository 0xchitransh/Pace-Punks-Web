# Corridor Run (Pace Punks mini game)

A Chrome-dino style auto-runner at `game/index.html`, linked from the site nav ("Play") and footer.
The punk's run cycle comes from the first clip of `pace 5.mp4`. The corridor is drawn in code (`corridor.js`).

```
game/index.html       the page
game/game.css         page and overlay styles (uses ../assets/css/site.css for brand tokens)
game/sim.js           the game rules. Shared by the browser and the leaderboard server. Deterministic.
game/game.js          drawing, obstacles, controls, sound, screens
game/corridor.js      the endless station corridor behind the run (drawn in code, no image files)
game/leaderboard.js   talks to the leaderboard provider set in ../assets/js/config.js
game/assets/          punk-run.webp (12 walk frames cut from the clip), music.mp3 (the soundtrack)
game/backend/apps-script/Leaderboard.gs   free Google Sheet backend
game/backend/node/server.js               self-hosted backend, no dependencies
```

Controls: Space / Up / W or tap to jump, hold for a higher jump, Down / S to drop fast, P or Esc to pause.
Scoring: 1 point per 40 distance units (about 12 points a second at the start), +25 per gold chip.

Difficulty keeps climbing through the run. Speed rises from 8 to 15 in the first minute, then keeps rising slowly to 20 at about four minutes. The gaps between obstacles shrink until about 4000 points (around three minutes), double combos get more common, triple combos (one long held jump) start after 1500 points, and the mix shifts toward stacks, wide canisters and drones.

## The corridor
There are no zone names, banners or loading screens: the run is one long station corridor drawn in code by `corridor.js`, in a clean inked illustration style.
It passes through 12 zones of 5000 run units each (about 125 points): Mint concourse, Amber engineering, Violet labs, Hydroponics, Sunset deck, Cryo bay, Habitat ring, Server hall, Rose lounge, Archive, Reactor core and Aqua tanks, then back to the start. A full loop is about 1500 points.
Each zone has its own colours, pillars, wall panels, floor touches and wall details (doors, viewports, gauges, plant beds, cryo pods, cabin doors, server racks, posters, data shelves, a reactor ring, aquarium tanks). Layout comes from a seeded hash, so the wall never repeats exactly. At a zone boundary the room colour rolls gradually over many bays and the details change only at a pillar, so there is never a cut or fade.
Static scenery is rendered once into cached strips and reused; only a few gentle touches (slow LEDs, bubbles, the reactor ring) animate. The wall scrolls at 0.69x of the floor for depth. To tune zones, edit the zone table near the top of `corridor.js`. Scenery never touches the rules, so the leaderboard is unaffected.
On a phone that can't keep a smooth frame rate, the game lowers its drawing resolution by itself instead of stuttering.

## Obstacles
Station gear in the corridor's colours: steel PP crates, rust hazard crates and server boxes, double crates, crate stacks, mint and amber coolant cells (single and double), a striped maintenance barrier, and low and high security drones.
Each one is pixel art drawn to fill its exact hit box from `KINDS` in `sim.js`, so what you see is what you hit. Drones bob by at most 2 units, inside the hit box margin.
Every pattern, and every pair of patterns at the tightest gap, has been checked to be clearable at every speed with taps and holds only (no drop key, as on phones). Low drones need a jump, high drones only catch you if you jump into them.
Harder kinds and two-obstacle combos unlock by distance, not by chips, and a tall stack only starts a combo once the run is fast enough for a comfortable jump window.

## Music
The soundtrack (`assets/music.mp3`) starts with the first run, plays under the sound effects, and goes quieter and muffled on the game over screen.
After the first play it loops back to the drop at 15.6 s instead of the slow intro. "Music on/off" and "Sound on/off" are separate buttons and are remembered per browser.

## Turn on the global leaderboard (Google Sheet, free, about 3 minutes)
Out of the box `leaderboard.provider` is `"demo"`: the game works, but each visitor only sees their own scores.

1. Create a new Google Sheet (any name). Extensions > Apps Script.
2. Replace the contents of `Code.gs` with `game/backend/apps-script/Leaderboard.gs`.
3. Add a script file (the + next to Files > Script), name it `Sim`, and paste `game/sim.js` into it unchanged.
4. Deploy > New deployment > type Web app. Execute as: Me. Who has access: Anyone. Authorize. Copy the URL ending in `/exec`.
5. In `assets/js/config.js`:
   ```js
   leaderboard: { provider: "google-apps-script", endpoint: "https://script.google.com/macros/s/XXXX/exec" }
   ```
The Sheet fills two tabs by itself: **Board** (one row per runner name, best score) and **Runs** (every accepted run with its input log, for review).
Remove a cheater by deleting their Board row. Block a name by writing `BANNED` in its `status` column.

If you ever change a number in `sim.js`, bump `VERSION` at the top, paste the new file into the `Sim` script, and Deploy > Manage deployments > Edit > New version. Old tabs get a "reload the page" message instead of a wrong score.
The rules are at `VERSION = 3` (difficulty that keeps climbing). A Sheet set up with an older copy needs the new `sim.js` pasted in.

## Or run your own server
`node game/backend/node/server.js` (Node 18+). Env: `PORT` (8787), `DATA_FILE`, `ALLOW_ORIGIN` (your site's origin).
Then `leaderboard: { provider: "json", endpoint: "https://your-host/" }`. Same protocol and checks as the Sheet version, plus a per-IP rate limit.
Protocol: POST JSON (sent as text/plain) with `action` = `session` | `begin` | `submit` | `top`; see the comment at the top of `leaderboard.js`.

## How cheating is blocked
- The browser never reports a score. It sends the run id, its button-press log and the run length. The server replays the run with the same `sim.js` and the replay decides the score. Typing a score in the console, editing the request or editing the page gives nothing.
- Each run uses a seed the server hands out, valid once. Replaying an old good run or a run from another seed fails.
- The server times each run from "begin" to "submit". A sped-up game (finishing a long run in less real time) and a slowed-down game (more than 25% slower, or paused for long) are rejected.
- Names belong to the device that first used them (a secret key kept in that browser), so nobody can post under someone else's name. Basic word filter on names.
- What no browser game can fully stop: a bot that really plays in real time. Every accepted run's input log is kept in the Runs tab, so suspicious runs can be checked and removed.
