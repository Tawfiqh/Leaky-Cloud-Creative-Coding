# Top-down RPG (p5.js)

A small **Matrix / cloud** themed game: walk the map, patch **broken pipes** before the timer runs out or you lose all **cloud bits**. Pipes can break at random; fixing one adds time and restores a bit. High score = most pipes fixed in a single run (saved in `localStorage`).

## Run locally

| Approach | What to do |
| -------- | ---------- |
| **Wrangler** (recommended) | `npm install` then `npm run pages:dev` — serves the `public/` folder with correct paths. |
| **Static files** | Serve `public/` with any static server and open `/` (loads [`public/index.html`](public/index.html)). Opening the HTML file directly as `file://` can break script paths. |

## Controls & rules

- **WASD** — move  
- **E** — patch a **broken** pipe (face it)  
- **+7 s** per successful fix; **+1 cloud bit** (capped)  
- Random pipe breaks **−1 cloud bit**  
- **Game over** if time reaches **0** or cloud bits reach **0**

Starting round length is **15 seconds** (see `TIMER_START_SEC` in [`public/top-down-rpg.js`](public/top-down-rpg.js)).

## Source files (`public/`)

| File | Role |
| ---- | ---- |
| [`index.html`](public/index.html) | Page shell, p5.js CDN, loads the scripts below. |
| [`rpg-world.js`](public/rpg-world.js) | Tile map, collision, drawing, camera, random pipe breaks → `onPipeSprungLeak`. |
| [`rpg-player.js`](public/rpg-player.js) | Player movement, facing, interact → `onPipeFixed`. |
| [`top-down-rpg.js`](public/top-down-rpg.js) | Timer, HUD, cloud bits, score, high score, game-over screen. |

## Look & feel (short)

Walkable floor **#010A03**, cloud-style **walls**, pipes **#158331** with glow **#1AFB4C**; broken pipes show drifting **0 / 1** “leak” animation.

---

## Deploy (Cloudflare Pages + Wrangler)

1. `npm install`  
2. `npx wrangler login` (once)  
3. `npm run deploy`  

The output directory is set in [`wrangler.toml`](wrangler.toml) (`pages_build_output_dir = "public"`). Change the `name` field there if you want a different Pages project name.
