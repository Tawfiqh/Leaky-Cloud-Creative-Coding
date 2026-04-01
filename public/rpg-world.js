const TILE_SIZE = 40;

/** Styling (Todo): walkable, cloud walls, Matrix pipes + glow. */
const COL_WALK = { r: 1, g: 10, b: 3 };
const COL_PIPE_BASE = { r: 21, g: 131, b: 49 };
const COL_PIPE_GLOW = { r: 26, g: 251, b: 76 };

const MAP_W = 29;
const MAP_H = 16;

const DEFAULT_MAP_ROWS = [
  "1111111111111111111111111111",
  "1000000000000000000000000001",
  "1000011122222111100000000001",
  "1000011000000200000000000001",
  "1000011000000200001000000001",
  "1000011000001100011100000001",
  "1000002000001100002000000001",
  "1000002000000000002000000001",
  "1000002000000000002000000001",
  "1000001111000000111000000001",
  "1000000000000000111000000001",
  "1000000000000000000000000001",
  "1011112222111122222111100001",
  "1000000000000000000000000001",
  "1000000000000000000000000001",
  "1111111111111111111111111111",
];

/** Set `true` to use `buildRandomMapGrid()` instead of `DEFAULT_MAP_ROWS`. */
const USE_RANDOM_MAP = false;

/** ASCII rows → numeric grid (`0` grass, `1` wall, `2` pipe, `3` broken). */
function mapGridFromAsciiRows(rows) {
  const grid = [];
  for (let ty = 0; ty < rows.length; ty++) {
    const row = [];
    const s = rows[ty];
    for (let tx = 0; tx < s.length; tx++) {
      const c = s[tx];
      let v = 1;
      if (c === "0" || c === " ") v = 0;
      else if (c === "2") v = 2;
      else if (c === "3") v = 3;
      row.push(v);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Fills a new grid: 0 grass, 1 wall, 2 pipe. Border is always wall.
 * Room outlines, optional wall specks, and pipes are randomized each load.
 */
function buildRandomMapGrid() {
  const g = [];
  for (let ty = 0; ty < MAP_H; ty++) {
    const row = [];
    for (let tx = 0; tx < MAP_W; tx++) {
      const border =
        tx === 0 || ty === 0 || tx === MAP_W - 1 || ty === MAP_H - 1;
      row.push(border ? 1 : 0);
    }
    g.push(row);
  }

  const roomCount = floor(random(4, 9));
  for (let i = 0; i < roomCount; i++) {
    carveRoomOutline(g);
  }

  const clusterCount = floor(random(2, 6));
  for (let i = 0; i < clusterCount; i++) {
    const bx = floor(random(2, MAP_W - 3));
    const by = floor(random(2, MAP_H - 3));
    if (g[by][bx] !== 0) continue;
    g[by][bx] = 1;
    if (random() < 0.55 && bx + 1 < MAP_W - 1) g[by][bx + 1] = 1;
    if (random() < 0.55 && by + 1 < MAP_H - 1) g[by + 1][bx] = 1;
  }

  placePipesRandomly(g);
  ensureSpawnAreaGrass(g);
  return g;
}

function carveRoomOutline(g) {
  const maxW = min(12, MAP_W - 4);
  const maxH = min(8, MAP_H - 4);
  const rw = floor(random(4, maxW + 1));
  const rh = floor(random(3, maxH + 1));
  const rx = floor(random(1, MAP_W - rw - 1));
  const ry = floor(random(1, MAP_H - rh - 1));
  const openSide = floor(random(4));

  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      const top = y === ry;
      const bot = y === ry + rh - 1;
      const left = x === rx;
      const right = x === rx + rw - 1;
      if (!top && !bot && !left && !right) continue;
      if (openSide === 0 && top && x > rx && x < rx + rw - 1) continue;
      if (openSide === 1 && right && y > ry && y < ry + rh - 1) continue;
      if (openSide === 2 && bot && x > rx && x < rx + rw - 1) continue;
      if (openSide === 3 && left && y > ry && y < ry + rh - 1) continue;
      g[y][x] = 1;
    }
  }
}

function placePipesRandomly(g) {
  const candidates = [];
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (g[ty][tx] !== 0) continue;
      if (tx <= 3 && ty <= 3) continue;
      candidates.push({ tx, ty });
    }
  }
  shuffle(candidates);
  const target = floor(random(18, 33));
  const pipeCount = min(target, candidates.length);
  for (let i = 0; i < pipeCount; i++) {
    const { tx, ty } = candidates[i];
    g[ty][tx] = 2;
  }
}

