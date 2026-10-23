import Phaser from 'phaser';
import { WIDTH, HEIGHT } from '../config.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const text = { fontFamily: 'monospace', color: '#ffffff' };
    this.add.text(WIDTH / 2, HEIGHT / 3, 'Defensa de Obligado', { ...text, fontSize: '48px' }).setOrigin(0.5);
    this.add
      .text(WIDTH / 2, HEIGHT / 2 + 40, 'Jugar', { ...text, fontSize: '28px', backgroundColor: '#333333', padding: { x: 16, y: 8 } })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('LevelSelect'));
  }
}
