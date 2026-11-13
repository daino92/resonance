import { byId, EDGES } from './graph';
import { type Edge, type Source } from './types';

export interface LearningStep {
  id: string;
  title: string;
  changed: string;
  listenFor: string;
  branch?: string;
}

export interface Lesson {
  target: string;
  title: string;
  introduction: string;
  steps: LearningStep[];
  edges: Edge[];
  sources: Source[];
  question?: {
    prompt: string;
    answers: string[];
    correct: number;
    explanation: string;
  };
  curated: boolean;
}

const step = (
  id: string,
  title: string,
  changed: string,
  listenFor: string,
  branch?: string,
): LearningStep => ({ id, title, changed, listenFor, branch });

const link = (from: string, to: string): Edge => {
  const edge = EDGES.find(
    (edge) => edge.from === from && edge.to === to && !edge.implicit,
  );

  if (!edge) {
    throw new Error(`Missing lesson relationship: ${from} → ${to}`);
  }

  return edge;
};

export const BLACKENED_DEATH_LESSON: Lesson = {
  target: 'blackened-death-metal',
  title: 'How did we get to blackened death?',
  introduction:
    'Start with a familiar guitar vocabulary, follow its transformations, then watch two extreme-metal branches meet. This is one explanatory route, not the entire history of metal.',
  curated: true,
  steps: [
    step(
      'blues',
      'First, a vocabulary for the guitar.',
      'Blue notes, repeated phrases and call-and-response became important ingredients in rock guitar. This is a distant influence, not an early version of extreme metal.',
      'Notice how a short phrase can be repeated, bent and answered. A riff is a repeated musical phrase.',
    ),
    step(
      'rock',
      'Amplification makes the band a new instrument.',
      'Rock draws on several traditions, including blues, rhythm and blues, country and gospel. Electric guitars and a strong backbeat become central.',
      'Follow the guitar phrase and the drum accents on beats two and four.',
    ),
    step(
      'blues-rock',
      'The blues vocabulary gets amplified.',
      'Blues rock places blues phrasing inside a louder electric band, often extending riffs and improvisation. It is one bridge into hard rock, not the only path taken by rock music.',
      'Compare a repeated blues phrase with the heavier guitar tone and longer instrumental passages.',
    ),
    step(
      'hard-rock',
      'The riff gets heavier.',
      'Hard rock turns up amplification and distortion, with more forceful drums and prominent guitar riffs. Volume changes the texture as well as the loudness.',
      'Listen to the rough edge around the guitar notes. Distortion adds a dense, buzzing texture.',
    ),
    step(
      'metal',
      'Weight becomes a musical identity.',
      'Early heavy metal intensifies hard rock’s weight and darker atmosphere. The slow and ominous side matters just as much as speed.',
      'Compare the space between heavy riffs with their impact. Heavy does not always mean fast.',
    ),
    step(
      'heavy-metal',
      'A shared toolkit takes shape.',
      'Traditional heavy metal develops melodic lead guitars, clear vocal lines and tightly coordinated rhythm playing. Later styles reuse this toolkit differently.',
      'Separate the repeating rhythm guitar from the lead melody or solo.',
    ),
    step(
      'thrash-metal',
      'Precision meets urgency.',
      'Thrash combines heavy-metal riffing with the energy and speed of hardcore punk. This lesson shows the metal branch; punk is another important input.',
      'Listen for tightly clipped, percussive guitar notes. Palm muting means damping the strings near the bridge.',
    ),
    step(
      'black-metal',
      'One branch pursues atmosphere.',
      'Early black metal and thrash overlap within the 1980s extreme-metal world. The later black-metal sound often favors sustained tremolo textures and shrieked vocals. It is not a stage after death metal.',
      'Tremolo picking repeats notes very quickly, creating a continuous texture rather than a clipped chug.',
      'Parallel branch · Black metal',
    ),
    step(
      'death-metal',
      'Another branch pursues a different extremity.',
      'Death metal develops from increasingly extreme thrash, emphasizing guttural voices, dense riffs and rhythmic intensity. It develops alongside black metal rather than replacing it.',
      'Notice the lower growled voice and abrupt changes in the guitar and drums.',
      'Parallel branch · Death metal',
    ),
    step(
      'blackened-death-metal',
      'Two branches meet. Neither disappears.',
      'Blackened death combines elements from both traditions. Death metal supplies force and attack; black metal contributes atmosphere and textures. Different bands balance them differently.',
      'In Conquer All, compare the weight of the rhythm section with the guitar’s darker sustained textures. One track illustrates a blend; it cannot define every band.',
      'Fusion · Death metal + Black metal',
    ),
  ],
  edges: [
    link('blues', 'rock'),
    link('rock', 'blues-rock'),
    link('blues-rock', 'hard-rock'),
    link('hard-rock', 'metal'),
    link('metal', 'heavy-metal'),
    link('heavy-metal', 'thrash-metal'),
    link('thrash-metal', 'black-metal'),
    link('thrash-metal', 'death-metal'),
    link('death-metal', 'blackened-death-metal'),
    link('black-metal', 'blackened-death-metal'),
  ],
  sources: [
    {
      title: 'Library of Congress — Blues and its influence',
      url: 'https://www.loc.gov/collections/songs-of-america/articles-and-essays/musical-styles/popular-songs-of-the-day/blues/',
    },
    {
      title: 'Peaceville — Behemoth’s stylistic development',
      url: 'https://peaceville.com/bands/behemoth-2/',
    },
    {
      title: 'Belphegor — the band on its black/death blend',
      url: 'https://www.belphegor.at/biography.htm',
    },
  ],
  question: {
    prompt: 'Which description best explains blackened death metal?',
    answers: [
      'Death metal turned into black metal, then into a new genre.',
      'Black and death metal contribute different elements to a hybrid.',
      'Jazz is a required intermediate step between blues and metal.',
    ],
    correct: 1,
    explanation:
      'It is a convergence of branches, not a ladder. Jazz shares historical roots with some of these traditions, but it is not a required step in this particular route.',
  },
};

