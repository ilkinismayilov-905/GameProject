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
    this.baseSpeed = 11; // increased default speed for faster movement
    this.lives  = 3;
    this.score  = 0;
    this.shootCooldown   = 0;
    this.shootDelay      = 9;  // reduced cooldown for faster default shooting
    this.invincible      = 0;  // invincibility frames after hit
    this.thrusterFlicker = 0;
    this.dead   = false;
    // Power-up states
    this.tripleShot  = 0; // frames remaining
    this.rapidFire   = 0; // frames remaining
    this.speedBoost  = 0; // frames remaining for speed boost
    this.shield      = false;
  }

  update() {
    // Movement
    const moveX = (keys['ArrowLeft']  || keys['a'] || keys['A']) ? -1
                : (keys['ArrowRight'] || keys['d'] || keys['D']) ?  1 : 0;
    const moveY = (keys['ArrowUp']    || keys['w'] || keys['W']) ? -1
                : (keys['ArrowDown']  || keys['s'] || keys['S']) ?  1 : 0;

    const speed = this.speedBoost > 0 ? 17 : this.baseSpeed;
    this.x += moveX * speed;
    this.y += moveY * speed * 0.6;

    // Clamp to canvas
    this.x = Math.max(0, Math.min(canvas.width  - this.width,  this.x));
    this.y = Math.max(canvas.height * 0.4, Math.min(canvas.height - this.height - 10, this.y));

    // Shooting
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.invincible    > 0) this.invincible--;
    if (this.tripleShot    > 0) this.tripleShot--;
    if (this.rapidFire     > 0) this.rapidFire--;
    if (this.speedBoost    > 0) this.speedBoost--;
    this.thrusterFlicker = (this.thrusterFlicker + 1) % 6;
  }

  shoot(bullets) {
    if (this.shootCooldown > 0) return;
    const cx = this.x + this.width / 2;
    const delay = this.rapidFire > 0 ? Math.max(2, Math.floor(this.shootDelay / 2)) : this.shootDelay;
    if (this.tripleShot > 0) {
      // Center + two angled bullets
      bullets.push(new Bullet(cx,      this.y - 4, -16,   '#00e5ff', true));
      bullets.push(new Bullet(cx - 14, this.y + 4, -15.5, '#a78bfa', true));
      bullets.push(new Bullet(cx + 14, this.y + 4, -15.5, '#a78bfa', true));
    } else {
      bullets.push(new Bullet(cx, this.y - 4, -16, '#00e5ff', true));
    }
    this.shootCooldown = delay;
  }

  takeDamage(particles) {
    if (this.invincible > 0) return false;
    if (this.shield) {
      this.shield = false;
      this.invincible = 60;
      spawnExplosion(particles, this.x + this.width / 2, this.y + this.height / 2, '#60a5fa', 14);
      renderPowerupHUD();
      return true;
    }
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

    // --- Dynamic colors based on active power-up ---
    let primaryColor   = '#7b2fff'; // default purple
    let secondaryColor = '#b07cff';
    let darkColor      = '#3a007a';
    let glowColor      = '#00e5ff'; // default cyan cockpit

    if (this.shield) {
      primaryColor   = '#2563eb';
      secondaryColor = '#60a5fa';
      darkColor      = '#1e3a8a';
      glowColor      = '#93c5fd';
    } else if (this.tripleShot > 0) {
      primaryColor   = '#7c3aed';
      secondaryColor = '#a78bfa';
      darkColor      = '#4c1d95';
      glowColor      = '#c084fc';
    } else if (this.rapidFire > 0) {
      primaryColor   = '#d97706';
      secondaryColor = '#facc15';
      darkColor      = '#78350f';
      glowColor      = '#fef08a';
    } else if (this.speedBoost > 0) {
      primaryColor   = '#e11d48';
      secondaryColor = '#f43f5e';
      darkColor      = '#4c0519';
      glowColor      = '#fda4af';
    }

    // --- Thruster flame ---
    const flicker = this.thrusterFlicker < 3 ? 1 : 0.75;
    const flameH  = (this.speedBoost > 0 ? 32 : 20) * flicker;
    const thrustGrad = ctx.createLinearGradient(0, 22, 0, 22 + flameH);
    thrustGrad.addColorStop(0, secondaryColor);
    thrustGrad.addColorStop(0.5, primaryColor);
    thrustGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.moveTo(-10, 22);
    ctx.lineTo( 10, 22);
    ctx.lineTo(  0, 22 + flameH);
    ctx.closePath();
    ctx.fillStyle = thrustGrad;
    ctx.shadowColor = secondaryColor;
    ctx.shadowBlur  = 20;
    ctx.fill();

    // --- Ship body ---
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur  = 22;

    // Hull gradient
    const bodyGrad = ctx.createLinearGradient(-24, -28, 24, 28);
    bodyGrad.addColorStop(0,   secondaryColor);
    bodyGrad.addColorStop(0.5, primaryColor);
    bodyGrad.addColorStop(1,   darkColor);

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
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur  = 14;
    ctx.fill();
    ctx.strokeStyle = glowColor;
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

// ── Power-up definitions ──────────────────────────────────────
const POWERUP_TYPES = [
  {
    key:       'health',
    emoji:     '❤️',
    ringColor: '#00ff88',
    ringFill:  'rgba(0,255,120,0.08)',
    ringStroke:'rgba(0,255,140,0.55)',
    glowColor: '#ff4488',
    label:     '+1 LIFE',
  },
  {
    key:       'triple',
    emoji:     '🔱',
    ringColor: '#a78bfa',
    ringFill:  'rgba(167,139,250,0.10)',
    ringStroke:'rgba(167,139,250,0.60)',
    glowColor: '#7c3aed',
    label:     'TRIPLE SHOT',
  },
  {
    key:       'rapid',
    emoji:     '⚡',
    ringColor: '#facc15',
    ringFill:  'rgba(250,204,21,0.10)',
    ringStroke:'rgba(250,204,21,0.55)',
    glowColor: '#d97706',
    label:     'RAPID FIRE',
  },
  {
    key:       'shield',
    emoji:     '🛡️',
    ringColor: '#60a5fa',
    ringFill:  'rgba(96,165,250,0.10)',
    ringStroke:'rgba(96,165,250,0.55)',
    glowColor: '#1d4ed8',
    label:     'SHIELD',
  },
  {
    key:       'speed',
    emoji:     '🚀',
    ringColor: '#f43f5e',
    ringFill:  'rgba(244,63,94,0.10)',
    ringStroke:'rgba(244,63,94,0.55)',
    glowColor: '#be123c',
    label:     'SPEED BOOST',
  },
];

class PowerUp {
  constructor() {
    this.type   = POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)];
    this.width  = 32;
    this.height = 32;
    this.x      = rand(24, canvas.width - 56);
    this.y      = -50;
    this.speed  = 1.6;
    this.dead   = false;
    this.pulse  = rand(0, Math.PI * 2);
    this.angle  = 0;
  }
  update() {
    this.y     += this.speed;
    this.pulse  = (this.pulse + 0.07) % (Math.PI * 2);
    this.angle += 0.02;
    if (this.y > canvas.height + 50) this.dead = true;
  }
  draw() {
    const t  = this.type;
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;
    const sc = 1 + Math.sin(this.pulse) * 0.13;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);

    // Rotating outer glow ring
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle   = t.ringFill;
    ctx.shadowColor = t.ringColor;
    ctx.shadowBlur  = 26;
    ctx.fill();
    ctx.strokeStyle = t.ringStroke;
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    // Dashed spinning ring
    ctx.save();
    ctx.rotate(this.angle);
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.strokeStyle = t.ringColor;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.restore();

    // Emoji — perfectly centered
    ctx.font         = '18px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor  = t.glowColor;
    ctx.shadowBlur   = 16;
    ctx.globalAlpha  = 1;
    ctx.fillText(t.emoji, 0, 0);

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
let player, enemies, bullets, particles, stars, waveManager, powerups;
let score, waveKills, killsPerWave, frameCount, animId, powerupSpawnTimer;

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
  powerups         = [];
  waveManager      = new WaveManager();
  score            = 0;
  waveKills        = 0;
  killsPerWave     = KILLS_PER_WAVE;
  frameCount       = 0;
  powerupSpawnTimer = 0;

  updateHUD();
  renderLives();
  renderPowerupHUD();
}

