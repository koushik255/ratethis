#!/usr/bin/env python3
"""
Deduplicate anime database - keep only one entry per show with MAL priority.

Priority hierarchy:
1. MyAnimeList (priority 3) - always preferred
2. AniDB (priority 2)
3. AniList (priority 1)
4. Other sources (priority 0)

Merges data from all duplicates:
- Uses highest priority entry as canonical
- Fills missing fields from other entries
- Combines synonyms, tags, sources, studios, producers
"""

import json
import re
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any
from tqdm import tqdm

# Convex deployment URL
CONVEX_URL = "https://pastel-condor-398.convex.site"
BATCH_SIZE = 500

# Dry run mode - set to False to actually make changes
DRY_RUN = False


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
    """
    Merge multiple anime entries into one canonical entry.

    Uses highest priority entry as base and fills in missing fields.
    Combines list fields (sources, synonyms, tags, etc.) from all entries.
    """
    # Sort by priority (highest first)
    sorted_entries = sorted(
        entries, key=lambda e: get_priority(e.get("sources", [])), reverse=True
    )

    canonical = sorted_entries[0]

    # Start with canonical entry
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

    # Fill missing fields and combine lists from other entries
    for entry in sorted_entries[1:]:
        # Fill missing scalar fields
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
            # Merge partial season info
            if not merged["animeSeason"].get("season") and entry["animeSeason"].get(
                "season"
            ):
                merged["animeSeason"]["season"] = entry["animeSeason"]["season"]
            if not merged["animeSeason"].get("year") and entry["animeSeason"].get(
                "year"
            ):
                merged["animeSeason"]["year"] = entry["animeSeason"]["year"]

        # Merge score - prefer more complete data
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

        # Combine list fields (dedupe)
        merged["sources"].extend(entry.get("sources", []))
        merged["synonyms"].extend(entry.get("synonyms", []))
        merged["studios"].extend(entry.get("studios", []))
        merged["producers"].extend(entry.get("producers", []))
        merged["relatedAnime"].extend(entry.get("relatedAnime", []))
        merged["tags"].extend(entry.get("tags", []))

    # Dedupe list fields
    merged["sources"] = list(set(merged["sources"]))
    merged["synonyms"] = list(set(merged["synonyms"]))
    merged["studios"] = list(set(merged["studios"]))
    merged["producers"] = list(set(merged["producers"]))
    merged["relatedAnime"] = list(set(merged["relatedAnime"]))
    merged["tags"] = list(set(merged["tags"]))

    # Clean up empty objects
    if not merged["animeSeason"]:
        merged["animeSeason"] = None
    if not merged["duration"]:
        merged["duration"] = None
    if not merged["score"]:
        merged["score"] = None

    return merged


