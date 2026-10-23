// Allied items placed on the map (the player's ships). Edited from elements.html, see docs/TUTORIAL.md "Items".
import local from './items.json';
import { remote } from './remote.js';

export const items = remote.items ?? local;
