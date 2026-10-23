import Projectile from '../entities/Projectile.js';
import { findTarget } from './targeting.js';

// Fires projectiles from its owner's position. Owner can be anything with x/y:
// a tower today, the player character later.
export default class Weapon {
  constructor(scene, owner, def) {
    this.scene = scene;
    this.owner = owner;
    this.def = def;
    this.cooldown = 0;
  }

  update(dt) {
    this.cooldown -= dt;
    if (this.cooldown > 0) return;

    const { range, targeting, projectile, fireRate } = this.def;
    const target = findTarget(this.scene.enemies.getChildren(), this.owner, range, targeting);
    if (!target) return;

    new Projectile(this.scene, this.owner.x, this.owner.y, target, projectile);
    this.cooldown = 1 / fireRate;
  }
}
