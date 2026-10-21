"""Reject bundled custom scripts and inspect newly built APKs before publication."""
import pathlib
import sys
import zipfile

root = pathlib.Path(__file__).resolve().parents[1]
for directory in ("builtin", "flower", "scripts"):
    assert not (root / "src" / "sources" / directory).exists(), "Bundled source directory present"

for path in sys.argv[1:]:
    with zipfile.ZipFile(path) as archive:
        scripts = [name for name in archive.namelist() if name.endswith(".js")
                   and name != "assets/script/user-api-preload.js"]
        assert not scripts, f"Unexpected JavaScript assets in {path}: {scripts}"
    print(f"Verified APK: {path}")
print("No bundled custom sources")
