"""
Fetch real lap-by-lap race positions for all 2024 and 2025 races using FastF1.
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

        # Build classified position map: driver -> final classified position
        # Also track which drivers actually retired (vs just being lapped)
        classified_pos = {}
        retired_drivers = set()
        for _, row in results.iterrows():
            abbr = row['Abbreviation']
            pos = row['Position']
            if not abbr or (isinstance(pos, float) and math.isnan(pos)):
                continue
            classified_pos[abbr] = int(pos)
            status = str(row.get('Status', '') or '')
            # A driver truly retired if status isn't Finished/Lapped/+X Lap(s)
            finished = (status == 'Finished' or status.startswith('+') or
                        'Lap' in status or status == 'Lapped')
            if not finished:
                retired_drivers.add(abbr)

        # Build per-driver last lap seen
        last_lap_seen = {}
        driver_laps = {}  # driver -> {lap_num -> position}
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

        # For DNF drivers: fill their classified position for laps after retirement
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

        # Override final lap positions with official classified result so
        # post-race penalties (e.g. time penalties) are reflected correctly
        if positions_by_lap and classified_pos:
            final_positions = positions_by_lap[-1]['positions']
            for abbr in list(final_positions.keys()):
                if abbr in classified_pos:
                    final_positions[abbr] = classified_pos[abbr]

        # dnfLaps: only drivers who actually retired (not lapped finishers)
        dnf_laps = {d: l for d, l in last_lap_seen.items()
                    if l < total_laps and d in retired_drivers}

        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump({'positionsByLap': positions_by_lap, 'dnfLaps': dnf_laps}, f, separators=(',', ':'))

        # Report DNFs
        dnfs = list(dnf_laps.keys())
        dnf_str = f' | DNFs: {dnfs}' if dnfs else ''
        winner_pos = positions_by_lap[-1]['positions'] if positions_by_lap else {}
        p1 = [k for k, v in winner_pos.items() if v == 1]
        print(f'  OK {race_id}: {total_laps} laps, winner={p1[0] if p1 else "?"}{dnf_str}')
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
