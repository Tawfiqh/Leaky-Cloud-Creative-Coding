# CreativeCoding — Top-down RPG (study notes)

## What We're Building

A small p5.js top-down exploration sketch: move on a tile map, face directions, and interact with special tiles. It runs from `leaky-pipe.html`.

## How It Works (High Level)

1. `setup()` creates the canvas, registers keyboard input, loads the world, and places the player on the start tile.
2. Each frame, `readInputAxes()` turns held movement keys into a direction vector, then `tryMove()` applies speed and collision.
3. The camera follows the player; the world and HUD draw on top.

## Key Decisions & Why

### Keyboard: native `keydown` / `keyup` with `event.code`

- **Chosen:** A `Set` of `KeyboardEvent.code` strings (e.g. `KeyW`, `ArrowLeft`), updated from `window` listeners in the capture phase, plus clearing on `blur` and `visibilitychange`.
- **Alternatives:** p5’s global `keyPressed` / `keyReleased` with a `keys[keyCode]` map.
- **Why:** p5’s handlers can be unreliable when several keys are held; `keyup` may not run if the tab loses focus, which leaves keys “stuck.” `code` identifies the physical key consistently for WASD + arrows together.
- **Tradeoff:** Slightly more code than p5-only input; must call `initPlayerKeyboard()` from `setup()`.

### Clearing keys on blur / hidden document

- **Why:** If the user switches tabs or the window loses focus while holding a key, the browser may not deliver `keyup`. Clearing avoids phantom movement until the next real key press.

## How Each Piece Works

### `initPlayerKeyboard` (in `rpg-player.js`)

- **What it does:** Registers keyboard listeners once.
- **How:** On `keydown`, adds `e.code` to `keysDown`; on `keyup`, removes it. `preventDefault` on Space and arrow keys stops the page from scrolling. Interact (`E` / Space) runs only when `!e.repeat` so auto-repeat does not spam interact.
- **Example:** Hold `W` and `D` → set contains `KeyW` and `KeyD` → `readInputAxes()` returns diagonal `(ax, ay)`.

## Things That Don't Work Well

- Some **physical keyboards** still block certain key combinations (hardware ghosting); that cannot be fixed in software.
- Focus is global to the window; there is no “click canvas to capture keys” flow yet.

## Key Metrics & Results

- Not measured; movement is frame-based with a fixed `MOVE_SPEED`.
