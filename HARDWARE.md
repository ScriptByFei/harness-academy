# Harness Academy — Hardware

> Stand 2026-09-22. Preise recherchiert (Geizhals/heise/netcup/Hetzner).
> **Drei Wege:** Raspberry Pi 5 · Mac mini · VPS. Die breitere Geräteliste steht im Anhang.
>
> **Worum es hier geht:** welches Gerät trägt das System, wie setzt man es auf, was
> lernt man dabei. Preise spielen eine Rolle, Verbrauchswerte sind eine Fußnote —
> das Projekt ist eine Lernplattform, keine Energiestudie.

## Was Hermes wirklich braucht (gemessen, nicht geschätzt)

| Posten | RAM |
|---|---|
| Hermes-Kern (Gateway + Serve) | **713 MB** |
| + Browser-Tool + Vektor-Store | **850 MB** |
| Schlankes Linux darunter | ~400 MB |
| **Realistischer Bedarf** | **~1,3 GB** |

Das ist die Zahl, gegen die jeder der drei Wege geprüft wird. Zum Vergleich: unser
Vollstack mit zwei OpenClaw-Gateways und Weltmodell liegt bei 3,5 GB — das ist
**nicht** das, was ein Einsteiger aufsetzt.

**Untergrenze: 1 GB RAM reicht nicht.** Ab 2 GB wird es eng, ab 4 GB ist reichlich
Luft. Jedes der drei Geräte liegt weit darüber.

## Warum genau diese drei

Die drei Wege bedienen drei verschiedene Menschentypen, nicht drei Preisklassen:

- **Raspberry Pi 5** — will basteln und verstehen. Unser Vorzeigesystem.
- **Mac mini** — will es einfach und leise, ohne im Terminal zu leben.
- **VPS** — will keinen Kasten im Zimmer, sondern Zugriff von überall.

Jeder weitere Gerätetyp vervielfacht Anleitungen, Dienstformate und Fehlerbilder,
ohne einen dieser drei Typen besser zu bedienen.

## Weg 1 — Raspberry Pi 5 (unser Referenzsystem)

**8 GB · ARM64 · ~215–235 € komplett**

Ein Board allein ist es nicht. Realistisch kommt dazu:

| Teil | Preis |
|---|---|
| Pi 5 8 GB (nackt) | ~185 € |
| Netzteil 27 W (offiziell) | ~12 € |
| Aktiver Kühler | ~6 € |
| Gehäuse | ~10 € |
| microSD 64 GB (oder NVMe-HAT + SSD, ~40 €) | ~10 € |
| **Summe** | **~215–235 €** |

**Warum 8 GB und nicht 16 GB:** Der Aufpreis ist groß und der Nutzen null — Hermes
braucht 850 MB.

**Aufsetzen:** Raspberry Pi OS Lite (64-bit), dann `install.sh`. Dienste laufen als
**systemd-User-Unit**. Alles, was in unserer Anleitung steht, ist auf echter
Hardware erprobt.

**Stärken:** aarch64 ist bei Hermes Tier-1, riesige Community, kein Gebastel-Risiko
bei der Software (nur bei der Kühlung).
**Schwächen:** Zubehör einzeln kaufen, mehr Schritte bis zum ersten Bot.

**Für wen:** wer das System von innen verstehen will. Der direkte Vergleich mit
unserem Aufbau ist möglich, weil es dieselbe Hardware ist.

## Weg 2 — Mac mini

**16 GB · Apple Silicon · 1.049 € (M6) / 949 € (M4)**

**Zwei Dinge, die hier zwingend dazugehören:**

1. **Nur Apple Silicon.** Der macOS-Installer ist Apple-Silicon-only, und macOS auf
   Intel ist eine *nicht unterstützte* Plattform (mehr dazu unten).
