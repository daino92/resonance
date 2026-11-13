import { type Family, type FamilyId } from './types';

const F = (
  id: FamilyId,
  name: string,
  color: string,
  shape: number,
  freq: number,
  speed: number,
  amp: number,
  bpm: number,
  solid: string,
): Family => ({ id, name, color, shape, freq, speed, amp, bpm, solid });

/**
 * Each family's visual personality. `shape/freq/speed/amp` drive the waveform
 * along the top of its curtains, `bpm` the pulse of its lights, `solid` its node geometry.
 */
export const FAMILIES: Record<FamilyId, Family> = {
  folk: F(
    'folk',
    'Folk & Traditional',
    '#b5c66e',
    0,
    0.6,
    0.6,
    1.5,
    88,
    'dodeca',
  ),
  country: F('country', 'Country', '#d9a05b', 1, 0.8, 1.0, 1.5, 100, 'hex'),
  blues: F('blues', 'Blues', '#3d7bff', 0, 0.7, 0.8, 1.8, 80, 'drop'),
  jazz: F('jazz', 'Jazz', '#ffb84d', 5, 1.2, 1.5, 1.9, 130, 'knot'),
  rnb: F('rnb', 'R&B & Soul', '#ff7fa8', 0, 0.9, 1.1, 1.8, 96, 'torus'),
  funk: F('funk', 'Funk', '#ff7a1a', 4, 1.6, 2.4, 1.8, 108, 'knot2'),
  hiphop: F('hiphop', 'Hip-Hop', '#ffe14a', 4, 1.0, 1.6, 2.0, 90, 'disc'),
  reggae: F('reggae', 'Reggae & Ska', '#35d07f', 1, 0.9, 1.2, 1.7, 75, 'cone'),
  latin: F('latin', 'Latin', '#ff6b4a', 5, 1.7, 2.2, 1.8, 115, 'bicone'),
  pop: F('pop', 'Pop', '#ffa3ec', 0, 1.2, 1.5, 1.6, 118, 'sphere'),
  electronic: F(
    'electronic',
    'Electronic',
    '#19e0ff',
    3,
    1.4,
    2.2,
    1.9,
    128,
    'cube',
  ),
  ambient: F(
    'ambient',
    'Ambient & Experimental',
    '#8f7dff',
    0,
    0.22,
    0.25,
    2.6,
    40,
    'orb',
  ),
  classical: F(
    'classical',
    'Classical',
    '#f1e6c8',
    0,
    0.45,
    0.5,
    2.3,
    66,
    'icosa',
  ),
  metal: F('metal', 'Metal', '#9fb2d9', 2, 1.8, 3.0, 2.4, 160, 'shard'),
  punk: F('punk', 'Punk', '#ff2e7e', 3, 1.8, 3.6, 1.7, 180, 'tetra'),
  rock: F('rock', 'Rock', '#e8412c', 1, 1.1, 1.6, 2.0, 120, 'octa'),
};
