import requests
from bs4 import BeautifulSoup
import json
import html
import sys
import time


def scrape_mal_list(username: str, list_type: str = "manga", status: int = 1):
    """
    Scrape titles from a public MyAnimeList user list.

    Args:
        username: MAL username
        list_type: "anime" or "manga"
        status: 1=Reading/Watching, 2=Completed, 3=On Hold, 4=Dropped, 6=Plan to Read/Watch, 7=All
    """
    base_url = f"https://myanimelist.net/{list_type}list/{username}"
    params = {"status": status}

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    all_titles = []
    offset = 0

    while True:
        print(f"Fetching page with offset {offset}...", file=sys.stderr)

        # Add offset for pagination
        current_params = params.copy()
        if offset > 0:
            current_params["offset"] = offset

        try:
            response = requests.get(
                base_url, params=current_params, headers=headers, timeout=30
            )
            response.raise_for_status()
        except requests.RequestException as e:
            print(f"Error fetching page: {e}", file=sys.stderr)
            break

        # Parse the HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # Find the list table which contains the data-items attribute
        list_table = soup.find("table", class_="list-table")

        if not list_table:
            print(
                "No list table found. User might have a private list or no items.",
                file=sys.stderr,
            )
            break

        # Extract the data-items JSON
        data_items = list_table.get("data-items")

        if not data_items:
            print("No data-items attribute found.", file=sys.stderr)
            break

        # Decode HTML entities and parse JSON
        try:
            items = json.loads(html.unescape(str(data_items)))
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}", file=sys.stderr)
            break

        if not items:
            print("No items found on this page.", file=sys.stderr)
            break

        # Extract titles
        page_titles = 0
        for item in items:
            # Get the title - use appropriate fields based on list type
            if list_type == "anime":
                title = item.get("anime_title") or item.get(
                    "anime_title_eng", "Unknown"
                )
            else:
                title = item.get("manga_title") or item.get(
                    "manga_title_eng", "Unknown"
                )
            if title and title != "Unknown":
                all_titles.append(title)
                print(title)
                page_titles += 1

        print(f"Found {page_titles} titles on this page", file=sys.stderr)

        # Check if there's a next page (MAL uses 300 items per page)
        if len(items) < 300:
            # Less than 300 items means we're on the last page
            break

        offset += 300

        # Be polite - add a small delay between requests
        time.sleep(1)

    print(f"\nTotal titles scraped: {len(all_titles)}", file=sys.stderr)
    return all_titles


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scraper.py <username> [type] [status]", file=sys.stderr)
        print("Type: anime or manga (default: manga)", file=sys.stderr)
        print(
            "Status codes: 1=Reading/Watching, 2=Completed, 3=On Hold, 4=Dropped, 6=Plan to Read/Watch, 7=All",
            file=sys.stderr,
        )
        print("\nExamples:", file=sys.stderr)
        print(
            "  python scraper.py TheGOF 1              # manga reading list",
            file=sys.stderr,
        )
        print(
            "  python scraper.py TheGOF manga 1        # manga reading list (explicit)",
            file=sys.stderr,
        )
        print(
            "  python scraper.py BarJsX anime 2        # anime completed list",
            file=sys.stderr,
        )
        sys.exit(1)

    username = sys.argv[1]

    # Parse arguments - check if second arg is type or status
    if len(sys.argv) == 2:
        list_type = "manga"
        status = 1
    elif len(sys.argv) == 3:
        # Check if arg 2 is a type or status
        if sys.argv[2] in ["anime", "manga"]:
            list_type = sys.argv[2]
            status = 1
        else:
            list_type = "manga"
            status = int(sys.argv[2])
    else:
        # len >= 4
        if sys.argv[2] in ["anime", "manga"]:
            list_type = sys.argv[2]
            status = int(sys.argv[3])
        else:
            list_type = "manga"
            status = int(sys.argv[2])

    scrape_mal_list(username, list_type, status)
