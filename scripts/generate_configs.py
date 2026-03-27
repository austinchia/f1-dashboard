"""
Generate raceConfigs.js from real FastF1 data in race_results.json.
Handles mid-season driver swaps with correct per-race driver arrays.
"""
import json, os

HERE = os.path.dirname(__file__)

with open(os.path.join(HERE, 'race_results.json'), encoding='utf-8') as f:
    data = json.load(f)

# Race ID mapping from round+year to our id scheme
RACE_ID_MAP_2024 = {
    1: 'bhr2024', 2: 'sau2024', 3: 'aus2024', 4: 'jpn2024',
    5: 'chn2024', 6: 'mia2024', 7: 'emi2024', 8: 'mon2024',
    9: 'can2024', 10: 'esp2024', 11: 'aut2024', 12: 'gbr2024',
    13: 'hun2024', 14: 'bel2024', 15: 'ned2024', 16: 'ita2024',
    17: 'aze2024', 18: 'sgp2024', 19: 'usa2024', 20: 'mex2024',
    21: 'bra2024', 22: 'lvg2024', 23: 'qat2024', 24: 'adh2024',
}
RACE_ID_MAP_2025 = {
    1: 'aus2025', 2: 'chn2025', 3: 'jpn2025', 4: 'bhr2025',
    5: 'sau2025', 6: 'mia2025', 7: 'emi2025', 8: 'mon2025',
    9: 'esp2025', 10: 'can2025', 11: 'aut2025', 12: 'gbr2025',
    13: 'bel2025', 14: 'hun2025', 15: 'ned2025', 16: 'ita2025',
    17: 'aze2025', 18: 'sgp2025', 19: 'usa2025', 20: 'mex2025',
    21: 'bra2025', 22: 'lvg2025', 23: 'qat2025', 24: 'adh2025',
}
RACE_ID_MAP_2026 = {
    1: 'aus2026', 2: 'chn2026', 3: 'jpn2026', 4: 'bhr2026',
    5: 'sau2026', 6: 'mia2026', 7: 'emi2026', 8: 'mon2026',
    9: 'esp2026', 10: 'can2026', 11: 'aut2026', 12: 'gbr2026',
    13: 'bel2026', 14: 'hun2026', 15: 'ned2026', 16: 'ita2026',
    17: 'aze2026', 18: 'sgp2026', 19: 'usa2026', 20: 'mex2026',
    21: 'bra2026', 22: 'lvg2026', 23: 'qat2026', 24: 'adh2026',
}

LABEL_MAP_2024 = {
    1:'Bahrain', 2:'Saudi Arabia', 3:'Australia', 4:'Japan',
    5:'China', 6:'Miami', 7:'Emilia Romagna', 8:'Monaco',
    9:'Canada', 10:'Spain', 11:'Austria', 12:'Great Britain',
    13:'Hungary', 14:'Belgium', 15:'Netherlands', 16:'Italy',
    17:'Azerbaijan', 18:'Singapore', 19:'United States', 20:'Mexico',
    21:'Brazil', 22:'Las Vegas', 23:'Qatar', 24:'Abu Dhabi',
}
LABEL_MAP_2025 = {
    1:'Australia', 2:'China', 3:'Japan', 4:'Bahrain',
    5:'Saudi Arabia', 6:'Miami', 7:'Emilia Romagna', 8:'Monaco',
    9:'Spain', 10:'Canada', 11:'Austria', 12:'Great Britain',
    13:'Belgium', 14:'Hungary', 15:'Netherlands', 16:'Italy',
    17:'Azerbaijan', 18:'Singapore', 19:'United States', 20:'Mexico',
    21:'Brazil', 22:'Las Vegas', 23:'Qatar', 24:'Abu Dhabi',
}
LABEL_MAP_2026 = {
    1:'Australia', 2:'China', 3:'Japan', 4:'Bahrain',
    5:'Saudi Arabia', 6:'Miami', 7:'Emilia Romagna', 8:'Monaco',
    9:'Spain', 10:'Canada', 11:'Austria', 12:'Great Britain',
    13:'Belgium', 14:'Hungary', 15:'Netherlands', 16:'Italy',
    17:'Azerbaijan', 18:'Singapore', 19:'United States', 20:'Mexico',
    21:'Brazil', 22:'Las Vegas', 23:'Qatar', 24:'Abu Dhabi',
}

CIRCUIT_MAP_2024 = {
    1:'Sakhir', 2:'Jeddah', 3:'Melbourne', 4:'Suzuka',
    5:'Shanghai', 6:'Miami', 7:'Imola', 8:'Monaco',
    9:'Montreal', 10:'Barcelona', 11:'Spielberg', 12:'Silverstone',
    13:'Budapest', 14:'Spa', 15:'Zandvoort', 16:'Monza',
    17:'Baku', 18:'Marina Bay', 19:'Austin', 20:'Mexico City',
    21:'São Paulo', 22:'Las Vegas', 23:'Lusail', 24:'Yas Marina',
}
CIRCUIT_MAP_2025 = {
    1:'Melbourne', 2:'Shanghai', 3:'Suzuka', 4:'Sakhir',
    5:'Jeddah', 6:'Miami', 7:'Imola', 8:'Monaco',
    9:'Barcelona', 10:'Montreal', 11:'Spielberg', 12:'Silverstone',
    13:'Spa', 14:'Budapest', 15:'Zandvoort', 16:'Monza',
    17:'Baku', 18:'Marina Bay', 19:'Austin', 20:'Mexico City',
    21:'São Paulo', 22:'Las Vegas', 23:'Lusail', 24:'Yas Marina',
}
CIRCUIT_MAP_2026 = {
    1:'Melbourne', 2:'Shanghai', 3:'Suzuka', 4:'Sakhir',
    5:'Jeddah', 6:'Miami', 7:'Imola', 8:'Monaco',
    9:'Barcelona', 10:'Montreal', 11:'Spielberg', 12:'Silverstone',
    13:'Spa', 14:'Budapest', 15:'Zandvoort', 16:'Monza',
    17:'Baku', 18:'Marina Bay', 19:'Austin', 20:'Mexico City',
    21:'São Paulo', 22:'Las Vegas', 23:'Lusail', 24:'Yas Marina',
}

