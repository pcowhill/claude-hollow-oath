import { describe, it, expect } from 'vitest';
// Static import doubles as the "importing without AudioContext must not throw"
// check — vitest runs in a node environment with no WebAudio at all.
import { audio, AudioManager } from '../src/audio/audioManager';

describe('AudioManager without an AudioContext (node environment)', () => {
  it('module imports and exposes a singleton', () => {
    expect(typeof AudioContext).toBe('undefined');
    expect(audio).toBeInstanceOf(AudioManager);
  });

  it('sfx() does not throw', () => {
    expect(() => audio.sfx('ui-click')).not.toThrow();
    expect(() => audio.sfx('ui-click', { volume: 0.5, rate: 1.2 })).not.toThrow();
    // rapid repeats exercise the 60ms throttle path
    expect(() => {
      for (let i = 0; i < 5; i++) audio.sfx('ui-click');
    }).not.toThrow();
  });

  it('playMusic() / stopMusic() do not throw', () => {
    expect(() => audio.playMusic('town')).not.toThrow();
    expect(() => audio.playMusic('town')).not.toThrow(); // same role again
    expect(() => audio.playMusic('combat')).not.toThrow();
    expect(() => audio.stopMusic(0.5)).not.toThrow();
    expect(() => audio.stopMusic()).not.toThrow();
  });

  it('playAmbience() handles names and null without throwing', () => {
    expect(() => audio.playAmbience('music-forest')).not.toThrow();
    expect(() => audio.playAmbience('door-creak')).not.toThrow();
    expect(() => audio.playAmbience(null)).not.toThrow();
    expect(() => audio.playAmbience(null)).not.toThrow();
  });

  it('duckMusic() and setVolumes() do not throw', () => {
    expect(() => audio.duckMusic(0.3, 2)).not.toThrow();
    expect(() =>
      audio.setVolumes({ master: 0.8, music: 0.6, ambience: 0.4, effects: 1 }),
    ).not.toThrow();
    expect(() =>
      audio.setVolumes({ master: -1, music: 2, ambience: NaN, effects: 0 }),
    ).not.toThrow();
  });

  it('a fresh instance behaves the same', () => {
    const a = new AudioManager();
    expect(() => a.playMusic('title')).not.toThrow();
    expect(() => a.playAmbience('music-marsh')).not.toThrow();
    expect(() => a.sfx('sword-clash')).not.toThrow();
    expect(() => a.duckMusic(0.2, 1)).not.toThrow();
    expect(() => a.stopMusic(1)).not.toThrow();
  });
});
