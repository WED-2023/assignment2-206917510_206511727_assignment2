let canvas, ctx;
let player, enemies = [], bullets = [], enemyBullets = [];
let keys = {};
let enemyDirection = 1;
let enemySpeed = 0.5;
let score = 0;
let lives = 3;

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

  player = {
    width: 50,
    height: 30,
    x: Math.random() * (canvas.width - 50),
    y: canvas.height * 0.6 + (canvas.height * 0.4 - 30),
    speed: 5,
    cooldown: 0
  };

  enemies = [];
  for (let row = 0; row < ENEMY_ROWS; row++) {
    for (let col = 0; col < ENEMY_COLS; col++) {
      enemies.push({
        x: 100 + col * ENEMY_SPACING_X,
        y: 50 + row * ENEMY_SPACING_Y,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        row: row,
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
  const lowerBound = canvas.height * 0.6;

  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys["ArrowUp"] && player.y > lowerBound) player.y -= player.speed;
  if (keys["ArrowDown"] && player.y + player.height < canvas.height) player.y += player.speed;

  if (keys[" "] && player.cooldown <= 0) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      speed: 6
    });
    player.cooldown = 15;
  }
  if (player.cooldown > 0) player.cooldown--;

  bullets.forEach(bullet => bullet.y -= bullet.speed);
  bullets = bullets.filter(b => b.y + b.height > 0);

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

  bullets.forEach(bullet => {
    enemies.forEach(enemy => {
      if (
        enemy.alive &&
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemy.alive = false;
        bullet.hit = true;
        const rowScore = [20, 15, 10, 5];
        score += rowScore[enemy.row];
      }
    });
  });

  bullets = bullets.filter(b => !b.hit);
  document.getElementById("score").textContent = score;

  // Move enemy bullets
  enemyBullets.forEach(b => b.y += b.speed);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);

  // Enemy shooting when last bullet reaches 3/4 screen
  const triggerZone = canvas.height * 0.75;
  const canShoot = enemyBullets.length === 0 || enemyBullets.every(b => b.y > triggerZone);

  if (canShoot) {
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length > 0) {
      const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      enemyBullets.push({
        x: shooter.x + shooter.width / 2 - 2,
        y: shooter.y + shooter.height,
        width: 4,
        height: 10,
        speed: 4
      });
    }
  }

  // Check collision with player
  enemyBullets.forEach(bullet => {
    if (
      bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y
    ) {
      bullet.hit = true;
      lives--;
    }
  });

  enemyBullets = enemyBullets.filter(b => !b.hit);
  document.getElementById("lives").textContent = lives;

  // Game over check
  if (lives <= 0) {
    alert("Game Over!");
    document.location.reload();
  }

  // Victory check
  if (enemies.every(e => !e.alive)) {
    alert("You win!");
    document.location.reload();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.fillStyle = "lime";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Draw enemies
  ctx.fillStyle = "red";
  enemies.forEach(e => {
    if (e.alive) ctx.fillRect(e.x, e.y, e.width, e.height);
  });

  // Draw player bullets
  ctx.fillStyle = "white";
  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  // Draw enemy bullets
  ctx.fillStyle = "yellow";
  enemyBullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
}


