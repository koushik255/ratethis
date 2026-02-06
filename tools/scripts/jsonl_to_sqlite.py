#!/usr/bin/env python3
"""
Convert anime-offline-database.jsonl to SQLite database.
Creates indexes on title, type, and year for faster querying.
"""

import json
import sqlite3
from pathlib import Path
from tqdm import tqdm

# Paths
JSONL_PATH = Path("/home/koushikk/Downloads/anime-offline-database.jsonl")
DB_PATH = Path("anime.db")


def create_table(conn):
    """Create the anime table with all fields."""
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS anime (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            type TEXT,
            episodes INTEGER,
            status TEXT,
            anime_season TEXT,  -- JSON: {"season": "FALL", "year": 2020}
            picture TEXT,
            thumbnail TEXT,
            duration TEXT,  -- JSON: {"value": 120, "unit": "SECONDS"}
            score TEXT,  -- JSON: {"arithmeticGeometricMean": 6.2, ...}
            sources TEXT,  -- JSON array of URLs
            synonyms TEXT,  -- JSON array of strings
            studios TEXT,  -- JSON array of strings
            producers TEXT,  -- JSON array of strings
            related_anime TEXT,  -- JSON array of URLs
            tags TEXT  -- JSON array of strings
        )
    """)

    # Create indexes on frequently queried fields
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_title ON anime(title)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_type ON anime(type)")
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_year ON anime(json_extract(anime_season, '$.year'))"
    )

    conn.commit()


def parse_anime_entry(line):
    """Parse a single anime entry from JSON."""
    data = json.loads(line)

    return {
        "title": data.get("title", ""),
        "type": data.get("type", ""),
        "episodes": data.get("episodes"),
        "status": data.get("status", ""),
        "anime_season": json.dumps(data.get("animeSeason", {})),
        "picture": data.get("picture", ""),
        "thumbnail": data.get("thumbnail", ""),
        "duration": json.dumps(data.get("duration", {})),
        "score": json.dumps(data.get("score", {})),
        "sources": json.dumps(data.get("sources", [])),
        "synonyms": json.dumps(data.get("synonyms", [])),
        "studios": json.dumps(data.get("studios", [])),
        "producers": json.dumps(data.get("producers", [])),
        "related_anime": json.dumps(data.get("relatedAnime", [])),
        "tags": json.dumps(data.get("tags", [])),
    }


def import_jsonl_to_sqlite():
    """Main function to import JSONL to SQLite."""
    print(f"Importing from: {JSONL_PATH}")
    print(f"Creating database: {DB_PATH}")

    # Count total lines (excluding first metadata line)
    print("Counting entries...")
    with open(JSONL_PATH, "r", encoding="utf-8") as f:
        total_lines = sum(1 for _ in f)
    total_entries = total_lines - 1  # Subtract metadata line
    print(f"Found {total_entries} anime entries to import")

    # Create database and table
    conn = sqlite3.connect(DB_PATH)
    create_table(conn)
    cursor = conn.cursor()

    # Import data
    imported_count = 0
    skipped_count = 0

    with open(JSONL_PATH, "r", encoding="utf-8") as f:
        # Skip first line (metadata)
        next(f)

        # Process remaining lines with progress bar
        for line in tqdm(f, total=total_entries, desc="Importing anime"):
            line = line.strip()
            if not line:
                skipped_count += 1
                continue

            try:
                entry = parse_anime_entry(line)
                cursor.execute(
                    """
                    INSERT INTO anime 
                    (title, type, episodes, status, anime_season, picture, thumbnail, 
                     duration, score, sources, synonyms, studios, producers, related_anime, tags)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        entry["title"],
                        entry["type"],
                        entry["episodes"],
                        entry["status"],
                        entry["anime_season"],
                        entry["picture"],
                        entry["thumbnail"],
                        entry["duration"],
                        entry["score"],
                        entry["sources"],
                        entry["synonyms"],
                        entry["studios"],
                        entry["producers"],
                        entry["related_anime"],
                        entry["tags"],
                    ),
                )
                imported_count += 1

                # Commit every 1000 entries for performance
                if imported_count % 1000 == 0:
                    conn.commit()

            except json.JSONDecodeError as e:
                print(f"\nError parsing JSON: {e}")
                skipped_count += 1
            except Exception as e:
                print(f"\nError importing entry: {e}")
                skipped_count += 1

    # Final commit
    conn.commit()

    # Verify import
    cursor.execute("SELECT COUNT(*) FROM anime")
    db_count = cursor.fetchone()[0]

    print(f"\n✅ Import complete!")
    print(f"   Imported: {imported_count} entries")
    print(f"   Skipped: {skipped_count} entries")
    print(f"   Total in database: {db_count} entries")

    # Sample query to verify data
    print("\n📊 Sample entries:")
    cursor.execute("SELECT title, type, anime_season FROM anime LIMIT 3")
    for row in cursor.fetchall():
        print(f"   - {row[0]} ({row[1]}) - {row[2]}")

    conn.close()


if __name__ == "__main__":
    import_jsonl_to_sqlite()
