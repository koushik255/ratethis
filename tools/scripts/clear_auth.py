#!/usr/bin/env python3
"""Clear auth sessions and refresh tokens from Convex."""

import json
import urllib.request
import urllib.error

CONVEX_URL = "https://adventurous-greyhound-84.convex.site"

def clear_auth():
    """Clear auth sessions via HTTP action."""
    url = f"{CONVEX_URL}/api/auth/clear-sessions"
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps({}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return {"success": False, "error": f"HTTP {e.code}: {error_body}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    print("Clearing auth sessions...")
    result = clear_auth()
    print(result)
