const TILE_SIZE = 40;
const PLAYER_W = 22;
const PLAYER_H = 22;
const MOVE_SPEED = 3.2;
const INTERACT_DEBOUNCE_MS = 320;

const MAP_ROWS = [
  "1111111111111111111111111111",
  "1000000000000000000000000001",
  "1000001111111111110000000001",
  "1000001000000000021000000001",
  "1000001022222000021000000001",
  "1000001020000200021000000001",
  "1000001020000200021000000001",
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
let player = { x: 0, y: 0 };
let facing = { x: 0, y: 1 };
let keys = {};
let lastInteractMs = 0;
let messageUntil = 0;
let messageText = "";

function setup() {
  createCanvas(min(960, windowWidth - 16), min(640, windowHeight - 16));
  parseMap();
  const start = findStartTile();
  player.x = start.x * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2;
  player.y = start.y * TILE_SIZE + (TILE_SIZE - PLAYER_H) / 2;
}

function windowResized() {
  resizeCanvas(min(960, windowWidth - 16), min(640, windowHeight - 16));
}

function parseMap() {
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
      const t = tileWorld(tx, ty);
      if (t !== 0) return true;
    }
  }
  return false;
}

function tryMove(dx, dy) {
  if (dx !== 0 || dy !== 0) {
    if (abs(dx) >= abs(dy)) {
      facing = { x: Math.sign(dx) || facing.x, y: 0 };
    } else {
      facing = { x: 0, y: Math.sign(dy) || facing.y };
    }
  }

  let nx = player.x + dx;
  let ny = player.y + dy;

  if (!rectHitsBlocking(nx, player.y, PLAYER_W, PLAYER_H)) {
    player.x = nx;
  }
  if (!rectHitsBlocking(player.x, ny, PLAYER_W, PLAYER_H)) {
    player.y = ny;
  }

  player.x = constrain(player.x, 0, WORLD_W - PLAYER_W);
  player.y = constrain(player.y, 0, WORLD_H - PLAYER_H);
}

function keyPressed() {
  keys[keyCode] = true;
  if (key === "e" || key === "E" || key === " ") {
    tryInteract();
  }
  if (key === " " || key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
    return false;
  }
}

function keyReleased() {
  keys[keyCode] = false;
}

function readInputAxes() {
  let ax = 0;
  let ay = 0;
  if (keys[LEFT_ARROW] || keys[65]) ax -= 1;
  if (keys[RIGHT_ARROW] || keys[68]) ax += 1;
  if (keys[UP_ARROW] || keys[87]) ay -= 1;
  if (keys[DOWN_ARROW] || keys[83]) ay += 1;
  if (ax !== 0 && ay !== 0) {
    ax *= 0.707;
    ay *= 0.707;
  }
  return { ax, ay };
}

function playerCenterTile() {
  const cx = player.x + PLAYER_W / 2;
  const cy = player.y + PLAYER_H / 2;
  return { tx: floor(cx / TILE_SIZE), ty: floor(cy / TILE_SIZE) };
}

function facingNeighborTile() {
  const { tx, ty } = playerCenterTile();
  const fx = facing.x === 0 ? 0 : Math.sign(facing.x);
  const fy = facing.y === 0 ? 0 : Math.sign(facing.y);
  if (fx === 0 && fy === 0) return { tx: tx, ty: ty - 1 };
  return { tx: tx + fx, ty: ty + fy };
}

function tryInteract() {
  const now = millis();
  if (now - lastInteractMs < INTERACT_DEBOUNCE_MS) return;
  lastInteractMs = now;

  const n = facingNeighborTile();
  const t = tileWorld(n.tx, n.ty);
  if (t === 2) {
    messageText = "The ancient seal hums… (interact)";
    messageUntil = now + 2800;
  }
}

function cameraOffset() {
  const cx = player.x + PLAYER_W / 2 - width / 2;
  const cy = player.y + PLAYER_H / 2 - height / 2;
  const maxX = max(0, WORLD_W - width);
  const maxY = max(0, WORLD_H - height);
  return {
    x: constrain(cx, 0, maxX),
    y: constrain(cy, 0, maxY),
  };
}

