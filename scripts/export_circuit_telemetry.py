"""Export FastF1 position telemetry into compact frontend-friendly circuit progress samples.

This script is intentionally offline/preprocessing oriented. It fetches one race session
through FastF1, aligns the session's X/Y position space to the repo's GeoJSON track shape,
and exports compact time-sampled progress data for Circuit Focus playback.

Example:
    python scripts/export_circuit_telemetry.py --race-id aus2024
"""

from __future__ import annotations

import argparse
import json
import math
from bisect import bisect_right
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

import fastf1

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "fastf1_cache"
RACES_PATH = ROOT / "src" / "data" / "races.json"
CIRCUITS_PATH = ROOT / "src" / "data" / "f1-circuits.geojson"
OUT_DIR = ROOT / "public" / "telemetry"

CACHE_DIR.mkdir(parents=True, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


def normalize_value(value: object) -> str:
    text = str(value or "")
    normalized = (
        text.encode("ascii", "ignore").decode("ascii").lower().strip()
    )
    return " ".join("".join(ch if ch.isalnum() else " " for ch in normalized).split())


LOCATION_ALIASES = {
    normalize_value("Marina Bay"): "Singapore",
    normalize_value("Spa"): "Spa Francorchamps",
    normalize_value("Sao Paulo"): "Sao Paulo",
    normalize_value("São Paulo"): "Sao Paulo",
}


def load_json(path: Path) -> object:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def resolve_requested_circuit_name(circuit_name: str) -> str:
    return LOCATION_ALIASES.get(normalize_value(circuit_name), circuit_name)


def get_race_metadata(race_id: str) -> dict:
    races = load_json(RACES_PATH)
    for race in races:
        if race.get("id") == race_id:
            return race
    raise KeyError(f"Unknown race id: {race_id}")


def get_circuit_feature(circuit_name: str) -> dict:
    collection = load_json(CIRCUITS_PATH)
    requested = normalize_value(resolve_requested_circuit_name(circuit_name))

    for feature in collection.get("features", []):
        props = feature.get("properties", {})
        location = normalize_value(props.get("Location"))
        name = normalize_value(props.get("Name"))
        if location == requested or name == requested:
            return feature

    raise KeyError(f"No GeoJSON circuit found for: {circuit_name}")


Point = Tuple[float, float]
Segment = Dict[str, float]


def normalize_points(points: Sequence[Point]) -> List[Point]:
    xs = [x for x, _ in points]
    ys = [y for _, y in points]
    min_x = min(xs)
    max_x = max(xs)
    min_y = min(ys)
    max_y = max(ys)
    span_x = max(max_x - min_x, 1e-12)
    span_y = max(max_y - min_y, 1e-12)

    return [((x - min_x) / span_x, (y - min_y) / span_y) for x, y in points]


def build_track_model(coords: Sequence[Point]) -> dict:
    points = normalize_points(coords)
    segments: List[Segment] = []
    total_length = 0.0

    for idx in range(len(points) - 1):
        ax, ay = points[idx]
        bx, by = points[idx + 1]
        length = math.hypot(bx - ax, by - ay)
        segments.append(
            {
                "ax": ax,
                "ay": ay,
                "bx": bx,
                "by": by,
                "length": length,
                "cumulative_start": total_length,
            }
        )
        total_length += length

    return {
        "points": points,
        "segments": segments,
        "total_length": max(total_length, 1e-12),
    }


def apply_transform(point: Point, swap_xy: bool, flip_x: bool, flip_y: bool) -> Point:
    x, y = point
    if swap_xy:
        x, y = y, x
    if flip_x:
        x = 1.0 - x
    if flip_y:
        y = 1.0 - y
    return x, y


def project_point_to_segment(point: Point, seg: Segment) -> Tuple[Point, float]:
    px, py = point
    ax = seg["ax"]
    ay = seg["ay"]
    bx = seg["bx"]
    by = seg["by"]
    abx = bx - ax
    aby = by - ay
    ab2 = abx * abx + aby * aby

    if ab2 <= 1e-15:
        return (ax, ay), 0.0

    apx = px - ax
    apy = py - ay
    t = (apx * abx + apy * aby) / ab2
    t = max(0.0, min(1.0, t))
    qx = ax + t * abx
    qy = ay + t * aby
    return (qx, qy), t


def project_point_to_track(point: Point, track_model: dict) -> dict:
    best = None
    for seg in track_model["segments"]:
        projected, t = project_point_to_segment(point, seg)
        qx, qy = projected
        dx = point[0] - qx
        dy = point[1] - qy
        d2 = dx * dx + dy * dy
        if best is None or d2 < best["distance_sq"]:
            distance_along = seg["cumulative_start"] + t * seg["length"]
            best = {
                "distance_sq": d2,
                "distance_along": distance_along,
                "progress": distance_along / track_model["total_length"],
                "projected": projected,
            }
    return best


def choose_best_alignment(
    track_model: dict,
    telemetry_points: Sequence[Point],
    max_alignment_points: int,
) -> dict:
    if not telemetry_points:
        raise ValueError("No telemetry points available for alignment")

    normalized_telemetry = normalize_points(telemetry_points)
    alignment_step = max(1, len(normalized_telemetry) // max(max_alignment_points, 1))
    candidates = []

    for swap_xy in (False, True):
        for flip_x in (False, True):
            for flip_y in (False, True):
                total_error = 0.0
                sample_count = 0
                for point in normalized_telemetry[::alignment_step]:
                    transformed = apply_transform(point, swap_xy, flip_x, flip_y)
                    projected = project_point_to_track(transformed, track_model)
                    total_error += projected["distance_sq"]
                    sample_count += 1
                candidates.append(
                    {
                        "swap_xy": swap_xy,
                        "flip_x": flip_x,
                        "flip_y": flip_y,
                        "avg_error": total_error / max(sample_count, 1),
                    }
                )

    return min(candidates, key=lambda item: item["avg_error"])


def session_time_to_ms(value) -> Optional[int]:
    if value is None:
        return None
    if hasattr(value, "total_seconds"):
        total_seconds = value.total_seconds()
        if math.isnan(total_seconds):
            return None
        return int(round(total_seconds * 1000))
    return None


def extract_track_status_timeline(track_status) -> List[Tuple[int, str]]:
    timeline: List[Tuple[int, str]] = []
    if track_status is None or len(track_status) == 0:
        return timeline

    time_col = None
    status_col = None
    for candidate in ("Time", "SessionTime"):
        if candidate in track_status.columns:
            time_col = candidate
            break
    for candidate in ("Status", "Message"):
        if candidate in track_status.columns:
            status_col = candidate
            break
    if time_col is None or status_col is None:
        return timeline

    for _, row in track_status.iterrows():
        t = session_time_to_ms(row.get(time_col))
        status = row.get(status_col)
        if t is None or status is None:
            continue
        timeline.append((t, str(status)))

    timeline.sort(key=lambda item: item[0])
    return timeline


def extract_session_status_timeline(session_status) -> List[Tuple[int, str]]:
    timeline: List[Tuple[int, str]] = []
    if session_status is None or len(session_status) == 0:
        return timeline

    time_col = None
    status_col = None
    for candidate in ("Time", "SessionTime"):
        if candidate in session_status.columns:
            time_col = candidate
            break
    for candidate in ("Status", "Message"):
        if candidate in session_status.columns:
            status_col = candidate
            break
    if time_col is None or status_col is None:
        return timeline

    for _, row in session_status.iterrows():
        t = session_time_to_ms(row.get(time_col))
        status = row.get(status_col)
        if t is None or status is None:
            continue
        timeline.append((t, str(status)))

    timeline.sort(key=lambda item: item[0])
    return timeline


def lookup_track_status(t_ms: int, timeline: Sequence[Tuple[int, str]]) -> Optional[str]:
    if not timeline:
        return None
    times = [item[0] for item in timeline]
    idx = bisect_right(times, t_ms) - 1
    if idx < 0:
        return None
    return timeline[idx][1]


def detect_race_start_time(session_status_timeline: Sequence[Tuple[int, str]]) -> Optional[int]:
    for t_ms, status in session_status_timeline:
        normalized = str(status).strip().lower()
        if normalized == "started":
            return t_ms
    return None


def detect_race_end_time(session_status_timeline: Sequence[Tuple[int, str]]) -> Optional[int]:
    for t_ms, status in session_status_timeline:
        normalized = str(status).strip().lower()
        if normalized == "finished":
            return t_ms
    return None


def collect_driver_samples(
    pos_df,
    alignment: dict,
    track_model: dict,
    driver_sample_step: int,
    include_projected_xy: bool,
) -> List[dict]:
    points_raw: List[Point] = []
    for _, row in pos_df.iterrows():
        x = row.get("X")
        y = row.get("Y")
        if x is None or y is None:
            continue
        try:
            xf = float(x)
            yf = float(y)
        except (TypeError, ValueError):
            continue
        if math.isnan(xf) or math.isnan(yf):
            continue
        points_raw.append((xf, yf))

    if not points_raw:
        return []

    normalized_points = normalize_points(points_raw)
    projected_samples: List[dict] = []
    normalized_index = 0

    for row_index, (_, row) in enumerate(pos_df.iterrows()):
        if row_index % max(driver_sample_step, 1) != 0:
            continue
        t_ms = session_time_to_ms(row.get("SessionTime"))
        x = row.get("X")
        y = row.get("Y")
        status = row.get("Status")
        if t_ms is None:
            continue
        try:
            xf = float(x)
            yf = float(y)
        except (TypeError, ValueError):
            continue
        if math.isnan(xf) or math.isnan(yf):
            continue

        normalized = normalized_points[normalized_index]
        normalized_index += 1
        transformed = apply_transform(
            normalized,
            alignment["swap_xy"],
            alignment["flip_x"],
            alignment["flip_y"],
        )
        projection = project_point_to_track(transformed, track_model)
        projected_samples.append(
            {
                "t": t_ms,
                "progress": round(projection["progress"], 6),
                "status": str(status) if status is not None else None,
            }
        )
        if include_projected_xy:
            projected_samples[-1]["x"] = round(projection["projected"][0], 6)
            projected_samples[-1]["y"] = round(projection["projected"][1], 6)

    projected_samples.sort(key=lambda item: item["t"])
    return projected_samples


def build_timeline(pos_data: dict, sample_ms: int) -> List[int]:
    max_time = 0
    for df in pos_data.values():
        if df is None or df.empty or "SessionTime" not in df.columns:
            continue
        last_t = session_time_to_ms(df.iloc[-1].get("SessionTime"))
        if last_t is not None:
            max_time = max(max_time, last_t)
    return list(range(0, max_time + sample_ms, sample_ms))


def sample_driver_at_time(samples: Sequence[dict], t_ms: int) -> Optional[dict]:
    if not samples:
        return None
    times = [item["t"] for item in samples]
    idx = bisect_right(times, t_ms) - 1
    if idx < 0:
        return None
    return samples[idx]


def find_first_sample_time(driver_samples: Dict[str, Sequence[dict]]) -> int:
    first_times = [
        samples[0]["t"]
        for samples in driver_samples.values()
        if samples
    ]
    return min(first_times) if first_times else 0


def detect_formation_lap_start_time(
    driver_samples: Dict[str, Sequence[dict]],
    timeline: Sequence[int],
    race_start_time: Optional[int],
    movement_threshold: float = 0.0025,
    minimum_moving_drivers: int = 4,
) -> Optional[int]:
    if race_start_time is None:
        return None

    baseline_progress_by_driver = {
        driver: samples[0]["progress"]
        for driver, samples in driver_samples.items()
        if samples
    }
    if not baseline_progress_by_driver:
        return None

    for t_ms in timeline:
        if t_ms >= race_start_time:
            break

        moving_drivers = 0
        for driver, baseline_progress in baseline_progress_by_driver.items():
            state = sample_driver_at_time(driver_samples.get(driver, []), t_ms)
            if state is None:
                continue

            delta = abs(state["progress"] - baseline_progress)
            wrapped_delta = min(delta, 1.0 - delta)
            if wrapped_delta >= movement_threshold:
                moving_drivers += 1

        if moving_drivers >= minimum_moving_drivers:
            return t_ms

    return None


def export_race_telemetry(
    race_id: str,
    sample_ms: int,
    max_alignment_points: int,
    driver_sample_step: int,
    include_projected_xy: bool,
) -> Path:
    race = get_race_metadata(race_id)
    circuit_feature = get_circuit_feature(race["circuit"])
    circuit_coords = circuit_feature["geometry"]["coordinates"]
    track_model = build_track_model(circuit_coords)

    session = fastf1.get_session(race["year"], race["label"], "R")
    session.load(laps=True, telemetry=True, weather=False, messages=False)

    telemetry_points: List[Point] = []
    for df in session.pos_data.values():
        if df is None or df.empty:
            continue
        for _, row in df.iterrows():
            x = row.get("X")
            y = row.get("Y")
            if x is None or y is None:
                continue
            try:
                xf = float(x)
                yf = float(y)
            except (TypeError, ValueError):
                continue
            if math.isnan(xf) or math.isnan(yf):
                continue
            telemetry_points.append((xf, yf))

    alignment = choose_best_alignment(track_model, telemetry_points, max_alignment_points)
    driver_samples = {
        driver: collect_driver_samples(
            df,
            alignment,
            track_model,
            driver_sample_step,
            include_projected_xy,
        )
        for driver, df in session.pos_data.items()
        if df is not None and not df.empty
    }
    first_sample_time = find_first_sample_time(driver_samples)

    track_status_timeline = extract_track_status_timeline(getattr(session, "track_status", None))
    session_status_timeline = extract_session_status_timeline(getattr(session, "session_status", None))
    race_start_time = detect_race_start_time(session_status_timeline)
    race_end_time = detect_race_end_time(session_status_timeline)
    timeline = build_timeline(session.pos_data, sample_ms)
    formation_lap_start_time = detect_formation_lap_start_time(
        driver_samples,
        timeline,
        race_start_time,
    )

    samples = []
    for t_ms in timeline:
        rebased_t_ms = max(0, t_ms - first_sample_time)
        driver_frame = {}
        for driver, samples_for_driver in driver_samples.items():
            state = sample_driver_at_time(samples_for_driver, t_ms)
            if state is None:
                continue
            driver_frame[driver] = {
                "progress": state["progress"],
                "status": state["status"],
            }
            if include_projected_xy:
                driver_frame[driver]["x"] = state["x"]
                driver_frame[driver]["y"] = state["y"]

        if not driver_frame:
            continue

        sample = {
            "t": rebased_t_ms,
            "drivers": driver_frame,
        }
        track_status = lookup_track_status(t_ms, track_status_timeline)
        if track_status is not None:
            sample["trackStatus"] = track_status
        samples.append(sample)

    payload = {
        "raceId": race_id,
        "source": "fastf1",
        "sessionName": race["label"],
        "sampleIntervalMs": sample_ms,
        "sessionDurationMs": samples[-1]["t"] if samples else 0,
        "startOffsetMs": first_sample_time,
        "raceStartOffsetMs": race_start_time,
        "raceStartTimeMs": (
            max(0, race_start_time - first_sample_time)
            if race_start_time is not None
            else None
        ),
        "raceEndOffsetMs": race_end_time,
        "raceEndTimeMs": (
            max(0, race_end_time - first_sample_time)
            if race_end_time is not None
            else None
        ),
        "formationLapStartOffsetMs": formation_lap_start_time,
        "formationLapStartTimeMs": (
            max(0, formation_lap_start_time - first_sample_time)
            if formation_lap_start_time is not None
            else None
        ),
        "preRaceTelemetryDurationMs": (
            max(0, race_start_time - first_sample_time)
            if race_start_time is not None and race_start_time > first_sample_time
            else 0
        ),
        "formationLapDurationMs": (
            max(0, race_start_time - formation_lap_start_time)
            if race_start_time is not None
            and formation_lap_start_time is not None
            and race_start_time > formation_lap_start_time
            else 0
        ),
        "hasFormationLapSamples": (
            race_start_time is not None
            and formation_lap_start_time is not None
            and race_start_time > formation_lap_start_time
        ),
        "circuit": {
            "id": circuit_feature["properties"].get("id"),
            "location": circuit_feature["properties"].get("Location"),
            "name": circuit_feature["properties"].get("Name"),
        },
        "alignment": alignment,
        "samples": samples,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{race_id}.json"
    with out_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, separators=(",", ":"))
    return out_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export FastF1 telemetry for circuit playback")
    parser.add_argument("--race-id", required=True, help="Repo race id, e.g. aus2024")
    parser.add_argument(
        "--sample-ms",
        type=int,
        default=1000,
        help="Sampling interval in milliseconds. Defaults to a compact 1000ms export.",
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Use an extra-light export for a quick first pass.",
    )
    parser.add_argument(
        "--alignment-points",
        type=int,
        default=180,
        help="Maximum number of telemetry points to use during alignment search.",
    )
    parser.add_argument(
        "--driver-step",
        type=int,
        default=4,
        help="Keep every Nth raw driver position sample before projection.",
    )
    parser.add_argument(
        "--skip-xy",
        action="store_true",
        default=True,
        help="Do not store projected x/y in the output JSON; only keep progress. Enabled by default.",
    )
    parser.add_argument(
        "--include-xy",
        dest="skip_xy",
        action="store_false",
        help="Include projected x/y in the output JSON.",
    )
    parser.add_argument(
        "--cache-dir",
        default=str(CACHE_DIR),
        help="FastF1 cache directory. Defaults to the repo-local fastf1_cache folder.",
    )
    parser.add_argument(
        "--out-dir",
        default=str(OUT_DIR),
        help="Output directory for exported telemetry JSON. Defaults to public/telemetry.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    global OUT_DIR

    cache_dir = Path(args.cache_dir).resolve()
    cache_dir.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(cache_dir)

    OUT_DIR = Path(args.out_dir).resolve()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    sample_ms = args.sample_ms
    alignment_points = args.alignment_points
    driver_step = args.driver_step
    include_projected_xy = not args.skip_xy

    if args.preview:
        sample_ms = max(sample_ms, 1000)
        alignment_points = min(alignment_points, 120)
        driver_step = max(driver_step, 8)
        include_projected_xy = False

    out_path = export_race_telemetry(
        args.race_id,
        sample_ms,
        alignment_points,
        driver_step,
        include_projected_xy,
    )
    print(f"FastF1 cache directory: {cache_dir}")
    print(f"Telemetry export written to {out_path}")


if __name__ == "__main__":
    main()
