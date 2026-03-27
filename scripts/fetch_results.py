"""
Fetch real F1 race results using FastF1 and output JS-compatible data.
"""
import fastf1
import json
import os

CACHE = os.path.join(os.path.dirname(__file__), '.f1cache')
fastf1.Cache.enable_cache(CACHE)

def fmt_date(d):
    try:
        return d.strftime('%B %d, %Y').replace(' 0', ' ')
    except Exception:
        return str(d)

def get_season_results(year):
    schedule = fastf1.get_event_schedule(year, include_testing=False)
    races = []

    for _, event in schedule.iterrows():
        round_num = int(event['RoundNumber'])
        event_name = event['EventName']

        try:
            session = fastf1.get_session(year, round_num, 'R')
            session.load(laps=False, telemetry=False, weather=False, messages=False)
            results = session.results

            if results is None or results.empty:
                print(f"  SKIP (no results): R{round_num} {event_name}")
                continue

            # Sort by finishing position (Position col is float)
            finished = results.dropna(subset=['Position']).sort_values('Position')
            finish_order = [row['Abbreviation'] for _, row in finished.iterrows() if row['Abbreviation']]

            # Sort by grid position
            grid_df = results.dropna(subset=['GridPosition']).sort_values('GridPosition')
            grid_order = [row['Abbreviation'] for _, row in grid_df.iterrows() if row['Abbreviation'] and row['GridPosition'] > 0]

            # Append any classified drivers not in grid (pit lane starts)
            grid_set = set(grid_order)
            for abbr in finish_order:
                if abbr not in grid_set:
                    grid_order.append(abbr)

            # Build per-driver info with FastF1 team/color (authoritative per race)
            drivers = []
            seen = set()
            for _, row in results.sort_values('Position').iterrows():
                abbr = row['Abbreviation']
                if not abbr or abbr in seen:
                    continue
                seen.add(abbr)
                team = row.get('TeamName', '') or ''
                color = row.get('TeamColor', '888888') or '888888'
                drivers.append({
                    'id': abbr,
                    'name': f"{row.get('FirstName','')} {row.get('LastName','')}".strip(),
                    'team': team,
                    'color': f'#{color}',
                })

            races.append({
                'round': round_num,
                'country': event['Country'],
                'location': event['Location'],
                'event_name': event_name,
                'date': fmt_date(event['EventDate']),
                'grid': grid_order,
                'finish': finish_order,
                'drivers': drivers,
            })
            winner = finish_order[0] if finish_order else '?'
            print(f"  OK R{round_num:2d}: {event_name:<30} Winner: {winner}  Grid P1: {grid_order[0] if grid_order else '?'}")

        except Exception as e:
            print(f"  ERROR R{round_num} {event_name}: {e}")

    return races

print("=== Fetching 2024 ===")
results_2024 = get_season_results(2024)
print(f"Got {len(results_2024)} races\n")

print("=== Fetching 2025 ===")
results_2025 = get_season_results(2025)
print(f"Got {len(results_2025)} races\n")

print("=== Fetching 2026 ===")
results_2026 = get_season_results(2026)
print(f"Got {len(results_2026)} races\n")

output = {'2024': results_2024, '2025': results_2025, '2026': results_2026}
out_path = os.path.join(os.path.dirname(__file__), 'race_results.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"Saved to {out_path}")
