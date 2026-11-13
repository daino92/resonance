import { useEffect, useRef, useState } from 'react';
import { findPreview, type Preview } from '@/api';
import { type Work } from '@/data';

export const useAudioPreview = (track: Work) => {
  const audio = useRef<HTMLAudioElement>(null);
  const request = useRef(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState('');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    request.current++;
    audio.current?.pause();
    audio.current?.removeAttribute('src');
    audio.current?.load();
    setPreview(null);
    setStatus('');
    setTime(0);
    setDuration(0);
    setLoading(false);
    setPlaying(false);

    return () => {
      request.current++;
    };
  }, [track.title, track.artist]);

  const play = async () => {
    if (playing) {
      audio.current?.pause();

      return;
    }

    if (preview) {
      try {
        await audio.current?.play();
      } catch {
        setStatus('Playback unavailable. Open the track on Apple Music.');
      }

      return;
    }

    const current = ++request.current;

    setLoading(true);
    setStatus('Finding a preview…');

    try {
      const match = await findPreview(track);

      if (current !== request.current) {
        return;
      }

      if (!match) {
        setStatus(
          'No matching preview. Try another track or open Apple Music.',
        );

        return;
      }

      setPreview(match);
      setStatus('');

      const element = audio.current;

      if (!element) {
        return;
      }

      element.src = match.previewUrl;

      try {
        await element.play();
      } catch {
        setStatus('Preview ready. Press play to listen.');
      }
    } catch {
      if (current === request.current) {
        setStatus('Preview service unavailable. Listening links still work.');
      }
    } finally {
      if (current === request.current) {
        setLoading(false);
      }
    }
  };

  return {
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
  };
};
