# CreativeCoding — Top-down RPG (study notes)

## What We're Building

A small p5.js top-down exploration sketch: move on a tile map, face directions, and patch **broken pipe** tiles. A **deadline timer** (starting at 30s) counts down; patching adds time and restores **cloud bits**; random pipe breaks drain bits. The HUD shows time (Matrix green), score, and cloud pips. The view **shakes** more as time runs out. Game over shows **Kernel Panic**. The playable build lives under **`public/`** as **`index.html`** (plus the three `.js` files next to it). You can preview locally with **`npm run pages:dev`** (Wrangler serves the `public` folder). Production deploy uses **Cloudflare Pages** via **`npm run deploy`** after **`npx wrangler login`** (see `wrangler.toml` for the project name, default **`creative-coding`**).

## How It Works (High Level)

1. `setup()` creates the canvas, registers keyboard input, **`buildRandomMapGrid()`** fills a new **29×16** tile map (border walls, random hollow room outlines, small wall clusters, shuffled pipe tiles), then places the player on the first walkable grass tile (top-left scan order; the **2×2** cell at `(1,1)` is forced to grass so spawn stays clear).
2. Each frame, if time remains, `readInputAxes()` turns held movement keys into a direction vector, then `tryMove()` applies speed and collision.
3. The camera follows the player. The world and player are drawn inside a `translate(shake)` so the whole playfield jitters; shake amplitude scales with **panic factor** \(1 - t/30\) squared.
4. The HUD draws instructions, score, cloud bits, the countdown (top right), optional interact messages, and when the game ends **`drawKernelPanicBackground()`** (dark red radial vignette, faint horizontal scanlines, sparse Matrix-green noise pixels, double border) then the **Kernel Panic** text stack.

## Key Decisions & Why

### Keyboard: native `keydown` / `keyup` with `event.code`

- **Chosen:** A `Set` of `KeyboardEvent.code` strings (e.g. `KeyW`, `ArrowLeft`), updated from `window` listeners in the capture phase, plus clearing on `blur` and `visibilitychange`.
- **Alternatives:** p5’s global `keyPressed` / `keyReleased` with a `keys[keyCode]` map.
- **Why:** p5’s handlers can be unreliable when several keys are held; `keyup` may not run if the tab loses focus, which leaves keys “stuck.” `code` identifies the physical key consistently for WASD + arrows together.
- **Tradeoff:** Slightly more code than p5-only input; must call `initPlayerKeyboard()` from `setup()`.

### Clearing keys on blur / hidden document

- **Why:** If the user switches tabs or the window loses focus while holding a key, the browser may not deliver `keyup`. Clearing avoids phantom movement until the next real key press.

### Countdown + screen shake (tension)

- **Chosen:** Deadline `gameEndMs` set in `setup()`; remaining time = `(gameEndMs - millis()) / 1000`. Patching moves `gameEndMs` forward. Panic factor = `1 - remaining / 30` (clamped); shake uses `(panicFactor ** 2) * 14` pixels per axis.
- **Alternatives:** Frame-based timer (drops when tab is hidden); CSS shake on `<canvas>` (would not move HUD separately unless split).
- **Why:** Real-time seconds match player expectations; separating shake into `push`/`translate`/`pop` around world + player keeps HUD labels readable.
- **Tradeoff:** Timer includes time spent reading the first frame; no pause key yet.

### Procedural map (`buildRandomMapGrid` in `rpg-world.js`)

