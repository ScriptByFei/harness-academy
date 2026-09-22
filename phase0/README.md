# Phase 0 — Template-Sammlung und Renderer

Kein UI. Ein Renderer nimmt ein Hardware-Profil plus eine Nutzerwahl und erzeugt
ein Artefakt-Bundle. Ziel dieser Phase ist der Beweis, dass aus einem Profil eine
`config.yaml` entsteht, **die eine echte Hermes-Installation akzeptiert**.

## Aufbau

```
data/profiles.json          drei Hardware-Profile (Pi 5, Mac mini, VPS)
phase0/templates/           die Vorlagen (config, env, setup, verify, Checkliste)
phase0/examples/            Beispielwahlen, je eine pro Profil
phase0/render.py            der Renderer (nur Standardbibliothek)
phase0/test.sh              Prüfungen, wiederholbar
phase0/out/<profil>/        erzeugte Bundles
```

## Benutzen

```bash
python3 render.py examples/freund-pi5.json --out out
```

Ergebnis liegt in `out/pi5/`:

```
config.yaml      validiert, kommentiert
.env.example     Platzhalter — kein echter Wert
setup.sh         idempotent, prüft nach jedem Schritt
verify.sh        liest nur, ändert nichts
CHECKLISTE.md    die Schritte zum Abhaken
```

Der Renderer **bricht ab**, statt still zu rendern, wenn

- ein Profil unbekannt ist,
- ein Platzhalter keinen Wert hat,
- die erzeugte `config.yaml` `model.provider` nicht setzt,
- ein eingebauter Provider eine `base_url` bekommt (siehe unten),
- ein nicht eingebauter Provider ohne `base_url` angegeben wird.

## Der Fallstrick, der diese Phase geprägt hat

**Eine gesetzte `model.base_url` schaltet Hermes auf „Custom endpoint" um** —
auch bei einem eingebauten Provider wie `openrouter`. Live nachgemessen:

| `model.provider` | `model.base_url` | Hermes meldet |
|---|---|---|
| `openrouter` | nicht gesetzt | **OpenRouter** ✓ |
| `openrouter` | `https://openrouter.ai/api/v1` | Custom endpoint ✗ |
| `openrouter` | `""` (leer) | OpenRouter ✓ |
| `custom` | gesetzt | Custom endpoint ✓ (so gewollt) |

Deshalb setzt das Template für eingebaute Provider **keine** `base_url` und
schreibt die Begründung als Kommentar in die erzeugte Datei. Wer den Kommentar
später liest, versteht, warum die Zeile fehlt.

Ein zweiter Fallstrick: ein `providers:`-Block, dessen Schlüssel einen
**eingebauten** Provider nennt, überschreibt diesen ebenfalls. Auch dagegen prüft
der Renderer.

## Prüfen

```bash
./test.sh
```

Prüft: alle drei Profile rendern, `config.yaml` ist valides YAML mit
Pflichtschlüsseln, keine Secrets in den Artefakten, Shell-Syntax der erzeugten
Skripte, und die Fehlerfälle greifen.
