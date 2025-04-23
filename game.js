let canvas, ctx;
let player, enemies = [], bullets = [], enemyBullets = [];
let keys = {};
let enemyDirection = 1;
let enemySpeed = 0.8;
let enemySpeedUps = 0;
const MAX_SPEED_UPS = 4;
const SPEED_MULTIPLIER = 1.2;
let score = 0;
let lives = 3;
let gameInterval;
let countdownInterval;
let currentUser = localStorage.getItem("currentUser") || null;
let lastUserPlay = null;
if (lastUserPlay == null){
  lastUserPlay = currentUser
}
let userScores = {};

const FRAME_RATE = 1000 / 60;
const ENEMY_ROWS = 4;
const ENEMY_COLS = 5;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 30;
const ENEMY_SPACING_X = 100;
const ENEMY_SPACING_Y = 60;

function resetGameState() {
  score = 0;
  lives = 3;
  enemySpeed = 0.8;
  enemySpeedUps = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  enemies.length = 0;
  keys = {};
  enemyDirection = 1;
  timeLeft = gameDuration;

  document.getElementById("score").textContent = 0;
  document.getElementById("lives").textContent = 3;
  document.getElementById("speedLevel").textContent = "1";
  document.getElementById("timer").textContent = formatTime(gameDuration);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}



function initGame() {
  if (typeof gameInterval !== "undefined") {
    clearInterval(gameInterval);
  }
  // stop the previos timer
  if (typeof countdownInterval !== "undefined") {
    clearInterval(countdownInterval);
  }

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

  document.addEventListener("keydown", e => {
    const key = /^[a-zA-Z]$/.test(e.key) ? e.key.toUpperCase() : e.key;
    keys[key] = true;
  });
  
  document.addEventListener("keyup", e => {
    const key = /^[a-zA-Z]$/.test(e.key) ? e.key.toUpperCase() : e.key;
    keys[key] = false;
  });

  gameInterval = setInterval(gameLoop, FRAME_RATE);

  let speedUpInterval = setInterval(() => {
    if (enemySpeedUps < MAX_SPEED_UPS) {
      enemySpeed *= SPEED_MULTIPLIER;
      enemySpeedUps++;
      document.getElementById("speedLevel").textContent = enemySpeedUps + 1;
    } else {
      clearInterval(speedUpInterval);
    }
  }, 5000);

  timeLeft = gameDuration;
  document.getElementById("timer").textContent = formatTime(timeLeft);

  countdownInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = formatTime(timeLeft);

    if (timeLeft == 0) {
      clearInterval(gameInterval);
      clearInterval(countdownInterval);
      if (score < 100) {
        endGame("You can do better", score);
      } else {
        endGame("Winner!", score);
      }
    }
  }, 1000);
}

// Prevent scrolling with arrow keys and spacebar during game
window.addEventListener("keydown", function (e) {
  const isGameScreen = document.getElementById("game").style.display === "block";
  const isScrollingKey = ["ArrowUp", "ArrowDown", " "].includes(e.key);

  if (isGameScreen && isScrollingKey) {
    e.preventDefault();
  }
});

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

  if (keys[shootKey] && player.cooldown <= 0) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      speed: 6,
    });
    player.cooldown = 33;
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
        document.getElementById("hitEnemySound").play();
      }
    });
  });
  bullets = bullets.filter(b => !b.hit);

  enemyBullets.forEach(b => b.y += b.speed);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);

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
        speed: 4 + (enemySpeedUps * 0.42),
        
      });
    }
  }

  enemyBullets.forEach(bullet => {
    if (
      bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y
    ) {
      bullet.hit = true;
      lives--;
      document.getElementById("playerHitSound").play();
      player.x = Math.random() * (canvas.width - player.width);
      player.y = canvas.height * 0.6 + (canvas.height * 0.4 - player.height);
    }
  });

  enemyBullets = enemyBullets.filter(b => !b.hit);

  document.getElementById("score").textContent = score;
  document.getElementById("lives").textContent = lives;

  if (lives <= 0) {
    lives = 3
    endGame("You Lost!", score);
    return;
  }

  if (enemies.every(e => !e.alive)) {
    endGame("Champion!", score);
    return;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.fillStyle = playerColor;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  enemies.forEach(e => {
    if (e.alive) {
      ctx.fillStyle = enemyColor;
      ctx.fillRect(e.x, e.y, e.width, e.height);
      const rowScore = [20, 15, 10, 5];
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(rowScore[e.row], e.x + e.width / 2, e.y + e.height / 2 + 5);
    }
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

function endGame(message, finalScore) {
  clearInterval(gameInterval);
  clearInterval(countdownInterval);
  document.getElementById("endMessage").textContent = message;
  document.getElementById("finalScore").textContent = `Your Score: ${finalScore}`;

  if (lastUserPlay !== currentUser) {
    userScores = {};
    userScores[currentUser] = [];
    lastUserPlay = currentUser;
  }

  if (!userScores[currentUser]) userScores[currentUser] = [];
  userScores[currentUser].push(finalScore);

  const scores = userScores[currentUser].slice().sort((a, b) => b - a);

  let table = `<br><br><h3>${currentUser}'s Scores Table</h3><ul>`;
  scores.forEach((s, i) => {
    const isCurrent = s === finalScore && i === scores.lastIndexOf(finalScore);
    table += `<li>${i + 1}. ${s} ${isCurrent ? "(current game)" : ""}</li>`;
  });
  table += `</ul>`;

  document.getElementById("finalScore").innerHTML += table;
  showScreen("end");
}

