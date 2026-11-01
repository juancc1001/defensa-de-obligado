export const TILE = 16;
// The world is drawn at ZOOM; the HUD (UIScene) is not.
export const ZOOM = 2;
// Starting screen resolution, chosen in the Opciones menu. Scenes read the current one from this.scale.
export const RESOLUTIONS = ['960x544', '1280x720', '1600x900', '1920x1080'];
const [width, height] = (localStorage.getItem('resolution') || RESOLUTIONS[0]).split('x').map(Number);
export const WIDTH = width;
export const HEIGHT = height;
// Mouse wheel zoom in levels, towards the cursor. Dragging moves around the map.
// Zooming out stops when the map would no longer cover the whole screen.
// A level starts showing START_VIEW_TILES across, centered on the editor's camera marker (or the first enemy route).
export const START_VIEW_TILES = 50;
export const MAX_ZOOM = 4;
