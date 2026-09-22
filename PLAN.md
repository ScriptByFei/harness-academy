# Harness Academy — Projektplan

> Stand 2026-09-22. Planungsphase, noch kein Code.
> Referenzsystem: das eigene Setup auf fei89 (Raspberry Pi 5) — vermessen, nicht angenommen.

## 0. Entschieden

| Frage | Entscheidung |
|---|---|
| Zielgruppe | **Privat** — Timo und Freunde |
| Name | **Harness Academy** |
| Scope v1 | **Nur Hermes** |
| System-Check | **Nur Messbericht** (kein SSH, kein Backend) |
| Sprache | **Deutsch** |

Diese fünf Entscheidungen halten das Projekt klein: kein Account, kein Onboarding,
kein Server, keine Übersetzungen. Die App ist eine statische PWA, die eine
Konfiguration versteht und Artefakte erzeugt.

**Was das Projekt ist und was nicht:** Es ist eine **Lernplattform** — der Nutzer
soll ein Harness-System verstehen und aufsetzen können. Der Wert liegt im
Lernpfad, in der Anleitung und in der Rechnung „passt mein Plan auf meine
Hardware". **Energieverbrauch und Kostensparen sind nicht der Zweck** und gehören
nur als Fußnote in die Hardware-Daten. Wer das Gerät wählt, wählt es nach
Lerneffekt und Aufwand, nicht nach Watt.

## 1. Warum dieses Produkt eine Lücke trifft

