#!/usr/bin/env python3
"""
Upload anime data from SQLite to Convex in batches.
"""

import json
import sqlite3
import time
from pathlib import Path
from tqdm import tqdm
import urllib.request
import urllib.error

# Paths
DB_PATH = Path("anime.db")
CONVEX_URL = "https://pastel-condor-398.convex.site/import"
BATCH_SIZE = 500


def load_anime_from_sqlite():
    """Load all anime entries from SQLite."""
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
    return animes


def upload_batch(batch, batch_num, total_batches):
    """Upload a batch of anime to Convex."""
    data = json.dumps({"animes": batch}).encode("utf-8")

    req = urllib.request.Request(
        CONVEX_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"\n❌ Batch {batch_num}/{total_batches} failed: HTTP {e.code}")
        print(f"   Error: {error_body}")
        return {"success": False, "error": error_body}
    except Exception as e:
        print(f"\n❌ Batch {batch_num}/{total_batches} failed: {e}")
        return {"success": False, "error": str(e)}


def upload_to_convex():
    """Main function to upload all anime to Convex."""
    print(f"Loading anime from: {DB_PATH}")
    animes = load_anime_from_sqlite()
    total = len(animes)
    print(f"Loaded {total} anime entries")

    # Split into batches
    batches = [animes[i : i + BATCH_SIZE] for i in range(0, total, BATCH_SIZE)]
    total_batches = len(batches)
    print(f"Split into {total_batches} batches of {BATCH_SIZE}")

    success_count = 0
    failed_count = 0

    for i, batch in enumerate(tqdm(batches, desc="Uploading batches"), 1):
        result = upload_batch(batch, i, total_batches)

        if result.get("success"):
            success_count += result.get("imported", 0)
            failed_count += result.get("failed", 0)

            if result.get("failed", 0) > 0:
                print(f"\n⚠️  Batch {i}: {result.get('failed')} failed imports")
        else:
            failed_count += len(batch)
            print(f"\n❌ Batch {i} completely failed")

        # Small delay to avoid rate limiting
        if i < total_batches:
            time.sleep(0.5)

    print(f"\n✅ Upload complete!")
    print(f"   Successfully imported: {success_count}")
    print(f"   Failed: {failed_count}")
    print(f"   Total: {total}")


if __name__ == "__main__":
    upload_to_convex()
