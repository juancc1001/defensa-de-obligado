// Terrain types: a tile of terrain.png and the zone it gives. Edited from elements.html.
import local from './terrain.json';
import { remote } from './remote.js';

export const terrain = remote.terrain ?? local;

// What can be placed where: towers and items have `placeOn` set to one of these.
export const zones = ['build', 'path'];