// ── HUD helpers ───────────────────────────────────────────────
const powerupHUD = document.getElementById('powerup-hud');

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

function renderPowerupHUD() {
  if (!powerupHUD || !player) return;
  const items = [];
  if (player.shield)             items.push({ emoji: '🛡️', label: 'SHIELD',       color: '#60a5fa' });
  if (player.tripleShot > 0)     items.push({ emoji: '🔱', label: 'TRIPLE',       color: '#a78bfa', frames: player.tripleShot });
  if (player.rapidFire  > 0)     items.push({ emoji: '⚡', label: 'RAPID',        color: '#facc15', frames: player.rapidFire  });
  if (player.speedBoost > 0)     items.push({ emoji: '🚀', label: 'SPEED',        color: '#f43f5e', frames: player.speedBoost });
  powerupHUD.innerHTML = items.map(it => {
    const secs = it.frames ? Math.ceil(it.frames / 60) + 's' : '';
    return `<span class="pup-badge" style="border-color:${it.color};color:${it.color}">${it.emoji} ${it.label}${secs ? ' ' + secs : ''}</span>`;
  }).join('');
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

  // Power-ups — spawn every ~500 frames, chance weighted by wave
  powerupSpawnTimer++;
  const spawnInterval = Math.max(280, 500 - waveManager.wave * 15);
  if (powerupSpawnTimer >= spawnInterval) {
    powerupSpawnTimer = 0;
    powerups.push(new PowerUp());
  }
  powerups.forEach(p => p.update());
  powerups = powerups.filter(p => {
    if (!p.dead && collides(p, player)) {
      const key = p.type.key;
      const cx  = p.x + p.width  / 2;
      const cy  = p.y + p.height / 2;
      if (key === 'health') {
        player.lives++;
        renderLives();
        spawnExplosion(particles, cx, cy, '#00ff88', 14);
      } else if (key === 'triple') {
        player.tripleShot = 480; // 8 seconds
        spawnExplosion(particles, cx, cy, '#a78bfa', 14);
      } else if (key === 'rapid') {
        player.rapidFire = 480;
        spawnExplosion(particles, cx, cy, '#facc15', 14);
      } else if (key === 'shield') {
        player.shield = true;
        spawnExplosion(particles, cx, cy, '#60a5fa', 14);
      } else if (key === 'speed') {
        player.speedBoost = 480; // 8 seconds
        spawnExplosion(particles, cx, cy, '#f43f5e', 14);
      }
      renderPowerupHUD();
      return false;
    }
    return !p.dead;
  });

  // Tick powerup HUD every 60 frames
  if (frameCount % 60 === 0) renderPowerupHUD();

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
  powerups.forEach(p => p.draw());
  enemies.forEach(e => e.draw());
  bullets.forEach(b => b.draw());
  player.draw();

  // Shield aura around player when active
  if (player && player.shield) {
    const cx = player.x + player.width  / 2;
    const cy = player.y + player.height / 2;
    const r  = 34 + Math.sin(frameCount * 0.08) * 4;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur  = 18;
    ctx.globalAlpha = 0.55 + Math.sin(frameCount * 0.1) * 0.15;
    ctx.stroke();
    ctx.restore();
  }
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
