import { FAMILIES } from './families';
import { GENRES_A } from './genres-a';
import { GENRES_B } from './genres-b';
import { GENRES_C } from './genres-c';
import { EDGES as CROSS } from './edges';
import {
  type Edge,
  type Family,
  type Genre,
  type RawGenre,
  type RelType,
} from './types';

export type { Edge, Family, Genre, RelType };

export { FAMILIES };

const RAW: RawGenre[] = [...GENRES_A, ...GENRES_B, ...GENRES_C];

export const GENRES: Genre[] = RAW;

export const byId: Record<string, Genre> = Object.fromEntries(
  GENRES.map((g) => [g.id, g]),
);

export const indexOf: Record<string, number> = Object.fromEntries(
  GENRES.map((g, i) => [g.id, i]),
);

export const famOf = (g: Genre): Family => FAMILIES[g.family];

/* ── edges: structural (from `parent`) + curated cross links ───────────────── */
const tree: Edge[] = [];

for (const g of RAW) {
  if (g.isRoot) {
    continue;
  }

  const root = byId[g.family];

  if (g.parent) {
    const p = byId[g.parent];
    const type: RelType = g._opts?.prel ?? (p.isRoot ? 'subgenre' : 'evolved');

    const note =
      g._opts?.pnote ??
      (type === 'subgenre'
        ? `${g.name} is a branch of ${p.name}.`
        : `${g.name} grew directly out of ${p.name}.`);

    tree.push({
      from: p.id,
      to: g.id,
      type,
      note,
      tree: true,
      sources: g.sources,
    });

    if (!p.isRoot) {
      tree.push({
        from: root.id,
        to: g.id,
        type: 'subgenre',
        note: `${g.name} belongs to the ${root.name} family.`,
        tree: true,
        implicit: true,
      });
    }
  }
}

export const EDGES: Edge[] = [...tree, ...CROSS];

/** Edges drawn as arches in the world (everything that is not a tree branch). */
export const ARCS: Edge[] = CROSS;

if (import.meta.env.DEV) {
  for (const e of EDGES) {
    if (!byId[e.from] || !byId[e.to]) {
      console.warn('[graph] unknown id in edge', e.from, '→', e.to);
    }
  }

  for (const g of GENRES) {
    if (g.parent && !byId[g.parent]) {
      console.warn('[graph] unknown parent', g.id, g.parent);
    }
  }

  for (const g of GENRES) {
    if (g.parent && byId[g.parent] && byId[g.parent].family !== g.family) {
      console.warn('[graph] parent in other family', g.id);
    }
  }
}

const outE: Record<string, Edge[]> = {};

const inE: Record<string, Edge[]> = {};

for (const e of EDGES) {
  (outE[e.from] ??= []).push(e);
  (inE[e.to] ??= []).push(e);
}

export const edgesFrom = (id: string) => outE[id] ?? [];

export const edgesTo = (id: string) => inE[id] ?? [];

const nb: Record<string, Set<string>> = {};

for (const e of EDGES) {
  if (e.implicit) {
    continue;
  }

  (nb[e.from] ??= new Set()).add(e.to);
  (nb[e.to] ??= new Set()).add(e.from);
}

const EMPTY = new Set<string>();

export const neighborsOf = (id: string): Set<string> => nb[id] ?? EMPTY;

/* ── connections, grouped for reading ─────────────────────────────────────── */
export interface Link {
  id: string;
  edge: Edge;
}

export interface Connections {
  roots: Link[];
  fusion: Link[];
  influencedBy: Link[];
  branches: Link[];
  fedInto: Link[];
  related: Link[];
}

export const connectionsOf = (id: string): Connections => {
  const c: Connections = {
    roots: [],
    fusion: [],
    influencedBy: [],
    branches: [],
    fedInto: [],
    related: [],
  };

  for (const e of edgesTo(id)) {
    if (e.implicit) {
      continue;
    }

    const l = { id: e.from, edge: e };

    if (e.type === 'related') {
      c.related.push(l);
    } else if (e.type === 'fusion') {
      c.fusion.push(l);
    } else if (e.type === 'influenced') {
      c.influencedBy.push(l);
    } else {
      c.roots.push(l);
    }
  }

  for (const e of edgesFrom(id)) {
    if (e.implicit) {
      continue;
    }

    const l = { id: e.to, edge: e };

    if (e.type === 'related') {
      c.related.push(l);
    } else if (e.type === 'subgenre' || e.type === 'evolved') {
      c.branches.push(l);
    } else {
      c.fedInto.push(l);
    }
  }

  const byYear = (a: Link, b: Link) => byId[a.id].year - byId[b.id].year;

  Object.values(c).forEach((l) => (l as Link[]).sort(byYear));

  return c;
};

