import Phaser from 'phaser';
import { TILE } from '../config.js';
import { maps } from '../data/maps.js';
import Level from '../systems/Level.js';
import WaveManager from '../systems/WaveManager.js';
import Tower from '../entities/Tower.js';
import Item from '../entities/Item.js';
import Objective from '../entities/Objective.js';

// Shared state lives in this.registry so UIScene can read it:
// gold, objectiveHp, wave, waves, building ({ kind, id, def } or null), result ('win' | 'lose' | null).
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create({ mapId }) {
    const def = maps[mapId].level;
    this.mapId = mapId;
    this.level = new Level(this, mapId);
    // Zoom so the whole map fits the window, whatever its size.
    const { widthInPixels: w, heightInPixels: h } = this.level.map;
    this.cameras.main.setZoom(Math.min(this.scale.width / w, this.scale.height / h)).centerOn(w / 2, h / 2);
    this.objective = new Objective(this, this.level.objectiveRect, def.objective);
    this.enemies = this.add.group();
    this.occupied = new Map();
    for (const obj of this.level.entities) {
      if (obj.type === 'tower') this.place(Tower, obj.name, Math.floor(obj.x / TILE), Math.floor(obj.y / TILE));
      if (obj.type === 'ship') this.place(Item, obj.name, Math.floor(obj.x / TILE), Math.floor(obj.y / TILE));
    }
    this.waves = new WaveManager(this, def.waves, this.level.paths);

    this.registry.set({
      gold: def.gold,
      objectiveName: def.objective.name,
      objectiveHp: def.objective.hp,
      objectiveMaxHp: def.objective.hp,
      wave: 0,
      waves: def.waves.length,
      building: null,
      result: null,
    });

    this.ghost = this.add.image(0, 0, '__DEFAULT').setAlpha(0.6).setDepth(10).setVisible(false);
    this.input.mouse.disableContextMenu();
    this.input.on('pointermove', (p) => this.updateGhost(p));
    this.input.on('pointerdown', (p) => this.onPointerDown(p));
    this.input.keyboard.on('keydown-ESC', () => this.registry.set('building', null));

    this.scene.launch('UI');
  }

  update(time, delta) {
    this.waves.update(delta / 1000);

    if (this.objective.hp <= 0) this.finish('lose');
    else if (this.waves.done && this.enemies.countActive() === 0) this.finish('win');
  }

  finish(result) {
    this.registry.set('result', result);
    this.scene.pause();
  }

  onEnemyKilled(enemy) {
    this.registry.inc('gold', enemy.def.reward);
  }

  // --- Building towers and items ---

  updateGhost(pointer) {
    const building = this.registry.get('building');
    if (!building) {
      this.ghost.setVisible(false);
      return;
    }
    const { tx, ty, x, y } = this.tileAt(pointer);
    this.ghost
      .setTexture(building.def.sprite)
      .setPosition(x, y)
      .setTint(this.canPlace(building, tx, ty) ? 0xffffff : 0xff0000)
      .setVisible(true);
  }

  onPointerDown(pointer) {
    const building = this.registry.get('building');
    if (pointer.rightButtonDown()) {
      this.registry.set('building', null);
      this.ghost.setVisible(false);
      return;
    }
    if (!building) return;

    const { tx, ty } = this.tileAt(pointer);
    if (!this.canPlace(building, tx, ty)) return;

    this.place(building.kind === 'tower' ? Tower : Item, building.id, tx, ty);
    this.registry.inc('gold', -building.def.cost);
    this.updateGhost(pointer);
  }

  place(Cls, id, tx, ty) {
    const obj = new Cls(this, tx * TILE + TILE / 2, ty * TILE + TILE / 2, id);
    const key = `${tx},${ty}`;
    this.occupied.set(key, obj);
    obj.once('destroy', () => this.occupied.delete(key));
  }

  canPlace(building, tx, ty) {
    return (
      this.level.zoneAt(tx, ty) === building.def.placeOn &&
      !this.occupied.has(`${tx},${ty}`) &&
      this.registry.get('gold') >= building.def.cost
    );
  }

  tileAt(pointer) {
    const tx = Math.floor(pointer.worldX / TILE);
    const ty = Math.floor(pointer.worldY / TILE);
    return { tx, ty, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
  }
}
