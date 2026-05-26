// ============================================================
//  SPACE SHOOTER — game.js
//  Vanilla JS · OOP · Canvas API · No libraries
// ============================================================

'use strict';

// ── Canvas setup ─────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── Key tracking ─────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => { keys[e.key] = true;  e.preventDefault(); });
document.addEventListener('keyup',   e => { keys[e.key] = false; });

// ── Helpers ───────────────────────────────────────────────────
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

/** AABB collision between two rect-like objects */
function collides(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ── localStorage high score ───────────────────────────────────
const HS_KEY = 'spaceShooterHighScore';
function getHighScore()  { return parseInt(localStorage.getItem(HS_KEY) || '0', 10); }
function saveHighScore(s){ localStorage.setItem(HS_KEY, s); }

// ── DOM refs ──────────────────────────────────────────────────
const startScreen    = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const hud            = document.getElementById('hud');
const hudScore       = document.getElementById('hud-score');
const hudWave        = document.getElementById('hud-wave');
const hudHighScore   = document.getElementById('hud-high-score');
const livesDisplay   = document.getElementById('lives-display');
const goScore        = document.getElementById('go-score');
const goHighScore    = document.getElementById('go-high-score');
const goWave         = document.getElementById('go-wave');
const newRecordBadge = document.getElementById('new-record-badge');
const startHsVal     = document.getElementById('start-hs-value');
const startBtn       = document.getElementById('start-btn');
const restartBtn     = document.getElementById('restart-btn');
const menuBtn        = document.getElementById('menu-btn');

// ── Particle pool ─────────────────────────────────────────────
class Particle {
  constructor(x, y, vx, vy, radius, color, life) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.radius = radius;
    this.color  = color;
    this.life   = life;   // frames
    this.maxLife = life;
    this.dead   = false;
  }
  update() {
    this.x  += this.vx;
    this.y  += this.vy;
    this.vy += 0.08; // gravity
    this.life--;
    if (this.life <= 0) this.dead = true;
  }
  draw() {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 8;
    ctx.fill();
    ctx.restore();
  }
}

// ── Star (background) ─────────────────────────────────────────
class Star {
  constructor() { this.reset(true); }
  reset(initial = false) {
    this.x     = rand(0, canvas.width);
    this.y     = initial ? rand(0, canvas.height) : 0;
    this.speed = rand(0.5, 2.5);
    this.size  = rand(0.5, 2.2);
    this.alpha = rand(0.3, 1);
  }
  update() {
    this.y += this.speed;
    if (this.y > canvas.height) this.reset();
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#99ccff';
    ctx.shadowBlur  = 4;
    ctx.fill();
    ctx.restore();
  }
}

// ── Bullet ────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, dy, color, isPlayer) {
    this.x        = x;
    this.y        = y;
    this.width    = isPlayer ? 4 : 6;
    this.height   = isPlayer ? 18 : 14;
    this.dy       = dy;
    this.color    = color;
    this.isPlayer = isPlayer;
    this.dead     = false;
  }
  update() {
    this.y += this.dy;
    if (this.y < -20 || this.y > canvas.height + 20) this.dead = true;
  }
  draw() {
    ctx.save();
    // Glow trail
    const grad = ctx.createLinearGradient(
      this.x, this.y,
      this.x, this.y + this.height * (this.isPlayer ? 1 : -1)
    );
    grad.addColorStop(0, this.color);
    grad.addColorStop(1, 'transparent');

    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = grad;
    ctx.beginPath();
    ctx.roundRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
      this.width / 2
    );
    ctx.fill();
    ctx.restore();
  }
}

// ── Player ────────────────────────────────────────────────────
class Player {
  constructor() {
    this.width  = 48;
    this.height = 56;
    this.x      = canvas.width  / 2 - this.width  / 2;
    this.y      = canvas.height - this.height - 40;
    this.speed  = 8;
    this.lives  = 3;
    this.score  = 0;
    this.shootCooldown   = 0;
    this.shootDelay      = 14; // frames
    this.invincible      = 0;  // invincibility frames after hit
    this.thrusterFlicker = 0;
    this.dead   = false;
  }

