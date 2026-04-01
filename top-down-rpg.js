function setup() {
  createCanvas(min(960, windowWidth - 16), min(640, windowHeight - 16));
  initPlayerKeyboard();
  initWorldMap();
  initPlayerFromWorldStart();
}

function windowResized() {
  resizeCanvas(min(960, windowWidth - 16), min(640, windowHeight - 16));
}

function drawHud() {
  fill(212, 204, 188);
  textAlign(LEFT, TOP);
  textSize(14);
  noStroke();
  text(
    "WASD / arrows — move   ·   E or Space — interact (face a rune tile)",
    12,
    10
  );
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

  const axes = readInputAxes();
  tryMove(axes.ax * MOVE_SPEED, axes.ay * MOVE_SPEED);

  const cam = cameraOffsetForPlayer(player.x, player.y, PLAYER_W, PLAYER_H);
  drawWorld(cam);
  drawPlayer(cam);

  drawHud();
}
