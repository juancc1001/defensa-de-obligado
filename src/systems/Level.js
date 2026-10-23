import Phaser from 'phaser';
import { TILE } from '../config.js';
import { terrain } from '../data/terrain.js';

// Builds a map: draws every tile layer and works out the enemy routes and the objective.
// Two styles are supported:
// - Hand-drawn (Tiled): `paths` object layer with polylines, `objective` object layer with a rectangle.
// - Map editor: `entities` object layer with `spawn` points and one `objective` point (the chains).
//   Each spawn becomes a route along the river from just outside the map to the chains.
export default class Level {
  constructor(scene, mapId) {
    this.map = scene.make.tilemap({ key: mapId });
    const tilesets = this.map.tilesets.map((ts) => this.map.addTilesetImage(ts.name, ts.name));
    for (const layer of this.map.layers) {
      this.map.createLayer(layer.name, tilesets);
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
    const chains = this.entities.find((o) => o.type === 'objective');
    if (chains) {
      this.objectiveRect = { x: chains.x - TILE / 2, y: chains.y - TILE / 2, width: TILE, height: TILE };
      for (const spawn of this.entities.filter((o) => o.type === 'spawn')) {
        this.paths[spawn.name] = this.riverRoute(cellOf(spawn), cellOf(chains));
      }
    } else {
      this.objectiveRect = this.map.getObjectLayer('objective').objects[0];
    }
  }

  // Shortest route over river tiles (zone 'path'), ending on the tile before the chains.
  // A spawn on the map edge starts one tile outside, so enemies sail in.
  riverRoute(start, goal) {
    const key = (c) => `${c.x},${c.y}`;
    const prev = new Map([[key(start), null]]);
    const queue = [start];
    while (queue.length) {
      const c = queue.shift();
      if (key(c) === key(goal)) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: c.x + dx, y: c.y + dy };
        if (prev.has(key(n))) continue;
        if (key(n) !== key(goal) && this.zoneAt(n.x, n.y) !== 'path') continue;
        prev.set(key(n), c);
        queue.push(n);
      }
    }
    if (!prev.has(key(goal))) throw new Error(`No river route from spawn at ${key(start)} to the chains`);

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
  zoneAt(tx, ty) {
    for (const layer of [...this.map.layers].reverse()) {
      const tile = this.map.getTileAt(tx, ty, false, layer.name);
      if (tile) {
        const id = tile.index - tile.tileset.firstgid;
        return Object.values(terrain).find((t) => t.tile === id)?.zone ?? null;
      }
    }
    return null;
  }
}

function cellOf(obj) {
  return { x: Math.floor(obj.x / TILE), y: Math.floor(obj.y / TILE) };
}
