"""Copy the static prototype to a GitHub Pages project subpath."""

from pathlib import Path
import re
import shutil


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "dist"
TARGET = ROOT / "pages-dist"
BASE = "/tonpao-map-public"

if TARGET.exists():
    shutil.rmtree(TARGET)
shutil.copytree(SOURCE, TARGET)

# The prototype uses hash routes, but some navigation points at the domain
# root. Pages serves this repository under /tonpao-map-public/ instead.
asset_names = [re.escape(path.name) for path in SOURCE.glob("*.js")]
asset_names += [re.escape(path.name) for path in SOURCE.glob("*.css")]
asset_pattern = re.compile(r"(?<=[\"'])/((?:" + "|".join(asset_names) + r"))(?=[\"'])")

for path in TARGET.rglob("*"):
    if path.suffix not in {".html", ".js", ".css"}:
        continue
    original = path.read_text(encoding="utf-8")
    updated = original.replace('"/#', f'"{BASE}/#').replace("'/#", f"'{BASE}/#")
    updated = asset_pattern.sub(lambda match: BASE + match.group(), updated)
    # A screen can also be loaded directly from a link outside the iframe.
    updated = updated.replace("'/screens/", f"'{BASE}/screens/").replace('"/screens/', f'"{BASE}/screens/')
    if updated != original:
        path.write_text(updated, encoding="utf-8")

(TARGET / ".nojekyll").touch()
print(f"Prepared {TARGET} for {BASE}/")
