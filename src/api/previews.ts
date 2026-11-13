import { type Work } from '@/data';

export interface Preview {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl: string;
  artworkUrl100: string;
  trackViewUrl: string;
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const isPreview = (value: unknown): value is Preview => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'trackId' in value &&
    typeof value.trackId === 'number' &&
    [
      'trackName',
      'artistName',
      'previewUrl',
      'artworkUrl100',
      'trackViewUrl',
    ].every(
      (key) => key in value && typeof Reflect.get(value, key) === 'string',
    )
  );
};

export const findPreview = async (
  track: Work,
): Promise<Preview | undefined> => {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(track.artist + ' ' + track.title)}&entity=song&limit=12`,
    { signal: AbortSignal.timeout(12000) },
  );

  if (!response.ok) {
    throw new Error('Catalog unavailable');
  }

  const data: unknown = await response.json();

  if (
    typeof data !== 'object' ||
    data === null ||
    !('results' in data) ||
    !Array.isArray(data.results)
  ) {
    throw new Error('Invalid catalog response');
  }

  return data.results
    .filter(isPreview)
    .find(
      (t) =>
        t.previewUrl &&
        normalize(t.artistName).includes(normalize(track.artist)) &&
        normalize(t.trackName).includes(normalize(track.title)),
    );
};