2. **Kein systemd.** Hermes nutzt auf macOS `launchd`. Der Befehl ist derselbe
   (`hermes gateway install`) — das erzeugte Artefakt ist ein LaunchAgent unter
   `~/Library/LaunchAgents/` statt einer systemd-Unit. Das muss der Konfigurator
   aus dem Profil ableiten, nicht fest verdrahten.

**Modellstand (22.09.2026):** Der Mac mini **M6** ist seit heute lieferbar,
16 GB / 256 GB für **1.049 €**. Der M4 (949 €) ist die Vorgängergeneration und im
Preisverfall — für Hermes sind beide gleichwertig.

**Aufsetzen:** `install.sh` über das Terminal, oder Hermes Desktop. Der Mac ist der
bequemste Weg — kein Kühlkörper, kein Gehäuse, kein OS-Image.

**Stärken:** praktisch unhörbar, kein Gebastel, läuft als Arbeitsrechner mit.
**Schwächen:** viermal so teuer wie der Pi, für Hermes allein überdimensioniert.

**Für wen:** wer keinen Bastelabend will und den Rechner ohnehin am Schreibtisch
hat. Für den Einstieg ist der Preis hoch — aber es ist der Weg mit den wenigsten
Fehlerquellen.

### Intel-Macs und iMac — die Falle beim Gebrauchtkauf

**Regel: Mac nur mit Apple Silicon.** macOS auf Intel ist bei Hermes eine **nicht
unterstützte Plattform** — PRs zur Reparatur werden nicht angenommen,
Kompatibilitätscode darf jederzeit entfernt werden. Dazu: **macOS 26 Tahoe ist die
letzte Version für Intel-Macs**, macOS 27 läuft nur noch auf Apple Silicon.

Gebrauchte Intel-Mac minis und iMacs sind billig zu haben und funktionieren
**nicht verlässlich**. Wer einen gebrauchten Mac sucht, tappt genau hier hinein.

**Was beim iMac von 2020 tatsächlich geprüft ist:**

- **Das `.dmg` startet nicht** auf Intel (gemeldeter Fehlerfall: Verbotszeichen).
  Es gibt keinen x86-Build der Desktop-App.
- **`install.sh` blockt Intel nicht ab.** Das Skript behandelt `Darwin*` normal als
  `macos`; es gibt keine Architektur-Sperre. Node wird automatisch als x64 geladen.
  Der Weg funktioniert also — nur ohne jede Garantie.
- **Der Engpass ist Python.** Hermes braucht `>=3.11,<3.14`. Steht der iMac auf
  einem alten macOS mit Python 3.9, muss Homebrew-Python nachhelfen. Das ist der
  Punkt, an dem es typischerweise hakt.
- **RAM ist kein Thema.** 8 GB gegen 850 MB Bedarf — reichlich. (Der 27" von 2020
  ließe sich sogar nachrüsten, ist aber nicht nötig.)

**Für Dauerbetrieb entscheidend:** Systemeinstellungen → **Displays → Advanced** →
*„Prevent automatic sleeping when the display is off"*. Ohne diese Einstellung
schläft der **ganze** Rechner, sobald das Display ausgeht — der Agent wäre tot,
nicht nur dunkel. Dazu passend `pmset displaysleepnow` (Display aus) und
`caffeinate -i` (Rechner wachhalten).

**Ein echter Vorteil gegenüber dem Mac mini:** Der iMac braucht **keinen
Headless-Dongle**. Ein Mac mini ohne Monitor verlangt einen HDMI-Dummy, damit eine
GUI-Sitzung entsteht. Beim iMac ist der Bildschirm eingebaut.

**Linux ist keine gute Alternative:** Der iMac 2020 hat einen T2-Chip — unter Linux
sind WLAN und Bluetooth nur über Firmware-Umwege ans Laufen zu bringen. Für einen
Einsteiger die denkbar schlechteste erste Erfahrung.

**Fazit für einen Freund:** Steht der iMac schon da oder ist er geschenkt — nutzen,
als Übungsumgebung ist er gut geeignet. **Geld dafür ausgeben: nein** — für denselben
Betrag gibt es einen neuen Pi mit Garantie und gepflegter Plattform.

