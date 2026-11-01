import Phaser from 'phaser';
import { TILE, ZOOM } from '../config.js';
import { towers } from '../data/towers.js';
import { items } from '../data/items.js';

// HUD on top of GameScene. Reads shared state from the registry every frame.
export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    const { width, height } = this.scale;
    const text = { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' };

    this.add.rectangle(0, 0, width, 28, 0x000000, 0.6).setOrigin(0);
    this.info = this.add.text(8, 6, '', text);

    this.add.rectangle(0, height - 64, width, 64, 0x000000, 0.6).setOrigin(0);
    const buildable = [
      ...Object.entries(towers).map(([id, def]) => ({ kind: 'tower', id, def })),
      ...Object.entries(items).map(([id, def]) => ({ kind: 'item', id, def })),
    ];
    buildable.forEach((b, i) => {
      const x = 50 + i * 100;
      const y = height - 42;
      // Big sprites are shrunk to fit the bar.
      const icon = this.add.image(x, y, b.def.sprite);
      icon
        .setScale(Math.min(ZOOM, (TILE * ZOOM) / Math.max(icon.width, icon.height)))
        .setInteractive()
        .on('pointerdown', () => this.registry.set('building', b));
      this.add.text(x, y + 16, `${b.def.name}\n$${b.def.cost}`, { ...text, fontSize: '11px', align: 'center' }).setOrigin(0.5, 0);
    });

    this.resultText = this.add
      .text(width / 2, height / 2, '', { ...text, fontSize: '32px', backgroundColor: '#000000aa', padding: { x: 16, y: 12 } })
      .setOrigin(0.5)
      .setVisible(false);
    this.input.on('pointerdown', () => {
      if (this.registry.get('result')) this.scene.start('Game', { mapId: this.scene.get('Game').mapId });
    });
  }

  update() {
    const r = this.registry;
    const building = r.get('building');
    this.info.setText(
      `Oro: ${r.get('gold')}   ${r.get('objectiveName')}: ${r.get('objectiveHp')}/${r.get('objectiveMaxHp')}   Oleada: ${r.get('wave')}/${r.get('waves')}` +
        (building ? `   Colocando: ${building.def.name} (clic derecho / Esc para cancelar)` : ''),
    );

    const result = r.get('result');
    this.resultText.setVisible(!!result);
    if (result) this.resultText.setText(result === 'win' ? '¡Victoria! Clic para jugar de nuevo' : 'Derrota. Clic para reintentar');
  }
}