def make_config(race_data, year, race_id_map, label_map, circuit_map):
    rn = race_data['round']
    race_id = race_id_map[rn]
    finish = race_data['finish']
    grid = race_data['grid']

    # Use FastF1 per-race driver data (authoritative team/color per race)
    race_drivers = {d['id']: d for d in race_data.get('drivers', [])}

    # Build participants in finish order then any grid-only drivers
    participants = []
    seen = set()
    for abbr in (finish + [g for g in grid if g not in finish]):
        if abbr not in seen and abbr in race_drivers:
            participants.append(race_drivers[abbr])
            seen.add(abbr)

    # Filter grid/finish to only drivers with FastF1 data
    finish_clean = [a for a in finish if a in race_drivers]
    grid_clean = [a for a in grid if a in race_drivers]

    # Determine laps from races.json (use the FastF1 session laps field if available)
    # We'll use a hardcoded map matching races.json
    laps_map_2024 = {1:57,2:50,3:58,4:53,5:56,6:57,7:63,8:78,
                     9:70,10:66,11:71,12:52,13:70,14:44,15:72,16:53,
                     17:51,18:62,19:56,20:71,21:71,22:50,23:57,24:58}
    laps_map_2025 = {1:58,2:56,3:53,4:57,5:50,6:57,7:63,8:78,
                     9:66,10:70,11:71,12:52,13:44,14:70,15:72,16:53,
                     17:51,18:62,19:56,20:71,21:71,22:50,23:57,24:58}
    laps_map_2026 = {1:58,2:56,3:53,4:57,5:50,6:57,7:63,8:78,
                     9:66,10:70,11:71,12:52,13:44,14:70,15:72,16:53,
                     17:51,18:62,19:56,20:71,21:71,22:50,23:57,24:58}
    if year == 2024:
        laps_map = laps_map_2024
    elif year == 2025:
        laps_map = laps_map_2025
    else:
        laps_map = laps_map_2026

    return {
        'race': {
            'id': race_id,
            'label': label_map[rn],
            'circuit': circuit_map[rn],
            'date': race_data['date'],
            'laps': laps_map[rn],
        },
        'drivers': participants,
        'grid': grid_clean,
        'finish': finish_clean,
    }

configs_2024 = []
for r in data['2024']:
    configs_2024.append(make_config(r, 2024, RACE_ID_MAP_2024, LABEL_MAP_2024, CIRCUIT_MAP_2024))

configs_2025 = []
for r in data['2025']:
    configs_2025.append(make_config(r, 2025, RACE_ID_MAP_2025, LABEL_MAP_2025, CIRCUIT_MAP_2025))

configs_2026 = []
for r in data.get('2026', []):
    configs_2026.append(make_config(r, 2026, RACE_ID_MAP_2026, LABEL_MAP_2026, CIRCUIT_MAP_2026))

# --- Generate JS ---
def js_driver(d):
    return f"  {{ id: '{d['id']}', name: '{d['name']}', team: '{d['team']}', color: '{d['color']}' }}"

def js_arr(items):
    return "['{}']".format("', '".join(items))

def js_config(c):
    r = c['race']
    drivers_js = ',\n'.join(js_driver(d) for d in c['drivers'])
    return (
        f"  {{\n"
        f"    race: {{ id: '{r['id']}', label: '{r['label']}', circuit: '{r['circuit']}', date: '{r['date']}', laps: {r['laps']} }},\n"
        f"    drivers: [\n{drivers_js}\n    ],\n"
        f"    grid: {js_arr(c['grid'])},\n"
        f"    finish: {js_arr(c['finish'])},\n"
        f"  }}"
    )

lines = []
lines.append("export const RACE_CONFIGS = [")
lines.append(",\n".join(js_config(c) for c in configs_2024))
lines.append("];")
lines.append("")
lines.append("export const RACE_CONFIGS_2025 = [")
lines.append(",\n".join(js_config(c) for c in configs_2025))
lines.append("];")
lines.append("")
lines.append("export const RACE_CONFIGS_2026 = [")
lines.append(",\n".join(js_config(c) for c in configs_2026))
lines.append("];")

out_js = "\n".join(lines) + "\n"

out_path = os.path.join(HERE, '..', 'src', 'data', 'raceConfigs.js')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(out_js)

print(f"Written {len(configs_2024)} 2024, {len(configs_2025)} 2025, and {len(configs_2026)} 2026 configs to raceConfigs.js")
# Spot check
for c in configs_2024 + configs_2025 + configs_2026:
    print(f"  {c['race']['id']}: winner={c['finish'][0]}, pole={c['grid'][0]}, drivers={len(c['drivers'])}")