def fetch_all_anime() -> list[dict[str, Any]]:
    """Fetch all anime entries from Convex with pagination."""
    print("Fetching all anime from Convex...")

    all_anime = []
    cursor = None
    page_count = 0

    while True:
        page_count += 1
        url = f"{CONVEX_URL}/anime/all"
        params = {"limit": 500}
        if cursor:
            params["cursor"] = cursor

        # Build URL with query params
        from urllib.parse import urlencode

        full_url = f"{url}?{urlencode(params)}"

        try:
            req = urllib.request.Request(full_url, method="GET")
            with urllib.request.urlopen(req, timeout=300) as response:
                data = json.loads(response.read().decode("utf-8"))
                if data.get("success"):
                    page = data.get("page", [])
                    all_anime.extend(page)
                    print(
                        f"  Fetched page {page_count}: {len(page)} entries (total: {len(all_anime)})"
                    )

                    if data.get("isDone"):
                        break

                    cursor = data.get("continueCursor")
                    if not cursor:
                        break
                else:
                    raise Exception(data.get("error", "Unknown error"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise Exception(f"HTTP {e.code}: {error_body}")

    print(f"\n  Total fetched: {len(all_anime)} anime entries")
    return all_anime


def clear_all_data() -> dict:
    """Clear all anime and user data from Convex (in batches)."""
    print("Clearing all anime and user data...")

    url = f"{CONVEX_URL}/anime/clear"

    total_user_anime = 0
    total_list_items = 0
    total_cache = 0
    total_anime = 0
    iteration = 0

    while True:
        iteration += 1

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps({"batch": 1000}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=300) as response:
                data = json.loads(response.read().decode("utf-8"))
                if data.get("success"):
                    total_user_anime += data.get("userAnimeCleared", 0)
                    total_list_items += data.get("listItemsCleared", 0)
                    total_cache += data.get("cacheCleared", 0)
                    total_anime += data.get("animeCleared", 0)

                    print(
                        f"  Batch {iteration}: anime={data.get('animeCleared', 0)}, userAnime={data.get('userAnimeCleared', 0)}"
                    )

                    if not data.get("hasMore"):
                        break
                else:
                    raise Exception(data.get("error", "Unknown error"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise Exception(f"HTTP {e.code}: {error_body}")

    print(f"\n  Total cleared:")
    print(f"    Anime: {total_anime}")
    print(f"    User anime: {total_user_anime}")
    print(f"    List items: {total_list_items}")
    print(f"    Cache: {total_cache}")

    return {
        "userAnimeCleared": total_user_anime,
        "listItemsCleared": total_list_items,
        "cacheCleared": total_cache,
        "animeCleared": total_anime,
    }


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


def deduplicate_anime(all_anime: list[dict]) -> list[dict]:
    """
    Deduplicate anime entries using MAL ID and title matching.
    """
    print("\nDeduplicating anime entries...")

    # Group by MAL ID
    by_mal_id: dict[str, list[dict]] = {}
    by_title: dict[str, list[dict]] = {}
    no_mal_no_title: list[dict] = []

    for anime in tqdm(all_anime, desc="Grouping entries"):
        mal_id = extract_mal_id(anime.get("sources", []))
        title = normalize_title(anime.get("title", ""))

        if mal_id:
            if mal_id not in by_mal_id:
                by_mal_id[mal_id] = []
            by_mal_id[mal_id].append(anime)
        elif title:
            if title not in by_title:
                by_title[title] = []
            by_title[title].append(anime)
        else:
            no_mal_no_title.append(anime)

    print(f"\n  Grouped by MAL ID: {len(by_mal_id)} unique IDs")
    print(f"  Grouped by title: {len(by_title)} unique titles")
    print(f"  No MAL ID or title: {len(no_mal_no_title)} entries")

    # Check for title groups that match MAL groups - remove them from title groups
    mal_titles = set()
    for entries in by_mal_id.values():
        for entry in entries:
            mal_titles.add(normalize_title(entry.get("title", "")))

    # Remove title groups that are already covered by MAL
    titles_to_remove = []
    for title in by_title:
        if title in mal_titles:
            titles_to_remove.append(title)

    for title in titles_to_remove:
        del by_title[title]

    print(f"  Title groups after MAL overlap removal: {len(by_title)}")

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
    for title, entries in tqdm(by_title.items(), desc="Title groups"):
        if len(entries) > 1:
            merged = merge_anime_entries(entries)
            deduplicated.append(merged)
        else:
            deduplicated.append(entries[0])

    # Add entries with no MAL ID or title (can't dedupe these)
    deduplicated.extend(no_mal_no_title)

    return deduplicated


def main():
    """Main migration function."""
    global DRY_RUN

    print("=" * 60)
    print("ANIME DATABASE DEDUPLICATION MIGRATION")
    print("=" * 60)

    if DRY_RUN:
        print("\n*** DRY RUN MODE - No changes will be made ***\n")

    # Step 1: Fetch all anime
    try:
        all_anime = fetch_all_anime()
    except Exception as e:
        print(f"\nError fetching anime: {e}")
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

    if DRY_RUN:
        print("\n*** DRY RUN COMPLETE ***")
        print("Set DRY_RUN = False to actually perform the migration.")
        print("\nSample merged entry:")
        if deduplicated:
            sample = deduplicated[0]
            print(f"  Title: {sample.get('title')}")
            print(f"  Sources: {len(sample.get('sources', []))}")
            print(f"  Synonyms: {len(sample.get('synonyms', []))}")
            print(f"  Tags: {len(sample.get('tags', []))}")
        return

    # Step 3: Clear all data
    print("\n" + "=" * 60)
    print("CLEARING DATABASE")
    print("=" * 60)

    try:
        clear_result = clear_all_data()
    except Exception as e:
        print(f"\nError clearing data: {e}")
        return

    # Step 4: Insert deduplicated entries
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
