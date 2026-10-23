# Tutorial: creating maps and game elements

1. [Running the game](#running-the-game)
2. [Maps (Tiled)](#maps-tiled)
3. [Waves](#waves)
4. [Enemies](#enemies)
5. [Towers](#towers)
6. [Items](#items)
7. [Effects](#effects)
8. [Art (sprites and tilesets)](#art-sprites-and-tilesets)
9. [Checklist](#checklist)

---

## Running the game

```sh
npm install
npm run dev      # http://localhost:5173, reloads on save
npm run build    # static build in dist/
```

Controls: click a button at the bottom, then click a valid tile. Right click or `Esc` cancels.

---

## Maps (Tiled)

### Install
Download **Tiled** from https://www.mapeditor.org (free).

### Open the existing map
Open `public/assets/maps/obligado.json` in Tiled. You will see:

| Layer | Type | Purpose |
|---|---|---|
| `ground` | Tile layer | water, sand, grass, build pads |
| `decoration` | Tile layer | trees, rocks (drawn on top) |
| `paths` | Object layer | polylines enemies follow |
| `objective` | Object layer | rectangle where the chains are |

### Rules the game relies on
1. **Tile size 16×16.**
2. **Tileset embedded in the map.** Phaser can't read external `.tsx` tilesets. When creating a tileset, tick **"Embed in map"**. To fix an existing one: Tilesets panel → *Embed Tileset* button.
3. **Save as JSON** (`File → Save As → JSON map files (*.json)`) inside `public/assets/maps/`.
4. **Tile `zone` property** decides what can be placed on a cell:
   - `build` → towers can go there
   - `path` → items (chains, fire ships) can go there
   - no property → nothing can be placed
   The **topmost** non-empty tile wins, so a tree on the decoration layer blocks building on the grass under it.
5. **Object layer named `paths`** with one **polyline** per route. The polyline **name** is what waves use (`path: 'river'`). Enemies walk it from the first point to the last, then stop there and attack the chains. **End every path right next to the chains.**
6. **Object layer named `objective`** with one **rectangle** where the chains go (e.g. 1 tile wide across the river). The chain sprite is repeated to fill it.

### Set a tile's `zone`
1. In the Tilesets panel, click the tileset's *Edit Tileset* button (or select the tile directly in the embedded tileset).
2. Select the tile (e.g. the build pad).
3. In the Properties panel: `+` → name `zone`, type `string`, value `build`.

In the current tileset: tile 3 (deep water / channel) = `path`, tile 5 (build pad) = `build`.

### Create a new map
1. `File → New → New Map`: orthogonal, tile size 16×16, map size 30×17 (fits the screen; the bottom 2 rows are behind the build bar).
2. `Map → New Tileset` (not *Add External Tileset*), pick `public/assets/tiles/terrain.png`, tile size 16, tick **Embed in map**. Keep the tileset name `terrain` (or register the new name, see step 6).
3. Rename the default tile layer to `ground` and paint. Add more tile layers for decoration if you like.
4. `Layer → New → Object Layer`, name it `paths`. Pick the **Insert Polyline** tool (`L`), click the points of the route, double click / Enter to finish. In Properties set its **Name** (e.g. `north`). Add as many routes as you want.
   Then add another Object Layer named `objective`, pick **Insert Rectangle** (`R`) and draw the chains' rectangle across the river where the paths end.
5. Save as `public/assets/maps/my-map.json`.
6. Register it in `src/data/maps.js`:
   ```js
   import myMapWaves from './waves/my-map.js';

   export const maps = {
     // ...
     myMap: {
       name: 'My map',
       file: 'assets/maps/my-map.json',
       tilesets: { terrain: 'assets/tiles/terrain.png' }, // Tiled tileset name -> image
       waves: myMapWaves,
       gold: 150,
       objective: { name: 'Chains', sprite: 'chains', hp: 100 }, // lose when hp reaches 0
     },
   };
   ```
7. It shows up in the level selector (Jugar → Elegí un nivel).

---

## Waves

One file per map in `src/data/waves/`:

```js
export default [
  {
    wait: 5,                  // seconds before this wave (after the previous one finished spawning)
    spawns: [
      { enemy: 'brig', count: 6, interval: 1.5, path: 'river' },
      { enemy: 'steamer', count: 2, interval: 4, path: 'north', delay: 3 }, // starts 3s into the wave
    ],
  },
  // next wave...
];
```

- `enemy`: key in `src/data/enemies.js`
- `path`: polyline name in the map's `paths` layer
- Several groups in one wave run at the same time (use `delay` to stagger them).

---

## Enemies

Add an entry to `src/data/enemies.js`:

```js
corvette: {
  name: 'Corvette',
  sprite: 'corvette',   // image key; a placeholder is drawn if there's no art yet
  hp: 120,
  speed: 18,            // pixels per second
  armor: 2,             // subtracted from each hit (min 1 damage). Burn ignores armor.
  reward: 15,           // gold when killed
  damage: 2,            // damage per second to the chains once it reaches them
  movement: 'path',     // see src/movement/
},
```

Then use it in a wave: `{ enemy: 'corvette', count: 4, interval: 2, path: 'river' }`.

---

## Towers

Add an entry to `src/data/towers.js`:

```js
mortar: {
  name: 'Mortar',
  sprite: 'mortar',
  cost: 120,
  placeOn: 'build',           // tile zone where it can be built
  weapon: {
    range: 100,               // pixels
    fireRate: 0.4,            // shots per second
    targeting: 'strongest',   // first | last | strongest | closest
    projectile: {
      sprite: 'shell',
      speed: 90,
      effects: [
        { type: 'explode', amount: 40, radius: 30 },
      ],
    },
  },
},
```

It appears automatically in the build bar.

---

## Items

Allied things placed on the map that react when an enemy comes close. Add to `src/data/items.js`:

```js
mine: {
  name: 'Mine',
  sprite: 'mine',
  cost: 40,
  placeOn: 'path',        // tile zone where it can be placed
  radius: 10,             // trigger distance in pixels
  uses: 1,                // triggers before it disappears (once per enemy)
  effects: [{ type: 'explode', amount: 80, radius: 25 }],
},
```

It appears automatically in the build bar.

---

## Effects

Effects are what towers' projectiles and items do. Available:

| type | params | does |
|---|---|---|
| `damage` | `amount` | direct damage (armor applies) |
| `burn` | `dps`, `duration` | damage over time, ignores armor, tints orange |
| `slow` | `factor`, `duration` | speed × factor, tints blue |
| `explode` | `amount`, `radius` | damage to every enemy in the radius |

### Write a new effect
1. Create `src/effects/poison.js`:
   ```js
   // Instant effect: only `apply`.
   // Status effect (lasts `duration`): `apply` calls target.status.add, plus `tick` and/or `speedMultiplier`.
   export default {
     tint: 0x66ff66,

     apply(scene, target, params) {
       target?.status.add('poison', params);
     },

     tick(target, dt, { dps }) {
       target.takeDamage(dps * dt, true);
     },
   };
   ```
   `apply(scene, target, params, ctx)` gets: the hit enemy (may be `null`), the params from data, and `ctx = { x, y, source }` where it happened.
2. Register it in `src/effects/index.js`: `export const effects = { damage, burn, slow, explode, poison };`
3. Use it in data: `{ type: 'poison', dps: 5, duration: 6 }`.

---

## Art (sprites and tilesets)

**Sprites.** Every `sprite` key in data gets a generated colored shape until real art exists. To use real art:
1. Put the PNG in `public/assets/sprites/` (e.g. `brig.png`). Ships should face **right**, since enemies rotate toward where they move.
2. Register it in `src/data/sprites.js`: `brig: 'assets/sprites/brig.png'`.

**Tilesets.** `public/assets/tiles/terrain.png` is a placeholder (4×2 tiles of 16px). You can redraw it keeping the same layout and every map updates. If you add tiles, also update the tileset in Tiled (it re-reads the image) and set `zone` on the new tiles.

Free art to start: https://kenney.nl (Tower Defense, Pirate Pack), https://opengameart.org.

---

## Checklist

| I want to add… | Edit |
|---|---|
| a map | Tiled → `public/assets/maps/*.json`, `src/data/maps.js`, a waves file |
| a wave | `src/data/waves/<map>.js` |
| an enemy | `src/data/enemies.js` (+ use it in a wave) |
| a tower | `src/data/towers.js` |
| an item | `src/data/items.js` |
| a new behavior on hit | `src/effects/<name>.js` + `src/effects/index.js` |
| a new way of moving | `src/movement/<name>.js` + `src/movement/index.js` |
| real art | `public/assets/sprites/` + `src/data/sprites.js` |
