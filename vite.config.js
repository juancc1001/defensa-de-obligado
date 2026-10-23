import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const MAPS_DIR = path.resolve('src/maps');
const DATA_DIR = path.resolve('src/data');
const DATA_FILES = ['towers', 'enemies', 'items', 'terrain', 'sprites'];
const SPRITES_DIR = path.resolve('public/assets/sprites');

// Dev-only API the editors use to list and save maps and game data.
function mapsApi() {
  return {
    name: 'maps-api',
    configureServer(server) {
      // GET /api/maps -> list of names, GET /api/maps/<name> -> the map, POST /api/maps/<name> -> save it.
      server.middlewares.use('/api/maps', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method === 'GET' && req.url === '/') {
          const names = fs.readdirSync(MAPS_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
          res.end(JSON.stringify(names));
          return;
        }

        const name = req.url.slice(1);
        if (!/^[\w-]+$/.test(name)) {
          res.statusCode = 400;
          res.end('El nombre del mapa solo puede tener letras, números, - y _');
          return;
        }
        if (req.method === 'GET') {
          res.end(fs.readFileSync(path.join(MAPS_DIR, `${name}.json`)));
          return;
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          fs.writeFileSync(path.join(MAPS_DIR, `${name}.json`), body);
          res.end('ok');
        });
      });

      // POST /api/sprites/<key> with the PNG as body -> public/assets/sprites/<key>.png
      server.middlewares.use('/api/sprites', (req, res) => {
        const key = req.url.slice(1);
        if (req.method !== 'POST' || !/^[\w-]+$/.test(key)) {
          res.statusCode = 400;
          res.end('El nombre del sprite solo puede tener letras, números, - y _');
          return;
        }
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
          fs.mkdirSync(SPRITES_DIR, { recursive: true });
          fs.writeFileSync(path.join(SPRITES_DIR, `${key}.png`), Buffer.concat(chunks));
          res.end('ok');
        });
      });

      // The elements page posts { towers, enemies, items, terrain, sprites } and each one is written to src/data/<name>.json.
      server.middlewares.use('/api/data', (req, res) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const data = JSON.parse(body);
          for (const name of DATA_FILES) {
            fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data[name], null, 2) + '\n');
          }
          res.end('ok');
        });
      });
    },
  };
}

// Relative base so the build works on any static host (itch.io, GitHub Pages).
export default defineConfig({
  base: './',
  build: {
    // Top-level await in src/data/remote.js.
    target: 'es2022',
    rollupOptions: { input: ['index.html', 'editor.html', 'elements.html'] },
  },
  plugins: [mapsApi()],
});
