import Phaser from 'phaser';
import { WIDTH } from '../config.js';
import { maps } from '../data/maps.js';

// One button per level in src/maps/.
export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    const text = { fontFamily: 'monospace', color: '#ffffff' };
    const button = { ...text, fontSize: '24px', backgroundColor: '#333333', padding: { x: 16, y: 8 } };

    this.add.text(WIDTH / 2, 80, 'Elegí un nivel', { ...text, fontSize: '36px' }).setOrigin(0.5);

    // Maps still being made (no waves yet) are left out.
    const levels = Object.entries(maps).filter(([, map]) => map.level.waves.length);
    levels.forEach(([mapId, map], i) => {
      this.add
        .text(WIDTH / 2, 170 + i * 60, map.level.name, button)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => this.scene.start('Game', { mapId }));
    });

    this.add
      .text(24, 24, '< Volver', { ...button, fontSize: '18px' })
      .setInteractive()
      .on('pointerdown', () => this.scene.start('Menu'));
  }
}
