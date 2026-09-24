"""Download remote images referenced by the prototype into dist/assets/images/.

Finds image URLs from the hosts in IMAGE_URL, saves each unique image once
(named by a hash of its URL), and rewrites every reference to a relative
path so the site works both at the domain root and under the GitHub Pages
prefix. Map tiles and fonts are left alone.

Usage: python3 scripts/localize-images.py [--dry-run]
"""

from html import unescape
from pathlib import Path, PurePosixPath
import hashlib
import json
import os
import posixpath
import re
import sys
import time
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
IMAGES = DIST / "assets" / "images"
MANIFEST = IMAGES / "manifest.json"
IMAGE_URL = re.compile(
    r"https://lh3\.googleusercontent\.com/[A-Za-z0-9_\-/=]+"
    r"|https://images\.unsplash\.com/[^\"'\s()<>]+"
)
TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/svg+xml": ".svg",
}
SOURCES = [p for p in DIST.rglob("*") if p.suffix in {".html", ".js", ".css"} and IMAGES not in p.parents]


def sniff(data, header):
    kind = (header or "").split(";")[0].strip().lower()
    if kind in TYPES:
        return TYPES[kind]
    if data[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif"
    if data[4:12] in (b"ftypavif", b"ftypavis"):
        return ".avif"
    return None


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (tonpao-map localize-images)"})
    last_error = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                data = response.read()
                ext = sniff(data, response.headers.get("Content-Type"))
                if not ext:
                    raise ValueError(f"not an image ({response.headers.get('Content-Type')})")
                return data, ext
        except Exception as error:  # network errors, HTTP errors, bad content
            last_error = error
            time.sleep(2 ** attempt)
    raise last_error


def base_dirs(path):
    """Directories that relative URLs in this file resolve against."""
    if path.suffix != ".js":
        return {path.parent}
    # URLs in JS end up in the DOM, so they resolve against the pages that load the script.
    pages = {p.parent for p in DIST.rglob("*.html") if path.name in p.read_text(encoding="utf-8")}
    return pages or {DIST}


def main():
    dry_run = "--dry-run" in sys.argv
    found = {}
    for path in SOURCES:
        for literal in set(IMAGE_URL.findall(path.read_text(encoding="utf-8"))):
            found.setdefault(literal, set()).add(path)

    IMAGES.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    local, failed = {}, {}
    for literal in sorted(found):
        url = unescape(literal)
        stem = hashlib.sha1(url.encode()).hexdigest()[:16]
        existing = next(IMAGES.glob(stem + ".*"), None)
        if existing:
            local[literal] = existing
            continue
        if dry_run:
            print("would download", url[:100])
            continue
        try:
            data, ext = download(url)
        except Exception as error:
            failed[url] = str(error)
            print(f"FAILED {url[:90]}… {error}")
            continue
        target = IMAGES / (stem + ext)
        target.write_bytes(data)
        manifest[target.name] = url
        local[literal] = target
        print(f"saved {target.name} ({len(data) // 1024} KB)")

    changed = 0
    for path in SOURCES:
        text = original = path.read_text(encoding="utf-8")
        # Longest first, so a URL that prefixes another cannot clobber it.
        for literal, target in sorted(local.items(), key=lambda item: -len(item[0])):
            if literal not in text:
                continue
            rels = {posixpath.relpath(PurePosixPath(target.relative_to(DIST)), PurePosixPath(d.relative_to(DIST))) for d in base_dirs(path)}
            if len(rels) != 1:
                print(f"SKIPPED {path.relative_to(ROOT)}: loaded from pages at different depths {sorted(rels)}")
                continue
            text = text.replace(literal, rels.pop())
        if text != original and not dry_run:
            path.write_text(text, encoding="utf-8")
            changed += 1

    if not dry_run:
        MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    summary = [
        f"Unique remote images: {len(found)}",
        f"Stored locally: {len(local)}",
        f"Failed: {len(failed)}",
        f"Files rewritten: {changed}",
    ]
    summary += [f"- FAILED {url} ({error})" for url, error in failed.items()]
    print("\n".join(summary))
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as out:
            out.write("## Localize images\n\n" + "\n".join(f"- {line}" if not line.startswith("-") else line for line in summary) + "\n")
    # Partial success still helps; only fail when no image could ever be stored.
    return 1 if failed and not local and not manifest else 0


if __name__ == "__main__":
    sys.exit(main())
