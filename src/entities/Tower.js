import Phaser from 'phaser';
import { towers } from '../data/towers.js';
import Weapon from '../components/Weapon.js';

export default class Tower extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, id) {
    const def = towers[id];
    super(scene, x, y, def.sprite);
    scene.add.existing(this);
    this.def = def;
    this.weapon = new Weapon(scene, this, def.weapon);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    this.weapon.update(delta / 1000);
  }
}