  update() {
    // Movement
    const moveX = (keys['ArrowLeft']  || keys['a'] || keys['A']) ? -1
                : (keys['ArrowRight'] || keys['d'] || keys['D']) ?  1 : 0;
    const moveY = (keys['ArrowUp']    || keys['w'] || keys['W']) ? -1
                : (keys['ArrowDown']  || keys['s'] || keys['S']) ?  1 : 0;

    this.x += moveX * this.speed;
    this.y += moveY * this.speed * 0.6;

    // Clamp to canvas
    this.x = Math.max(0, Math.min(canvas.width  - this.width,  this.x));
    this.y = Math.max(canvas.height * 0.4, Math.min(canvas.height - this.height - 10, this.y));

    // Shooting
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.invincible    > 0) this.invincible--;
    this.thrusterFlicker = (this.thrusterFlicker + 1) % 6;
  }

  shoot(bullets) {
    if (this.shootCooldown > 0) return;
    const cx = this.x + this.width / 2;
    bullets.push(new Bullet(cx, this.y - 4, -12, '#00e5ff', true));
    this.shootCooldown = this.shootDelay;
  }

  takeDamage(particles) {
    if (this.invincible > 0) return false;
    this.lives--;
    this.invincible = 90; // 1.5 sec at 60fps
    spawnExplosion(particles, this.x + this.width / 2, this.y + this.height / 2, '#ff3366', 18);
    if (this.lives <= 0) this.dead = true;
    return true;
  }

  draw() {
    if (this.invincible > 0 && Math.floor(this.invincible / 6) % 2 === 0) return; // blink

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // --- Thruster flame ---
    const flicker = this.thrusterFlicker < 3 ? 1 : 0.75;
    const flameH  = 20 * flicker;
    const thrustGrad = ctx.createLinearGradient(0, 22, 0, 22 + flameH);
    thrustGrad.addColorStop(0, 'rgba(0,229,255,0.9)');
    thrustGrad.addColorStop(0.5, 'rgba(123,47,255,0.7)');
    thrustGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.moveTo(-10, 22);
    ctx.lineTo( 10, 22);
    ctx.lineTo(  0, 22 + flameH);
    ctx.closePath();
    ctx.fillStyle = thrustGrad;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur  = 20;
    ctx.fill();

    // --- Ship body ---
    ctx.shadowColor = '#7b2fff';
    ctx.shadowBlur  = 22;

    // Hull gradient
    const bodyGrad = ctx.createLinearGradient(-24, -28, 24, 28);
    bodyGrad.addColorStop(0,   '#b07cff');
    bodyGrad.addColorStop(0.5, '#7b2fff');
    bodyGrad.addColorStop(1,   '#3a007a');

    // Main body
    ctx.beginPath();
    ctx.moveTo(  0, -28);   // nose
    ctx.lineTo( 18,  20);   // right wing
    ctx.lineTo( 10,  14);
    ctx.lineTo(  0,  18);
    ctx.lineTo(-10,  14);
    ctx.lineTo(-18,  20);   // left wing
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Cockpit window
    ctx.beginPath();
    ctx.ellipse(0, -6, 7, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,229,255,0.25)';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur  = 14;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,229,255,0.6)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}

// ── Enemy ─────────────────────────────────────────────────────
const ENEMY_TYPES = [
  {
    key: 'scout',
    color: '#ff4466', glow: '#ff0033',
    width: 38, height: 34,
    hp: 1, speed: 1.8, points: 10,
    shootChance: 0.003,
  },
  {
    key: 'cruiser',
    color: '#ffaa00', glow: '#ff6600',
    width: 52, height: 44,
    hp: 3, speed: 1.1, points: 30,
    shootChance: 0.006,
  },
  {
    key: 'dreadnought',
    color: '#cc44ff', glow: '#8800ff',
    width: 66, height: 56,
    hp: 6, speed: 0.7, points: 60,
    shootChance: 0.009,
  },
];

class Enemy {
  constructor(type, x, y) {
    Object.assign(this, type);
    this.x    = x;
    this.y    = y;
    this.maxHp = this.hp;
    this.dead  = false;
    this.angle = 0; // wobble
    this.wobbleSpeed = rand(0.02, 0.06);
    this.wobbleAmp   = rand(20, 50);
    this.startX      = x;
  }

  update(bullets) {
    this.y += this.speed;
    this.angle += this.wobbleSpeed;
    this.x = this.startX + Math.sin(this.angle) * this.wobbleAmp;

    // Random shoot
    if (Math.random() < this.shootChance) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height;
      bullets.push(new Bullet(cx, cy, 6, this.glow, false));
    }

    if (this.y > canvas.height + 80) this.dead = true;
  }

  takeDamage(amount, particles) {
    this.hp -= amount;
    spawnExplosion(particles, this.x + this.width / 2, this.y + this.height / 2, this.glow, 8);
    if (this.hp <= 0) {
      spawnExplosion(particles, this.x + this.width / 2, this.y + this.height / 2, this.glow, 28);
      this.dead = true;
      return true; // killed
    }
    return false;
  }

  draw() {
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.shadowColor = this.glow;
    ctx.shadowBlur  = 24;

    const bodyGrad = ctx.createRadialGradient(0, -4, 2, 0, 0, this.width * 0.65);
    bodyGrad.addColorStop(0, lighten(this.color, 40));
    bodyGrad.addColorStop(0.6, this.color);
    bodyGrad.addColorStop(1, darken(this.color, 40));

    if (this.key === 'scout') {
      // Diamond saucer
      ctx.beginPath();
      ctx.moveTo(  0, -this.height * 0.48);
      ctx.lineTo( this.width * 0.48,  0);
      ctx.lineTo(  0,  this.height * 0.48);
      ctx.lineTo(-this.width * 0.48,  0);
      ctx.closePath();
      ctx.fillStyle = bodyGrad;
      ctx.fill();
    } else if (this.key === 'cruiser') {
      // Hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const r = this.width * 0.46;
        i === 0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r)
                : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      ctx.closePath();
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      // Inner ring
      ctx.beginPath();
      ctx.arc(0, 0, this.width * 0.22, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth   = 2;
      ctx.stroke();
    } else {
      // Dreadnought — octagon
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i;
        const r = this.width * 0.46;
        i === 0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r)
                : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      ctx.closePath();
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      // Core
      ctx.beginPath();
      ctx.arc(0, 0, this.width * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();
    }

    // HP bar
    if (this.maxHp > 1) {
      const bw = this.width * 0.8;
      const bh = 4;
      const bx = -bw / 2;
      const by = this.height * 0.48 + 6;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = this.glow;
      ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
    }

    ctx.restore();
  }
}

