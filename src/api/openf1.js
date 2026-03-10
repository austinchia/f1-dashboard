const BASE = 'https://api.openf1.org/v1';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`OpenF1 API error ${res.status} — ${path}`);
  return res.json();
}

const delay = ms => new Promise(r => setTimeout(r, ms));

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

export function clearCache(meetingKey) {
  cache.delete(meetingKey);
}

export async function fetchRaceBundle(meetingKey) {
  if (cache.has(meetingKey)) return cache.get(meetingKey);

  const session = await fetchRaceSession(meetingKey);
  if (!session) throw new Error('No race session found for this meeting.');

  const sk = session.session_key;

  // Serialize requests to stay within the free-tier 3 req/s rate limit.
  // Adding 400 ms between each call keeps us safely under the cap.
  const drivers = await fetchDrivers(sk);
  await delay(400);
  const laps = await fetchLaps(sk);
  await delay(400);
  const stints = await fetchStints(sk);
  await delay(400);
  const pits = await fetchPits(sk);

  const bundle = { session, drivers, laps, stints, pits };
  cache.set(meetingKey, bundle);
  return bundle;
}
