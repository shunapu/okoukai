const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const coinCount = document.getElementById("coin-count");
const lifeCount = document.getElementById("life-count");
const message = document.getElementById("message");
const messageTitle = document.getElementById("message-title");
const restartButton = document.getElementById("restart-button");

const keys = {};
const world = { width: 3600, height: canvas.height };
const player = { x: 90, y: 390, w: 28, h: 50, vx: 0, vy: 0, speed: 4.7, jump: 12.5, grounded: false, lives: 3, coins: 0, invincible: 0 };
const level = {
  platforms: [
    { x: 0, y: 455, w: 730, h: 85 }, { x: 820, y: 455, w: 520, h: 85 },
    { x: 1450, y: 455, w: 430, h: 85 }, { x: 2010, y: 455, w: 530, h: 85 },
    { x: 2660, y: 455, w: 940, h: 85 }, { x: 430, y: 370, w: 170, h: 18 },
    { x: 970, y: 350, w: 150, h: 18 }, { x: 1530, y: 340, w: 180, h: 18 },
    { x: 2200, y: 365, w: 170, h: 18 }, { x: 2870, y: 350, w: 180, h: 18 }
  ],
  coins: [200, 475, 545, 900, 1040, 1250, 1600, 1670, 1810, 2180, 2290, 2420, 2800, 2960, 3140, 3370]
    .map((x, i) => ({ x, y: [410, 325, 325, 410, 305, 410, 300, 300, 410, 320, 320, 410, 305, 305, 410, 410][i], got: false })),
  enemies: [
    { x: 600, y: 419, w: 30, h: 36, min: 520, max: 690, speed: 1.1 },
    { x: 1160, y: 419, w: 30, h: 36, min: 900, max: 1280, speed: 1.35 },
    { x: 1780, y: 419, w: 30, h: 36, min: 1530, max: 1840, speed: 1.4 },
    { x: 2340, y: 419, w: 30, h: 36, min: 2100, max: 2490, speed: 1.25 },
    { x: 3050, y: 419, w: 30, h: 36, min: 2750, max: 3300, speed: 1.5 }
  ]
};
let cameraX = 0;
let gameState = "playing";
let lastTime = 0;
let particles = [];

function reset() {
  Object.assign(player, { x: 90, y: 390, vx: 0, vy: 0, grounded: false, lives: 3, coins: 0, invincible: 0 });
  level.coins.forEach(c => { c.got = false; });
  level.enemies.forEach(e => { e.x = e.min; e.speed = Math.abs(e.speed); });
  particles = []; cameraX = 0; gameState = "playing"; message.classList.add("hidden"); updateHud();
}

