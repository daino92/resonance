/** Seeded points on a spherical shell. The sky follows the camera's translation. */
export const createStarPositions = (count: number, seed = 42): Float32Array => {
  const points = new Float32Array(count * 3);

  const random = () => {
    seed = (seed * 16807) % 2147483647;

    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < count; i++) {
    const z = 2 * random() - 1;
    const angle = random() * Math.PI * 2;
    const radius = 100 + random() * 45;
    const equator = Math.sqrt(1 - z * z);

    points.set(
      [
        radius * equator * Math.cos(angle),
        radius * equator * Math.sin(angle),
        radius * z,
      ],
      i * 3,
    );
  }

  return points;
};

export interface LabelVisibility {
  visible: boolean;
  candidate: boolean;
  changedAt: number;
}

/** A silhouette crossing must persist before it changes label visibility. */
export const settleLabelVisibility = (
  state: LabelVisibility,
  candidate: boolean,
  now: number,
): boolean => {
  if (candidate !== state.candidate) {
    state.candidate = candidate;
    state.changedAt = now;
  }

  if (now - state.changedAt >= 140) {
    state.visible = state.candidate;
  }

  return state.visible;
};

export interface RouteEdge {
  from: string;
  to: string;
  type?: string;
}

/** Layers show ancestry. Branches at the same depth remain separate. */
export const layoutLineage = (
  ids: string[],
  edges: RouteEdge[],
): Map<string, [number, number, number]> => {
  const depths = new Map(ids.map((id) => [id, 0]));

  // Lessons are topologically ordered; only incoming edges affect each node.
  for (const id of ids) {
    const parents = edges.filter(
      (edge) => edge.to === id && depths.has(edge.from),
    );

    depths.set(
      id,
      parents.length
        ? Math.max(...parents.map((edge) => depths.get(edge.from)! + 1))
        : 0,
    );
  }

  const maxDepth = Math.max(0, ...depths.values());
  const result = new Map<string, [number, number, number]>();

  for (const id of ids) {
    const depth = depths.get(id)!;
    const siblings = ids.filter((other) => depths.get(other) === depth);

    result.set(id, [
      (depth - maxDepth / 2) * 3.4,
      (siblings.indexOf(id) - (siblings.length - 1) / 2) * 3.3,
      0,
    ]);
  }

  return result;
};
