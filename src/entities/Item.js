import Phaser from 'phaser';
import { items } from '../data/items.js';
import { applyEffects } from '../effects/index.js';

// Triggers its effects once per enemy that comes within `radius`, until out of uses.
export default class Item extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, id) {
    const def = items[id];
    super(scene, x, y, def.sprite);
    scene.add.existing(this);
    this.def = def;
    this.uses = def.uses;
    this.touched = new Set();
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    for (const enemy of [...this.scene.enemies.getChildren()]) {
      if (this.touched.has(enemy)) continue;
      if (Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) > this.def.radius) continue;

      this.touched.add(enemy);
      applyEffects(this.scene, this.def.effects, enemy, { x: this.x, y: this.y, source: this });
      this.uses -= 1;
      if (this.uses <= 0) {
        this.destroy();
        return;
      }
    }
  }
}