function drawTile(tx, ty, type, ox, oy) {
  const x = tx * TILE_SIZE + ox;
  const y = ty * TILE_SIZE + oy;

  if (type === 0) {
    const base = color(52 + noise(tx * 0.31, ty * 0.29) * 28, 118 + noise(tx * 0.27, ty * 0.33) * 35, 72);
    fill(base);
    noStroke();
    rect(x, y, TILE_SIZE, TILE_SIZE);

    for (let i = 0; i < 5; i++) {
      const s = tx * 928371 + ty * 19249 + i * 7919;
      const px = (s % 31) + 4;
      const py = ((s >> 5) % 31) + 4;
      fill(40 + (s % 30), 100 + ((s >> 3) % 40), 55 + ((s >> 7) % 25), 180);
      ellipse(x + px, y + py, 3 + (s % 5));
    }

    stroke(30, 80, 45, 40);
    strokeWeight(1);
    line(x + 4, y + TILE_SIZE - 4, x + TILE_SIZE - 4, y + 4);
    noStroke();
  } else if (type === 1) {
    fill(38, 42, 52);
    rect(x, y, TILE_SIZE, TILE_SIZE);
    stroke(22, 26, 34);
    strokeWeight(2);
    for (let i = 0; i < 4; i++) {
      line(x + i * 10, y, x + i * 10 + TILE_SIZE, y + TILE_SIZE);
    }
    for (let j = 0; j < 4; j++) {
      line(x, y + j * 10, x + TILE_SIZE, y + j * 10 - TILE_SIZE);
    }
    noStroke();
    fill(55, 60, 72, 90);
    rect(x + 2, y + 2, TILE_SIZE - 4, 8);
  } else {
    fill(28, 22, 48);
    rect(x, y, TILE_SIZE, TILE_SIZE);
    push();
    translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    noFill();
    stroke(160, 120, 255, 220);
    strokeWeight(2);
    for (let r = 8; r < TILE_SIZE / 2; r += 7) {
      arc(0, 0, r * 2, r * 2, -PI * 0.75, -PI * 0.25);
    }
    stroke(100, 220, 255, 180);
    strokeWeight(1.5);
    for (let a = 0; a < 6; a++) {
      const ang = (TWO_PI / 6) * a - HALF_PI;
      line(cos(ang) * 6, sin(ang) * 6, cos(ang) * 16, sin(ang) * 16);
    }
    fill(200, 240, 255, 90);
    noStroke();
    ellipse(0, 0, 10, 10);
    pop();
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

function drawPlayer(cam) {
  const sx = player.x - cam.x;
  const sy = player.y - cam.y;
  push();
  translate(sx + PLAYER_W / 2, sy + PLAYER_H / 2);
  let ang = 0;
  if (facing.x > 0) ang = HALF_PI;
  else if (facing.x < 0) ang = -HALF_PI;
  else if (facing.y < 0) ang = PI;
  else ang = 0;
  rotate(ang);
  fill(70, 140, 255);
  stroke(20, 50, 90);
  strokeWeight(2);
  triangle(0, -12, -9, 10, 9, 10);
  fill(255, 220, 160);
  noStroke();
  ellipse(0, 2, 10, 10);
  pop();
}

function drawHud() {
  fill(240, 245, 250);
  textAlign(LEFT, TOP);
  textSize(14);
  noStroke();
  text("WASD / arrows — move   ·   E or Space — interact (face a rune tile)", 12, 10);
  if (millis() < messageUntil && messageText) {
    fill(20, 24, 32, 220);
    rect(12, height - 52, min(width - 24, 420), 40, 8);
    fill(220, 230, 255);
    textSize(15);
    text(messageText, 24, height - 42);
  }
}

function draw() {
  background(15, 18, 26);

  const axes = readInputAxes();
  tryMove(axes.ax * MOVE_SPEED, axes.ay * MOVE_SPEED);

  const cam = cameraOffset();
  drawWorld(cam);
  drawPlayer(cam);

  drawHud();
}
