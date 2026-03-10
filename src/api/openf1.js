const BASE = 'https://api.openf1.org/v1';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`OpenF1 ${res.status}: ${path}`);
  return res.json();
}

export async function fetchMeetings(year = 2026) {
  return get(`/meetings?year=${year}`);
}

export async function fetchRaceSession(meetingKey) {
  const sessions = await get(`/sessions?meeting_key=${meetingKey}&session_name=Race`);
  return sessions[0] ?? null;
}

export async function fetchDrivers(sessionKey) {
  return get(`/drivers?session_key=${sessionKey}`);
}

export async function fetchLaps(sessionKey) {
  return get(`/laps?session_key=${sessionKey}`);
}

export async function fetchStints(sessionKey) {
  return get(`/stints?session_key=${sessionKey}`);
}

export async function fetchPits(sessionKey) {
  return get(`/pit?session_key=${sessionKey}`);
}

// Cache wrapper — avoids re-fetching same session in same browser tab
const cache = new Map();

export async function fetchRaceBundle(meetingKey) {
  if (cache.has(meetingKey)) return cache.get(meetingKey);

  const session = await fetchRaceSession(meetingKey);
  if (!session) throw new Error('No race session found for this meeting.');

  const sk = session.session_key;

  // Fetch drivers, laps, stints and pits in parallel (respects 3 req/s easily)
  const [drivers, laps, stints, pits] = await Promise.all([
    fetchDrivers(sk),
    fetchLaps(sk),
    fetchStints(sk),
    fetchPits(sk),
  ]);

  const bundle = { session, drivers, laps, stints, pits };
  cache.set(meetingKey, bundle);
  return bundle;
}
