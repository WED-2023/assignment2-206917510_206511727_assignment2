let canvas, ctx;
let player, enemies = [];
let keys = {};
let enemyDirection = 1;
let enemySpeed = 0.5;

let bullets = [];
let score = 0;
let shootCooldown = 0;

const rowScores = [20, 15, 10, 5]; // Row 0 = 20pts, Row 3 = 5pts

const FRAME_RATE = 1000 / 60;
const ENEMY_ROWS = 4;
const ENEMY_COLS = 5;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 30;
const ENEMY_SPACING_X = 100;
const ENEMY_SPACING_Y = 60;

function initGame() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // Player initialization
  player = {
    width: 50,
    height: 30,
    x: Math.random() * (canvas.width - 50),
    y: canvas.height * 0.6 + (canvas.height * 0.4 - 30), // Bottom 40%
    speed: 5
  };

  // Enemy formation
  enemies = [];
  for (let row = 0; row < ENEMY_ROWS; row++) {
    for (let col = 0; col < ENEMY_COLS; col++) {
      enemies.push({
        x: 100 + col * ENEMY_SPACING_X,
        y: 50 + row * ENEMY_SPACING_Y,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        alive: true
      });
    }
  }

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  setInterval(gameLoop, FRAME_RATE);
}

function gameLoop() {
  update();
  draw();
}

function update() {
  // Movement: keep player within bottom 40% of screen
  const lowerBound = canvas.height * 0.6;
  const upperBound = canvas.height - player.height;

  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys["ArrowUp"] && player.y > lowerBound) player.y -= player.speed;
  if (keys["ArrowDown"] && player.y + player.height < canvas.height) player.y += player.speed;

  // Enemy movement
  let edgeReached = false;
  enemies.forEach(e => {
    if (!e.alive) return;
    e.x += enemySpeed * enemyDirection;
    if (e.x <= 0 || e.x + e.width >= canvas.width) edgeReached = true;
  });

  if (edgeReached) {
    enemyDirection *= -1;
    enemies.forEach(e => e.y += 10);
  }
  // Player shooting
  if (keys[" "] && shootCooldown <= 0) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      speed: 6
    });
    shootCooldown = 20; // cooldown frames
  }
  if (shootCooldown > 0) shootCooldown--;

  // Update bullet positions
  bullets.forEach(b => b.y -= b.speed);
  bullets = bullets.filter(b => b.y + b.height >= 0);

  // Bullet vs Enemy collision
  bullets.forEach(bullet => {
    enemies.forEach((enemy, idx) => {
      if (!enemy.alive) return;

      const hit = bullet.x < enemy.x + enemy.width &&
                  bullet.x + bullet.width > enemy.x &&
                  bullet.y < enemy.y + enemy.height &&
                  bullet.y + bullet.height > enemy.y;

      if (hit) {
        enemy.alive = false;
        bullet.hit = true;

        const rowIndex = Math.floor(idx / ENEMY_COLS); // 0 to 3
        score += rowScores[rowIndex];
      }
    });
  });

  bullets = bullets.filter(b => !b.hit);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Draw player
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  
    // Draw enemies
    ctx.fillStyle = "#ff0000";
    enemies.forEach(e => {
      if (e.alive) ctx.fillRect(e.x, e.y, e.width, e.height);
    });
  
    // Draw bullets
    ctx.fillStyle = "white";
    bullets.forEach(b => {
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });
  
    // Draw score (optional, for debug)
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Score: " + score, 10, 20);
  }