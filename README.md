# 🚀 Space Shooter

A browser-based arcade game built with **pure HTML, CSS, and vanilla JavaScript** — no libraries, no frameworks, no game engines.

![Game Preview](https://img.shields.io/badge/Status-Playable-brightgreen) ![Tech](https://img.shields.io/badge/Tech-Vanilla%20JS%20%7C%20Canvas%20API-blueviolet)

---

## 📖 Game Description

You pilot a lone starship defending against endless waves of alien invaders. Three enemy types with increasing difficulty spawn in escalating waves. Survive as long as possible, destroy as many enemies as you can, and beat your high score!

### 🎮 Entities

| Entity | Description |
|---|---|
| **Player** | Purple spaceship controlled by keyboard. Has 3 lives. |
| **Scout** | Fast red diamond — 1 HP, 10 pts |
| **Cruiser** | Medium orange hexagon — 3 HP, 30 pts |
| **Dreadnought** | Slow purple octagon — 6 HP, 60 pts |
| **Player Bullet** | Cyan laser fired upward |
| **Enemy Bullet** | Colored plasma shot fired downward |
| **Particle** | Explosion debris on death or hit |
| **Star** | Scrolling background parallax decoration |

### 🖼️ Game Sketch (Excalidraw)

> _See `excalidraw-sketch.png` in the repo root (exported from Excalidraw planning session)_

```
┌─────────────────────────────┐
│  ★  ★     ★        ★       │
│         ◆  ⬡               │
│    ★          ⬡   ★         │
│       ◆                    │
│   |  (bullet)              │
│   ▲  (player ship)         │
│  HUD: SCORE | WAVE | LIVES │
└─────────────────────────────┘
```

---

## 🕹️ How to Play

### Controls

| Key | Action |
|---|---|
| `W` / `↑` | Move Up |
| `S` / `↓` | Move Down |
| `A` / `←` | Move Left |
| `D` / `→` | Move Right |
| `SPACE` | Shoot |

### Objective

- Destroy enemies before they pass through or ram you
- Each wave ends after a set number of kills — waves get harder
- You have **3 lives** — enemies that touch you or hit you with bullets take a life
- After losing all lives → **Game Over**

### Win / Lose

- **Lose:** All 3 lives gone → Game Over screen
- **Win:** There is no final win — it's a high-score survival game
- **High Score** is saved locally and persists between sessions

---

## ⚙️ Tech Decisions

### OOP (Object-Oriented Programming)

I chose **OOP** because:

1. Each game entity has its own **state** (position, HP, speed) and **behavior** (update, draw, shoot)
2. Classes make it easy to create many instances of the same type (e.g., `new Enemy(...)`)
3. Inheritance is clean: a `Bullet` knows if it's a player or enemy bullet via a property
4. Easier to debug — each object is self-contained

### Class Structure

```
Player      → movement, shooting, lives, invincibility
Enemy       → 3 types (scout / cruiser / dreadnought), wobble, shoot, HP
Bullet      → player or enemy, direction, glow trail
Particle    → explosion debris, gravity, alpha fade
Star        → scrolling background parallax
WaveManager → controls enemy spawn rate & wave escalation
```

### Game Loop

```js
function gameLoop() {
  update(); // move everything, check collisions
  draw();   // clear canvas, render all entities
  requestAnimationFrame(gameLoop);
}
```

### Collision Detection

AABB (Axis-Aligned Bounding Box):

```js
function collides(a, b) {
  return (
    a.x < b.x + b.width  && a.x + a.width  > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y
  );
}
```

---

## 🔗 Links

- **AI Diary:** [AI_DIARY.md](./AI_DIARY.md)
- **Live Game (GitHub Pages):** _Add after deploying to GitHub Pages_

---

## 🐛 Known Bugs / What I'd Fix Next

| Issue | Notes |
|---|---|
| Enemy bullets ignore canvas resize | Bullet position is set at spawn time |
| No sound | Would add Web Audio API sfx |
| Mobile controls missing | Would add on-screen touch buttons |
| Wave number in HUD flickers briefly | Minor re-render timing issue |
| No power-ups | Would add shield, rapid fire, triple shot |
| Enemies can stack at same X | Spawn RNG can produce overlapping enemies |

---

## 📁 File Structure

```
space-shooter/
├── index.html     ← Game entry point
├── style.css      ← All styling (no frameworks)
├── game.js        ← Full game logic (OOP, Canvas API)
├── README.md      ← This file
└── AI_DIARY.md    ← AI development log
```
