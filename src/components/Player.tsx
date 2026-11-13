import { type Work } from '@/data';
import { useAudioPreview } from '@/hooks';
import { seconds } from '@/utils';

interface PlayerProps {
  track: Work;
}

const Player = ({ track }: PlayerProps) => {
  const {
    audio,
    preview,
    status,
    playing,
    loading,
    time,
    duration,
    play,
    setPlaying,
    setStatus,
    setTime,
    setDuration,
  } = useAudioPreview(track);

  if (!track.title) {
    return (
      <section className="player" aria-label="Music preview player">
        <div className="track-info">
          <span className="micro">{track.artist.toUpperCase()}</span>
          <strong>Explore the essential albums</strong>
          <p className="player-status">
            No individual preview is curated for this world yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="player" aria-label="Music preview player">
      <audio
        ref={audio}
        preload="none"
        onPlay={() => {
          setPlaying(true);
          setStatus('');
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={() => setTime(audio.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audio.current?.duration || 0)}
        onError={() => {
          setPlaying(false);
          setStatus('This preview cannot be played. Try the listening link.');
        }}
      />
      <button
        className={'play-button ' + (playing ? 'playing' : '')}
        onClick={play}
        disabled={loading}
        aria-label={
          playing ? 'Pause preview' : `Play preview of ${track.title}`
        }
      >
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          {playing ? (
            <path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor" />
          ) : (
            <path d="M7 4l13 8-13 8z" fill="currentColor" />
          )}
        </svg>
      </button>
      {preview ? (
        <img
          className="cover"
          src={preview.artworkUrl100}
          alt={`${preview.trackName} cover`}
        />
      ) : (
        <div className="record" aria-hidden="true">
          <i />
        </div>
      )}
      <div className="track-info">
        <span className="micro">A FIRST LISTEN</span>
        <strong>{preview?.trackName || track.title}</strong>
        <span>{preview?.artistName || track.artist}</span>
        <p className="player-status" role="status">
          {status || 'Previews provided courtesy of iTunes'}
        </p>
      </div>
      <div className="player-end">
        <a
          href={
            preview?.trackViewUrl ||
            `https://music.apple.com/us/search?term=${encodeURIComponent(track.artist + ' ' + track.title)}`
          }
          target="_blank"
          rel="noreferrer"
        >
          {preview ? 'Listen on Apple Music ↗' : 'Find on Apple Music ↗'}
        </a>
        <div className="seek">
          <span>{seconds(time)}</span>
          <input
            aria-label="Seek preview"
            type="range"
            min="0"
            max={duration || 1}
            step="0.1"
            value={time}
            disabled={!duration}
            onChange={(e) => {
              if (audio.current) {
                audio.current.currentTime = Number(e.target.value);
              }
            }}
          />
          <span>{seconds(duration)}</span>
        </div>
      </div>
    </section>
  );
};

export default Player;