function ensureSpawnAreaGrass(g) {
  for (let ty = 1; ty <= 2; ty++) {
    for (let tx = 1; tx <= 2; tx++) {
      g[ty][tx] = 0;
    }
  }
}

const WORLD_W = MAP_W * TILE_SIZE;
const WORLD_H = MAP_H * TILE_SIZE;

let mapGrid;

function initWorldMap() {
  mapGrid = USE_RANDOM_MAP
    ? buildRandomMapGrid()
    : mapGridFromAsciiRows(DEFAULT_MAP_ROWS);
  scheduleNextPipeBreak();
}

function findStartTile() {
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      if (mapGrid[ty][tx] === 0) return { x: tx, y: ty };
    }
  }
  return { x: 1, y: 1 };
}

function tileWorld(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return 1;
  return mapGrid[ty][tx];
}

/** 0 = walkable; 1–3 = blocked (walls + pipes). */
function isWalkableTile(tileType) {
  return tileType === 0;
}

function rectHitsBlocking(x, y, w, h) {
  const x0 = floor(x / TILE_SIZE);
  const y0 = floor(y / TILE_SIZE);
  const x1 = floor((x + w - 0.001) / TILE_SIZE);
  const y1 = floor((y + h - 0.001) / TILE_SIZE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isWalkableTile(tileWorld(tx, ty))) return true;
    }
  }
  return false;
}

const PIPE_BREAK_MIN_MS = 3500;
const PIPE_BREAK_MAX_MS = 11000;
let pipeBreakDueAtMs = 0;

function scheduleNextPipeBreak() {
  pipeBreakDueAtMs = millis() + random(PIPE_BREAK_MIN_MS, PIPE_BREAK_MAX_MS);
}

function collectPipeTilesOfType(typeId) {
  const list = [];
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      if (mapGrid[ty][tx] === typeId) list.push({ tx, ty });
    }
  }
  return list;
}

function updateRandomPipeBreaks() {
  if (typeof isGameOver === "function" && isGameOver()) return;
  if (millis() < pipeBreakDueAtMs) return;
  scheduleNextPipeBreak();

  const intact = collectPipeTilesOfType(2);
  if (intact.length === 0) return;
  const pick = random(intact);
  mapGrid[pick.ty][pick.tx] = 3;
  if (typeof onPipeSprungLeak === "function") onPipeSprungLeak();
}

function patchBrokenPipeAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  if (mapGrid[ty][tx] !== 3) return false;
  mapGrid[ty][tx] = 2;
  return true;
}

function cameraOffsetForPlayer(px, py, pw, ph) {
  const cx = px + pw / 2 - width / 2;
  const cy = py + ph / 2 - height / 2;
  const maxX = max(0, WORLD_W - width);
  const maxY = max(0, WORLD_H - height);
  return {
    x: constrain(cx, 0, maxX),
    y: constrain(cy, 0, maxY),
  };
}

