# Copilot Instructions

## Repository overview

This is a dependency-free browser game called **Skybound Runner**. It is intentionally a small static site:

- `index.html` defines the Japanese game shell, HUD, controls, canvas, and end-state overlay.
- `style.css` provides the responsive presentation layer and visual theme. The canvas keeps a 960x540 internal coordinate system and is scaled by CSS.
- `script.js` contains the complete game runtime: level data, input handling, physics, collisions, camera movement, rendering, particles, HUD updates, and win/lose state transitions.

The HTML is the integration point: keep the element IDs used by `script.js` (`game`, `coin-count`, `life-count`, `message`, `message-title`, and `restart-button`) in sync with any markup changes.

## Commands

There is no `package.json`, build system, test runner, or lint configuration. The game runs directly in a browser.

```sh
# Check the JavaScript file for syntax errors
node --check script.js

# Serve the repository locally (recommended instead of opening file:// directly)
python3 -m http.server 8000
```

Open `http://localhost:8000/` after starting the server. There are currently no automated tests or single-test selectors; validate gameplay changes manually in a browser and use `node --check script.js` for the standalone JavaScript syntax check.

## Architecture and gameplay flow

- `level` is the source of truth for static world content. Platforms, coins, and enemies use world coordinates in a 3600px-wide world.
- `player` is the mutable player state. `gameState` is `"playing"`, `"over"`, or `"clear"`.
- `requestAnimationFrame(loop)` drives the game. Each frame computes a capped delta, calls `update(dt)`, then calls `draw()`.
- `update()` applies keyboard input, gravity, movement, platform landing, coin collection, enemy patrol/collision, damage, particles, camera smoothing, and the goal check.
- `draw()` renders the gradient background and all world objects on the canvas after translating by `cameraX`.
- DOM updates are limited to the HUD and the overlay. `reset()` restores mutable level/player state and is shared by the `R` key and restart button.

## Codebase-specific conventions

- Keep gameplay coordinates in the canvas/world coordinate system; use CSS only for presentation scaling.
- Add or tune level content in `level.platforms`, `level.coins`, and `level.enemies` rather than scattering coordinates through update/render logic.
- When adding mutable level state, reset it in `reset()` so restarting produces a fresh run.
- Use the existing `overlap()` helper for rectangle collisions and `burst()` for short-lived visual effects.
- Preserve the frame-loop pattern and the `dt`-based movement values so gameplay speed is not tied directly to the monitor refresh rate.
- Update the HUD through `updateHud()` whenever lives or coins change; do not write those counters independently in collision code.
- Keep keyboard behavior in the existing `keydown`/`keyup` listeners and prevent default browser scrolling for movement keys.
- Keep UI text and player-facing instructions in Japanese unless the feature explicitly requires another language.
- Explanations and user-facing descriptions should be written in Japanese.
- The stylesheet uses a dark theme, CSS custom properties, and responsive rules below 620px. Reuse those variables and existing layout classes before introducing new visual patterns.
- Avoid adding runtime dependencies or a build step unless the project is intentionally being migrated from its current static setup.
