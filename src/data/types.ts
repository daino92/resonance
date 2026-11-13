export const FAMILY_ORDER = [
  'folk',
  'country',
  'blues',
  'jazz',
  'rnb',
  'funk',
  'hiphop',
  'reggae',
  'latin',
  'pop',
  'electronic',
  'ambient',
  'classical',
  'metal',
  'punk',
  'rock',
] as const;

export type FamilyId = (typeof FAMILY_ORDER)[number];

/** Relationship types. Direction is always from → to along the flow of history. */
export type RelType =
  | 'subgenre' // `to` is a branch of `from` (read backwards: `from` is the parent genre)
  | 'evolved' // `to` evolved from `from`
  | 'influenced' // `from` influenced `to`
  | 'fusion' // `to` is a fusion that includes `from`
  | 'related'; // kinship without a clear direction

export interface Family {
  id: FamilyId;
  name: string;
  color: string;
  /** waveform identity: 0 sine · 1 triangle · 2 saw · 3 square · 4 pulse · 5 irregular */
  shape: number;
  freq: number;
  speed: number;
  amp: number;
  bpm: number;
  solid: string;
}

export interface Sound {
  i?: string; // instrumentation
  r?: string; // rhythm
  t?: string; // tempo
  v?: string; // vocals
  p?: string; // production
  q?: string; // techniques
}

export interface Work {
  title: string;
  artist: string;
  year: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface Genre {
  id: string;
  name: string;
  family: FamilyId;
  isRoot: boolean;
  /** Primary ancestor inside the same family (drives the branch in the 3D layout). */
  parent?: string;
  /** Approximate year of emergence, used for layout and the timeline. */
  year: number;
  /** Human-readable period, which carries the nuance the single year cannot. */
  period: string;
  origin: string;
  summary: string;
  history: string;
  sound: Sound;
  artists: string[];
  albums: Work[];
  tracks: Work[];
  /** English Wikipedia article slug used as the source reference. */
  sources?: Source[];
  wiki: string;
  /** Classification caveat, shown when a placement is contested. */
  note?: string;
}

export interface Edge {
  sources?: Source[];
  from: string;
  to: string;
  type: RelType;
  note: string;
  /** True where historians disagree or the link is looser than the others. */
  debated?: boolean;
  /** Structural edges (tree branches / family membership) are not drawn as arches. */
  tree?: boolean;
  implicit?: boolean;
}

export interface GenreOpts {
  sources?: Source[];
  note?: string;
  pnote?: string;
  prel?: RelType;
}

export type RawGenre = Genre & {
  _opts?: GenreOpts;
};

const works = (s: string): Work[] =>
  s
    ? s.split(';').map((x) => {
        const [title, artist, year] = x.trim().split('|');

        return { title, artist, year: year ?? '' };
      })
    : [];

export const G = (
  id: string,
  name: string,
  family: FamilyId,
  parent: string | null,
  year: number,
  period: string,
  origin: string,
  summary: string,
  history: string,
  sound: Sound,
  artists: string,
  albums: string,
  tracks: string,
  wiki: string,
  opts?: GenreOpts,
): RawGenre => {
  return {
    id,
    name,
    family,
    isRoot: id === family,
    parent: parent ?? undefined,
    year,
    period,
    origin,
    summary,
    history,
    sound,
    artists: artists
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean),
    albums: works(albums),
    tracks: works(tracks),
    wiki,
    sources: opts?.sources,
    note: opts?.note,
    _opts: opts,
  };
};
