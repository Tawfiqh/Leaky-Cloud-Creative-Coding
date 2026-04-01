const TIMER_START_SEC = 30;

let gameStartMs;

function remainingSeconds() {
  const elapsed = (millis() - gameStartMs) / 1000;
  return max(0, TIMER_START_SEC - elapsed);
}

/** 0 at full time → 1 at zero; drives screen shake intensity. */
function panicFactor() {
  const r = remainingSeconds();
  if (r <= 0) return 0;
  return 1 - r / TIMER_START_SEC;
}

function setup() {
  createCanvas(min(960, windowWidth - 16), min(640, windowHeight - 16));
  gameStartMs = millis();
  initPlayerKeyboard();
  initWorldMap();
  initPlayerFromWorldStart();
}

function windowResized() {
  resizeCanvas(min(960, windowWidth - 16), min(640, windowHeight - 16));
}

function drawHud() {
  const remaining = remainingSeconds();
  const playing = remaining > 0;

  fill(212, 204, 188);
  textAlign(LEFT, TOP);
  textSize(14);
  noStroke();
  text(
    "WASD / arrows — move   ·   E or Space — interact (face a rune tile)",
    12,
    10
  );

  textAlign(RIGHT, TOP);
  textSize(16);
  if (remaining <= 10) {
    fill(255, 120, 100);
  } else {
    fill(212, 204, 188);
  }
  text(playing ? remaining.toFixed(1) + " s" : "0.0 s", width - 12, 10);
  textAlign(LEFT, TOP);

  if (!playing) {
    fill(255, 90, 70, 230);
    textAlign(CENTER, CENTER);
    textSize(28);
    text("TIME'S UP", width / 2, height / 2 - 8);
    textSize(14);
    fill(212, 204, 188, 200);
    text("Refresh the page to play again", width / 2, height / 2 + 22);
    textAlign(LEFT, TOP);
  }

  if (millis() < messageUntil && messageText) {
    fill(36, 30, 48, 238);
    rect(12, height - 52, min(width - 24, 420), 40, 8);
    stroke(180, 150, 95, 90);
    strokeWeight(1);
    noFill();
    rect(12.5, height - 51.5, min(width - 24, 420) - 1, 39, 7);
    noStroke();
    fill(248, 242, 228);
    textSize(15);
    text(messageText, 24, height - 42);
  }
}

function draw() {
  background(22, 18, 34);

  const remaining = remainingSeconds();
  if (remaining > 0) {
    const axes = readInputAxes();
    tryMove(axes.ax * MOVE_SPEED, axes.ay * MOVE_SPEED);
  }

  const pf = panicFactor();
  const shakeAmp = pf * pf * 14;
  const shakeX = (random() - 0.5) * 2 * shakeAmp;
  const shakeY = (random() - 0.5) * 2 * shakeAmp;

  push();
  translate(shakeX, shakeY);
  const cam = cameraOffsetForPlayer(player.x, player.y, PLAYER_W, PLAYER_H);
  drawWorld(cam);
  drawPlayer(cam);
  pop();

  drawHud();
}
