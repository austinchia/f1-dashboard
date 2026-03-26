"""
Fetches 2024 F1 race data using FastF1 and writes static JSON files
to src/data/ for consumption by the React app.

Run once before starting the dev server:
    pip install fastf1
    python scripts/fetch_race_data.py
"""

import json
import os
import fastf1

# Ensure output directory exists
os.makedirs(os.path.join("src", "data"), exist_ok=True)

# Enable FastF1 cache (avoids re-downloading on repeat runs)
fastf1.Cache.enable_cache("fastf1_cache")

# Team colors — FastF1 doesn't provide these, so we hardcode them
TEAM_COLORS = {
    "Red Bull Racing": "#3671C6",
    "McLaren": "#FF8000",
    "Ferrari": "#E8002D",
    "Mercedes": "#27F4D2",
    "Aston Martin": "#358C75",
    "Alpine": "#0093cc",
    "Williams": "#64C4FF",
    "RB": "#6692FF",
    "Kick Sauber": "#52E252",
    "Haas F1 Team": "#B6BABD",
}

RACES_CONFIG = [
    {"year": 2024, "name": "Bahrain",      "id": "bhr2024"},
    {"year": 2024, "name": "Saudi Arabia", "id": "sau2024"},
    {"year": 2024, "name": "Australia",    "id": "aus2024"},
]

races_index = []

for config in RACES_CONFIG:
    print(f"\nFetching {config['name']} {config['year']}...")
    session = fastf1.get_session(config["year"], config["name"], "R")
    session.load()

    # --- Race metadata ---
    event = session.event
    total_laps = int(session.laps["LapNumber"].max())

    # Format date cross-platform (avoid %-d which fails on Windows)
    event_date = event["EventDate"]
    date_str = event_date.strftime("%B ") + str(event_date.day) + event_date.strftime(", %Y")

    race_meta = {
        "id": config["id"],
        "label": event["EventName"],
        "circuit": event["Location"],
        "date": date_str,
        "laps": total_laps,
    }
    races_index.append(race_meta)

    # --- Driver list (only drivers who have lap data) ---
    drivers = []
    seen_abbrs = set()
    for drv_num in session.drivers:
        try:
            info = session.get_driver(drv_num)
            abbr = info["Abbreviation"]
            if abbr in seen_abbrs:
                continue
            seen_abbrs.add(abbr)
            team = info["TeamName"]
            drivers.append({
                "id": abbr,
                "name": info["FullName"],
                "team": team,
                "color": TEAM_COLORS.get(team, "#888888"),
            })
        except Exception:
            continue

    # Build abbreviation lookup: driver_number -> abbreviation
    num_to_abbr = {}
    for drv_num in session.drivers:
        try:
            info = session.get_driver(drv_num)
            num_to_abbr[str(drv_num)] = info["Abbreviation"]
        except Exception:
            continue

    # --- Positions by lap ---
    laps_df = session.laps[["DriverNumber", "LapNumber", "Position"]].copy()
    laps_df = laps_df.dropna(subset=["Position"])
    laps_df["Position"] = laps_df["Position"].astype(int)
    laps_df["LapNumber"] = laps_df["LapNumber"].astype(int)

    positions_by_lap = []
    for lap_num in range(1, total_laps + 1):
        lap_rows = laps_df[laps_df["LapNumber"] == lap_num]
        positions = {}
        for _, row in lap_rows.iterrows():
            abbr = num_to_abbr.get(str(int(row["DriverNumber"])))
            if abbr:
                positions[abbr] = int(row["Position"])
        if positions:
            positions_by_lap.append({"lap": lap_num, "positions": positions})

    # --- Write race JSON ---
    race_data = {
        "race": race_meta,
        "drivers": drivers,
        "positionsByLap": positions_by_lap,
    }
    out_path = os.path.join("src", "data", f"{config['id']}.json")
    with open(out_path, "w") as f:
        json.dump(race_data, f, indent=2)
    print(f"  Written {out_path} ({len(positions_by_lap)} laps, {len(drivers)} drivers)")

# --- Write races index ---
index_path = os.path.join("src", "data", "races.json")
with open(index_path, "w") as f:
    json.dump(races_index, f, indent=2)
print(f"\nWritten {index_path}")
print("\nDone. Run 'npm run dev' to start the app.")
