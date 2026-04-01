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
  for (let ty = 0; ty < MAP_H; ty++) {
    const row = [];
    const s = MAP_ROWS[ty];
    for (let tx = 0; tx < MAP_W; tx++) {
      const c = s[tx];
      row.push(c === "0" || c === " " ? 0 : c === "2" ? 2 : 1);
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

function rectHitsBlocking(x, y, w, h) {
  const x0 = floor(x / TILE_SIZE);
  const y0 = floor(y / TILE_SIZE);
  const x1 = floor((x + w - 0.001) / TILE_SIZE);
  const y1 = floor((y + h - 0.001) / TILE_SIZE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (tileWorld(tx, ty) !== 0) return true;
    }
  }
  return false;
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

function drawRuneTile(screenX, screenY) {
  fill(32, 26, 52);
  rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  push();
  translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
  noFill();
  stroke(212, 168, 96, 235);
  strokeWeight(2);
  for (let r = 8; r < TILE_SIZE / 2; r += 7) {
    arc(0, 0, r * 2, r * 2, -PI * 0.75, -PI * 0.25);
  }
  stroke(110, 210, 198, 200);
  strokeWeight(1.5);
  for (let a = 0; a < 6; a++) {
    const ang = (TWO_PI / 6) * a - HALF_PI;
    line(cos(ang) * 6, sin(ang) * 6, cos(ang) * 16, sin(ang) * 16);
  }
  fill(255, 248, 220, 100);
  noStroke();
  ellipse(0, 0, 10, 10);
  pop();
}

function drawTile(tx, ty, type, ox, oy) {
  const screenX = tx * TILE_SIZE + ox;
  const screenY = ty * TILE_SIZE + oy;

  if (type === 0) {
    drawGrassTile(screenX, screenY, tx, ty);
  } else if (type === 1) {
    drawWallTile(screenX, screenY);
  } else {
    drawRuneTile(screenX, screenY);
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
