# Python Scripts

This directory contains Python utility scripts for data processing. These are **not required** for the application to run - they're only used for importing anime data.

## Files

- `main.py` - Entry point for data import
- `jsonl_to_sqlite.py` - Converts JSONL data to SQLite
- `upload_to_convex.py` - Uploads data to Convex backend

## Usage

Only needed if you want to re-import anime data. Run from within this directory:

```bash
cd scripts
python main.py
```

## Dependencies

See `pyproject.toml` for Python dependencies.
