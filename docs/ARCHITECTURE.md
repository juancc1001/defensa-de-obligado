# Architecture

## Stack

| Piece | Why |
|---|---|
| **Phaser 3** | 2D game framework: scenes, sprites, tilemaps, input, tweens, audio. |
| **Vite** | Dev server with hot reload, builds to static files (`npm run build` → `dist/`). |
| **Tiled** | Free map editor. Maps are saved as `.json` and loaded by Phaser. |
| **Plain JavaScript (ES modules)** | No build step beyond Vite. |

## Core idea: content is data, behavior is reusable

Towers, enemies, items, maps and waves are **plain objects in `src/data/`**.
A small set of generic classes reads that data. Adding content means editing data, not writing new classes.

Behavior that varies is split into small **named modules** that data refers to by name:

| Registry | Used by | Examples |
|---|---|---|
| `src/effects/` | projectiles, items | `damage`, `burn`, `slow`, `explode` |
| `src/movement/` | enemies | `path` (later: `chase`) |
| `src/components/targeting.js` | weapons | `first`, `last`, `strongest`, `closest` |

So a tower that "shoots fire that slows" is just data:
`effects: [{ type: 'damage', amount: 5 }, { type: 'burn', ... }, { type: 'slow', ... }]`.

## Folder layout

```
public/assets/
  maps/          Tiled maps (.json)
  tiles/         tileset images
  sprites/       sprite images (optional, placeholders are generated otherwise)
src/
  main.js        Phaser game config
  config.js      tile size, screen size, start map
  data/          ALL game content
    enemies.js  towers.js  items.js  maps.js  sprites.js  waves/
  entities/      Phaser sprites that live in the world
    Enemy.js  Tower.js  Item.js  Projectile.js
  components/    pieces any entity can own
    Weapon.js         finds a target and fires projectiles
    StatusEffects.js  timed effects (burn, slow) on an entity
    targeting.js      target selection rules
  effects/       what happens on hit / on trigger
  movement/      how enemies move
  systems/       level-wide logic
    Level.js         loads a Tiled map, exposes paths and zones
    WaveManager.js   spawns enemies from the wave list
  scenes/
    BootScene.js   loads assets, makes placeholders
    GameScene.js   the world: map, entities, placement, win/lose
    UIScene.js     HUD on top (gold, objective hp, build buttons)
  assets/placeholders.js   colored shapes for sprites with no art yet
```

## How a frame works

```
GameScene.update
  └─ WaveManager.update  → spawns Enemy (movement.init)
Each entity's preUpdate (Phaser calls it automatically)
  ├─ Enemy:      status.update (burn ticks, slow) → movement.update, or attack the objective once it reached the end of its path
  ├─ Tower:      weapon.update → findTarget → new Projectile
  ├─ Projectile: flies to target → applyEffects(...) on arrival
  └─ Item:       enemy within radius → applyEffects(...), uses--
UIScene.update   → reads registry, redraws HUD
```

## Shared state

`GameScene` keeps game state in `this.registry` (Phaser's global data store): `gold`, `objectiveName`, `objectiveHp`, `objectiveMaxHp`, `wave`, `waves`, `building`, `result`.
`UIScene` only reads it, plus sets `building` when a build button is clicked. The two scenes don't call each other.

Entities report back to the scene with plain method calls: `scene.onEnemyKilled(enemy)`, `scene.objective.takeDamage(amount)`.

## Maps

- Tile layers: any number, drawn in order. The **topmost non-empty tile** at a cell decides its `zone`.
- `zone` is a custom property on tiles in the tileset: `build` (towers go here), `path` (items go here), or none.
- Object layer **`paths`**: polylines. Each polyline's **name** is what waves reference (`path: 'river'`).
- Object layer **`objective`**: one rectangle where the objective (the chains) is drawn. Enemies stop at the end of their path and attack it; at 0 hp the game is lost.

See [TUTORIAL.md](TUTORIAL.md) for the step-by-step.

## Planned: playable character (Vampire Survivors style)

The structure already leaves room for it. What changes:

| Need | How it fits |
|---|---|
| **Player entity** | New `entities/Player.js`: a sprite moved by keyboard input. Owns an **array of `Weapon`s**. `Weapon` already only needs `owner.x/y`, so the same weapon data used by towers works on the player. |
| **Weapon variety** (whip, aura, orbit, radial) | Add a `pattern` field to weapon data (`aimed` is today's behavior) and a small registry like `effects/`. |
| **Enemies that chase** | New `movement/chase.js` (`init` / `update`, moves toward `scene.player`). Enemy data: `movement: 'chase'`. Waves can spawn at points instead of paths. |
| **Enemies that hurt things** | Add `takeDamage` + `hp` to `Player` (and towers if wanted). Enemy contact damage becomes another effect (`{ type: 'damage' }` applied to whatever they touch). |
| **Pickups (XP, gold, power-ups)** | Same idea as `Item`: trigger on contact, but with the player instead of enemies. |
| **Bigger maps** | Tiled map larger than the screen + `camera.startFollow(player)`. UIScene already sits on its own camera, so the HUD stays fixed. |
| **Level-ups** | Data file of upgrades (`{ weapon: 'cannon', fireRate: +0.2 }`) applied to the player's weapons. |

Keep the rule: **new content = new data entry; new kind of behavior = new small module in a registry.**
