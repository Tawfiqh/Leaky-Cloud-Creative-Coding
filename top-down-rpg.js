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
  fill(240, 245, 250);
  textAlign(LEFT, TOP);
  textSize(14);
  noStroke();
  text(
    "WASD / arrows — move   ·   E or Space — interact (face a rune tile)",
    12,
    10
  );
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

  const cam = cameraOffsetForPlayer(player.x, player.y, PLAYER_W, PLAYER_H);
  drawWorld(cam);
  drawPlayer(cam);

  drawHud();
}
