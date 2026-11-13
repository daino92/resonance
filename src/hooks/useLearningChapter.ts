import { useState } from 'react';
import { byId, listen, type Lesson, type Work } from '@/data';

export const useLearningChapter = (
  lesson: Lesson,
  stepIndex: number,
  onTrack: (track: Work) => void,
) => {
  const [answer, setAnswer] = useState<number | null>(null);
  const [queued, setQueued] = useState('');
  const step = lesson.steps[stepIndex];
  const genre = byId[step.id];
  const inputs = lesson.edges.filter((edge) => edge.to === step.id);
  const last = stepIndex === lesson.steps.length - 1;
  const question = lesson.question;
  const track = genre.tracks[0];

  const sourceLinks = [
    ...(genre.sources || []),
    { title: `Further reading: ${genre.name}`, url: listen.wiki(genre.wiki) },
  ];

  const relationName = {
    fusion: 'Fusion input',
    influenced: 'Influence',
    evolved: 'Evolved from',
    subgenre: 'Family membership',
    related: 'Related',
  };

  const queueTrack = () => {
    if (!track) {
      return;
    }

    onTrack(track);
    setQueued(step.id);

    document
      .querySelector('.player')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return {
    answer,
    setAnswer,
    queued,
    step,
    genre,
    inputs,
    last,
    question,
    track,
    sourceLinks,
    relationName,
    queueTrack,
  };
};
