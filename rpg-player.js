const PLAYER_W = 22;
const PLAYER_H = 22;
const MOVE_SPEED = 3.2;
const INTERACT_DEBOUNCE_MS = 320;

const player = { x: 0, y: 0 };
let facing = { x: 0, y: 1 };
/** Tracks physical keys via KeyboardEvent.code (reliable for WASD + arrows together). */
const keysDown = new Set();
let lastInteractMs = 0;
let messageUntil = 0;
let messageText = "";

function initPlayerFromWorldStart() {
  const start = findStartTile();
  player.x = start.x * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2;
  player.y = start.y * TILE_SIZE + (TILE_SIZE - PLAYER_H) / 2;
}

function tryMove(dx, dy) {
  if (dx !== 0 || dy !== 0) {
    if (abs(dx) >= abs(dy)) {
      facing = { x: Math.sign(dx) || facing.x, y: 0 };
    } else {
      facing = { x: 0, y: Math.sign(dy) || facing.y };
    }
  }

  const nx = player.x + dx;
  const ny = player.y + dy;

  if (!rectHitsBlocking(nx, player.y, PLAYER_W, PLAYER_H)) {
    player.x = nx;
  }
  if (!rectHitsBlocking(player.x, ny, PLAYER_W, PLAYER_H)) {
    player.y = ny;
  }

  player.x = constrain(player.x, 0, WORLD_W - PLAYER_W);
  player.y = constrain(player.y, 0, WORLD_H - PLAYER_H);
}

function clearHeldKeys() {
  keysDown.clear();
}

function initPlayerKeyboard() {
  const preventScroll = (e) => {
    if (
      e.code === "Space" ||
      e.code === "ArrowUp" ||
      e.code === "ArrowDown" ||
      e.code === "ArrowLeft" ||
      e.code === "ArrowRight"
    ) {
      e.preventDefault();
    }
  };

  window.addEventListener(
    "keydown",
    (e) => {
      keysDown.add(e.code);
      if (e.code === "KeyE" || e.code === "Space") {
        if (!e.repeat) tryInteract();
      }
      preventScroll(e);
    },
    { capture: true, passive: false }
  );

  window.addEventListener(
    "keyup",
    (e) => {
      keysDown.delete(e.code);
    },
    { capture: true, passive: true }
  );

  window.addEventListener("blur", clearHeldKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearHeldKeys();
  });
}

function readInputAxes() {
  let ax = 0;
  let ay = 0;
  if (keysDown.has("ArrowLeft") || keysDown.has("KeyA")) ax -= 1;
  if (keysDown.has("ArrowRight") || keysDown.has("KeyD")) ax += 1;
  if (keysDown.has("ArrowUp") || keysDown.has("KeyW")) ay -= 1;
  if (keysDown.has("ArrowDown") || keysDown.has("KeyS")) ay += 1;
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
  if (typeof remainingSeconds === "function" && remainingSeconds() <= 0) return;
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
  fill(214, 122, 92);
  stroke(92, 52, 42);
  strokeWeight(2);
  triangle(0, -12, -9, 10, 9, 10);
  fill(255, 232, 212);
  noStroke();
  ellipse(0, 2, 10, 10);
  pop();
}
