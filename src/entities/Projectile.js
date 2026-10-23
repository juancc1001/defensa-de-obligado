import Phaser from 'phaser';
import { applyEffects } from '../effects/index.js';

// Homes in on its target. If the target dies, it flies to the last known position.
export default class Projectile extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, target, def) {
    super(scene, x, y, def.sprite);
    scene.add.existing(this);
    this.def = def;
    this.target = target;
    this.tx = target.x;
    this.ty = target.y;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.target.active) {
      this.tx = this.target.x;
      this.ty = this.target.y;
    }

    const step = (this.def.speed * delta) / 1000;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.tx, this.ty);
    if (dist <= step) {
      const target = this.target.active ? this.target : null;
      applyEffects(this.scene, this.def.effects, target, { x: this.tx, y: this.ty, source: this });
      this.destroy();
      return;
    }

    const angle = Math.atan2(this.ty - this.y, this.tx - this.x);
    this.x += Math.cos(angle) * step;
    this.y += Math.sin(angle) * step;
  }
}
