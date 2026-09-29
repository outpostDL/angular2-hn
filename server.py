import json
import os
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "notes.json"
PUBLIC = ROOT / "public"


def load():
    return json.loads(DATA.read_text()) if DATA.exists() else []


def save(notes):
    DATA.write_text(json.dumps(notes, indent=2) + "\n")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def _json(self, status, body):
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path == "/api/health":
            return self._json(200, {"ok": True, "host": os.uname().nodename})
        if self.path == "/api/notes":
            return self._json(200, load())
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/notes":
            return self._json(404, {"error": "not found"})
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        text = str(body.get("text", "")).strip()
        if not text:
            return self._json(400, {"error": "text required"})
        notes = load()
        note = {
            "id": max((n["id"] for n in notes), default=0) + 1,
            "text": text[:500],
            "author": str(body.get("author", "anonymous"))[:50],
            "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }
        notes.append(note)
        save(notes)
        return self._json(201, note)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8765"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
