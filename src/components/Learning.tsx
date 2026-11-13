import { useLearningChapter } from '@/hooks';
import { GENRES, byId, type Lesson, type Work } from '@/data';

interface LearningProps {
  lesson: Lesson;
  stepIndex: number;
  chooseTarget: (id: string) => void;
  chooseStep: (index: number) => void;
  onTrack: (track: Work) => void;
  onClose: () => void;
}

const Learning = ({
  lesson,
  stepIndex,
  chooseTarget,
  chooseStep,
  onTrack,
  onClose,
}: LearningProps) => {
  const {
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
  } = useLearningChapter(lesson, stepIndex, onTrack);

  return (
    <>
      <aside className="learning-panel" aria-label="Learning mode">
        <div className="learning-toolbar">
          <span className="micro">LEARN BY LISTENING</span>
          <button onClick={onClose} aria-label="Close learning mode">
            ×
          </button>
        </div>
        <label className="learning-target">
          I want to understand
          <select
            value={lesson.target}
            onChange={(event) => chooseTarget(event.target.value)}
          >
            <optgroup label="Featured lesson">
              <option value="blackened-death-metal">
                Blackened Death Metal
              </option>
            </optgroup>
            <optgroup label="Explore another ancestry">
              {GENRES.filter((g) => g.id !== 'blackened-death-metal').map(
                (g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ),
              )}
            </optgroup>
          </select>
        </label>
        <div className="lesson-progress" aria-label="Lesson chapters">
          {lesson.steps.map((item, index) => (
            <button
              key={item.id}
              onClick={() => chooseStep(index)}
              aria-current={index === stepIndex ? 'step' : undefined}
              aria-label={`Chapter ${index + 1}: ${byId[item.id].name}`}
              title={byId[item.id].name}
            >
              {String(index + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
        <div className="lesson-reading" key={step.id}>
          <div className="lesson-step-meta">
            <span>
              CHAPTER {String(stepIndex + 1).padStart(2, '0')} /{' '}
              {lesson.steps.length}
            </span>
            <span>{genre.period}</span>
          </div>
          <h1>{genre.name}</h1>
          <p className="lesson-title">{step.title}</p>
          {step.branch && <p className="branch-callout">{step.branch}</p>}
          {stepIndex === 0 && (
            <p className="lesson-introduction">{lesson.introduction}</p>
          )}
          <h2>{inputs.length ? 'What changed?' : 'Start here'}</h2>
          <p>{step.changed}</p>
          {inputs.length > 0 && (
            <div className="lesson-inputs" aria-label="Contributing genres">
              {inputs.map((edge, index) => (
                <button
                  key={index}
                  onClick={() =>
                    chooseStep(
                      lesson.steps.findIndex((item) => item.id === edge.from),
                    )
                  }
                >
                  <span>
                    {relationName[edge.type]}
                    {edge.debated ? ' · debated' : ''}
                  </span>
                  <strong>
                    {byId[edge.from].name} → {genre.name}
                  </strong>
                </button>
              ))}
            </div>
          )}
          <div className="listening-prompt">
            <h2>Listen for this</h2>
            <p>{step.listenFor}</p>
            {track ? (
              <button onClick={queueTrack}>
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  aria-hidden="true"
                >
                  <path d="M7 4l13 8-13 8z" fill="currentColor" />
                </svg>
                <span>
                  {track.title}
                  <small>
                    {track.artist} · {track.year}
                  </small>
                </span>
                <span>Queue ↗</span>
              </button>
            ) : (
              <p>
                Explore the albums in the genre view; no individual sample is
                curated here.
              </p>
            )}
            <small role="status">
              {queued === step.id
                ? 'Queued. Press play in the listening bar.'
                : 'Press play in the listening bar to hear the selected sample.'}
            </small>
          </div>
          {last && question && (
            <section
              className="knowledge-check"
              aria-label="Check your understanding"
            >
              <h2>Connect what you heard</h2>
              <p>{question.prompt}</p>
              {question.answers.map((text, index) => (
                <button
                  key={text}
                  aria-pressed={answer === index}
                  onClick={() => setAnswer(index)}
                >
                  {text}
                </button>
              ))}
              {answer !== null && (
                <p
                  role="status"
                  className={
                    answer === question.correct ? 'correct-answer' : 'try-again'
                  }
                >
                  {answer === question.correct ? 'Exactly. ' : 'Not quite. '}
                  {question.explanation}
                </p>
              )}
            </section>
          )}
          {last && !question && (
            <div className="lesson-takeaway">
              <h2>The takeaway</h2>
              <p>
                {inputs.length > 1
                  ? 'Several traditions meet here. A family tree is more useful than a single ladder.'
                  : inputs.length
                    ? 'Follow the labeled arrow to distinguish musical influence from family membership.'
                    : 'This atlas does not document an earlier input for this genre. That does not mean it has no predecessors.'}
              </p>
            </div>
          )}
          <details className="lesson-sources">
            <summary>Context & sources</summary>
            <p>{genre.history}</p>
            {sourceLinks.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                {source.title} ↗
              </a>
            ))}
            {lesson.sources
              .filter(
                (source) =>
                  !sourceLinks.some((link) => link.url === source.url),
              )
              .map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.title} ↗
                </a>
              ))}
          </details>
          <p className="lesson-caveat">
            {lesson.curated
              ? 'One curated route through a wider history. Chapter order is a teaching sequence, not a claim that every genre evolved from the previous chapter.'
              : 'Selected from the existing atlas. At most nine genres and four upstream levels are shown; this is not a complete ancestry.'}
          </p>
        </div>
        <div className="lesson-navigation">
          <button
            disabled={stepIndex === 0}
            onClick={() => chooseStep(stepIndex - 1)}
          >
            ← Previous
          </button>
          <span>
            {stepIndex + 1} of {lesson.steps.length}
          </span>
          <button
            onClick={() => (last ? onClose() : chooseStep(stepIndex + 1))}
          >
            {last ? 'Back to exploring ↗' : 'Next chapter →'}
          </button>
        </div>
      </aside>
      <div className="learning-map-heading">
        <span className="micro">
          {lesson.curated ? 'FEATURED LESSON' : 'ANCESTRY EXPLORER'}
        </span>
        <h2>{lesson.title}</h2>
        <p>Follow the arrows. Branches can meet.</p>
      </div>
      <div className="learning-map-legend">
        <span>
          <i />
          Influence / evolution / family
        </span>
        <span>
          <i />
          Fusion
        </span>
        <small>Select a world to revisit its chapter.</small>
      </div>
    </>
  );
};

export default Learning;