function drawGrassTile(screenX, screenY, tx, ty) {
  fill(COL_WALK.r, COL_WALK.g, COL_WALK.b);
  noStroke();
  rect(screenX, screenY, TILE_SIZE, TILE_SIZE);

  const n1 = noise(tx * 0.31, ty * 0.29);
  const n2 = noise(tx * 0.58 + 12, ty * 0.55 + 7);
  fill(2 + n1 * 10, 12 + n1 * 22 + n2 * 14, 5 + n1 * 12, 75);
  rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  fill(1 + n2 * 8, 6 + n2 * 16, 3 + n2 * 9, 38);
  rect(screenX, screenY, TILE_SIZE, TILE_SIZE);

  for (let i = 0; i < 6; i++) {
    const s = tx * 928371 + ty * 19249 + i * 7919;
    const px = (s % 31) + 4;
    const py = ((s >> 5) % 31) + 4;
    fill(
      5 + (s % 16),
      24 + ((s >> 3) % 38),
      10 + ((s >> 7) % 22),
      55 + (s % 55)
    );
    ellipse(screenX + px, screenY + py, 2 + (s % 4), 2 + (s % 3));
  }

  stroke(12, 42, 22, 14);
  strokeWeight(1);
  for (let y = 4; y < TILE_SIZE - 2; y += 8) {
    line(screenX + 2, screenY + y, screenX + TILE_SIZE - 2, screenY + y);
  }
  noStroke();

  stroke(8, 30, 15, 22);
  strokeWeight(1);
  line(
    screenX + 3,
    screenY + TILE_SIZE - 3,
    screenX + TILE_SIZE - 3,
    screenY + 3
  );
  noStroke();

  for (let j = 0; j < 5; j++) {
    const s = tx * 1409 + ty * 601 + j * 211;
    const x = 3 + (s % 32);
    const y = 3 + ((s >> 6) % 32);
    fill(COL_PIPE_GLOW.r, COL_PIPE_GLOW.g, COL_PIPE_GLOW.b, 12 + (s % 22));
    ellipse(screenX + x, screenY + y, 1.8, 1.8);
  }

  stroke(18, 55, 28, 16);
  strokeWeight(1);
  line(
    screenX + TILE_SIZE - 4,
    screenY + 4,
    screenX + 4,
    screenY + TILE_SIZE - 4
  );
  noStroke();
}

function drawWallTile(screenX, screenY) {
  fill(0, 0, 0);
  noStroke();
  rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  fill(255, 255, 255, 235);
  ellipse(screenX + 10, screenY + 16, 20, 14);
  ellipse(screenX + 20, screenY + 12, 22, 17);
  ellipse(screenX + 30, screenY + 15, 18, 13);
  fill(235, 242, 252, 215);
  ellipse(screenX + 16, screenY + 24, 24, 15);
  ellipse(screenX + 28, screenY + 26, 20, 12);
  fill(218, 228, 242, 195);
  ellipse(screenX + 22, screenY + 30, 26, 10);
  stroke(200, 216, 236, 140);
  strokeWeight(1);
  noFill();
  ellipse(screenX + 20, screenY + 18, 24, 18);
  noStroke();
}

function setPipeGlow(shadowBlurPx) {
  drawingContext.shadowBlur = shadowBlurPx;
  drawingContext.shadowColor = "rgba(26, 251, 76, 0.55)";
}

function clearGlow() {
  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor = "transparent";
}

