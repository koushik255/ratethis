#!/usr/bin/env python3
"""
Deduplicate anime data from SQLite and upload to Convex.

Priority hierarchy:
1. MyAnimeList (priority 3) - always preferred
2. AniDB (priority 2)
3. AniList (priority 1)
4. Other sources (priority 0)
"""

import json
import re
import sqlite3
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any
from tqdm import tqdm

# Paths
DB_PATH = Path(__file__).parent.parent.parent / "anime.db"
CONVEX_URL = "https://pastel-condor-398.convex.site"
BATCH_SIZE = 100


def extract_mal_id(sources: list[str]) -> str | None:
    """Extract MyAnimeList ID from sources list."""
    for source in sources:
        match = re.search(r"myanimelist\.net/anime/(\d+)", source)
        if match:
            return match[1]
    return None


def get_priority(sources: list[str]) -> int:
    """Get priority score based on sources (higher is better)."""
    priority = 0
    for source in sources:
        if "myanimelist.net" in source:
            priority = max(priority, 3)
        elif "anidb.net" in source:
            priority = max(priority, 2)
        elif "anilist.co" in source:
            priority = max(priority, 1)
    return priority


def normalize_title(title: str) -> str:
    """Normalize title for comparison."""
    return title.lower().strip()


def merge_anime_entries(entries: list[dict[str, Any]]) -> dict[str, Any]:
    """Merge multiple anime entries into one canonical entry."""
    sorted_entries = sorted(
        entries, key=lambda e: get_priority(e.get("sources", [])), reverse=True
    )

    canonical = sorted_entries[0]

    merged = {
        "title": canonical.get("title"),
        "type": canonical.get("type"),
        "episodes": canonical.get("episodes"),
        "status": canonical.get("status"),
        "animeSeason": canonical.get("animeSeason") or {},
        "picture": canonical.get("picture"),
        "thumbnail": canonical.get("thumbnail"),
        "duration": canonical.get("duration") or {},
        "score": canonical.get("score") or {},
        "sources": list(canonical.get("sources", [])),
        "synonyms": list(canonical.get("synonyms", [])),
        "studios": list(canonical.get("studios", [])),
        "producers": list(canonical.get("producers", [])),
        "relatedAnime": list(canonical.get("relatedAnime", [])),
        "tags": list(canonical.get("tags", [])),
    }

    for entry in sorted_entries[1:]:
        if not merged["episodes"] and entry.get("episodes"):
            merged["episodes"] = entry["episodes"]
        if not merged["picture"] and entry.get("picture"):
            merged["picture"] = entry["picture"]
        if not merged["thumbnail"] and entry.get("thumbnail"):
            merged["thumbnail"] = entry["thumbnail"]
        if not merged["duration"] and entry.get("duration"):
            merged["duration"] = entry["duration"]
        if not merged["animeSeason"] and entry.get("animeSeason"):
            merged["animeSeason"] = entry["animeSeason"]
        elif entry.get("animeSeason"):
            if not merged["animeSeason"].get("season") and entry["animeSeason"].get(
                "season"
            ):
                merged["animeSeason"]["season"] = entry["animeSeason"]["season"]
            if not merged["animeSeason"].get("year") and entry["animeSeason"].get(
                "year"
            ):
                merged["animeSeason"]["year"] = entry["animeSeason"]["year"]

        if entry.get("score"):
            if not merged["score"].get("arithmeticMean") and entry["score"].get(
                "arithmeticMean"
            ):
                merged["score"]["arithmeticMean"] = entry["score"]["arithmeticMean"]
            if not merged["score"].get("arithmeticGeometricMean") and entry[
                "score"
            ].get("arithmeticGeometricMean"):
                merged["score"]["arithmeticGeometricMean"] = entry["score"][
                    "arithmeticGeometricMean"
                ]
            if not merged["score"].get("median") and entry["score"].get("median"):
                merged["score"]["median"] = entry["score"]["median"]

        merged["sources"].extend(entry.get("sources", []))
        merged["synonyms"].extend(entry.get("synonyms", []))
        merged["studios"].extend(entry.get("studios", []))
        merged["producers"].extend(entry.get("producers", []))
        merged["relatedAnime"].extend(entry.get("relatedAnime", []))
        merged["tags"].extend(entry.get("tags", []))

    merged["sources"] = list(set(merged["sources"]))
    merged["synonyms"] = list(set(merged["synonyms"]))
    merged["studios"] = list(set(merged["studios"]))
    merged["producers"] = list(set(merged["producers"]))
    merged["relatedAnime"] = list(set(merged["relatedAnime"]))
    merged["tags"] = list(set(merged["tags"]))

    if not merged["animeSeason"]:
        merged["animeSeason"] = None
    if not merged["duration"]:
        merged["duration"] = None
    if not merged["score"]:
        merged["score"] = None

    return merged


