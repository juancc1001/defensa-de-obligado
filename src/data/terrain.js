// Terrain types: a tile of terrain.png and the zone it gives. Edited from elements.html.
// `cover`: enemies on it can't be targeted or hit. Put it in the editor's overlay so they sail under it.
import local from './terrain.json';
import { remote } from './remote.js';

export const terrain = remote.terrain ?? local;

// What can be placed where: towers and items have `placeOn` set to one of these.
export const zones = ['build', 'path'];
