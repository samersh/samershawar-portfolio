#!/usr/bin/env python3
"""Dev server with caching disabled, so edits always show up on refresh."""
import http.server
import functools
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
ROOT = sys.argv[2] if len(sys.argv) > 2 else "."


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, *args):
        pass


handler = functools.partial(NoCacheHandler, directory=ROOT)
with http.server.ThreadingHTTPServer(("", PORT), handler) as httpd:
    print(f"serving {ROOT} on {PORT} (no-cache)")
    httpd.serve_forever()
