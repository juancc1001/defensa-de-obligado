import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    const text = { fontFamily: 'monospace', color: '#ffffff' };
    const button = { ...text, fontSize: '28px', backgroundColor: '#333333', padding: { x: 16, y: 8 } };
    this.add.text(width / 2, height / 3, 'Defensa de Obligado', { ...text, fontSize: '48px' }).setOrigin(0.5);

    const options = [
      ['Nueva Partida', () => this.scene.start('Cutscene')],
      ['Editor de mapas', () => (window.location.href = 'editor.html')],
      ['Editor de elementos', () => (window.location.href = 'elements.html')],
      ['Opciones', () => this.scene.start('Options')],
      ['Editor de historia', () => (window.location.href = 'story.html')],
    ];
    options.forEach(([label, onClick], i) => {
      this.add
        .text(width / 2, height / 2 + 40 + i * 50, label, button)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', onClick);
    });
  }
}