**Zur Leistungsaufnahme, damit die Zahl einmal im Dokument steht:** Apple gibt für
den iMac 27" 5K von 2020 **74 W** im Leerlauf an (mit Display), bis 295 W unter
Last. Ohne Display messen Nutzer 30–40 W, weil die Paneelelektronik weiterläuft.
Ein Mac mini liegt bei 4 W. Für die Entscheidung ist das nebensächlich — relevant
ist, dass der iMac **dauerhaft wach bleiben muss**, wenn er als Server dient.

## Weg 3 — VPS (kein Gerät im Zimmer)

**4 GB reichen bequem · Linux x86_64 oder ARM64 · ab 4,96 €/Monat**

| Angebot | RAM | Preis/Monat |
|---|---|---|
| netcup VPS 500 G12 | 4 GB, 2 vCore | **4,96 €** |
| Hetzner CAX11 | 4 GB ARM, 2 vCore | **4,99 €** |
| Hetzner CAX21 | 8 GB ARM, 4 vCore | **8,49 €** |
| netcup VPS 1000 G12 | 8 GB, 4 vCore | **8,70 €** |

Alle Preise inkl. IPv4. ARM (CAX) ist kein Problem — aarch64 ist Hermes-Tier-1,
das läuft genauso wie x86.

**4 GB ist die richtige Wahl** (850 MB = 21 % Auslastung). **8 GB nur, wenn später
mehr dazukommt.** 2 GB nicht nehmen.

**Aufsetzen:** Ubuntu oder Debian, dann `install.sh`. Dienste laufen als
**systemd-Unit** — identisch zum Pi. Der schnellste Weg zum ersten Bot: kein
Gerät, keine Kühlung, kein Netzwerk zu Hause.

**Stärken:** in fünf Minuten läuft der erste Bot, kein Lärm, kein Port-Forwarding
(Telegram arbeitet über ausgehende Verbindungen), Zugriff von überall, Snapshots
vor riskanten Änderungen.
**Schwächen:** monatlich für immer, kein Restwert, Daten liegen beim Anbieter —
bei einem System, das Schlüssel verwaltet, ist das eine bewusste Entscheidung.

**Für wen:** wer keinen Kasten hinstellen will oder keinen geeigneten Rechner hat.

## Die drei Wege im Vergleich

| | Pi 5 8 GB | Mac mini | VPS 4 GB |
|---|---|---|---|
| Anschaffung | ~215 € | 949–1.049 € | — |
| laufend | Strom | Strom | 4,96–4,99 €/Monat |
| RAM-Auslastung durch Hermes | 10 % | 5 % | 21 % |
| **Dienstverwaltung** | systemd | **launchd** | systemd |
| **Installationsweg** | `install.sh` | `install.sh` oder Desktop | `install.sh` |
| Architektur | ARM64 | Apple Silicon | x86_64 / ARM64 |
| Datenhoheit | bei dir | bei dir | beim Anbieter |
| Aufwand bis zum ersten Bot | mittel | **niedrig** | **niedrig** |
| Lerneffekt Hardware | **hoch** | niedrig | niedrig |

**Der Pi ist der beste Kompromiss**, wenn man basteln will. Der VPS ist der
schnellste Weg, wenn man nicht basteln will. Der Mac mini ist der bequemste Weg
und der teuerste.

Der wichtigste Unterschied für die Plattform steht in der Tabelle: **das
Dienstformat.** Pi und VPS teilen sich systemd, der Mac braucht launchd. Deshalb
ist der Mac kein Sonderfall, den man ignorieren kann — er ist einer von drei
Renderer-Pfaden.

## Was das für den Konfigurator bedeutet

Drei Profile statt einer Liste. Jedes Profil ist ein Datensatz für die
Hardware-Ebene:

```
{ id, name, arch, ram_mb, preis, preis_monat,
  service_manager, install_weg, hinweise[], watt? }
```

