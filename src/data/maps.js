// Every level: a map in src/maps/ (made in editor.html), keyed by file name.
// Its settings (name, gold, objective, waves) are in the map's `level` field.
import { remote } from './remote.js';

const files = import.meta.glob('../maps/*.json', { eager: true, import: 'default' });

const local = Object.fromEntries(Object.entries(files).map(([file, map]) => [file.match(/([\w-]+)\.json$/)[1], map]));

export const maps = { ...local, ...remote.maps };
