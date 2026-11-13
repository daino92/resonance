import { type CSSProperties } from 'react';
import { Universe, Detail, Player, Learning } from '@/components';
import { useAtlas } from '@/hooks';
import { GENRES, byId, describeEdge, JOURNEYS } from '@/data';
import { colors } from '@/theme';

const ROOTS = GENRES.filter((g) => g.isRoot);

const App = () => {
  const {
    selected,
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
    step,
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
  } = useAtlas();

  return (
    <main style={{ '--accent': colors[g.family] } as CSSProperties}>
      <header className="header">
        <button className="brand" onClick={home} aria-label="Resonance home">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="11" />
            <ellipse
              cx="20"
              cy="20"
              rx="19"
              ry="5"
              transform="rotate(-30 20 20)"
            />
          </svg>
          RESONANCE
        </button>
        <nav aria-label="Main navigation">
          <button className={!panel ? 'active' : ''} onClick={home}>
            Explore
          </button>
          <button
            className={panel === 'learn' ? 'active' : ''}
            onClick={() => openLearning()}
          >
            Learn
          </button>
          <button
            className={panel === 'journeys' ? 'active' : ''}
            onClick={() => setPanel(panel === 'journeys' ? null : 'journeys')}
          >
            Journeys
          </button>
        </nav>
        <div className="search-wrap">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="7" />
            <path d="m15 15 6 6" />
          </svg>
          <input
            aria-label="Search genres or artists"
            placeholder="Artists, genres, worlds…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hits[0]) {
                select(hits[0].id);
              }
            }}
          />
          {query && (
            <div className="search-results">
              {hits.length ? (
                hits.map((h, i) => (
                  <button key={i} onClick={() => select(h.id)}>
                    <strong>{h.label}</strong>
                    <small>{h.sub}</small>
                  </button>
                ))
              ) : (
                <p>No worlds found. Try jazz, techno, or an artist.</p>
              )}
            </div>
          )}
        </div>
      </header>
      <section
        className={
          'experience ' +
          (focused ? 'is-focused' : '') +
          (panel === 'path' ? ' has-path' : '') +
          (panel === 'learn' ? ' is-learning' : '')
        }
      >
        {!focused && (
          <div className="opening">
            <h1>A universe of sound.</h1>
            <p>Find your next world.</p>
          </div>
        )}
        <Universe
          selected={selected}
          focused={focused}
          year={year}
          all={all}
          connections={connections}
          route={
            panel === 'learn'
              ? lesson.steps.map((step) => step.id)
              : panel === 'path' && path
                ? [from, ...path.map((p) => p.to)]
                : []
          }
          routeEdges={panel === 'learn' ? lesson.edges : undefined}
          onSelect={(id) =>
            panel === 'learn'
              ? chooseLearningStep(
                  lesson.steps.findIndex((step) => step.id === id),
                )
              : select(id)
          }
        />
        <div className="atlas-tools">
          <button
            className={panel === 'index' ? 'active' : ''}
            onClick={() => {
              setPanel(panel === 'index' ? null : 'index');
              setAll(true);
            }}
          >
            All worlds <span>16</span>
          </button>
          <button
            onClick={() => {
              const pool = GENRES.filter((o) => o.id !== selected);

              select(pool[Math.floor(Math.random() * pool.length)].id);
            }}
          >
            Surprise me ↗
          </button>
          <button
            className={connections ? 'active' : ''}
            onClick={() => {
              setFocused(false);
              setAll(true);
              setConnections(!connections);
            }}
          >
            Connections
          </button>
        </div>
        {focused ? (
          <Detail
            onLearn={() => openLearning(selected)}
            key={selected}
            genre={g}
            select={select}
            onTrack={setTrack}
            onBack={home}
          />
        ) : (
          <aside className="featured">
            <span className="micro">FEATURED WORLD</span>
            <div className="short-rule" />
            <h2>Jazz</h2>
            <p>
              The art of improvisation. A world of freedom, dialogue, and
              constant reinvention.
            </p>
            <button className="outline-button" onClick={() => select('jazz')}>
              Explore world <span>↗</span>
            </button>
            <div className="featured-bottom">
              <span className="micro">16 WORLDS. {GENRES.length} GENRES.</span>
              <p>
                Follow a familiar sound.
                <br />
                Find something unexpected.
              </p>
            </div>
          </aside>
        )}
        {panel === 'learn' && (
          <Learning
            key={learningTarget}
            lesson={lesson}
            stepIndex={learningStep}
            chooseTarget={openLearning}
            chooseStep={chooseLearningStep}
            onTrack={setTrack}
            onClose={home}
          />
        )}
        {panel && panel !== 'learn' && (
          <section
            className="overlay-panel"
            aria-label={
              panel === 'index'
                ? 'All worlds'
                : panel === 'journeys'
                  ? 'Guided journeys'
                  : 'Influence explorer'
            }
          >
            <button
              className="close-panel"
              onClick={() => setPanel(null)}
              aria-label="Close panel"
            >
              ×
            </button>
            {panel === 'index' && (
              <>
                <span className="micro">THE ATLAS</span>
                <h2>Choose a world.</h2>
                <p>
                  Every sound belongs somewhere.
                  <br />
                  Most belong in more than one place.
                </p>
                <div className="world-index">
                  {ROOTS.map((r, i) => (
                    <button key={r.id} onClick={() => select(r.id)}>
                      <span className="index-number">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <i style={{ background: colors[r.id] }} />
                      <span>{r.name}</span>
                      <small>
                        {
                          GENRES.filter((x) => x.family === r.id && !x.isRoot)
                            .length
                        }
                      </small>
                      <span>↗</span>
                    </button>
                  ))}
                </div>
                <button
                  className="outline-button"
                  onClick={() => setPanel('path')}
                >
                  Trace an influence <span>↗</span>
                </button>
              </>
            )}
            {panel === 'journeys' && (
              <>
                <span className="micro">TAKE THE LONG WAY</span>
                <h2>Follow the sound.</h2>
                <p>Three routes through a connected history.</p>
                {JOURNEYS.map((j, i) => (
                  <button
                    className="journey-option"
                    key={j.name}
                    onClick={() => goJourney(i, 0)}
                  >
                    <span className="micro">
                      JOURNEY 0{i + 1} · {j.ids.length} STOPS
                    </span>
                    <h3>{j.name}</h3>
                    <p>{j.text}</p>
                    <span>Begin journey ↗</span>
                  </button>
                ))}
                <button
                  className="outline-button"
                  onClick={() => setPanel('path')}
                >
                  Make your own connection ↗
                </button>
              </>
            )}
            {panel === 'path' && (
              <>
                <span className="micro">INFLUENCE EXPLORER</span>
                <h2>Connect the dots.</h2>
                <label>
                  From
                  <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  >
                    {GENRES.map((g) => (
                      <option value={g.id} key={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  To
                  <select value={to} onChange={(e) => setTo(e.target.value)}>
                    {GENRES.map((g) => (
                      <option value={g.id} key={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="muted">
                  Routes use only the atlas’s relationships. A shared ancestor
                  is not necessarily a direct influence.
                </p>
                {path ? (
                  path.map((p, i) => (
                    <button
                      className="connection"
                      key={i}
                      onClick={() => select(p.to)}
                    >
                      <span className="micro">
                        {p.forward ? 'FORWARD' : 'TRACING BACK'} · {p.edge.type}
                        {p.edge.debated ? ' · DEBATED' : ''}
                      </span>
                      <strong>
                        {byId[p.from].name} → {byId[p.to].name}
                      </strong>
                      <span>
                        {describeEdge(p.edge)}. {p.edge.note}
                      </span>
                    </button>
                  ))
                ) : (
                  <p>
                    {from === to
                      ? 'Choose two different genres.'
                      : 'No documented path found in this dataset.'}
                  </p>
                )}
              </>
            )}
          </section>
        )}
        {journey !== null && (
          <div className="journey-progress">
            <span>
              {JOURNEYS[journey].name}{' '}
              <b>
                {step + 1}/{JOURNEYS[journey].ids.length}
              </b>
            </span>
            <button
              disabled={step === 0}
              onClick={() => goJourney(journey, step - 1)}
            >
              ← Previous
            </button>
            <button
              onClick={() =>
                step < JOURNEYS[journey].ids.length - 1
                  ? goJourney(journey, step + 1)
                  : home()
              }
            >
              {step < JOURNEYS[journey].ids.length - 1
                ? 'Next world →'
                : 'Finish journey'}
            </button>
          </div>
        )}
        <div className="navigation-hint">
          DRAG TO ORBIT <i /> SCROLL TO TRAVEL <i /> CLICK TO DISCOVER
        </div>
      </section>
      <footer className="dock">
        <section
          className="timeline"
          aria-label="Music evolution"
          aria-disabled={panel === 'learn'}
        >
          <div className="timeline-top">
            <button
              onClick={() => {
                if (!evolving) {
                  setFocused(false);
                  setAll(true);

                  if (year >= 2026) {
                    setYear(1900);
                  }
                }

                setEvolving(!evolving);
              }}
              disabled={panel === 'learn'}
              aria-label={evolving ? 'Pause evolution' : 'Play evolution'}
            >
              {evolving ? 'Ⅱ' : '▷'} <span>Travel through time</span>
            </button>
            <select
              disabled={panel === 'learn'}
              aria-label="Evolution speed"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value="1">1×</option>
              <option value="2">2×</option>
              <option value="4">4×</option>
            </select>
            <span>
              {year === 2026 ? 'ALL ERAS' : year}{' '}
              <small>· {visible} genres</small>
            </span>
          </div>
          <input
            disabled={panel === 'learn'}
            aria-label="Historical year"
            type="range"
            min="1900"
            max="2026"
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setEvolving(false);
              setFocused(false);
              setAll(true);
            }}
          />
          <div className="timeline-labels">
            {[1900, 1920, 1940, 1960, 1980, 2000, 2026].map((y) => (
              <button
                disabled={panel === 'learn'}
                key={y}
                onClick={() => {
                  setYear(y);
                  setEvolving(false);
                  setFocused(false);
                  setAll(true);
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </section>
        <Player track={track} />
      </footer>
    </main>
  );
};

export default App;
