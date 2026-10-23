import Phaser from 'phaser';

// What the enemies try to destroy (the chains). Fills the rectangle drawn in Tiled.
export default class Objective extends Phaser.GameObjects.TileSprite {
  constructor(scene, rect, def) {
    super(scene, rect.x, rect.y, rect.width, rect.height, def.sprite);
    this.setOrigin(0);
    scene.add.existing(this);
    this.def = def;
    this.hp = def.hp;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.scene.registry.set('objectiveHp', Math.ceil(this.hp));
  }
}
