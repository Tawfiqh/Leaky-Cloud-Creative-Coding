
## Implemented (p5): top-down RPG
Open [`public/index.html`](public/index.html) locally (serve the `public` folder for correct script paths), or run **`npm run pages:dev`** to preview with Wrangler. Scripts in `public/`: [`rpg-world.js`](public/rpg-world.js) (map, collision, tiles, camera, random pipe breaks → calls `onPipeSprungLeak`), [`rpg-player.js`](public/rpg-player.js) (player, **E** to patch → `onPipeFixed`), [`top-down-rpg.js`](public/top-down-rpg.js) (deadline timer, **cloud bits**, score, high score in `localStorage`). Patching adds **+7s** and restores **1 cloud bit**; each random break **−1 bit**. **Game over** if time hits **0** or **cloud bits** hit **0**. **High score** = most pipes fixed in a run (persisted). **Look:** walkable **#010A03**, cloud-style walls, Matrix pipes **#158331** + glow **#1AFB4C**, broken pipes leak animated **0/1**.

### Cloudflare Pages (Wrangler)
1. Install deps: `npm install`
2. Log in once: `npx wrangler login`
3. Deploy: `npm run deploy` (first run creates the Pages project `creative-coding` if it does not exist; rename in [`wrangler.toml`](wrangler.toml) if you want a different project name)
