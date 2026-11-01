import Phaser from 'phaser';
import { RESOLUTIONS } from '../config.js';

export default class OptionsScene extends Phaser.Scene {
  constructor() {
    super('Options');
  }

  create() {
    const { width, height } = this.scale;
    const text = { fontFamily: 'monospace', color: '#ffffff' };
    const button = { ...text, fontSize: '24px', backgroundColor: '#333333', padding: { x: 16, y: 8 } };

    this.add.text(width / 2, 80, 'Opciones', { ...text, fontSize: '36px' }).setOrigin(0.5);

    // Resolution carousel: the arrows change it right away.
    const y = height / 2 - 40;
    const current = RESOLUTIONS.indexOf(`${width}x${height}`);
    this.add.text(width / 2 - 10, y, 'Resolución:', { ...text, fontSize: '24px' }).setOrigin(1, 0.5);
    this.add
      .text(width / 2 + 30, y, '<', button)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.setResolution(current - 1));
    this.add.text(width / 2 + 130, y, RESOLUTIONS[current], { ...text, fontSize: '24px' }).setOrigin(0.5);
    this.add
      .text(width / 2 + 230, y, '>', button)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.setResolution(current + 1));

    // Browsers only allow fullscreen from a click, and Phaser needs it on pointerup.
    this.add
      .text(width / 2, height / 2 + 40, 'Pantalla completa', button)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerup', () => this.scale.toggleFullscreen());

    this.add
      .text(24, 24, '< Volver', { ...button, fontSize: '18px' })
      .setInteractive()
      .on('pointerdown', () => this.scene.start('Menu'));
  }

  setResolution(i) {
    const res = RESOLUTIONS[Phaser.Math.Wrap(i, 0, RESOLUTIONS.length)];
    const [w, h] = res.split('x').map(Number);
    localStorage.setItem('resolution', res);
    this.scale.setGameSize(w, h);
    this.scene.restart();
  }
}
