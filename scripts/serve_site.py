#!/usr/bin/env python3
"""Serve site/ over HTTP without relying on os.getcwd() (sandboxed envs deny it)."""

import functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

DIRECTORY = str(Path(__file__).resolve().parent.parent / "site")
PORT = 8420

handler = functools.partial(SimpleHTTPRequestHandler, directory=DIRECTORY)
httpd = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
print(f"Serving {DIRECTORY} at http://127.0.0.1:{PORT}")
httpd.serve_forever()
