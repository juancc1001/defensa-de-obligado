// Real sprite images, key = the `sprite` name used in data files. Uploaded from elements.html.
// Any sprite not listed here gets a colored placeholder (see src/assets/placeholders.js).
import local from './sprites.json';
import { remote } from './remote.js';

export const sprites = remote.sprites ?? local;
