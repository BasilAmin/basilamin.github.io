#!/usr/bin/env python3
"""Check local HTML links and required page basics without third-party packages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "templates"}

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.has_title = False
        self.has_viewport = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag in {"img", "script", "iframe"} and attrs.get("src"):
            self.links.append(attrs["src"])
        if tag == "link" and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag == "title":
            self.has_title = True
        if tag == "meta" and attrs.get("name", "").lower() == "viewport":
            self.has_viewport = True

def local_target(source, raw):
    parsed = urlparse(raw)
    if parsed.scheme or raw.startswith(("//", "mailto:", "tel:", "#")):
        return None
    path = unquote(parsed.path)
    target = ROOT / path.lstrip("/") if path.startswith("/") else source.parent / path
    if path.endswith("/") or target.is_dir():
        target /= "index.html"
    return target.resolve()

errors = []
pages = [p for p in ROOT.rglob("*.html") if not any(part in SKIP_DIRS for part in p.parts)]
for page in pages:
    parser = PageParser()
    try:
        parser.feed(page.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"{page.relative_to(ROOT)}: cannot parse: {exc}")
        continue
    if not parser.has_title:
        errors.append(f"{page.relative_to(ROOT)}: missing <title>")
    if not parser.has_viewport:
        errors.append(f"{page.relative_to(ROOT)}: missing viewport meta tag")
    for raw in parser.links:
        target = local_target(page, raw)
        if target and not target.exists():
            errors.append(f"{page.relative_to(ROOT)}: broken local reference {raw}")

if errors:
    print("Site check failed:")
    print("\n".join(f"- {error}" for error in errors))
    sys.exit(1)
print(f"Site check passed: {len(pages)} HTML pages, all local references resolve.")
