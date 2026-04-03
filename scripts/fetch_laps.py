"""
Fetch real lap-by-lap race positions for all 2024, 2025 and 2026 races using FastF1.
Also fetches:
  - stints (compound + lap range per driver)
  - safetyCars (SC/VSC lap ranges)
  - gapsByLap (gap to leader in seconds per driver per lap)
  - fastestLap (driver, lap, time string)
DNF drivers are filled in at their classified finishing position for all
remaining laps after they retire (so their line drops to the back).
Outputs one JSON file per race into src/data/laps/.
"""
import fastf1
import json
import os
import math

CACHE = os.path.join(os.path.dirname(__file__), '.f1cache')
fastf1.Cache.enable_cache(CACHE)

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'laps')
os.makedirs(OUT_DIR, exist_ok=True)

RACE_ID_MAP = {
    2024: {
        1:'bhr2024', 2:'sau2024', 3:'aus2024', 4:'jpn2024',
        5:'chn2024', 6:'mia2024', 7:'emi2024', 8:'mon2024',
        9:'can2024', 10:'esp2024', 11:'aut2024', 12:'gbr2024',
        13:'hun2024', 14:'bel2024', 15:'ned2024', 16:'ita2024',
        17:'aze2024', 18:'sgp2024', 19:'usa2024', 20:'mex2024',
        21:'bra2024', 22:'lvg2024', 23:'qat2024', 24:'adh2024',
    },
    2025: {
        1:'aus2025', 2:'chn2025', 3:'jpn2025', 4:'bhr2025',
        5:'sau2025', 6:'mia2025', 7:'emi2025', 8:'mon2025',
        9:'esp2025', 10:'can2025', 11:'aut2025', 12:'gbr2025',
        13:'bel2025', 14:'hun2025', 15:'ned2025', 16:'ita2025',
        17:'aze2025', 18:'sgp2025', 19:'usa2025', 20:'mex2025',
        21:'bra2025', 22:'lvg2025', 23:'qat2025', 24:'adh2025',
    },
    2026: {
        1:'aus2026', 2:'chn2026', 3:'jpn2026', 4:'bhr2026',
        5:'sau2026', 6:'mia2026', 7:'emi2026', 8:'mon2026',
        9:'esp2026', 10:'can2026', 11:'aut2026', 12:'gbr2026',
        13:'bel2026', 14:'hun2026', 15:'ned2026', 16:'ita2026',
        17:'aze2026', 18:'sgp2026', 19:'usa2026', 20:'mex2026',
        21:'bra2026', 22:'lvg2026', 23:'qat2026', 24:'adh2026',
    },
}