// ── Health Pickup ────────────────────────────────────────────
class HealthPickup {
  constructor() {
    this.width  = 28;
    this.height = 28;
    this.x      = rand(20, canvas.width - 48);
    this.y      = -40;
    this.speed  = 1.8;
    this.dead   = false;
    this.pulse  = 0;
  }
  update() {
    this.y    += this.speed;
    this.pulse = (this.pulse + 0.08) % (Math.PI * 2);
    if (this.y > canvas.height + 40) this.dead = true;
  }
  draw() {
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;
    const scale = 1 + Math.sin(this.pulse) * 0.12;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    // Glow ring
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,120,0.08)';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur  = 22;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,255,140,0.55)';
    ctx.lineWidth   = 2;
    ctx.stroke();
    // Heart emoji
    ctx.font = '20px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor  = '#ff4488';
    ctx.shadowBlur   = 14;
    ctx.fillStyle    = '#fff';
    ctx.fillText('❤️', 0, 1);
    ctx.restore();
  }
}

// Colour helpers
function lighten(hex, amount) { return shiftColor(hex, amount); }
function darken(hex, amount)  { return shiftColor(hex, -amount); }
function shiftColor(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
}

// ── Explosion helper ──────────────────────────────────────────
function spawnExplosion(particles, x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1, 5);
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 1,
      rand(2, 5),
      color,
      randInt(25, 55)
    ));
  }
}

