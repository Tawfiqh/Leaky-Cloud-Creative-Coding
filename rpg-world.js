const TILE_SIZE = 40;

const MAP_ROWS = [
  "1111111111111111111111111111",
  "1000000000000000000000000001",
  "1000001111111111110000000001",
  "1000001000000000021000000001",
  "1000001022222000000000000001",
  "1000001020000200021000000001",
  "1000001020000000021000000001",
  "1000001022222200021000000001",
  "1000001000000000021000000001",
  "1000001111111111121000000001",
  "1000000000000000020000000001",
  "1000000000000000000000000001",
  "1011110000111100000111100001",
  "1000000000000000000000000001",
  "1000000000000000000000000001",
  "1111111111111111111111111111",
];

const MAP_W = MAP_ROWS[0].length;
const MAP_H = MAP_ROWS.length;
const WORLD_W = MAP_W * TILE_SIZE;
const WORLD_H = MAP_H * TILE_SIZE;

let mapGrid;

function initWorldMap() {
  mapGrid = [];
  scheduleNextPipeBreak();
  for (let ty = 0; ty < MAP_H; ty++) {
    const row = [];
    const s = MAP_ROWS[ty];
    for (let tx = 0; tx < MAP_W; tx++) {
      const c = s[tx];
      let v = 1;
      if (c === "0" || c === " ") v = 0;
      else if (c === "2") v = 2;
      else if (c === "3") v = 3;
      row.push(v);
    }
    mapGrid.push(row);
  }
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
  if (typeof remainingSeconds === "function" && remainingSeconds() <= 0) return;
  if (millis() < pipeBreakDueAtMs) return;
  scheduleNextPipeBreak();

  const intact = collectPipeTilesOfType(2);
  if (intact.length === 0) return;
  const pick = random(intact);
  mapGrid[pick.ty][pick.tx] = 3;
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
  const base = color(
    42 + noise(tx * 0.31, ty * 0.29) * 26,
    108 + noise(tx * 0.27, ty * 0.33) * 36,
    88 + noise(tx * 0.19, ty * 0.21) * 14
  );
  fill(base);
  noStroke();
  rect(screenX, screenY, TILE_SIZE, TILE_SIZE);

  for (let i = 0; i < 5; i++) {
    const s = tx * 928371 + ty * 19249 + i * 7919;
    const px = (s % 31) + 4;
    const py = ((s >> 5) % 31) + 4;
    fill(48 + (s % 28), 124 + ((s >> 3) % 36), 72 + ((s >> 7) % 22), 175);
    ellipse(screenX + px, screenY + py, 3 + (s % 5));
  }

  stroke(56, 112, 88, 42);
  strokeWeight(1);
  line(
    screenX + 4,
    screenY + TILE_SIZE - 4,
    screenX + TILE_SIZE - 4,
    screenY + 4
  );
  noStroke();
}

function drawWallTile(screenX, screenY) {
  fill(74, 78, 94);
  rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  stroke(48, 52, 66);
  strokeWeight(2);
  for (let i = 0; i < 4; i++) {
    line(
      screenX + i * 10,
      screenY,
      screenX + i * 10 + TILE_SIZE,
      screenY + TILE_SIZE
    );
  }
  for (let j = 0; j < 4; j++) {
    line(
      screenX,
      screenY + j * 10,
      screenX + TILE_SIZE,
      screenY + j * 10 - TILE_SIZE
    );
  }
  noStroke();
  fill(108, 114, 132, 95);
  rect(screenX + 2, screenY + 2, TILE_SIZE - 4, 8);
}

/** Mario-style green pipe (top-down): solid cylinder segment, blocked. */
function drawPipeTile(screenX, screenY) {
  fill(34, 112, 58);
  rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  stroke(12, 52, 28);
  strokeWeight(2);
  fill(52, 168, 88);
  rect(screenX + 4, screenY + 8, TILE_SIZE - 8, TILE_SIZE - 16, 6);
  noStroke();
  fill(120, 220, 150, 110);
  rect(screenX + 8, screenY + 10, TILE_SIZE - 22, TILE_SIZE - 20, 4);
  stroke(12, 52, 28);
  strokeWeight(2);
  noFill();
  rect(screenX + 4, screenY + 8, TILE_SIZE - 8, TILE_SIZE - 16, 6);
  stroke(18, 70, 38);
  line(screenX + 6, screenY + TILE_SIZE / 2, screenX + TILE_SIZE - 6, screenY + TILE_SIZE / 2);
  noStroke();
  fill(28, 96, 48);
  ellipse(screenX + 7, screenY + TILE_SIZE / 2, 5, 12);
  ellipse(screenX + TILE_SIZE - 7, screenY + TILE_SIZE / 2, 5, 12);
}

/** Broken pipe: crack + leak hint; still blocked until patched. */
function drawBrokenPipeTile(screenX, screenY, tx, ty) {
  drawPipeTile(screenX, screenY);
  push();
  translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
  stroke(40, 40, 48);
  strokeWeight(2.5);
  noFill();
  line(-10, -6, 4, 8);
  line(4, 8, 14, -4);
  stroke(255, 180, 60, 200);
  strokeWeight(1.5);
  line(-8, -4, 2, 10);
  noStroke();
  const s = tx * 313 + ty * 919;
  fill(120, 200, 255, 200);
  for (let i = 0; i < 3; i++) {
    const dy = 10 + (i * 7 + (s >> i) % 5) % 8;
    ellipse(6 + i * 5 - 8, dy - 6, 3, 5);
  }
  pop();
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
