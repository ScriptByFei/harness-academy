#!/usr/bin/env python3
"""
Harness Academy — Web-Bundle bauen.

Eine Quelle, eine Kopie, eine Prüfung. Es gibt genau EINEN Ort, an dem die
Geräteprofile und die Vorlagen gepflegt werden:

    data/profiles.json
    phase0/templates/*.tmpl

Dieses Skript erzeugt daraus web/js/daten.js. Warum als JavaScript und nicht
als JSON: die App soll auch per Doppelklick (file://) laufen, und dort
blockiert der Browser jeden fetch(). Eingebettete Daten umgehen das.

Aufruf:
    python3 tools/build_web.py            # bauen
    python3 tools/build_web.py --pruefen  # nur vergleichen, nichts schreiben
"""
import argparse
import json
import os
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.dirname(HIER)
PROFILE = os.path.join(WURZEL, "data", "profiles.json")
VORLAGEN = os.path.join(WURZEL, "phase0", "templates")
ZIEL = os.path.join(WURZEL, "web", "js", "daten.js")

# Dateiname der Vorlage  ->  Schlüssel im Bundle (= der Dateiname, den der
# Nutzer später in seinem Bundle sieht).
VORLAGEN_ZUORDNUNG = [
    ("config.yaml.tmpl", "config.yaml"),
    ("env.example.tmpl", ".env.example"),
    ("setup.sh.tmpl", "setup.sh"),
    ("verify.sh.tmpl", "verify.sh"),
    ("CHECKLISTE.md.tmpl", "CHECKLISTE.md"),
]

KOPF = """/* Harness Academy — eingebettete Daten.
 *
 * ERZEUGT von tools/build_web.py. NICHT von Hand bearbeiten.
 * Quelle: data/profiles.json und phase0/templates/*.tmpl
 *
 * Diese Datei ist bewusst JavaScript und nicht JSON: die App soll auch per
 * Doppelklick (file://) laufen, wo der Browser fetch() blockiert.
 */
"""


def erzeuge():
    with open(PROFILE, encoding="utf-8") as f:
        profile = json.load(f)

    vorlagen = {}
    for dateiname, schluessel in VORLAGEN_ZUORDNUNG:
        pfad = os.path.join(VORLAGEN, dateiname)
        if not os.path.isfile(pfad):
            sys.exit(f"FEHLER: Vorlage fehlt: {pfad}")
        with open(pfad, encoding="utf-8") as f:
            vorlagen[schluessel] = f.read()

    # Flache Struktur: die Schlüssel liegen so, wie der Renderer sie erwartet.
    # Vorher lag alles unter "profile", was zwei Ebenen erzeugte und beim
    # Aufruf zu Fehlgriffen führte.
    inhalt = {
        "meta": profile.get("meta", {}),
        "rechenregel_ram": profile["rechenregel_ram"],
        "dienstformate": profile["dienstformate"],
        "profile": profile["profile"],
        "vorlagen": vorlagen,
    }
    rumpf = "window.HADATEN = " + json.dumps(inhalt, ensure_ascii=False, indent=2) + ";\n"
    return KOPF + rumpf


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pruefen", action="store_true",
                    help="nur vergleichen, nichts schreiben")
    args = ap.parse_args()

    neu = erzeuge()

    if args.pruefen:
        if not os.path.isfile(ZIEL):
            sys.exit(f"FEHLER: {ZIEL} fehlt — tools/build_web.py laufen lassen.")
        with open(ZIEL, encoding="utf-8") as f:
            alt = f.read()
        if alt != neu:
            sys.exit("FEHLER: web/js/daten.js weicht von data/profiles.json bzw. "
                     "phase0/templates/ ab. tools/build_web.py laufen lassen.")
        print("OK    daten.js stimmt mit den Quellen überein")
        return

    os.makedirs(os.path.dirname(ZIEL), exist_ok=True)
    with open(ZIEL, "w", encoding="utf-8") as f:
        f.write(neu)

    with open(PROFILE, encoding="utf-8") as f:
        anzahl_profile = len(json.load(f)["profile"])

    print(f"geschrieben: {ZIEL}")
    print(f"  Geräteprofile : {anzahl_profile}")
    print(f"  Vorlagen      : {len(VORLAGEN_ZUORDNUNG)}")


if __name__ == "__main__":
    main()