// ── Wave manager ──────────────────────────────────────────────
class WaveManager {
  constructor() {
    this.wave      = 1;
    this.spawnTimer = 0;
    this.spawnRate  = 90; // frames between spawns
  }

  update(enemies, bullets) {
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnRate) {
      this.spawnTimer = 0;
      this._spawnEnemy(enemies);
    }
  }

  nextWave() {
    this.wave++;
    this.spawnRate = Math.max(28, 90 - this.wave * 6);
  }

  _spawnEnemy(enemies) {
    // Determine type weights based on wave
    let pool = ['scout'];
    if (this.wave >= 3) pool.push('cruiser');
    if (this.wave >= 6) pool.push('dreadnought');

    // Higher waves spawn harder enemies more often
    if (this.wave >= 3) pool.push('cruiser');
    if (this.wave >= 6) pool.push('dreadnought', 'dreadnought');

    const key  = pool[randInt(0, pool.length - 1)];
    const type = ENEMY_TYPES.find(t => t.key === key);

    const x = rand(10, canvas.width - type.width - 10);
    enemies.push(new Enemy({ ...type }, x, -type.height - 10));
  }
}

// ── Game state ────────────────────────────────────────────────
let state = 'start'; // 'start' | 'playing' | 'gameover'
let player, enemies, bullets, particles, stars, waveManager, healthPickups;
let score, waveKills, killsPerWave, frameCount, animId, healthSpawnTimer;

const KILLS_PER_WAVE = 8;

function initStars() {
  stars = [];
  for (let i = 0; i < 160; i++) stars.push(new Star());
}

function initGame() {
  player           = new Player();
  enemies          = [];
  bullets          = [];
  particles        = [];
  healthPickups    = [];
  waveManager      = new WaveManager();
  score            = 0;
  waveKills        = 0;
  killsPerWave     = KILLS_PER_WAVE;
  frameCount       = 0;
  healthSpawnTimer = 0;

  updateHUD();
  renderLives();
}

// ── HUD helpers ───────────────────────────────────────────────
function updateHUD() {
  hudScore.textContent     = score;
  hudWave.textContent      = waveManager ? waveManager.wave : 1;
  hudHighScore.textContent = getHighScore();
}

function popScore() {
  hudScore.classList.remove('pop');
  void hudScore.offsetWidth; // reflow
  hudScore.classList.add('pop');
  setTimeout(() => hudScore.classList.remove('pop'), 200);
}

function renderLives() {
  livesDisplay.innerHTML = '';
  const display = Math.max(player.lives, 3); // always show at least 3 slots
  for (let i = 0; i < display; i++) {
    const span = document.createElement('span');
    span.className = 'heart' + (i >= player.lives ? ' lost' : '');
    span.textContent = '❤️';
    livesDisplay.appendChild(span);
  }
}

// ── Screen transitions ────────────────────────────────────────
function showScreen(name) {
  startScreen.classList.remove('active');
  gameoverScreen.classList.remove('active');
  hud.classList.add('hidden');
  if (name === 'start') {
    startHsVal.textContent = getHighScore();
    startScreen.classList.add('active');
  } else if (name === 'gameover') {
    const hs = getHighScore();
    goScore.textContent     = score;
    goHighScore.textContent = hs;
    goWave.textContent      = waveManager ? waveManager.wave : 1;
    const isNew = score > 0 && score >= hs;
    newRecordBadge.classList.toggle('hidden', !isNew);
    gameoverScreen.classList.add('active');
  } else if (name === 'playing') {
    hud.classList.remove('hidden');
  }
}

