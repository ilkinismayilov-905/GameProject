# AI Development Diary — Space Shooter

## Tools Used

**Primary AI:** Google Gemini (Antigravity / Gemini 2.5 Pro)

**Why this tool?**
- Free to use, no credit card required
- Strong code generation for vanilla JS / Canvas API
- Good at explaining concepts like game loops and collision detection

---

## Diary Entries

### [2026-05-25] - Canvas roundRect() not supported in older browsers

**What I asked the AI:** Draw a glowing bullet shape on the canvas with rounded corners.

**What it gave me:**
```js
ctx.roundRect(x, y, width, height, radius);
```

**What was wrong:** `roundRect()` is not available in Firefox versions before 112 and Safari before 15.4. The game threw `TypeError: ctx.roundRect is not a function` when opened in an older browser.

**How I fixed it:** Added a polyfill fallback:
```js
if (!ctx.roundRect) {
  ctx.beginPath();
  ctx.arc(x + width/2, y + height/2, width/2, 0, Math.PI * 2);
}
```
Then switched to a simple `arc()` for bullets to avoid the issue entirely.

**Time lost:** ~15 minutes

---

### [2026-05-25] - Enemy wobble caused them to go off-screen permanently

**What I asked the AI:** Make enemies move in a sine-wave pattern horizontally as they descend.

**What it gave me:**
```js
this.x += Math.sin(this.angle) * this.wobbleAmp;
this.angle += this.wobbleSpeed;
```

**What was wrong:** The AI used `+=` on `this.x` instead of calculating from the original `startX`. After a few seconds, enemies drifted far off the left or right side of the canvas and never came back. Collisions stopped working.

**How I fixed it:** Stored the original spawn X in `this.startX` and recalculated each frame:
```js
this.x = this.startX + Math.sin(this.angle) * this.wobbleAmp;
```

**Time lost:** ~20 minutes

---

### [2026-05-25] - Shooting cooldown ignored, player could rapid-fire infinitely

**What I asked the AI:** Implement a shooting cooldown so the player can't spam bullets.

**What it gave me:**
```js
if (keys[' ']) player.shoot(bullets);
```
Without any cooldown decrement in the update loop.

**What was wrong:** The `shootCooldown` variable was decremented inside `shoot()` but never decremented per frame. So it stayed at 14 forever once set, blocking all future shots.

**How I fixed it:** Added `if (this.shootCooldown > 0) this.shootCooldown--;` inside `Player.update()`, not inside `shoot()`.

**Time lost:** ~10 minutes

---

### [2026-05-25] - Game Over screen appeared before player death animation finished

**What I asked the AI:** Transition to the game over screen when the player runs out of lives.

**What it gave me:** Check `player.lives <= 0` directly inside the collision handler and immediately call `showScreen('gameover')`.

**What was wrong:** The transition happened mid-frame, while the draw loop was still executing. This caused the canvas to freeze on a half-drawn frame and the explosion particles never appeared.

**How I fixed it:** Set a `player.dead = true` flag inside `takeDamage()`, then check the flag at the **end** of `update()` after all draw calls are complete for that frame:
```js
if (player.dead) {
  saveHighScore(score);
  state = 'gameover';
  showScreen('gameover');
}
```

**Time lost:** ~25 minutes

---

### [2026-05-25] - Stars disappeared after canvas resize

**What I asked the AI:** Make the canvas fill the full window and respond to resizing.

**What it gave me:**
```js
window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});
```

**What was wrong:** Resizing the canvas clears it AND resets the 2D context state (transforms, shadows, etc.). Stars that had `x` positions beyond the new width became invisible. Also, all `ctx.shadowColor` settings were wiped on resize.

**How I fixed it:**
1. Created a `resizeCanvas()` function and also called it once on boot.
2. Stars' `reset()` uses `canvas.width` dynamically, so they redistribute over time.
3. All draw methods set their own `ctx.shadow*` values each frame — no global state assumed.

**Time lost:** ~30 minutes

---

### [2026-05-25] - High score not updating on the start screen after a game

**What I asked the AI:** Show the high score on both the start screen and game over screen.

**What it gave me:** Set `startHsVal.textContent = getHighScore()` only once at page load.

**What was wrong:** After playing a game and returning to the menu, the start screen showed the old high score (0) because `localStorage` had been updated but the DOM element was not refreshed.

**How I fixed it:** Called `startHsVal.textContent = getHighScore()` inside `showScreen('start')` every time the start screen is shown, not just at boot.

**Time lost:** ~8 minutes

---

## Summary

Total issues caught and fixed: **6**
Total time lost to AI mistakes: **~108 minutes**

The AI was very helpful for boilerplate and structure, but required careful review for:
- Canvas API compatibility
- Mutable state bugs (using `+=` vs absolute recalculation)
- Frame-order logic (when to check game state vs. when to render)
- DOM update timing
