# First Aid Rush! 🩹

A tiny, fast-paced 3D endless-runner built with **Three.js / WebGL** — no build step, ready for **GitHub Pages**.

**The story:** his finger is stuck in a backpack. Push the wheelchair through the mall crowd and get him to the First Aid room — wing after wing, because somehow every First Aid room is closed.

Characters and setting are modeled on the reference video: the pusher in a black crossback tank + cream wide-leg trousers with a canvas tote (teddy charm included), the guy in a black tee on a black wheelchair, terrazzo mall floors, speckled wainscot walls, and botanical dandelion murals.

## Play

- **⬅️ ➡️ / A D** — steer
- **⬆️ / W / Shift (hold)** — sprint (more score, more risk)
- **Drag** — steer on touch devices
- **Space / R** — start / retry

Dodge shoppers, joggers, benches, kiosks, planters, and cleaning robots. Collect 🥚 eggs for points, grab first-aid kits to heal, and shave past people for near-miss bonuses. Reach the gate at the end of each wing to clear it.

## Run locally

Any static server works (ES modules need http, not file://):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "First Aid Rush"
gh repo create first-aid-rush --public --source=. --push
gh api repos/{owner}/first-aid-rush/pages -X POST -f 'source[branch]=main' -f 'source[path]=/'
```

Or via the web UI: push this folder to a repo → **Settings → Pages → Deploy from branch → main / (root)**. The game will be live at `https://<user>.github.io/<repo>/`.

Everything is static (`index.html`, `style.css`, `js/main.js`); Three.js and the Baloo 2 font load from CDNs, so there is nothing to build.

## Tech notes

- Three.js r160 via import map (jsdelivr CDN)
- All characters, props, and textures are procedural — primitives + canvas-drawn textures (terrazzo, murals, shop signs, the floral skirt). Zero asset files.
- Endless corridor from 7 recycled chunks; entities spawn in rows with a guaranteed gap.
- Soft shadows, warm hemisphere light, fog, ACES tone mapping.
- Tiny WebAudio synth for sfx + background loop (mute button bottom-right).
- Dev hook: `window.__far.step(n)` steps the simulation manually (handy for testing in backgrounded tabs where `requestAnimationFrame` is throttled); `__far.godMode = true` disables damage.
