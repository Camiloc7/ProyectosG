import { Howl } from 'howler';

// Configurá los audios con volúmenes sutiles
export const toastSound = new Howl({
  src: ['/audio/map.mp3'],
  volume: 0.2,
});
export const errorSound = new Howl({
  src: ['/audio/close.mp3'],
  volume: 0.9,
});