def fetch_race(year, round_num):
    race_id = RACE_ID_MAP[year][round_num]
    out_path = os.path.join(OUT_DIR, f'{race_id}.json')

    try:
        session = fastf1.get_session(year, round_num, 'R')
        session.load(laps=True, telemetry=False, weather=False, messages=False)
        laps = session.laps
        results = session.results

        if laps is None or laps.empty:
            print(f'  SKIP (no laps): {race_id}')
            return False

        total_laps = int(laps['LapNumber'].max())

        # Build classified position map
        classified_pos = {}
        retired_drivers = set()
        for _, row in results.iterrows():
            abbr = row['Abbreviation']
            pos = row['Position']
            if not abbr or (isinstance(pos, float) and math.isnan(pos)):
                continue
            classified_pos[abbr] = int(pos)
            status = str(row.get('Status', '') or '')
            finished = (status == 'Finished' or status.startswith('+') or
                        'Lap' in status or status == 'Lapped')
            if not finished:
                retired_drivers.add(abbr)

        # Build per-driver last lap seen and lap data
        last_lap_seen = {}
        driver_laps = {}
        for _, row in laps.iterrows():
            driver = row['Driver']
            lap_num = row['LapNumber']
            pos = row['Position']
            if not driver or math.isnan(float(lap_num)):
                continue
            lap_num = int(lap_num)
            if not (isinstance(pos, float) and math.isnan(pos)):
                pos_int = int(pos)
                if driver not in driver_laps:
                    driver_laps[driver] = {}
                driver_laps[driver][lap_num] = pos_int
                last_lap_seen[driver] = max(last_lap_seen.get(driver, 0), lap_num)

        # Fill DNF drivers' classified position for laps after retirement
        for driver, last_lap in last_lap_seen.items():
            if last_lap < total_laps and driver in classified_pos:
                dnf_pos = classified_pos[driver]
                for lap_num in range(last_lap + 1, total_laps + 1):
                    driver_laps[driver][lap_num] = dnf_pos

        # Build positionsByLap
        positions_by_lap = []
        for lap_num in range(1, total_laps + 1):
            positions = {}
            for driver, lap_data in driver_laps.items():
                if lap_num in lap_data:
                    positions[driver] = lap_data[lap_num]
            if positions:
                positions_by_lap.append({'lap': lap_num, 'positions': positions})

        # Override final lap with official classified result
        if positions_by_lap and classified_pos:
            final_positions = positions_by_lap[-1]['positions']
            for abbr in list(final_positions.keys()):
                if abbr in classified_pos:
                    final_positions[abbr] = classified_pos[abbr]

        # dnfLaps
        dnf_laps = {d: l for d, l in last_lap_seen.items()
                    if l < total_laps and d in retired_drivers}

        # ── NEW: Stints (compound groupings) ──────────────────────────────────
        stints = {}
        try:
            if 'Compound' in laps.columns:
                for driver_abbr in driver_laps.keys():
                    driver_lap_rows = laps[laps['Driver'] == driver_abbr].sort_values('LapNumber')
                    if driver_lap_rows.empty:
                        continue
                    driver_stints = []
                    current_compound = None
                    stint_start = None
                    for _, row in driver_lap_rows.iterrows():
                        ln = row['LapNumber']
                        if math.isnan(float(ln)):
                            continue
                        lap_n = int(ln)
                        raw = row.get('Compound', None)
                        compound = str(raw).upper().strip() if raw and str(raw) not in ('nan', 'None', '') else None
                        if not compound or compound in ('NAN', 'NONE', ''):
                            continue
                        if current_compound is None:
                            current_compound = compound
                            stint_start = lap_n
                        elif compound != current_compound:
                            driver_stints.append({
                                'startLap': stint_start,
                                'endLap': lap_n - 1,
                                'compound': current_compound,
                            })
                            current_compound = compound
                            stint_start = lap_n
                    if current_compound and stint_start is not None:
                        last = last_lap_seen.get(driver_abbr, total_laps)
                        driver_stints.append({
                            'startLap': stint_start,
                            'endLap': last,
                            'compound': current_compound,
                        })
                    if driver_stints:
                        stints[driver_abbr] = driver_stints
        except Exception as e:
            print(f'  Stints extraction failed: {e}')

        # ── NEW: Safety Car / VSC laps ─────────────────────────────────────────
        safety_cars = []
        try:
            if 'TrackStatus' in laps.columns:
                sc_by_lap = {}
                for _, row in laps.iterrows():
                    ln = row['LapNumber']
                    if math.isnan(float(ln)):
                        continue
                    lap_n = int(ln)
                    status = str(row.get('TrackStatus', '1') or '1')
                    if lap_n not in sc_by_lap:
                        if '4' in status:
                            sc_by_lap[lap_n] = 'SC'
                        elif '6' in status:
                            sc_by_lap[lap_n] = 'VSC'
                if sc_by_lap:
                    sorted_sc = sorted(sc_by_lap.keys())
                    i = 0
                    while i < len(sorted_sc):
                        start_lap = sorted_sc[i]
                        sc_type = sc_by_lap[start_lap]
                        end_lap = start_lap
                        while (i + 1 < len(sorted_sc)
                               and sorted_sc[i + 1] == end_lap + 1
                               and sc_by_lap[sorted_sc[i + 1]] == sc_type):
                            i += 1
                            end_lap = sorted_sc[i]
                        safety_cars.append({'startLap': start_lap, 'endLap': end_lap, 'type': sc_type})
                        i += 1
        except Exception as e:
            print(f'  Safety car detection failed: {e}')

        # ── NEW: Gap to leader by lap ──────────────────────────────────────────
        gaps_by_lap = []
        try:
            if 'Time' in laps.columns:
                for lap_n in range(1, total_laps + 1):
                    lap_rows = laps[laps['LapNumber'] == lap_n]
                    if lap_rows.empty:
                        continue
                    times = {}
                    for _, row in lap_rows.iterrows():
                        drv = row['Driver']
                        t = row.get('Time')
                        if t is not None and hasattr(t, 'total_seconds'):
                            ts = t.total_seconds()
                            if ts > 0:
                                times[drv] = ts
                    if not times:
                        continue
                    leader_time = min(times.values())
                    gaps = {drv: round(t - leader_time, 3) for drv, t in times.items()}
                    gaps_by_lap.append({'lap': lap_n, 'gaps': gaps})
        except Exception as e:
            print(f'  Gap computation failed: {e}')

        # ── NEW: Fastest lap ──────────────────────────────────────────────────
        fastest_lap_info = None
        try:
            if 'LapTime' in laps.columns:
                valid = laps[laps['LapTime'].notna()].copy()
                if 'IsAccurate' in laps.columns:
                    accurate = valid[valid['IsAccurate'].fillna(True)]
                    if not accurate.empty:
                        valid = accurate
                if not valid.empty:
                    idx = valid['LapTime'].idxmin()
                    row = valid.loc[idx]
                    lt = row['LapTime'].total_seconds()
                    m = int(lt // 60)
                    s = lt % 60
                    fastest_lap_info = {
                        'driver': row['Driver'],
                        'lap': int(row['LapNumber']),
                        'time': f'{m}:{s:06.3f}',
                    }
        except Exception as e:
            print(f'  Fastest lap failed: {e}')

        # ── Output ─────────────────────────────────────────────────────────────
        out_data = {
            'positionsByLap': positions_by_lap,
            'dnfLaps': dnf_laps,
            'stints': stints,
            'safetyCars': safety_cars,
            'gapsByLap': gaps_by_lap,
            'fastestLap': fastest_lap_info,
        }
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(out_data, f, separators=(',', ':'))

        dnfs = list(dnf_laps.keys())
        dnf_str = f' | DNFs: {dnfs}' if dnfs else ''
        sc_str = f' | SC/VSC: {len(safety_cars)}' if safety_cars else ''
        winner_pos = positions_by_lap[-1]['positions'] if positions_by_lap else {}
        p1 = [k for k, v in winner_pos.items() if v == 1]
        fl = f' | FL: {fastest_lap_info["driver"]} {fastest_lap_info["time"]}' if fastest_lap_info else ''
        print(f'  OK {race_id}: {total_laps} laps, winner={p1[0] if p1 else "?"}{dnf_str}{sc_str}{fl}')
        return True

    except Exception as e:
        print(f'  ERROR {race_id}: {e}')
        import traceback; traceback.print_exc()
        return False

for year in [2024, 2025, 2026]:
    print(f'\n=== {year} ===')
    schedule = fastf1.get_event_schedule(year, include_testing=False)
    for _, event in schedule.iterrows():
        rn = int(event['RoundNumber'])
        if rn not in RACE_ID_MAP[year]:
            continue
        fetch_race(year, rn)

print('\nDone.')