function updateHud() {
  coinCount.textContent = player.coins;
  lifeCount.textContent = "♥".repeat(player.lives) + "♡".repeat(3 - player.lives);
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function hurt() {
  player.lives--; updateHud(); player.invincible = 100;
  if (player.lives <= 0) {
    gameState = "over"; messageTitle.textContent = "ゲームオーバー"; message.classList.remove("hidden"); return;
  }
  player.x = Math.max(30, player.x - 120); player.y = 350; player.vy = 0; burst(player.x, player.y, "#ff6b8a");
}

function finish() {
  gameState = "clear";
  messageTitle.textContent = `ステージクリア！ コイン ${player.coins}/${level.coins.length}`;
  message.classList.remove("hidden");
  burst(player.x, player.y, "#ffca63");
}

function burst(x, y, color) {
  for (let i = 0; i < 12; i++) particles.push({ x, y, vx: Math.cos(i) * 2.5, vy: Math.sin(i) * 2.5 - 2, life: 1, color });
}

function update(dt) {
  if (gameState !== "playing") return;
  const left = keys.ArrowLeft || keys.KeyA || keys.a;
  const right = keys.ArrowRight || keys.KeyD || keys.d;
  player.vx = (Number(Boolean(right)) - Number(Boolean(left))) * player.speed;
  if ((keys.Space || keys[" "] || keys.ArrowUp || keys.KeyW || keys.w) && player.grounded) {
    player.vy = -player.jump; player.grounded = false;
  }
  player.vy += 0.58 * dt; player.x += player.vx * dt; player.y += player.vy * dt;
  player.x = Math.max(0, Math.min(world.width - player.w, player.x)); player.grounded = false;
  level.platforms.forEach(p => {
    if (player.vy >= 0 && player.x + player.w > p.x && player.x < p.x + p.w &&
        player.y + player.h >= p.y && player.y + player.h - player.vy * dt <= p.y) {
      player.y = p.y - player.h; player.vy = 0; player.grounded = true;
    }
  });
  if (player.y > world.height + 50) hurt();
  level.coins.forEach(c => {
    if (!c.got && Math.hypot(player.x + player.w / 2 - c.x, player.y + player.h / 2 - c.y) < 30) {
      c.got = true; player.coins++; burst(c.x, c.y, "#ffca63"); updateHud();
    }
  });
  level.enemies.forEach(e => {
    e.x += e.speed * dt;
    if (e.x < e.min || e.x > e.max) e.speed *= -1;
    if (player.invincible <= 0 && overlap(player, e)) {
      if (player.vy > 1 && player.y + player.h - e.y < 18) { e.x = e.min; player.vy = -8; burst(e.x, e.y, "#ff6b8a"); }
      else hurt();
    }
  });
  if (player.invincible > 0) player.invincible -= dt;
  particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .1 * dt; p.life -= .03 * dt; });
  particles = particles.filter(p => p.life > 0);
  cameraX += (Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width * .35)) - cameraX) * .12;
  if (player.x > 3470) finish();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#080d2b"); sky.addColorStop(.52, "#20265b"); sky.addColorStop(1, "#713f6f");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.translate(-cameraX, 0);
  ctx.fillStyle = "#f5d58b"; ctx.shadowColor = "#f5a65b"; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(780, 105, 42, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  for (let x = -150; x < world.width; x += 170) {
    ctx.fillStyle = `rgba(190, 214, 255, ${.25 + (x % 5) * .03})`;
    ctx.beginPath(); ctx.arc(x + 35, 55 + (x * 7 % 150), 1.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "rgba(10, 18, 52, .45)";
  for (let x = -300; x < world.width + 300; x += 230) {
    const height = 70 + (x * 13 % 100);
    ctx.beginPath(); ctx.moveTo(x, 455); ctx.lineTo(x + 115, 455 - height); ctx.lineTo(x + 230, 455); ctx.fill();
  }
  level.platforms.forEach(p => {
    const platform = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    platform.addColorStop(0, "#263c70"); platform.addColorStop(1, "#111b3c");
    ctx.fillStyle = platform; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#58e0c1"; ctx.shadowColor = "#58e0c1"; ctx.shadowBlur = 12;
    ctx.fillRect(p.x, p.y, p.w, 5); ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(139, 180, 255, .18)"; ctx.strokeRect(p.x, p.y + 6, p.w, p.h - 6);
  });
  level.coins.forEach(c => {
    if (!c.got) {
      const pulse = 10 + Math.sin(Date.now() / 180 + c.x) * 2;
      ctx.fillStyle = "#ffcf5a"; ctx.shadowColor = "#ff9d3d"; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(c.x, c.y, pulse, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff4bd"; ctx.beginPath(); ctx.arc(c.x - 3, c.y - 3, 3, 0, Math.PI * 2); ctx.fill();
    }
  });
  level.enemies.forEach(e => {
    ctx.fillStyle = "#8e315f"; ctx.shadowColor = "#ff4f9a"; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.roundRect(e.x, e.y, e.w, e.h, 9); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffb7df"; ctx.fillRect(e.x + 7, e.y + 8, 5, 7); ctx.fillRect(e.x + 19, e.y + 8, 5, 7);
    ctx.fillStyle = "#331842"; ctx.fillRect(e.x + 8, e.y + 26, 14, 4);
  });
  ctx.fillStyle = "#ffcf5a"; ctx.shadowColor = "#ffcf5a"; ctx.shadowBlur = 16; ctx.fillRect(3500, 275, 6, 180); ctx.shadowBlur = 0;
  ctx.fillStyle = "#ff4f9a"; ctx.beginPath(); ctx.moveTo(3506, 280); ctx.lineTo(3570, 300); ctx.lineTo(3506, 325); ctx.fill();
  particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 5, 5); }); ctx.globalAlpha = 1;
  if (player.invincible <= 0 || Math.floor(player.invincible / 6) % 2) {
    ctx.fillStyle = "rgba(0, 0, 0, .3)"; ctx.beginPath(); ctx.ellipse(player.x + 14, player.y + player.h + 3, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
    const cx = player.x + player.w / 2;
    ctx.fillStyle = "#f2c7aa"; ctx.shadowColor = "#6b8cff"; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(cx, player.y + 9, 8, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#18244f";
    ctx.beginPath(); ctx.arc(cx, player.y + 7, 8.5, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#101738";
    ctx.fillRect(cx - 6, player.y + 8, 12, 3);
    ctx.fillStyle = "#8ff7e1";
    ctx.fillRect(cx - 4, player.y + 9, 3, 2); ctx.fillRect(cx + 1, player.y + 9, 3, 2);
    ctx.fillStyle = "#5468df";
    ctx.beginPath(); ctx.roundRect(player.x + 7, player.y + 17, 14, 18, 5); ctx.fill();
    ctx.fillStyle = "#8ff7e1"; ctx.fillRect(player.x + 10, player.y + 19, 8, 3);
    ctx.strokeStyle = "#d8e6ff"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(player.x + 7, player.y + 20); ctx.lineTo(player.x + 2, player.y + 29);
    ctx.moveTo(player.x + 21, player.y + 20); ctx.lineTo(player.x + 26, player.y + 29);
    ctx.stroke();
    ctx.strokeStyle = "#263568"; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(player.x + 11, player.y + 34); ctx.lineTo(player.x + 8, player.y + 47);
    ctx.moveTo(player.x + 17, player.y + 34); ctx.lineTo(player.x + 20, player.y + 47);
    ctx.stroke();
    ctx.strokeStyle = "#ff5b9d"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + 5, player.y + 47); ctx.lineTo(player.x + 10, player.y + 47);
    ctx.moveTo(player.x + 18, player.y + 47); ctx.lineTo(player.x + 23, player.y + 47);
    ctx.stroke();
  }
  ctx.restore();
}

function loop(time) {
  const dt = Math.min(2, (time - lastTime) / 16.67 || 1); lastTime = time; update(dt); draw(); requestAnimationFrame(loop);
}

window.addEventListener("keydown", e => {
  keys[e.key] = true;
  keys[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code) ||
      [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
  if (e.key.toLowerCase() === "r") reset();
});
window.addEventListener("keyup", e => {
  keys[e.key] = false;
  keys[e.code] = false;
});
restartButton.addEventListener("click", reset);
updateHud(); requestAnimationFrame(loop);
