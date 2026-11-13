interface DetailProps {
  genre: Genre;
  select: (id: string) => void;
  onTrack: (w: Work) => void;
  onBack: () => void;
  onLearn: () => void;
}

import { useGenreDetails } from '@/hooks';
import { byId, listen, describeEdge, type Genre, type Work } from '@/data';

const Detail = ({ genre, select, onTrack, onBack, onLearn }: DetailProps) => {
  const { tab, setTab, tabs, relations, children } = useGenreDetails(genre);

  return (
    <aside className="detail" aria-label={`${genre.name} details`}>
      <div className="detail-top">
        <button onClick={onBack}>← All worlds</button>
        <span>
          {genre.isRoot
            ? 'MUSICAL FAMILY'
            : byId[genre.family].name.toUpperCase()}
        </span>
      </div>
      <h2>{genre.name}</h2>
      <div className="origin">
        {genre.period}
        <br />
        {genre.origin}
      </div>
      <p className="summary">{genre.summary}</p>
      <button className="learn-origin-button" onClick={onLearn}>
        Learn how this sound developed ↗
      </button>
      <div
        className="detail-tabs"
        role="tablist"
        aria-label="Genre information"
      >
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();

                const next =
                  (tabs.indexOf(t) + (e.key === 'ArrowRight' ? 1 : 3)) % 4;

                setTab(tabs[next]);

                const buttons =
                  e.currentTarget.parentElement?.querySelectorAll('button');

                buttons?.[next]?.focus();
              }
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="detail-content" role="tabpanel" aria-label={tab}>
        {tab === 'Story' && (
          <>
            <p>{genre.history}</p>
            {genre.note && (
              <p className="note">Classification note: {genre.note}</p>
            )}
            <h3>Essential artists</h3>
            <p className="artist-list">{genre.artists.join(' · ')}</p>
            <h3>
              Inside this world <span>{children.length} subgenres</span>
            </h3>
            <div className="branches">
              {children.map((g) => (
                <button key={g.id} onClick={() => select(g.id)}>
                  {g.name}
                  <span>↗</span>
                </button>
              ))}
            </div>
            {genre.sources?.map((source) => (
              <a
                className="source"
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                {source.title} ↗
              </a>
            ))}
            <a
              className="source"
              href={listen.wiki(genre.wiki)}
              target="_blank"
              rel="noreferrer"
            >
              Source & further reading ↗
            </a>
            {genre.family === 'jazz' && (
              <a
                className="source"
                href="https://music.si.edu/story/jazz/"
                target="_blank"
                rel="noreferrer"
              >
                Jazz at the Smithsonian ↗
              </a>
            )}
          </>
        )}
        {tab === 'Sound DNA' && (
          <>
            <p className="micro">COMMON TENDENCIES, NOT FIXED RULES</p>
            {Object.entries(genre.sound).map(([key, value]) => (
              <div className="dna" key={key}>
                <h3>
                  {
                    {
                      i: 'Instrumentation',
                      r: 'Rhythm',
                      t: 'Tempo',
                      v: 'Voice',
                      p: 'Production',
                      q: 'Technique',
                    }[key]
                  }
                </h3>
                <p>{value}</p>
              </div>
            ))}
          </>
        )}
        {tab === 'Listen' && (
          <>
            <h3>Start with these tracks</h3>
            <p className="muted">
              {genre.tracks.length
                ? 'Select a track, then press play in the listening bar.'
                : 'No individual track is curated here. Start with the albums below.'}
            </p>
            {genre.tracks.map((w, i) => (
              <button
                className="track-row"
                key={w.title}
                onClick={() => onTrack(w)}
              >
                <span className="track-number">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <strong>{w.title}</strong>
                  <small>
                    {w.artist} · {w.year}
                  </small>
                </span>
                <span>↗</span>
              </button>
            ))}
            <h3>Essential albums</h3>
            {genre.albums.map((w) => (
              <a
                className="album-row"
                key={w.title}
                href={listen.spotify(w.artist + ' ' + w.title)}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  {w.title}
                  <small>{w.artist}</small>
                </span>
                <span>{w.year} ↗</span>
              </a>
            ))}
          </>
        )}
        {tab === 'Connections' && (
          <>
            <p className="muted">
              Documented relationships in this atlas. Direction describes
              musical history, not distance in space.
            </p>
            {relations.map((e, i) => {
              const id = e.from === genre.id ? e.to : e.from;

              return (
                <button
                  className="connection"
                  key={i}
                  onClick={() => select(id)}
                >
                  <span className="micro">
                    {e.type.toUpperCase()}
                    {e.debated ? ' · DEBATED' : ''}
                  </span>
                  <strong>{byId[id].name} ↗</strong>
                  <span>
                    {describeEdge(e)}. {e.note}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </aside>
  );
};

export default Detail;
