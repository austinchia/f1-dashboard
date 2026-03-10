import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMeetings, fetchRaceBundle, clearCache } from '../api/openf1';
import { transformBundle } from '../api/transform';

export function useMeetings(year = 2026) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchMeetings(year)
      .then(data => {
        // Only show past/ongoing meetings (date_start <= now)
        const now = new Date();
        const past = data.filter(m => new Date(m.date_start) <= now);
        setMeetings(past);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [year]);

  return { meetings, loading, error };
}

export function useRaceData(meetingKey) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevKey = useRef(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!meetingKey) return;
    // Allow retry (retryCount changes) or new meeting
    if (meetingKey === prevKey.current && retryCount === 0) return;
    prevKey.current = meetingKey;

    setLoading(true);
    setError(null);
    setData(null);

    fetchRaceBundle(meetingKey)
      .then(bundle => {
        const transformed = transformBundle(bundle);
        setData(transformed);
      })
      .catch(err => {
        console.error('[OpenF1] fetch failed:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [meetingKey, retryCount]);

  const retry = useCallback(() => {
    if (meetingKey) clearCache(meetingKey);
    setRetryCount(c => c + 1);
  }, [meetingKey]);

  return { data, loading, error, retry };
}