/** An honest, bounded ancestry reader. No backward pathfinding or invented links. */
export const buildLesson = (target: string): Lesson => {
  if (target === BLACKENED_DEATH_LESSON.target) {
    return BLACKENED_DEATH_LESSON;
  }

  if (!byId[target]) {
    throw new Error(`Unknown learning target: ${target}`);
  }

  const ordered: string[] = [];
  const edges: Edge[] = [];
  const visiting = new Set<string>();
  const admitted = new Set<string>([target]);

  const priority = {
    fusion: 0,
    evolved: 1,
    influenced: 2,
    subgenre: 3,
    related: 4,
  };

  const visit = (id: string, depth: number) => {
    if (ordered.includes(id)) {
      return;
    }

    visiting.add(id);

    const incoming = EDGES.filter(
      (edge) => edge.to === id && !edge.implicit && edge.type !== 'related',
    ).sort(
      (a, b) =>
        Number(!!a.debated) - Number(!!b.debated) ||
        priority[a.type] - priority[b.type],
    );

    for (const edge of depth < 4 ? incoming.slice(0, 2) : []) {
      if (visiting.has(edge.from)) {
        continue;
      }

      if (!admitted.has(edge.from) && admitted.size >= 9) {
        continue;
      }

      admitted.add(edge.from);
      visit(edge.from, depth + 1);
      edges.push(edge);
    }

    visiting.delete(id);
    ordered.push(id);
  };

  visit(target, 0);

  const steps = ordered.map((id) => {
    const genre = byId[id];
    const inputs = edges.filter((edge) => edge.to === id);

    return step(
      id,
      genre.name,
      inputs.length ? inputs.map((edge) => edge.note).join(' ') : genre.summary,
      genre.sound.q || genre.sound.r || genre.sound.i || genre.summary,
      inputs.length > 1 ? 'Multiple inputs · not a single chain' : undefined,
    );
  });

  return {
    target,
    title: `Where does ${byId[target].name} come from?`,
    introduction:
      'A selected ancestry map from the atlas. Arrows retain their relationship types: family membership is not the same as direct influence. It is a starting point, not an exhaustive or independently reviewed history.',
    steps,
    edges,
    sources: byId[target].sources || [],
    curated: false,
  };
};
