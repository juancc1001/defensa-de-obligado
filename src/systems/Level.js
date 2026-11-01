import Phaser from 'phaser';
import { TILE } from '../config.js';
import { terrain } from '../data/terrain.js';

// Builds a map: draws every tile layer and works out the enemy routes and the objective.
// Two styles are supported:
// - Hand-drawn (Tiled): `paths` object layer with polylines, `objective` object layer with a rectangle.
// - Map editor: `entities` object layer with `spawn` points and `objective` points (the chains).
//   Each spawn becomes a route along the river from just outside the map to the nearest chains.
export default class Level {
  constructor(scene, mapId) {
    this.map = scene.make.tilemap({ key: mapId });
    const tilesets = this.map.tilesets.map((ts) => this.map.addTilesetImage(ts.name, ts.name));
    // The `overlay` layer (map editor's "Superponer") is drawn above ships and towers.
    for (const layer of this.map.layers) {
      const created = this.map.createLayer(layer.name, tilesets);
      if (layer.name === 'overlay') created.setDepth(5);
    }

    this.paths = {};
    for (const obj of this.map.getObjectLayer('paths')?.objects ?? []) {
      const [first, ...rest] = obj.polyline;
      const path = new Phaser.Curves.Path(obj.x + first.x, obj.y + first.y);
      for (const p of rest) path.lineTo(obj.x + p.x, obj.y + p.y);
      this.paths[obj.name] = path;
    }

    // Pre-placed towers and ships are read by GameScene.
    this.entities = this.map.getObjectLayer('entities')?.objects ?? [];
    const chains = this.entities.filter((o) => o.type === 'objective');
    if (chains.length) {
      this.objectiveRects = chains.map((c) => ({ x: c.x - TILE / 2, y: c.y - TILE / 2, width: TILE, height: TILE }));
      for (const spawn of this.entities.filter((o) => o.type === 'spawn')) {
        this.paths[spawn.name] = this.riverRoute(cellOf(spawn), chains.map(cellOf));
      }
    } else {
      this.objectiveRects = this.map.getObjectLayer('objective').objects;
    }
  }

  // Shortest route over river tiles (zone 'path') to the nearest chains, ending on the tile before them.
  // A spawn on the map edge starts one tile outside, so enemies sail in.
  riverRoute(start, goals) {
    const key = (c) => `${c.x},${c.y}`;
    const isGoal = (c) => goals.some((g) => key(g) === key(c));
    const prev = new Map([[key(start), null]]);
    const queue = [start];
    let goal = null;
    while (queue.length) {
      const c = queue.shift();
      if (isGoal(c)) {
        goal = c;
        break;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: c.x + dx, y: c.y + dy };
        if (prev.has(key(n))) continue;
        if (!isGoal(n) && this.zoneAt(n.x, n.y) !== 'path') continue;
        prev.set(key(n), c);
        queue.push(n);
      }
    }
    if (!goal) throw new Error(`No river route from spawn at ${key(start)} to the chains`);

    const cells = [];
    for (let c = prev.get(key(goal)); c; c = prev.get(key(c))) cells.unshift(c);
    if (start.x === 0) cells.unshift({ x: -1, y: start.y });
    else if (start.x === this.map.width - 1) cells.unshift({ x: this.map.width, y: start.y });
    else if (start.y === 0) cells.unshift({ x: start.x, y: -1 });
    else if (start.y === this.map.height - 1) cells.unshift({ x: start.x, y: this.map.height });

    const center = (c) => [c.x * TILE + TILE / 2, c.y * TILE + TILE / 2];
    const path = new Phaser.Curves.Path(...center(cells[0]));
    for (const c of cells.slice(1)) path.lineTo(...center(c));
    return path;
  }

  // Zone of the topmost tile at that cell ('build', 'path' or null), from src/data/terrain.json.
  // The overlay doesn't change zones: an Escudo over the river is still river.
  zoneAt(tx, ty) {
    return this.terrainAt(tx, ty, this.map.layers.filter((l) => l.name !== 'overlay'))?.zone ?? null;
  }

  coverAt(tx, ty) {
    return this.map.layers.some((l) => this.terrainAt(tx, ty, [l])?.cover);
  }

  terrainAt(tx, ty, layers) {
    for (const layer of [...layers].reverse()) {
      const tile = this.map.getTileAt(tx, ty, false, layer.name);
      if (tile) {
        const id = tile.index - tile.tileset.firstgid;
        return Object.values(terrain).find((t) => t.tile === id);
      }
    }
    return null;
  }
}

function cellOf(obj) {
  return { x: Math.floor(obj.x / TILE), y: Math.floor(obj.y / TILE) };
}
