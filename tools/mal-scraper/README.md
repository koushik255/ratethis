# MyAnimeList List Scraper

A simple Python scraper to extract anime or manga titles from public MyAnimeList user lists.

## Setup

```bash
uv sync
```

## Usage

```bash
uv run python scraper.py <username> [type] [status]
```

### Arguments
- `username` - MAL username (required)
- `type` - `anime` or `manga` (default: manga)
- `status` - Status filter (default: 1)

### Status Codes
- `1` - Reading/Watching (default)
- `2` - Completed
- `3` - On Hold
- `4` - Dropped
- `6` - Plan to Read/Watch
- `7` - All

### Examples

```bash
# Manga examples
uv run python scraper.py TheGOF 1              # currently reading
uv run python scraper.py TheGOF manga 1        # same, explicit type
uv run python scraper.py TheGOF 2              # completed

# Anime examples
uv run python scraper.py BarJsX anime 2        # completed anime
uv run python scraper.py BarJsX anime 1        # currently watching
```

## Output

Titles are printed to stdout (one per line). Progress messages go to stderr.

## Features

- Extracts anime or manga titles from public MAL lists
- Handles pagination (users with 100+ items)
- Polite rate limiting (1 second delay between pages)
- No authentication required for public lists

## How It Works

The scraper extracts JSON data embedded in the page's `data-items` attribute, which contains all the anime/manga information rendered by Vue.js.
