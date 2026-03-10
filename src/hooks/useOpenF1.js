import { useState, useEffect, useRef } from 'react';
import { fetchMeetings, fetchRaceBundle } from '../api/openf1';
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

  useEffect(() => {
    if (!meetingKey || meetingKey === prevKey.current) return;
    prevKey.current = meetingKey;

    setLoading(true);
    setError(null);
    setData(null);

    fetchRaceBundle(meetingKey)
      .then(bundle => {
        const transformed = transformBundle(bundle);
        setData(transformed);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [meetingKey]);

  return { data, loading, error };
}
