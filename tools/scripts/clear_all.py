#!/usr/bin/env python3
"""Clear all anime data from Convex in batches."""

import json
import urllib.request
import urllib.error
import time

CONVEX_URL = "https://adventurous-greyhound-84.convex.site"


def clear_batch():
    """Clear one batch of data."""
    url = f"{CONVEX_URL}/anime/clear"

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps({"batch": 1000}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return {"success": False, "error": f"HTTP {e.code}: {error_body}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def main():
    print("Clearing all anime data...")

    totals = {
        "anime": 0,
        "userAnime": 0,
        "animeLists": 0,
        "animeListItems": 0,
        "animeListComments": 0,
        "animeListCommentVotes": 0,
        "topAnimeCache": 0,
    }
    iteration = 0

    while True:
        iteration += 1
        result = clear_batch()

        if result.get("success"):
            totals["anime"] += result.get("animeCleared", 0)
            totals["userAnime"] += result.get("userAnimeCleared", 0)
            totals["animeLists"] += result.get("listsCleared", 0)
            totals["animeListItems"] += result.get("listItemsCleared", 0)
            totals["animeListComments"] += result.get("listCommentsCleared", 0)
            totals["animeListCommentVotes"] += result.get("commentVotesCleared", 0)
            totals["topAnimeCache"] += result.get("cacheCleared", 0)

            print(
                f"  Batch {iteration}: anime={result.get('animeCleared', 0)}, userAnime={result.get('userAnimeCleared', 0)}"
            )

            if not result.get("hasMore"):
                break
        else:
            print(f"  Error: {result.get('error')}")
            break

        time.sleep(0.1)

    print(f"\nDone! Cleared:")
    print(f"  - anime: {totals['anime']}")
    print(f"  - userAnime (favorites/watched): {totals['userAnime']}")
    print(f"  - animeLists: {totals['animeLists']}")
    print(f"  - animeListItems: {totals['animeListItems']}")
    print(f"  - animeListComments: {totals['animeListComments']}")
    print(f"  - animeListCommentVotes: {totals['animeListCommentVotes']}")
    print(f"  - topAnimeCache: {totals['topAnimeCache']}")


if __name__ == "__main__":
    main()