Daraus fällt automatisch:

- **RAM-Ampel** — grün ab 4 GB, gelb bei 2 GB, rot bei 1 GB
- **Dienstformat** — systemd-Unit für Pi und VPS, LaunchAgent für den Mac
- **Installationsweg** — `install.sh` bzw. Desktop-Installer
- **Kostenschätzung** — Anschaffung bzw. Monatsmiete

`watt` ist ein **optionales** Feld, keine Säule der Empfehlung. Es steht im Profil,
weil es zur Vollständigkeit gehört, nicht weil damit gerechnet wird.

Offen: **Preise veralten.** In der App mit Datum anzeigen („Preise: September
2026") oder pflegbar machen.

---

# Anhang — breitere Geräteliste (nicht in der Plattform)

Recherchiert am 2026-09-22, aufbewahrt als Reserve. Diese Geräte sind bewusst
**nicht** Teil der Lernplattform, weil jedes zusätzliche Gerät eigene Anleitungen
und Fehlerbilder mitbringt. Wenn jemand sehr günstig anfangen will, ist der Weg
über einen gebrauchten Pi 4 oder einen 4-GB-VPS weiterhin gangbar.

## Der Markt gerade

**RAM-Preise sind 2026 stark gestiegen.** Pi 5 16 GB: von ~130 € auf **~320 €**.
Pi 5 8 GB: von ~90 € auf **~185 €**. Ein gebrauchter Mini-PC ist aktuell oft die
günstigere Wahl als ein neuer Pi.

## 0 € — das, was schon da ist

**Vorhandener Laptop / alter Desktop / NAS.** Läuft Hermes problemlos, und ein
Laptop ist sogar ideal zum Anfang: Bildschirm und Tastatur sind dran, kein SSH
nötig. **Die beste erste Übungsumgebung** — nur eben kein Dauerbetrieb.

Das gilt auch für den iMac eines Freundes: als Lerngerät gut, als empfohlene
Plattform nicht.

## bis 100 € — gebraucht

- **HP t630 / t640 Thin Client, 8–16 GB — ~70 €** · lüfterlos, klein
- **Raspberry Pi 4 8 GB gebraucht + Netzteil + SD — ~75 €**
- **Lenovo ThinkCentre Tiny i5, 16 GB — ~130 €** · x86

Netzteil und Speicherkarte/SSD immer mitrechnen — beim Pi fehlen sie im Grundpreis.

## 150–250 € — neu mit Garantie

- **Mini-PC Intel N100/N150, 16 GB/512 GB — ~190 €** (Beelink Mini S12 Pro,
  GMKtec NucBox G3 Plus). x86, meist Windows vorinstalliert — löschen, Linux drauf.
  Guter Kompromiss für Einsteiger, die einen Fertigrechner wollen.
- **Raspberry Pi 5 8 GB + Zubehör — ~215 €** (jetzt Weg 1)

## 300–500 € — viel Luft

- **Raspberry Pi 5 16 GB + Zubehör — ~350 €** · Aufpreis ohne Nutzen für Hermes
- **Mini-PC Ryzen 7 8845HS, 32 GB — ~480 €** · für lokale Modelle, Bildgenerierung,
  viele Bots parallel. Überdimensioniert für Hermes allein, aber zukunftssicher.

## Preise im Überblick

| Gerät | Preis |
|---|---|
| Pi 4 8 GB gebraucht | 75 € |
| Thin Client gebraucht | 70 € |
| ThinkCentre Tiny gebraucht | 130 € |
| Mini-PC N100 16 GB | 190 € |
| **Pi 5 8 GB + Zubehör** | **215 €** |
| Pi 5 16 GB + Zubehör | 350 € |
| Ryzen 7 Mini-PC 32 GB | 480 € |
| **Mac mini M6** | **1.049 €** |
| netcup VPS 4 GB | 4,96 €/Monat |
| Hetzner CAX11 4 GB | 4,99 €/Monat |