/** Genres from other families that emerged within a few years of this one. */
export const contemporaries = (id: string, n = 4): Genre[] => {
  const g = byId[id];
  const span = g.year < 1900 ? 40 : 4;

  return GENRES.filter(
    (o) =>
      o.id !== id &&
      o.family !== g.family &&
      !o.isRoot &&
      Math.abs(o.year - g.year) <= span &&
      !neighborsOf(id).has(o.id),
  )
    .sort((a, b) => Math.abs(a.year - g.year) - Math.abs(b.year - g.year))
    .slice(0, n);
};

/* ── pathfinding ──────────────────────────────────────────────────────────── */
export interface PathStep {
  from: string;
  to: string;
  edge: Edge;
  forward: boolean;
}

const W: Record<RelType, number> = {
  evolved: 1,
  subgenre: 1,
  fusion: 1.1,
  influenced: 1.35,
  related: 2,
};

/**
 * Cheapest route between two genres using only edges in the dataset.
 * Following history forwards is preferred; walking an edge backwards costs extra,
 * so a route through a shared ancestor is only chosen when no direct lineage exists.
 */
export const findPath = (a: string, b: string): PathStep[] | null => {
  if (a === b || !byId[a] || !byId[b]) {
    return null;
  }

  const dist: Record<string, number> = { [a]: 0 };
  const prev: Record<string, PathStep> = {};
  const done = new Set<string>();

  for (;;) {
    let u: string | null = null;

    for (const k in dist) {
      if (!done.has(k) && (u === null || dist[k] < dist[u])) {
        u = k;
      }
    }

    if (u === null) {
      return null;
    }

    if (u === b) {
      break;
    }

    done.add(u);

    const relax = (v: string, e: Edge, forward: boolean) => {
      let w = W[e.type] + (e.debated ? 0.8 : 0) + (e.implicit ? 1.5 : 0);

      if (!forward && e.type !== 'related') {
        w += 2.2;
      }

      const d = dist[u!] + w;

      if (dist[v] === undefined || d < dist[v]) {
        dist[v] = d;
        prev[v] = { from: u!, to: v, edge: e, forward };
      }
    };

    for (const e of edgesFrom(u)) {
      relax(e.to, e, true);
    }

    for (const e of edgesTo(u)) {
      relax(e.from, e, false);
    }
  }

  const steps: PathStep[] = [];

  for (let v = b; v !== a; v = prev[v].from) {
    steps.unshift(prev[v]);
  }

  return steps;
};

export const describeEdge = (e: Edge): string => {
  const f = byId[e.from].name;
  const t = byId[e.to].name;

  switch (e.type) {
    case 'subgenre':
      return `${t} is a branch of ${f}`;
    case 'evolved':
      return `${t} evolved from ${f}`;
    case 'influenced':
      return `${f} influenced ${t}`;
    case 'fusion':
      return `${t} is a fusion that draws on ${f}`;
    default:
      return `${f} and ${t} are closely related`;
  }
};

export const REL_LABEL: Record<RelType, string> = {
  subgenre: 'branch',
  evolved: 'evolved from',
  influenced: 'influence',
  fusion: 'fusion',
  related: 'related',
};

/* ── search ───────────────────────────────────────────────────────────────── */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const artistIndex: Record<string, string[]> = {};

for (const g of GENRES) {
  for (const a of g.artists) {
    (artistIndex[a] ??= []).push(g.id);
  }
}

export type Hit =
  | {
      kind: 'genre';
      id: string;
      label: string;
      sub: string;
    }
  | {
      kind: 'artist';
      id: string;
      label: string;
      sub: string;
    };

const genreKeys = GENRES.map((g) => ({ g, k: norm(g.name) }));

const artistKeys = Object.keys(artistIndex).map((a) => ({ a, k: norm(a) }));

export const search = (q: string, limit = 9): Hit[] => {
  const n = norm(q);

  if (!n) {
    return [];
  }

  const score = (k: string) =>
    k === n
      ? 0
      : k.startsWith(n)
        ? 1
        : k.includes(' ' + n)
          ? 2
          : k.includes(n)
            ? 3
            : -1;

  const hits: {
    s: number;
    h: Hit;
  }[] = [];

  for (const { g, k } of genreKeys) {
    const s = score(k);

    if (s >= 0) {
      hits.push({
        s,
        h: {
          kind: 'genre',
          id: g.id,
          label: g.name,
          sub: `${famOf(g).name} · ${g.period}`,
        },
      });
    }
  }

  for (const { a, k } of artistKeys) {
    const s = score(k);

    if (s >= 0) {
      const ids = artistIndex[a];

      hits.push({
        s: s + 0.5,
        h: {
          kind: 'artist',
          id: ids[0],
          label: a,
          sub: ids.map((i) => byId[i].name).join(' · '),
        },
      });
    }
  }

  return hits
    .sort((x, y) => x.s - y.s)
    .slice(0, limit)
    .map((x) => x.h);
};

/* ── listening links: honest hand-offs to the real services, no fake players ─ */
export const listen = {
  spotify: (q: string) =>
    `https://open.spotify.com/search/${encodeURIComponent(q)}`,
  youtube: (q: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  wiki: (slug: string) => `https://en.wikipedia.org/wiki/${slug}`,
};
