import { useState } from 'react';
import { GENRES, EDGES, type Genre } from '@/data';

export const useGenreDetails = (genre: Genre) => {
  const [tab, setTab] = useState('Story');
  const tabs = ['Story', 'Sound DNA', 'Listen', 'Connections'];

  const relations = EDGES.filter(
    (e) => !e.implicit && (e.from === genre.id || e.to === genre.id),
  );

  const children = GENRES.filter((g) => !g.isRoot && g.family === genre.family);

  return { tab, setTab, tabs, relations, children };
};
