const TIMER_START_SEC = 30;
const TIME_BONUS_PER_FIX_SEC = 7;

const CLOUD_BITS_MAX = 8;
const BITS_LOST_ON_PIPE_BREAK = 1;
const BITS_RESTORED_ON_FIX = 1;

const HIGH_SCORE_KEY = "creativeCoding_rpg_pipesFixed_high";

const HUD_GLOW = { r: 26, g: 251, b: 76 };
const HUD_DIM = { r: 160, g: 220, b: 175 };

let gameEndMs;
let cloudBits;
let pipesFixedThisRun;
let highScorePipesLoaded;

function loadHighScore() {
  try {
    const v = localStorage.getItem(HIGH_SCORE_KEY);
    if (v === null) return 0;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? max(0, n) : 0;
  } catch (e) {
    return 0;
  }
}

function saveHighScore(n) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(n));
  } catch (e) {
    /* ignore */
  }
}

function remainingSeconds() {
  return max(0, (gameEndMs - millis()) / 1000);
}

/** 0 = calm → 1 = max panic shake (when time is low vs starting budget). */
function panicFactor() {
  const r = remainingSeconds();
  if (r <= 0) return 1;
  return constrain(1 - r / TIMER_START_SEC, 0, 1);
}

function isGameOver() {
  return remainingSeconds() <= 0 || cloudBits <= 0;
}

function gameOverReason() {
  if (remainingSeconds() <= 0) return "time";
  if (cloudBits <= 0) return "cloud";
  return null;
}

function onPipeSprungLeak() {
  cloudBits = max(0, cloudBits - BITS_LOST_ON_PIPE_BREAK);
}

function onPipeFixed() {
  pipesFixedThisRun++;
  gameEndMs += TIME_BONUS_PER_FIX_SEC * 1000;
  cloudBits = min(CLOUD_BITS_MAX, cloudBits + BITS_RESTORED_ON_FIX);
  if (pipesFixedThisRun > highScorePipesLoaded) {
    highScorePipesLoaded = pipesFixedThisRun;
    saveHighScore(highScorePipesLoaded);
  }
}

function setup() {
  createCanvas(min(960, windowWidth - 16), min(640, windowHeight - 16));
  gameEndMs = millis() + TIMER_START_SEC * 1000;
  cloudBits = CLOUD_BITS_MAX;
  pipesFixedThisRun = 0;
  highScorePipesLoaded = loadHighScore();
  initPlayerKeyboard();
  initWorldMap();
  initPlayerFromWorldStart();
}

function windowResized() {
  resizeCanvas(min(960, windowWidth - 16), min(640, windowHeight - 16));
}

function drawHud() {
  const remaining = remainingSeconds();
  const over = isGameOver();

  fill(HUD_DIM.r, HUD_DIM.g, HUD_DIM.b);
  textAlign(LEFT, TOP);
  textSize(14);
  noStroke();
  text(
    "WASD — move · E — patch broken pipe (face it) · +" +
      TIME_BONUS_PER_FIX_SEC +
      "s per fix",
    12,
    10
  );

  textSize(13);
  fill(HUD_GLOW.r, HUD_GLOW.g, HUD_GLOW.b, 200);
  text(
    "Pipes fixed: " +
      pipesFixedThisRun +
      "    High score: " +
      highScorePipesLoaded,
    12,
    30
  );

  const bitsLabel = "Cloud bits ";
  textSize(13);
  fill(240, 248, 255);
  text(bitsLabel, 12, 50);
  const lx = 12 + textWidth(bitsLabel);
  for (let i = 0; i < CLOUD_BITS_MAX; i++) {
    const on = i < cloudBits;
    fill(on ? 248 : 180, on ? 252 : 210, on ? 255 : 230, on ? 255 : 100);
    noStroke();
    rect(lx + i * 14, 48, 12, 14, 3);
  }

  textAlign(RIGHT, TOP);
  textSize(16);
  if (remaining <= 10 && remaining > 0) {
    fill(255, 80, 90);
  } else {
    fill(HUD_GLOW.r, HUD_GLOW.g, HUD_GLOW.b);
  }
  text(over ? "0.0 s" : remaining.toFixed(1) + " s", width - 12, 10);
  textAlign(LEFT, TOP);

  if (over) {
    const reason = gameOverReason();
    drawingContext.shadowBlur = 18;
    drawingContext.shadowColor = "rgba(255, 60, 60, 0.6)";
    fill(255, 70, 85, 245);
    textAlign(CENTER, CENTER);
    textSize(28);
    text("Kernel Panic", width / 2, height / 2 - 28);
    drawingContext.shadowBlur = 0;
    textSize(15);
    fill(HUD_DIM.r, HUD_DIM.g, HUD_DIM.b, 230);
    if (reason === "time") {
      text("Timer reached zero — the cloud needed more patches in time.", width / 2, height / 2 + 8);
    } else {
      text(
        "The cloud ran out of bits — too many pipe leaks!",
        width / 2,
        height / 2 + 8
      );
    }
    textSize(14);
    fill(HUD_GLOW.r, HUD_GLOW.g, HUD_GLOW.b, 180);
    text(
      "Pipes fixed this run: " +
        pipesFixedThisRun +
        " · High score: " +
        highScorePipesLoaded,
      width / 2,
      height / 2 + 36
    );
    textSize(13);
    fill(HUD_DIM.r, HUD_DIM.g, HUD_DIM.b, 200);
    text("Refresh the page to play again", width / 2, height / 2 + 62);
    textAlign(LEFT, TOP);
  }

  if (millis() < messageUntil && messageText) {
    fill(2, 12, 6, 230);
    rect(12, height - 52, min(width - 24, 480), 40, 8);
    stroke(HUD_GLOW.r, HUD_GLOW.g, HUD_GLOW.b, 200);
    strokeWeight(1.5);
    noFill();
    rect(12.5, height - 51.5, min(width - 24, 480) - 1, 39, 7);
    noStroke();
    fill(HUD_GLOW.r, HUD_GLOW.g, HUD_GLOW.b);
    textSize(15);
    text(messageText, 24, height - 42);
  }
}

function draw() {
  background(2, 8, 5);

  const over = isGameOver();
  if (!over) {
    updateRandomPipeBreaks();
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