/** Top-down pipe: horizontal cylinder + open bore + rim caps; few strokes, reads as a tube. */
function drawPipeTile(screenX, screenY) {
  const pad = 3;
  const bodyX = screenX + pad;
  const bodyY = screenY + pad;
  const bodyW = TILE_SIZE - pad * 2;
  const bodyH = TILE_SIZE - pad * 2;
  const midY = screenY + TILE_SIZE / 2;

  fill(COL_PIPE_BASE.r, COL_PIPE_BASE.g, COL_PIPE_BASE.b);
  noStroke();
  rect(bodyX, bodyY, bodyW, bodyH, 10);

  fill(38, 155, 72);
  rect(bodyX + 2, bodyY + 2, bodyW - 4, 9, 8);

  fill(0, 35, 14);
  rect(bodyX + 9, bodyY + 14, bodyW - 18, 12, 5);

  fill(0, 18, 6);
  rect(bodyX + 11, midY - 3, bodyW - 22, 6, 2);

  setPipeGlow(12);
  stroke(COL_PIPE_GLOW.r, COL_PIPE_GLOW.g, COL_PIPE_GLOW.b);
  strokeWeight(2);
  noFill();
  rect(bodyX, bodyY, bodyW, bodyH, 10);
  clearGlow();

  setPipeGlow(10);
  stroke(COL_PIPE_GLOW.r, COL_PIPE_GLOW.g, COL_PIPE_GLOW.b, 200);
  strokeWeight(2);
  noFill();
  ellipse(bodyX + 7, midY, 9, 24);
  ellipse(bodyX + bodyW - 7, midY, 9, 24);
  clearGlow();
  noStroke();
}

function drawBinaryLeak(screenX, screenY, tx, ty) {
  const seed = tx * 10007 + ty * 7919;
  const t = millis() * 0.0025;
  push();
  textAlign(CENTER, CENTER);
  textSize(8);
  const glow = drawingContext;
  for (let k = 0; k < 10; k++) {
    const s = seed + k * 31;
    const col = (s % 9) - 4;
    const row = ((t * 35 + s * 1.7) % (TILE_SIZE + 24)) - 10;
    const wobble = sin(t * 3 + s * 0.1) * 4;
    const ch = floor(t * 4 + s + k) % 2 === 0 ? "0" : "1";
    glow.shadowBlur = 6;
    glow.shadowColor = "rgba(26, 251, 76, 0.85)";
    fill(COL_PIPE_GLOW.r, COL_PIPE_GLOW.g, COL_PIPE_GLOW.b, max(45, 200 - k * 12));
    noStroke();
    text(
      ch,
      screenX + TILE_SIZE / 2 + col * 4.5 + wobble,
      screenY + row
    );
  }
  glow.shadowBlur = 0;
  pop();
}

function drawBrokenPipeTile(screenX, screenY, tx, ty) {
  drawPipeTile(screenX, screenY);
  push();
  translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
  setPipeGlow(12);
  stroke(COL_PIPE_GLOW.r, COL_PIPE_GLOW.g, COL_PIPE_GLOW.b);
  strokeWeight(2.2);
  noFill();
  line(-12, -4, 2, 10);
  line(2, 10, 14, -6);
  stroke(255, 100, 90, 180);
  strokeWeight(1);
  line(-10, -2, 0, 12);
  clearGlow();
  noStroke();
  fill(COL_PIPE_GLOW.r, COL_PIPE_GLOW.g, COL_PIPE_GLOW.b, 40);
  ellipse(-2, 4, 16, 10);
  pop();

  drawBinaryLeak(screenX, screenY, tx, ty);
}

function drawTile(tx, ty, type, ox, oy) {
  const screenX = tx * TILE_SIZE + ox;
  const screenY = ty * TILE_SIZE + oy;

  if (type === 0) {
    drawGrassTile(screenX, screenY, tx, ty);
  } else if (type === 1) {
    drawWallTile(screenX, screenY);
  } else if (type === 2) {
    drawPipeTile(screenX, screenY);
  } else if (type === 3) {
    drawBrokenPipeTile(screenX, screenY, tx, ty);
  }
}

function drawWorld(cam) {
  const t0x = floor(cam.x / TILE_SIZE);
  const t0y = floor(cam.y / TILE_SIZE);
  const t1x = ceil((cam.x + width) / TILE_SIZE);
  const t1y = ceil((cam.y + height) / TILE_SIZE);

  for (let ty = max(0, t0y); ty < min(MAP_H, t1y); ty++) {
    for (let tx = max(0, t0x); tx < min(MAP_W, t1x); tx++) {
      drawTile(tx, ty, mapGrid[ty][tx], -cam.x, -cam.y);
    }
  }
}