// ── Core game loop ────────────────────────────────────────────
function update() {
  frameCount++;

  // Stars
  stars.forEach(s => s.update());

  if (state !== 'playing') return;

  // Player
  player.update();
  if (keys[' '] || keys['Space']) player.shoot(bullets);

  // Wave
  waveManager.update(enemies, bullets);

  // Bullets
  bullets.forEach(b => b.update());
  bullets = bullets.filter(b => !b.dead);

  // Enemies
  enemies.forEach(e => e.update(bullets));

  // Collision: player bullets ↔ enemies
  const playerBullets = bullets.filter(b => b.isPlayer);
  enemies.forEach(enemy => {
    playerBullets.forEach(bullet => {
      if (!bullet.dead && !enemy.dead && collides(bullet, enemy)) {
        bullet.dead = true;
        const killed = enemy.takeDamage(1, particles);
        if (killed) {
          score    += enemy.points;
          waveKills++;
          popScore();
          updateHUD();
          // Wave progression
          if (waveKills >= killsPerWave) {
            waveKills    = 0;
            killsPerWave = Math.min(KILLS_PER_WAVE + waveManager.wave * 2, 30);
            waveManager.nextWave();
            updateHUD();
          }
        }
      }
    });
  });

  // Collision: enemy bullets ↔ player
  const enemyBullets = bullets.filter(b => !b.isPlayer);
  enemyBullets.forEach(bullet => {
    if (!bullet.dead && !player.dead && collides(bullet, player)) {
      bullet.dead = true;
      const hit = player.takeDamage(particles);
      if (hit) renderLives();
    }
  });

  // Collision: enemies ↔ player (ramming)
  enemies.forEach(enemy => {
    if (!enemy.dead && !player.dead && collides(enemy, player)) {
      const hit = player.takeDamage(particles);
      if (hit) {
        renderLives();
        enemy.dead = true;
        spawnExplosion(particles, enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.glow, 20);
      }
    }
  });

  // Health pickups — spawn every ~600 frames
  healthSpawnTimer++;
  if (healthSpawnTimer >= 600) {
    healthSpawnTimer = 0;
    healthPickups.push(new HealthPickup());
  }
  healthPickups.forEach(h => h.update());
  healthPickups = healthPickups.filter(h => {
    if (!h.dead && collides(h, player)) {
      player.lives++;
      renderLives();
      // small green particles burst
      spawnExplosion(particles, h.x + h.width/2, h.y + h.height/2, '#00ff88', 14);
      return false; // remove pickup
    }
    return !h.dead;
  });

  // Clean up dead
  enemies   = enemies.filter(e => !e.dead);
  bullets   = bullets.filter(b => !b.dead);
  particles.forEach(p => p.update());
  particles = particles.filter(p => !p.dead);

  // Game over check
  if (player.dead) {
    const hs = getHighScore();
    if (score > hs) saveHighScore(score);
    state = 'gameover';
    showScreen('gameover');
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#05060f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  stars.forEach(s => s.draw());

  if (state !== 'playing') return;

  // Game objects
  particles.forEach(p => p.draw());
  healthPickups.forEach(h => h.draw());
  enemies.forEach(e => e.draw());
  bullets.forEach(b => b.draw());
  player.draw();
}

function gameLoop() {
  update();
  draw();
  animId = requestAnimationFrame(gameLoop);
}

// ── Button handlers ───────────────────────────────────────────
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
menuBtn.addEventListener('click', () => {
  state = 'start';
  showScreen('start');
});

function startGame() {
  initGame();
  state = 'playing';
  showScreen('playing');
  updateHUD();
}

// ── Boot ──────────────────────────────────────────────────────
initStars();
showScreen('start');
gameLoop();
