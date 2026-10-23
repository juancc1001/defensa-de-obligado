import Phaser from 'phaser';
import { enemies } from '../data/enemies.js';
import { movements } from '../movement/index.js';
import StatusEffects from '../components/StatusEffects.js';

export default class Enemy extends Phaser.GameObjects.Sprite {
  // opts are passed to the movement's init, e.g. { path } for 'path' movement.
  constructor(scene, id, opts) {
    const def = enemies[id];
    super(scene, 0, 0, def.sprite);
    scene.add.existing(this);
    scene.enemies.add(this);

    this.def = def;
    this.hp = def.hp;
    this.armor = def.armor ?? 0;
    this.status = new StatusEffects(this);
    this.movement = movements[def.movement ?? 'path'];
    this.movement.init(this, opts);
  }

  get speed() {
    return this.def.speed * this.status.speedMultiplier();
  }

  takeDamage(amount, ignoreArmor = false) {
    if (!this.active) return;
    this.hp -= ignoreArmor ? amount : Math.max(1, amount - this.armor);
    if (this.hp <= 0) {
      this.scene.onEnemyKilled(this);
      this.destroy();
    }
  }

  // Called by the movement when it arrives; from then on it stays and attacks the objective.
  reachGoal() {
    this.attacking = true;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    const dt = delta / 1000;
    this.status.update(dt);
    if (!this.active) return;
    if (this.attacking) this.scene.objective.takeDamage(this.def.damage * dt);
    else this.movement.update(this, dt);
  }
}
