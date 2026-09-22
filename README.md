# Harness Academy

Eine Lernplattform, die zeigt, wie man ein KI-Harness aufsetzt — auf einem
Raspberry Pi, einem Mac mini oder einem gemieteten Server.

**Die Oberfläche ist live:** https://scriptbyfei.github.io/harness-academy/

## Was hier liegt

Dieses Verzeichnis ist beides: die Planung **und** die Anwendung.

```
PLAN.md          Projektplan, Phasen, offene Fragen
HARDWARE.md      die drei Wege, Preise, Intel-Warnung
data/            Geräteprofile — die eine Quelle für Hardware-Zahlen
phase0/          Renderer und Vorlagen (Python)
web/             die Anwendung (wird veröffentlicht)
tools/           Bau- und Prüfskripte
tests/           die Prüfungen
```

## Aufbau

Ein Renderer nimmt ein Geräteprofil plus eine Nutzerwahl und erzeugt fünf
Artefakte: `config.yaml`, `.env.example`, `setup.sh`, `verify.sh`,
`CHECKLISTE.md`.

Es gibt **zwei** Renderer mit **derselben** Logik:

- `phase0/render.py` — Python, für Prüfungen und Stapelverarbeitung
- `web/js/render-core.js` — JavaScript, für die Anwendung im Browser

Dass beide wirklich dasselbe erzeugen, ist keine Annahme, sondern eine
Prüfung: `tests/test_bundle.js` vergleicht die Ergebnisse Zeichen für Zeichen.
Ohne diesen Vergleich wäre jede Prüfung des Python-Renderers wertlos, sobald
jemand die Anwendung benutzt.

## Prüfen

```bash
bash tests/run_all.sh
```

Vier Ebenen:

| Ebene | Was geprüft wird |
|---|---|
| 1 | Erzeugung: alle Profile rendern, Fehlerfälle greifen |
| 2 | `web/js/daten.js` stimmt mit `data/profiles.json` und den Vorlagen überein |
| 3 | Browser-Renderer und Python-Renderer erzeugen dasselbe |
| 4 | die echte Oberfläche im echten Browser, mit echten Klicks |

Ebene 4 braucht Chromium. Fehlt es, wird sie übersprungen und das gesagt —
nicht stillschweigend als bestanden gewertet.

## Eine Quelle, eine Kopie

`web/js/daten.js` ist **erzeugt** aus `data/profiles.json` und
`phase0/templates/`. Nicht von Hand bearbeiten. Nach jeder Änderung an den
Quellen:

```bash
python3 tools/build_web.py
```

Die Prüfung `--pruefen` schlägt fehl, wenn die Kopie von den Quellen abweicht.

## Veröffentlichen

Ein Push auf `main` prüft und veröffentlicht automatisch nach GitHub Pages.
Der Ablauf liegt in `.github/workflows/deploy.yml`.

## Ein Fund, der die Umsetzung geprägt hat

Eine gesetzte `model.base_url` schaltet Hermes auf „Custom endpoint" um — auch
bei einem eingebauten Anbieter wie `openrouter`. Kein Absturz, keine
Fehlermeldung, nur der falsche Anbieter. Beide Renderer **verweigern** diese
Kombination deshalb und schreiben die Begründung als Kommentar in die erzeugte
Datei. Einzelheiten in `phase0/README.md`.
