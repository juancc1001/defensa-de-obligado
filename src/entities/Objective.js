import Phaser from 'phaser';

// What the enemies try to destroy (the chains). Fills the rectangle drawn in Tiled.
// A level can have several; they share one HP, kept in GameScene.
export default class Objective extends Phaser.GameObjects.TileSprite {
  constructor(scene, rect, def) {
    super(scene, rect.x, rect.y, rect.width, rect.height, def.sprite);
    this.setOrigin(0);
    scene.add.existing(this);
  }
}
