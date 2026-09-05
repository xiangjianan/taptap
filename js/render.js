import platform from './platform';

const canvas = platform.createCanvas();
const windowInfo = platform.getWindowInfo();
const devicePixelRatio = windowInfo.pixelRatio;
const safeArea = windowInfo.safeArea;

const logicalWidth = windowInfo.screenWidth;
const logicalHeight = windowInfo.screenHeight;

canvas.width = logicalWidth * devicePixelRatio;
canvas.height = logicalHeight * devicePixelRatio;

if (typeof canvas.style !== 'undefined') {
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = logicalWidth + 'px';
  canvas.style.height = logicalHeight + 'px';
  canvas.style.touchAction = 'none';
  canvas.style.userSelect = 'none';
  canvas.style.webkitUserSelect = 'none';
  canvas.style.webkitTouchCallout = 'none';
  canvas.style.zIndex = '9999';
  canvas.style.imageRendering = 'optimizeQuality';
  canvas.style.imageRendering = '-webkit-optimize-contrast';
}

const ctx = canvas.getContext('2d', {
  antialias: true,
  alpha: false,
  desynchronized: false
});

if (ctx) {
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

export const SCREEN_WIDTH = logicalWidth;
export const SCREEN_HEIGHT = logicalHeight;
export const SAFE_AREA = safeArea;
export const GAME_WIDTH_PERCENT = 1.0;
export const GAME_WIDTH = Math.floor(SCREEN_WIDTH * GAME_WIDTH_PERCENT);
export const GAME_HEIGHT = SCREEN_HEIGHT;
export const GAME_X = Math.floor((SCREEN_WIDTH - GAME_WIDTH) / 2);
export const GAME_Y = 0;

export function getCanvas() {
  return canvas;
}

export function getContext() {
  return ctx;
}

export function getDevicePixelRatio() {
  return devicePixelRatio;
}

export function getSafeArea() {
  return safeArea;
}