- **Chosen:** Each `setup()` builds the grid in memory: outer ring **1** (wall), interior starts **0** (grass). **4–8** random hollow rectangles get **wall outlines** with one random side left open (a “door”). **2–5** small **1×1 / L-shaped** wall specks add clutter. **18–32** pipe tiles (**2**) are placed on shuffled grass candidates, skipping the top-left **3×3** so pipes do not sit on the spawn pocket. Finally **`ensureSpawnAreaGrass`** clears **(1,1)–(2,2)** to grass so the first walkable tile in row-major order is always valid.
- **Alternatives:** Fixed ASCII `MAP_ROWS` (original hand-authored layout); dungeon generator with guaranteed connectivity (e.g. BSP or Drunkard’s walk).
- **Why:** Fast, no assets, visibly different layout every refresh; pipes stay plentiful for the leak / fix loop.
- **Tradeoff:** Rare layouts can feel cramped or oddly open; connectivity is not formally proven (rooms have openings, but overlapping outlines can create awkward pockets).

### Look and feel (Matrix + cloud + deep walkable)

- **Chosen:** Walkable tiles use **#010A03** (near-black deep green) with **layered `noise()`**, deterministic **speckle ellipses** (seeded by tile coords so nothing flickers), faint **horizontal scan lines**, two **diagonal scratches**, and sparse **#1AFB4C** micro-dots for a Matrix floor texture. **Walls** are **clouds on pure black** (overlapping white / pale blue ellipses). **Pipes** are drawn as a **top-down tube**: rounded shell, top highlight band, dark **bore** (hollow), **glowing rim ellipses** on the left/right ends, and a single **rounded outer glow** — not a grid of lines. **Broken pipes** reuse the pipe draw, add a glowing crack, and **`drawBinaryLeak`** animates drifting **0** and **1** with `millis()`. The canvas **background** is almost-black green `(2,8,5)`; HUD and timer lean **#1AFB4C**; the player avatar is the same accent with a green glow. The HTML page uses a **dark green radial gradient** and a faint green rim on the `<canvas>`.
- **Why:** Matches the “pipes as Matrix infrastructure + cloud bits” theme; glow is done with `drawingContext.shadowBlur` + stroke, not extra assets.

## How Each Piece Works

### `buildRandomMapGrid` / `initWorldMap` (in `rpg-world.js`)

- **What it does:** Creates **`mapGrid`** as a 2D array of tile IDs **0 / 1 / 2** (and **3** later when a pipe breaks).
- **How:** Border walls, randomized hollow rooms (`carveRoomOutline`), optional one- and two-tile wall clusters, then `shuffle` + slice for pipe placement; spawn patch last.
- **Example:** After load, `mapGrid[5][12] === 2` means an intact pipe at tile **(12, 5)**; `updateRandomPipeBreaks` may turn that cell into **3**.

### `initPlayerKeyboard` (in `rpg-player.js`)

- **What it does:** Registers keyboard listeners once.
- **How:** On `keydown`, adds `e.code` to `keysDown`; on `keyup`, removes it. `preventDefault` on Space and arrow keys stops the page from scrolling. Interact (`E` / Space) runs only when `!e.repeat` so auto-repeat does not spam interact.
- **Example:** Hold `W` and `D` → set contains `KeyW` and `KeyD` → `readInputAxes()` returns diagonal `(ax, ay)`.

## Things That Don't Work Well

- Some **physical keyboards** still block certain key combinations (hardware ghosting); that cannot be fixed in software.
- Focus is global to the window; there is no “click canvas to capture keys” flow yet.

## Key Metrics & Results

- Not measured; movement is frame-based with a fixed `MOVE_SPEED`.

## Cloudflare Pages (Wrangler)

- **What it does:** Uploads the contents of **`public/`** to a Cloudflare Pages project so the game is available at a `*.pages.dev` URL (and a custom domain if you attach one in the dashboard).
- **How:** **`wrangler.toml`** sets **`pages_build_output_dir = "public"`** and the project **`name`**. **`npm run deploy`** runs **`wrangler pages deploy`**, which reads that config and uploads only the static assets (not `node_modules`, which stays outside `public/`).
- **Example:** After login, one deploy → Cloudflare shows a preview URL and promotes it to production according to your Pages settings.
- **Tradeoff:** You need a Cloudflare account and either **`wrangler login`** in a browser or a **`CLOUDFLARE_API_TOKEN`** in CI (non-interactive environments).
