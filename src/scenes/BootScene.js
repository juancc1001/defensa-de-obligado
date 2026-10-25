import Phaser from 'phaser';
import { maps } from '../data/maps.js';
import { TILE } from '../config.js';
import { sprites } from '../data/sprites.js';
import { terrain } from '../data/terrain.js';
import { makePlaceholders } from '../assets/placeholders.js';

const terrainRows = (columns) => Math.ceil((Math.max(...Object.values(terrain).map((t) => t.tile)) + 1) / columns);

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
        // Terrains past terrain.png's tiles only exist as PNGs; the tileset has to reach them.
        if (ts.name === 'terrain') ts.imageheight = Math.max(ts.imageheight, terrainRows(ts.imagewidth / TILE) * TILE);
      }
    }
    for (const [key, file] of Object.entries(sprites)) {
      this.load.image(key, file);
    }
  }

  create() {
    this.paintTerrainSprites();
    makePlaceholders(this);
    this.scene.start('Menu');
  }

  // Terrain with an uploaded PNG: it replaces its tile in terrain.png.
  paintTerrainSprites() {
    const painted = Object.values(terrain).filter((t) => this.textures.exists(t.sprite));
    if (!painted.length || !this.textures.exists('terrain')) return;
    const source = this.textures.get('terrain').getSourceImage();
    const columns = source.width / TILE;
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = Math.max(source.height, terrainRows(columns) * TILE);
    const c = canvas.getContext('2d');
    c.drawImage(source, 0, 0);
    for (const t of painted) {
      const x = (t.tile % columns) * TILE;
      const y = Math.floor(t.tile / columns) * TILE;
      c.clearRect(x, y, TILE, TILE);
      c.drawImage(this.textures.get(t.sprite).getSourceImage(), x, y, TILE, TILE);
    }
    this.textures.remove('terrain');
    this.textures.addCanvas('terrain', canvas);
  }
}