def load_anime_from_sqlite() -> list[dict]:
    """Load all anime entries from SQLite."""
    print(f"Loading anime from: {DB_PATH}")

    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT title, type, episodes, status, anime_season, picture, thumbnail,
               duration, score, sources, synonyms, studios, producers, related_anime, tags
        FROM anime
    """)

    animes = []
    for row in cursor.fetchall():
        anime = {
            "title": row["title"],
            "type": row["type"],
            "episodes": row["episodes"],
            "status": row["status"],
            "animeSeason": json.loads(row["anime_season"] or "{}"),
            "picture": row["picture"],
            "thumbnail": row["thumbnail"],
            "duration": json.loads(row["duration"] or "{}"),
            "score": json.loads(row["score"] or "{}"),
            "sources": json.loads(row["sources"] or "[]"),
            "synonyms": json.loads(row["synonyms"] or "[]"),
            "studios": json.loads(row["studios"] or "[]"),
            "producers": json.loads(row["producers"] or "[]"),
            "relatedAnime": json.loads(row["related_anime"] or "[]"),
            "tags": json.loads(row["tags"] or "[]"),
        }
        animes.append(anime)

    conn.close()
    print(f"Loaded {len(animes)} entries from SQLite")
    return animes


def deduplicate_anime(all_anime: list[dict]) -> list[dict]:
    """Deduplicate anime entries using MAL ID and title matching."""
    print("\nDeduplicating anime entries...")

    by_mal_id: dict[str, list[dict]] = {}
    by_title: dict[str, list[dict]] = []

    for anime in tqdm(all_anime, desc="Grouping entries"):
        mal_id = extract_mal_id(anime.get("sources", []))
        title = normalize_title(anime.get("title", ""))

        if mal_id:
            if mal_id not in by_mal_id:
                by_mal_id[mal_id] = []
            by_mal_id[mal_id].append(anime)
        elif title:
            by_title.append((title, anime))

    print(f"\n  Grouped by MAL ID: {len(by_mal_id)} unique IDs")
    print(f"  Entries without MAL ID: {len(by_title)}")

    # Remove title entries that match MAL entries
    mal_titles = set()
    for entries in by_mal_id.values():
        for entry in entries:
            mal_titles.add(normalize_title(entry.get("title", "")))

    filtered_by_title = {}
    for title, anime in by_title:
        if title not in mal_titles:
            if title not in filtered_by_title:
                filtered_by_title[title] = []
            filtered_by_title[title].append(anime)

    print(f"  Title groups after MAL overlap removal: {len(filtered_by_title)}")

    # Merge each group
    deduplicated = []

    print("\n  Merging MAL ID groups...")
    for mal_id, entries in tqdm(by_mal_id.items(), desc="MAL groups"):
        if len(entries) > 1:
            merged = merge_anime_entries(entries)
            deduplicated.append(merged)
        else:
            deduplicated.append(entries[0])

    print("  Merging title groups...")
    for title, entries in tqdm(filtered_by_title.items(), desc="Title groups"):
        if len(entries) > 1:
            merged = merge_anime_entries(entries)
            deduplicated.append(merged)
        else:
            deduplicated.append(entries[0])

    return deduplicated


def insert_batch(batch: list[dict], batch_num: int, total_batches: int) -> dict:
    """Insert a batch of anime entries."""
    url = f"{CONVEX_URL}/anime/bulk-insert"

    data = json.dumps({"animes": batch}).encode("utf-8")

    try:
        req = urllib.request.Request(
            url, data=data, headers={"Content-Type": "application/json"}, method="POST"
        )
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return {"success": False, "error": f"HTTP {e.code}: {error_body}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def insert_deduplicated_anime(animes: list[dict]) -> tuple[int, int]:
    """Insert deduplicated anime entries in batches."""
    print(f"\nInserting {len(animes)} deduplicated anime entries...")

    batches = [animes[i : i + BATCH_SIZE] for i in range(0, len(animes), BATCH_SIZE)]
    total_imported = 0
    total_failed = 0

    for i, batch in enumerate(tqdm(batches, desc="Inserting batches"), 1):
        result = insert_batch(batch, i, len(batches))

        if result.get("success"):
            total_imported += result.get("imported", 0)
            total_failed += result.get("failed", 0)

            if result.get("errors"):
                for error in result["errors"]:
                    print(f"\n  Error: {error}")
        else:
            total_failed += len(batch)
            print(f"\n  Batch {i} failed: {result.get('error')}")

    return total_imported, total_failed


def main():
    print("=" * 60)
    print("ANIME DEDUPLICATION & UPLOAD")
    print("=" * 60)

    # Step 1: Load from SQLite
    try:
        all_anime = load_anime_from_sqlite()
    except Exception as e:
        print(f"\nError loading anime: {e}")
        return

    original_count = len(all_anime)
    print(f"\nOriginal anime count: {original_count}")

    # Step 2: Deduplicate
    deduplicated = deduplicate_anime(all_anime)
    new_count = len(deduplicated)

    print(f"\nDeduplicated anime count: {new_count}")
    print(
        f"Reduction: {original_count - new_count} entries ({100 * (original_count - new_count) / original_count:.1f}%)"
    )

    # Step 3: Insert
    print("\n" + "=" * 60)
    print("INSERTING DEDUPLICATED ENTRIES")
    print("=" * 60)

    imported, failed = insert_deduplicated_anime(deduplicated)

    # Final report
    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE")
    print("=" * 60)
    print(f"  Original entries: {original_count}")
    print(f"  Deduplicated entries: {new_count}")
    print(f"  Successfully imported: {imported}")
    print(f"  Failed imports: {failed}")
    print(
        f"  Reduction: {original_count - new_count} entries ({100 * (original_count - new_count) / original_count:.1f}%)"
    )


if __name__ == "__main__":
    main()