**Was es gibt:** Tutorials, die erklären *was* ein Agent ist, und Blogs, die ein
konkretes Setup in Prosa beschreiben. Generatoren existieren für Coding-Agent-
Konfigdateien (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`) — eine Handvoll
Textdateien, kein laufendes System.

**Was fehlt:** Ein Tutorial sagt dir nie, ob dein Plan auf *deiner* Hardware
überhaupt läuft. Ein Blogpost ist nach zwei Monaten veraltet. Und niemand liefert
die Artefakte fertig: `config.yaml`, Service-Unit, `.env`, Setup-Skript.

**Der Kern:** Das Produkt muss **rechnen**, nicht erzählen. Es nimmt die Hardware
des Nutzers und entscheidet, welche Komponenten passen — und sagt ehrlich, was
nicht geht.

## 2. Die gemessenen Zahlen

### Scope v1: nur Hermes

| Komponente | RAM |
|---|---|
| Hermes-Gateway | 589 MB |
| Hermes-Serve | 124 MB |
| **Hermes-Kern** | **713 MB = 0,70 GB** |
| + Browser-Tool (`cdp-chromium`) | +134 MB → 847 MB |
| + Vektor-Store (qdrant) | +3 MB → 850 MB |

### Was auf welcher Maschine geht

| Maschine | Hermes-only (850 MB) | Vollstack (3,5 GB) |
|---|---|---|
| 2 GB VPS | 41 % — knapp, machbar | **175 % — unmöglich** |
| 4 GB VPS | **21 % — bequem** | 88 % — quetscht |
| 8 GB VPS | 10 % — viel Luft | 44 % |
| Raspberry Pi 5 (7,8 GB) | 11 % | 45 % |

Das ist die zentrale Aussage des Produkts. Ein Tutorial kann sie nicht treffen,
weil sie eine Messung voraussetzt.

> **Für die Doku wichtig:** Die 3,5-GB-Zahl gilt für den *Vollstack* — zwei
> OpenClaw-Gateways (1,18 + 0,90 GB), Weltmodell, Bridge. Für die Academy ist sie
> nur Vergleichsmaterial, **nicht** Empfehlungsgrundlage. Wer nur Hermes will,
> braucht ein Drittel davon.

## 3. Produktkern — drei Bausteine

**Die drei Zielwege stehen fest** (entschieden 2026-09-22): Raspberry Pi 5, Mac mini
M4 und VPS. Die Plattform beschreibt nur diese drei — jedes weitere Gerät
vervielfacht Anleitungen und Dienstformate, ohne einen der drei Menschentypen
besser zu bedienen. Details, Preise und Profile: `HARDWARE.md`.

1. **Konfigurator** — Wizard, der aus Hardware- und Zielprofil ein
   Artefakt-Bundle erzeugt.
2. **Lernpfade** — geführte Strecke in Phasen, jede mit *prüfbarem* Ergebnis.
   Checkliste + Befehl + Verifikationsschritt statt Video.
3. **System-Check** — erzeugt ein Prüfskript, wertet dessen JSON aus und
   vergleicht gegen das eigene Profil: „Dein Pi hat 6 GB in Benutzung; erwartet
   waren 3,5."

Baustein 3 ist der Twist: Dieselbe Engine, die Konfiguration *erzeugt*, kann sie
auch *prüfen*. Die Plattform ist damit keine Einbahnstraße aus der Anleitung.

### Wie der Check ohne Backend funktioniert

```
App  ->  check.sh herunterladen
           |
Nutzer führt es auf seiner Maschine aus   (lokal, kein Netz nach außen)
           |
        Ergebnis-JSON
           |
App  <-  JSON importieren  ->  Bericht + Soll/Ist-Vergleich
```

Damit braucht es **keinen** SSH-Zugang, **kein** Backend und **keine** offenen
Ports. Der Nutzer behält die Kontrolle über jeden Schritt — und weil nur ein
Messbericht entsteht, ist die Auswertung read-only.

## 4. Konfigurator: Entscheidungsbäume

Fragen in dieser Reihenfolge — jede schränkt die folgenden ein:

1. **Zielumgebung** — eigener Server/Pi · VPS · Homelab-Rechner · nur Container
2. **Hardware** — RAM, Kerne, Speicher (freie Eingabe, keine Auswahlliste)
3. **Modelle** — Cloud-API · lokal · hybrid mit Fallback
4. **Kanäle** — Telegram, Discord, Slack, E-Mail …
5. **Automatisierung** — Cronjobs, Watchdogs
6. **Zugang/Netz** — Tailscale, Reverse-Proxy mit TLS, Tunnel
7. **Zweck** — Coding-Begleiter, Haushaltssteuerung, Recherche, Multi-Agent-Team

**Prüfungen (das eigentliche Produkt):**

- RAM-Budget gegen die gewählten Komponenten; rote Karte mit Begründung, wenn
  die Summe die Maschine übersteigt
- Hinweis, wenn lokale Inferenz gewählt wird, die Hardware aber nur Cloud trägt
- Secret-Bedarf je Kanal auflisten, damit vorher klar ist, was zu besorgen ist
- Warnung bei Konstellationen, die ohne Nutzen RAM kosten

**Output:**

```
config.yaml              # validiert, kommentiert
.env.example             # Platzhalter, echter Wert bleibt leer
systemd/*.service        # Units, korrekt für User- oder System-Scope
                         #   → auf macOS stattdessen LaunchAgent (launchd)
setup.sh                 # idempotent, prüft nach jedem Schritt
verify.sh                # Verifikation gegen das Profil
CHECKLISTE.md            # die Phasen zum Abhaken
```

**Dienstformat je Zielweg:** Der Befehl ist überall `hermes gateway install`, das
Ergebnis unterscheidet sich. Auf Pi und VPS entsteht eine systemd-Unit, auf dem
Mac ein LaunchAgent unter `~/Library/LaunchAgents/`. Der Renderer muss den
Diensttyp aus dem Hardware-Profil ableiten, nicht fest verdrahten.

## 5. Architektur

- **PWA, installierbar, offline-fähig.** Nach dem ersten Laden läuft sie ohne Netz.
- **Kein Backend.** Profil im `localStorage`, Export/Import als JSON-Datei. Damit
  verlässt kein Schlüssel und kein Hardware-Profil das Gerät — bei einem Produkt,
  das Secrets anfasst, ist das kein Nice-to-have, sondern die Botschaft.
- **Templates als Daten, nicht als Code.** Vorlagen (config.yaml, Units, Skripte)
  liegen als versionierte Sammlung; der Renderer füllt sie. Content-Pflege und
  Logik bleiben getrennt.
- **Zielplattform der erzeugten Artefakte ist identisch zu dem, was hier läuft** —
  jede erzeugte Anleitung ist durch eine echte Installation gedeckt.

## 6. Phasenplan

**Phase 0 — Fundament ohne UI.** Template-Sammlung + Renderer (Profil-JSON →
Artefakte). Ziel: aus einem Profil entsteht eine `config.yaml`, die eine echte
Installation startet. *Prüfbar, ohne eine Zeile Oberfläche.*

> **Erledigt 2026-09-22.** Liegt in `phase0/`. Drei Profile, fünf Vorlagen,
> Renderer, `test.sh` mit **34 Prüfungen, alle grün**. Beweis erbracht: die
> erzeugte `config.yaml` wird von Hermes als **OpenRouter** geladen — für alle
> drei Profile im isolierten `HERMES_HOME` nachgemessen.
>
> Dabei ein echter Fallstrick gefunden und im Renderer abgesichert: **eine
> gesetzte `model.base_url` schaltet Hermes auf „Custom endpoint" um**, auch bei
> einem eingebauten Provider wie `openrouter`. Das Template setzt sie deshalb
> nicht mehr und schreibt die Begründung als Kommentar in die erzeugte Datei.

**Phase 1 — Konfigurator-PWA.** Wizard, Budget-Prüfungen, Download des Bundles,
offline installierbar, deutsch.

**Phase 2 — Lernpfade.** Sieben Stufen mit Verifikation:
1. Grundinstallation (Hermes auf Pi oder VPS)
2. Modell und Provider anbinden
3. Erster Kanal (Telegram)
4. Autonomie: Cronjobs und Watchdogs
5. Fähigkeiten: Skills, MCP
6. Gedächtnis und Kontext
7. Betrieb: Messen, Aufräumen, Aktualisieren

Seed-Material ist vorhanden: die Harness-Skills zu Administration, Token-Flow,
Bot-Roster und MCP-Clients beschreiben genau diese Schritte.

**Phase 3 — System-Check.** `check.sh`-Generator plus JSON-Auswertung mit
Soll/Ist-Vergleich.

**Phase 4 — Ausbau.** Weitere Kanäle, geteilte Profile und Rezepte für Freunde,
optional OpenClaw als eigener Lernpfad.

## 7. Was die Planung für *unser* System ergeben hat

1. **Das RAM-Budget ist nirgends dokumentiert.** Jetzt bekannt: Hermes-Kern
   713 MB, Vollstack 3,5 GB, davon 74 % Gateways. Gehört in die Betriebsdoku,
   damit künftige Änderungen gegen ein Budget laufen statt ins Blaue.
2. **Es gibt kein Harness-Manifest.** Drei Schichten ohne gemeinsame Übersicht:
   was läuft, warum, welcher Port, welcher RAM-Bedarf. Der System-Check braucht
   das als Datengrundlage — es entsteht also als Nebenprodukt.
3. **242 Skills, aber kein Lernpfad.** Das Wissen liegt als Nachschlagewerk vor,
   nicht als Strecke für jemanden, der bei null anfängt. Phase 2 extrahiert genau
   diese Reihenfolge.
4. **Beobachtung, kein Auftrag:** Die zwei OpenClaw-Gateways kosten 2,1 GB; ein
   gemeinsamer Gateway mit mehreren Bots würde rund 1 GB sparen. Die Trennung hat
   Gründe (State-Isolation, getrenntes `OPENCLAW_HOME`) — das ist eine bewusste
   Abwägung, die geprüft gehört, keine automatische Änderung. Liegt außerhalb des
   Academy-Scopes.

## 8. Was noch offen ist

1. ~~**Zielplattform der Freunde**~~ — **beantwortet:** es geht nicht um vorhandene
   Hardware, sondern um eine **Kaufempfehlungsliste** von günstig bis teuer, weil
   die Freunde erst anfangen. Siehe `HARDWARE.md` (eigene Datei, Preise mit Datum).
2. **Verteilungsweg** — statisches Hosting (GitHub Pages, weil `scriptbyfei`
   schon dort ist) oder lokal geöffnete Datei?
3. **Verhältnis zu den 242 Skills** — bleiben sie getrennt, oder fließen Teile
   als Lernpfad-Inhalte in die Academy?

## 9. Nächster Schritt

Phase 0 ohne Oberfläche: eine kleine Template-Sammlung plus Renderer, geprüft
gegen ein JSON-Profil, das die eigene Maschine beschreibt. Erst wenn daraus eine
`config.yaml` entsteht, die eine echte Installation startet, kommt der Wizard.
Das Risiko liegt in den Artefakten, nicht im UI.
