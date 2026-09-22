#!/usr/bin/env python3
"""
Harness Academy — Symbole erzeugen.

Erzeugt die PWA-Symbole als PNG. Das Motiv ist bewusst einfach und ohne
Schrifttype: eine Eingabeaufforderung (Chevron und Unterstrich) auf dunklem
Grund. Es ist bei 192 px noch erkennbar und braucht keine Schriftdatei, die
auf einem fremden Rechner fehlen könnte.

Aufruf:  python3 tools/make_icons.py
"""
import os
import sys

from PIL import Image, ImageDraw

HIER = os.path.dirname(os.path.abspath(__file__))
ZIEL = os.path.join(os.path.dirname(HIER), "web", "icons")

HINTERGRUND = (15, 23, 42, 255)      # #0f172a — dieselbe Farbe wie der Kopf
VORDERGRUND = (255, 255, 255, 255)
AKZENT = (37, 99, 235, 255)          # #2563eb


def zeichne(groesse, randanteil):
    """randanteil: Anteil des Bildes, der als Sicherheitsrand frei bleibt.
    Für maskierbare Symbole größer, weil das Betriebssystem den Rand beschneidet."""
    bild = Image.new("RGBA", (groesse, groesse), (0, 0, 0, 0))
    d = ImageDraw.Draw(bild)

    radius = int(groesse * 0.22)
    d.rounded_rectangle([0, 0, groesse - 1, groesse - 1], radius=radius, fill=HINTERGRUND)

    rand = groesse * randanteil
    innen = groesse - 2 * rand

    strich = max(2, int(innen * 0.085))
    farbe = VORDERGRUND

    # Chevron ">" — zwei Striche, oben und unten von der Mitte aus.
    x0 = rand + innen * 0.20
    x1 = rand + innen * 0.42
    mitte_y = rand + innen * 0.44
    hoehe = innen * 0.20
    d.line([(x0, mitte_y - hoehe), (x1, mitte_y), (x0, mitte_y + hoehe)],
           fill=farbe, width=strich, joint="curve")

    # Unterstrich "_" — der Eingabeplatzhalter.
    ux0 = rand + innen * 0.53
    ux1 = rand + innen * 0.82
    uy = rand + innen * 0.64
    d.line([(ux0, uy), (ux1, uy)], fill=AKZENT, width=strich)

    return bild


def main():
    os.makedirs(ZIEL, exist_ok=True)

    aufgaben = [
        ("icon-192.png", 192, 0.16),
        ("icon-512.png", 512, 0.16),
        ("icon-maskable-512.png", 512, 0.26),
    ]

    for name, groesse, rand in aufgaben:
        pfad = os.path.join(ZIEL, name)
        zeichne(groesse, rand).save(pfad, "PNG", optimize=True)
        print(f"  {name:26s} {groesse}x{groesse}  {os.path.getsize(pfad):6d} Bytes")

    print(f"\nZiel: {ZIEL}")


if __name__ == "__main__":
    sys.exit(main())
