#!/usr/bin/env bash
# Harness Academy — alle Prüfungen.
#
# Vier Ebenen, absichtlich getrennt:
#   1. Erzeugung mit Python   (phase0/test.sh)
#   2. Web-Bündel ist aktuell (tools/build_web.py --pruefen)
#   3. Browser-Kern == Python-Kern  (tests/test_bundle.js, braucht node)
#   4. Die echte Oberfläche im Browser  (tests/ui_check.html, braucht Chromium)
#
# Ebene 4 läuft nur, wenn ein Browser gefunden wird — sie ist der schärfste
# Test, aber nicht überall verfügbar (z.B. nicht in der CI).
set -uo pipefail

HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HIER"

ZEITSTEMPEL="2026-09-22 23:40"
export HA_ZEITSTEMPEL="$ZEITSTEMPEL"

BROWSER="${HA_BROWSER:-}"
if [ -z "$BROWSER" ]; then
  for kandidat in \
    "$HOME/.cache/ms-playwright/chromium_headless_shell-"*/chrome-linux/headless_shell \
    /usr/bin/chromium-browser /usr/bin/chromium /usr/bin/google-chrome
  do
    [ -x "$kandidat" ] && { BROWSER="$kandidat"; break; }
  done
fi

fehler=0

echo "############ 1. Erzeugung mit Python"
( cd phase0 && bash ./test.sh ) || fehler=1

echo
echo "############ 2. Web-Bündel gegen die Quellen"
python3 tools/build_web.py --pruefen || fehler=1

echo
echo "############ 3. Browser-Kern gegen Python-Kern"
if command -v node >/dev/null 2>&1; then
  ( cd phase0 && for p in pi5 macmini vps; do
      python3 render.py "examples/freund-$p.json" --out out >/dev/null || exit 1
    done ) || fehler=1
  node tests/test_bundle.js || fehler=1
else
  echo "ÜBERSPRUNGEN — node fehlt"
fi

echo
echo "############ 4. Die echte Oberfläche im Browser"
if [ -n "$BROWSER" ] && [ -x "$BROWSER" ]; then
  echo "Browser: $BROWSER"
  for seite in browser_check ui_check; do
    ARBEIT="$(mktemp -d)"
    ausgabe="$(timeout 90 "$BROWSER" --no-sandbox --disable-gpu \
        --disable-dev-shm-usage --allow-file-access-from-files \
        --user-data-dir="$ARBEIT" --virtual-time-budget=8000 --dump-dom \
        "file://$HIER/tests/$seite.html" 2>/dev/null \
      | sed -n '/id="ausgabe"/,/<\/pre>/p' | sed 's/<[^>]*>//g')"
    rm -rf "$ARBEIT"
    echo "$ausgabe"
    echo "$ausgabe" | grep -q "fehlgeschlagen: 0" || fehler=1
  done
else
  echo "ÜBERSPRUNGEN — kein Chromium gefunden (HA_BROWSER setzen, um es zu erzwingen)"
fi

echo
if [ "$fehler" -eq 0 ]; then
  echo "ALLE PRÜFUNGEN BESTANDEN"
else
  echo "ES GIBT FEHLSCHLÄGE"
fi
exit "$fehler"
