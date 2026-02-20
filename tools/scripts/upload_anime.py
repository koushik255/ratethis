#!/usr/bin/env python3
"""
Upload anime data from newanimedb.json to Convex.

Filter rules:
- Skip entries with only 1 source AND no picture (orphans)
- Extract MAL ID from sources for easy lookup
"""

import json
import re
import urllib.request
import urllib.error
from pathlib import Path
from tqdm import tqdm

JSON_PATH = Path("/home/koushikk/Documents/newanimedb.json")
CONVEX_URL = "https://pastel-condor-398.convex.site"
BATCH_SIZE = 100


def extract_mal_id(sources: list[str]) -> str | None:
    """Extract MyAnimeList ID from sources list."""
    for source in sources:
        match = re.search(r"myanimelist\.net/anime/(\d+)", source)
        if match:
            return match[1]
    return None


def is_orphan(entry: dict) -> bool:
    """Check if entry is an orphan (only 1 source + no picture)."""
    sources = entry.get("sources", [])
    picture = entry.get("picture")
    no_pic_placeholder = "no_pic.png" in (picture or "")

    return len(sources) == 1 and (not picture or no_pic_placeholder)


def transform_entry(entry: dict) -> dict:
    """Transform JSON entry to Convex format, omitting null values."""
    mal_id = extract_mal_id(entry.get("sources", []))

    result = {
        "title": entry.get("title"),
        "type": entry.get("type", "UNKNOWN"),
        "sources": entry.get("sources", []),
        "synonyms": entry.get("synonyms", []),
        "studios": entry.get("studios", []),
        "producers": entry.get("producers", []),
        "relatedAnime": entry.get("relatedAnime", []),
        "tags": entry.get("tags", []),
    }

    if entry.get("episodes") is not None:
        result["episodes"] = entry["episodes"]

    result["status"] = entry.get("status", "UNKNOWN")

    if entry.get("animeSeason") is not None:
        result["animeSeason"] = entry["animeSeason"]

    if entry.get("picture") is not None:
        result["picture"] = entry["picture"]

    if entry.get("thumbnail") is not None:
        result["thumbnail"] = entry["thumbnail"]

    if mal_id is not None:
        result["malId"] = mal_id

    if entry.get("duration") is not None:
        result["duration"] = entry["duration"]

    if entry.get("score") is not None:
        result["score"] = entry["score"]

    return result


def insert_batch(batch: list[dict]) -> dict:
    """Insert a batch of anime entries."""
    url = f"{CONVEX_URL}/anime/bulk-insert"
    data = json.dumps({"animes": batch}).encode("utf-8")

    try:
        req = urllib.request.Request(
            url, data=data, headers={"Content-Type": "application/json"}, method="POST"
        )
        with urllib.request.urlopen(req, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return {"success": False, "error": f"HTTP {e.code}: {error_body}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def main():
    print("=" * 60)
    print("ANIME UPLOAD TO CONVEX")
    print("=" * 60)

    print(f"\nLoading: {JSON_PATH}")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    all_entries = data.get("data", [])
    total_count = len(all_entries)
    print(f"Total entries in JSON: {total_count}")

    print("\nFiltering entries...")
    filtered = []
    skipped = 0

    for entry in tqdm(all_entries, desc="Filtering"):
        if is_orphan(entry):
            skipped += 1
            continue
        filtered.append(transform_entry(entry))

    print(f"\n  Kept: {len(filtered)}")
    print(f"  Skipped (orphans): {skipped}")

    print(f"\nUploading {len(filtered)} entries in batches of {BATCH_SIZE}...")

    batches = [
        filtered[i : i + BATCH_SIZE] for i in range(0, len(filtered), BATCH_SIZE)
    ]
    total_imported = 0
    total_failed = 0

    for batch in tqdm(batches, desc="Uploading"):
        result = insert_batch(batch)

        if result.get("success"):
            total_imported += result.get("imported", 0)
            total_failed += result.get("failed", 0)

            if result.get("errors"):
                for error in result["errors"][:3]:
                    print(f"\n  Error: {error}")
        else:
            total_failed += len(batch)
            print(f"\n  Batch failed: {result.get('error')}")

    print("\n" + "=" * 60)
    print("UPLOAD COMPLETE")
    print("=" * 60)
    print(f"  Total in JSON: {total_count}")
    print(f"  Skipped (orphans): {skipped}")
    print(f"  Attempted upload: {len(filtered)}")
    print(f"  Successfully imported: {total_imported}")
    print(f"  Failed: {total_failed}")


if __name__ == "__main__":
    main()
