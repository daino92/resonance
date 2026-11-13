import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  buildLesson,
  GENRES,
  byId,
  search,
  findPath,
  JOURNEYS,
  type Work,
} from '@/data';

export const useAtlas = () => {
  const [selected, setSelected] = useState('jazz');
  const [focused, setFocused] = useState(false);
  const [all, setAll] = useState(false);

  const [panel, setPanel] = useState<
    'index' | 'journeys' | 'path' | 'learn' | null
  >(null);

  const [query, setQuery] = useState('');
  const [year, setYear] = useState(2026);
  const [evolving, setEvolving] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [connections, setConnections] = useState(false);
  const [journey, setJourney] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [from, setFrom] = useState('blues');
  const [to, setTo] = useState('metal');

  const [track, setTrack] = useState<Work>({
    title: 'So What',
    artist: 'Miles Davis',
    year: '1959',
  });

  const [learningTarget, setLearningTarget] = useState('blackened-death-metal');
  const [learningStep, setLearningStep] = useState(0);
  const lesson = useMemo(() => buildLesson(learningTarget), [learningTarget]);
  const g = byId[selected];

  const select = useCallback((id: string) => {
    setSelected(id);
    setFocused(true);
    setPanel(null);
    setQuery('');
    setEvolving(false);
    setYear((y) => Math.max(y, byId[id].year));

    setTrack(
      byId[id].tracks[0] || { title: '', artist: byId[id].name, year: '' },
    );
  }, []);

  const openLearning = useCallback((id = 'blackened-death-metal') => {
    const next = buildLesson(id);

    setLearningTarget(id);
    setLearningStep(0);
    setSelected(next.steps[0].id);

    setTrack(
      byId[next.steps[0].id].tracks[0] || {
        title: '',
        artist: byId[next.steps[0].id].name,
        year: '',
      },
    );

    setPanel('learn');
    setFocused(false);
    setJourney(null);
    setEvolving(false);
    setYear(2026);
    setQuery('');
  }, []);

  const chooseLearningStep = useCallback(
    (index: number) => {
      const item = lesson.steps[index];

      if (!item) {
        return;
      }

      setLearningStep(index);
      setSelected(item.id);

      setTrack(
        byId[item.id].tracks[0] || {
          title: '',
          artist: byId[item.id].name,
          year: '',
        },
      );
    },
    [lesson],
  );

  const home = useCallback(() => {
    setFocused(false);
    setPanel(null);
    setJourney(null);
    setAll(false);
    setConnections(false);
  }, []);

  useEffect(() => {
    if (!evolving) {
      return;
    }

    const timer = setInterval(
      () =>
        setYear((y) => {
          if (y >= 2026) {
            setEvolving(false);

            return 2026;
          }

          return Math.min(y + 1, 2026);
        }),
      200 / speed,
    );

    return () => clearInterval(timer);
  }, [evolving, speed]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanel(null);
        setQuery('');
        setFocused(false);
        setJourney(null);
      }
    };

    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, []);

  const hits = search(query, 12);
  const path = findPath(from, to);
  const visible = GENRES.filter((g) => g.year <= year).length;

  const goJourney = useCallback(
    (j: number, s: number) => {
      setJourney(j);
      setStep(s);
      select(JOURNEYS[j].ids[s]);
    },
    [select],
  );

  return {
    selected,
    setSelected,
    focused,
    setFocused,
    all,
    setAll,
    panel,
    setPanel,
    query,
    setQuery,
    year,
    setYear,
    evolving,
    setEvolving,
    speed,
    setSpeed,
    connections,
    setConnections,
    journey,
    setJourney,
    step,
    setStep,
    from,
    setFrom,
    to,
    setTo,
    track,
    setTrack,
    learningTarget,
    learningStep,
    lesson,
    g,
    select,
    openLearning,
    chooseLearningStep,
    home,
    hits,
    path,
    visible,
    goJourney,
  };
};
