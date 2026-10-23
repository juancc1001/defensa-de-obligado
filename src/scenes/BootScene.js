import Phaser from 'phaser';
import { maps } from '../data/maps.js';
import { sprites } from '../data/sprites.js';
import { makePlaceholders } from '../assets/placeholders.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    for (const [id, map] of Object.entries(maps)) {
      this.load.tilemapTiledJSON(id, map);
      // Tileset images live in public/assets/tiles/, keyed by the tileset name.
      for (const ts of map.tilesets) {
        this.load.image(ts.name, `assets/tiles/${ts.image.split('/').pop()}`);
      }
    }
    for (const [key, file] of Object.entries(sprites)) {
      this.load.image(key, file);
    }
  }

  create() {
    makePlaceholders(this);
    this.scene.start('Menu');
  }
}
