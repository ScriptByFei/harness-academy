#!/usr/bin/env bash
# Harness Academy — Prüfungen für Phase 0. Wiederholbar, ohne Seiteneffekte.
set -uo pipefail
HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HIER"

bestanden=0; fehlgeschlagen=0
pruefe() {
  local name="$1"; shift
  if "$@" >/dev/null 2>&1; then
    printf 'OK    %s\n' "$name"; bestanden=$((bestanden+1))
  else
    printf 'FEHL  %s\n' "$name"; fehlgeschlagen=$((fehlgeschlagen+1))
  fi
}
pruefe_nicht() {
  local name="$1"; shift
  if "$@" >/dev/null 2>&1; then
    printf 'FEHL  %s (haette scheitern muessen)\n' "$name"; fehlgeschlagen=$((fehlgeschlagen+1))
  else
    printf 'OK    %s\n' "$name"; bestanden=$((bestanden+1))
  fi
}

echo "== Rendern =="
for p in pi5 macmini vps; do
  pruefe "rendert $p" python3 render.py "examples/freund-$p.json" --out out
done

echo "== Erzeugte Dateien =="
for p in pi5 macmini vps; do
  for f in config.yaml .env.example setup.sh verify.sh CHECKLISTE.md; do
    pruefe "$p/$f vorhanden" test -s "out/$p/$f"
  done
done

echo "== config.yaml inhaltlich =="
for p in pi5 macmini vps; do
  pruefe "$p config ist valides YAML" python3 -c "
import yaml,sys
d=yaml.safe_load(open('out/$p/config.yaml'))
sys.exit(0 if isinstance(d,dict) and d.get('model',{}).get('provider') else 1)"
  pruefe "$p ohne base_url bei eingebautem Provider" bash -c "! grep -qE '^\s*base_url:' out/$p/config.yaml"
done

echo "== Shell-Syntax =="
for f in out/*/setup.sh out/*/verify.sh; do
  pruefe "Syntax $f" bash -n "$f"
done

echo "== Keine Secrets =="
pruefe_nicht "kein Key-Wert in Artefakten" bash -c "grep -rqE 'sk-[a-zA-Z0-9]{16,}' out/"

echo "== Fehlerfaelle greifen =="
mkdir -p /tmp/ha_t && printf '{"profil":"gibtsnicht"}' > /tmp/ha_t/x.json
pruefe_nicht "unbekanntes Profil wird abgelehnt" python3 render.py /tmp/ha_t/x.json --out /tmp/ha_t/o
printf '%s' '{"profil":"pi5","provider":{"key":"openrouter","label":"O","base_url":"https://x.y"},"modell":{"id":"m","context_length":1},"agent":{"max_turns":1,"gateway_timeout":1},"kanal":"telegram"}' > /tmp/ha_t/y.json
pruefe_nicht "eingebauter Provider mit base_url wird abgelehnt" python3 render.py /tmp/ha_t/y.json --out /tmp/ha_t/o
printf '%s' '{"profil":"pi5","provider":{"key":"unbekannt-xyz","label":"U"},"modell":{"id":"m","context_length":1},"agent":{"max_turns":1,"gateway_timeout":1},"kanal":"telegram"}' > /tmp/ha_t/z.json
pruefe_nicht "fremder Provider ohne base_url wird abgelehnt" python3 render.py /tmp/ha_t/z.json --out /tmp/ha_t/o

echo
echo "bestanden: $bestanden   fehlgeschlagen: $fehlgeschlagen"
[ "$fehlgeschlagen" -eq 0 ]
