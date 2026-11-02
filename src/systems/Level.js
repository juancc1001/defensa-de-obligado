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
    this.spawns = {};
    if (chains.length) {
      this.objectiveRects = chains.map((c) => ({ x: c.x - TILE / 2, y: c.y - TILE / 2, width: TILE, height: TILE }));
      this.chainCells = chains.map(cellOf);
      for (const spawn of this.entities.filter((o) => o.type === 'spawn')) {
        this.spawns[spawn.name] = cellOf(spawn);
        this.paths[spawn.name] = this.riverRoute(cellOf(spawn), this.chainCells);
      }
    } else {
      this.objectiveRects = this.map.getObjectLayer('objective').objects;
    }
  }

  // Route for a new enemy: spawn routes are rebuilt each time so every ship takes its own line.
  path(name) {
    const spawn = this.spawns[name];
    return spawn ? this.riverRoute(spawn, this.chainCells) : this.paths[name];
  }

  // Route over river tiles (zone 'path') to the chains, ending on the tile before them.
  // Each step costs a random 1-3, so on wide stretches the route drifts between lanes instead of going straight.
  // A spawn on the map edge starts one tile outside, so enemies sail in.
  riverRoute(start, goals) {
    const key = (c) => `${c.x},${c.y}`;
    const isGoal = (c) => goals.some((g) => key(g) === key(c));
    const cost = new Map([[key(start), 0]]);
    const prev = new Map([[key(start), null]]);
    const open = [start];
    let goal = null;
    while (open.length) {
      let i = 0;
      for (let j = 1; j < open.length; j++) if (cost.get(key(open[j])) < cost.get(key(open[i]))) i = j;
      const [c] = open.splice(i, 1);
      if (isGoal(c)) {
        goal = c;
        break;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: c.x + dx, y: c.y + dy };
        if (!isGoal(n) && this.zoneAt(n.x, n.y) !== 'path') continue;
        const d = cost.get(key(c)) + 1 + Math.random() * 2;
        if (cost.has(key(n)) && cost.get(key(n)) <= d) continue;
        if (!cost.has(key(n))) open.push(n);
        cost.set(key(n), d);
        prev.set(key(n), c);
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
