/* Harness Academy — eingebettete Daten.
 *
 * ERZEUGT von tools/build_web.py. NICHT von Hand bearbeiten.
 * Quelle: data/profiles.json und phase0/templates/*.tmpl
 *
 * Diese Datei ist bewusst JavaScript und nicht JSON: die App soll auch per
 * Doppelklick (file://) laufen, wo der Browser fetch() blockiert.
 */
window.HADATEN = {
  "meta": {
    "projekt": "Harness Academy",
    "stand": "2026-09-22",
    "waehrung": "EUR",
    "scope": "v1 = nur Hermes",
    "hinweis_preise": "Preise veralten schnell. In der App mit Datum anzeigen oder pflegbar machen.",
    "hinweis_zweck": "Diese Profile steuern die Hardware-Ebene des Konfigurators. Der Verbrauch ist ein optionales Feld, keine Empfehlungsgrundlage."
  },
  "rechenregel_ram": {
    "hermes_belegt_mb": 850,
    "davon": {
      "kern": 713,
      "browser_tool": 134,
      "vektor_store": 3
    },
    "quelle": "gemessen auf dem Referenzsystem (Pi 5, fei89)",
    "os_overhead_mb": 400,
    "ampel": [
      {
        "bis_mb": 1024,
        "status": "rot",
        "text": "Reicht nicht. Hermes belegt mehr als die Maschine hat und swappt sofort."
      },
      {
        "bis_mb": 2048,
        "status": "gelb",
        "text": "Knapp. Läuft, aber ohne Reserve für Browser-Tool oder Vektor-Store."
      },
      {
        "bis_mb": null,
        "status": "gruen",
        "text": "Reichlich Luft."
      }
    ]
  },
  "dienstformate": {
    "systemd": {
      "plattformen": [
        "pi5",
        "vps"
      ],
      "erzeugt_von": "hermes gateway install",
      "artefakt": "systemd-User-Unit unter ~/.config/systemd/user/",
      "beispiel_units": [
        "hermes-gateway.service",
        "hermes-serve.service"
      ],
      "scope": "User-Unit, WantedBy=default.target (kein system-weiter Dienst nötig)",
      "renderer_regel": "Unit NICHT selbst templaten. Den Befehl `hermes gateway install` ausgeben — Hermes erzeugt eine korrekte, versionssichere Unit (ExecStart zeigt in die eigene venv, ExecStop/ExecStopPost räumen den cgroup)."
    },
    "launchd": {
      "plattformen": [
        "macmini"
      ],
      "erzeugt_von": "hermes gateway install",
      "artefakt": "LaunchAgent unter ~/Library/LaunchAgents/",
      "renderer_regel": "Derselbe Befehl wie unter Linux. Hermes erkennt macOS selbst und wählt launchd. Kein gesondertes Template."
    }
  },
  "profile": [
    {
      "id": "pi5",
      "name": "Raspberry Pi 5",
      "tagline": "Basteln und verstehen",
      "arch": "arm64",
      "ram_mb": 8192,
      "hermes_auslastung_prozent": 10.4,
      "reserve_prozent": 84.7,
      "service_manager": "systemd",
      "install_weg": "install.sh",
      "os_empfehlung": "Raspberry Pi OS Lite (64-bit)",
      "preis": {
        "anschaffung_eur": 215,
        "spanne_eur": [
          215,
          235
        ],
        "monatlich_eur": null
      },
      "preis_aufschluesselung": [
        {
          "teil": "Pi 5 8 GB (nackt)",
          "eur": 185
        },
        {
          "teil": "Netzteil 27 W",
          "eur": 12
        },
        {
          "teil": "Aktiver Kühler",
          "eur": 6
        },
        {
          "teil": "Gehäuse",
          "eur": 10
        },
        {
          "teil": "microSD 64 GB",
          "eur": 10
        }
      ],
      "watt_idle": 6,
      "lerneffekt_hardware": "hoch",
      "aufwand_bis_erster_bot": "mittel",
      "staerken": [
        "aarch64 ist bei Hermes Tier-1 — gepflegte Plattform",
        "größte Community, jedes Problem ist irgendwo beschrieben",
        "unser Vorzeigesystem läuft auf identischer Hardware — direkter Vergleich möglich"
      ],
      "schwaechen": [
        "Zubehör einzeln kaufen, Board allein genügt nicht",
        "mehr Schritte bis zum ersten Bot als bei VPS oder Mac"
      ],
      "fuer_wen": "Wer das System von innen verstehen will und den Zusammenbau nicht scheut.",
      "hinweise": [
        "8 GB genügen — Hermes braucht 850 MB. Der Aufpreis auf 16 GB bringt für Hermes keinen Nutzen.",
        "Aktive Kühlung ist Pflicht: der Pi 5 drosselt ohne Kühler unter Dauerlast.",
        "Für Dauerbetrieb ist NVMe über HAT robuster als microSD — optional, nicht zwingend."
      ]
    },
    {
      "id": "macmini",
      "name": "Mac mini",
      "tagline": "Einfach und leise",
      "arch": "apple-silicon",
      "ram_mb": 16384,
      "hermes_auslastung_prozent": 5.2,
      "reserve_prozent": 92.4,
      "service_manager": "launchd",
      "install_weg": "install.sh oder Hermes Desktop",
      "os_empfehlung": "aktuelles macOS",
      "varianten": [
        {
          "modell": "Mac mini M6 (2026)",
          "ram_gb": 16,
          "ssd_gb": 256,
          "eur": 1049,
          "status": "aktuell, seit 22.09.2026 lieferbar"
        },
        {
          "modell": "Mac mini M4 (2024)",
          "ram_gb": 16,
          "ssd_gb": 512,
          "eur": 949,
          "status": "Vorgängergeneration, im Preisverfall"
        }
      ],
      "preis": {
        "anschaffung_eur": 1049,
        "spanne_eur": [
          949,
          1049
        ],
        "monatlich_eur": null
      },
      "watt_idle": 4,
      "lerneffekt_hardware": "niedrig",
      "aufwand_bis_erster_bot": "niedrig",
      "staerken": [
        "wenigste Fehlerquellen — kein Zusammenbau, kein OS-Image, keine Kühlung",
        "praktisch unhörbar, läuft als Arbeitsrechner mit",
        "Apple Silicon ist Hermes-Tier-1"
      ],
      "schwaechen": [
        "teuerster Weg — rund das Vierfache des Pi",
        "für Hermes allein deutlich überdimensioniert",
        "einzelne Werkzeuge haben ARM-Sonderfälle"
      ],
      "fuer_wen": "Wer keinen Bastelabend will und den Rechner ohnehin am Schreibtisch hat.",
      "hinweise": [
        "NUR Apple Silicon. macOS auf Intel ist bei Hermes eine nicht unterstützte Plattform: der Desktop-Installer startet dort nicht, und der Hersteller nimmt keine Fixes dafür an.",
        "Kein systemd: Hermes nutzt launchd. Gleicher Befehl, anderes Artefakt.",
        "Headless-Betrieb braucht einen HDMI-Dummy, sonst entsteht keine GUI-Sitzung.",
        "macOS 26 Tahoe ist die letzte Version für Intel-Macs — Intel-Mac minis sind damit keine Empfehlung."
      ]
    },
    {
      "id": "vps",
      "name": "VPS (gemietet)",
      "tagline": "Kein Gerät im Zimmer",
      "arch": "x86_64 oder arm64",
      "ram_mb": 4096,
      "hermes_auslastung_prozent": 20.8,
      "reserve_prozent": 69.5,
      "service_manager": "systemd",
      "install_weg": "install.sh",
      "os_empfehlung": "Ubuntu oder Debian",
      "varianten": [
        {
          "anbieter": "netcup",
          "produkt": "VPS 500 G12",
          "ram_gb": 4,
          "vcore": 2,
          "monatlich_eur": 4.96
        },
        {
          "anbieter": "Hetzner",
          "produkt": "CAX11",
          "ram_gb": 4,
          "vcore": 2,
          "monatlich_eur": 4.99,
          "arch": "arm64"
        },
        {
          "anbieter": "Hetzner",
          "produkt": "CAX21",
          "ram_gb": 8,
          "vcore": 4,
          "monatlich_eur": 8.49,
          "arch": "arm64"
        },
        {
          "anbieter": "netcup",
          "produkt": "VPS 1000 G12",
          "ram_gb": 8,
          "vcore": 4,
          "monatlich_eur": 8.7
        }
      ],
      "preis": {
        "anschaffung_eur": 0,
        "spanne_eur": [
          0,
          0
        ],
        "monatlich_eur": 4.96
      },
      "watt_idle": null,
      "lerneffekt_hardware": "keiner",
      "aufwand_bis_erster_bot": "niedrig",
      "staerken": [
        "schnellster Weg zum ersten Bot — kein Gerät, keine Kühlung, kein Netzwerk zu Hause",
        "Zugriff von überall, Snapshots vor riskanten Änderungen",
        "kein Port-Forwarding nötig: Telegram arbeitet über ausgehende Verbindungen"
      ],
      "schwaechen": [
        "monatliche Kosten ohne Ende und ohne Restwert",
        "Daten liegen beim Anbieter — bei einem System, das Schlüssel verwaltet, ist das eine bewusste Entscheidung",
        "kein Hardware-Lerneffekt"
      ],
      "fuer_wen": "Wer keinen Kasten hinstellen will oder keinen geeigneten Rechner hat.",
      "hinweise": [
        "4 GB sind die richtige Wahl (850 MB = 21 % Auslastung). 8 GB nur, wenn später mehr dazukommt.",
        "2 GB nicht nehmen — zu wenig Luft.",
        "ARM-Angebote sind unbedenklich: aarch64 ist Hermes-Tier-1."
      ]
    }
  ],
  "vorlagen": {
    "config.yaml": "# Harness Academy — erzeugter Startpunkt\n# Profil   : {{profil_name}} ({{profil_id}}, {{arch}})\n# Erzeugt  : {{timestamp}}\n# Hardware : {{ram_gb}} GB RAM -> Hermes belegt {{auslastung}} %\n#\n# Diese Datei ist ein START, kein fertiges Produkt. Wo eine Entscheidung\n# getroffen wurde, steht ein Kommentar. Secrets gehören NICHT hier hinein,\n# sondern in .env (siehe .env.example).\n\nmodel:\n  default: {{model_id}}\n  provider: {{provider_key}}\n{{base_url_block}}\n\nagent:\n  # max_turns begrenzt, wie viele Tool-Runden ein Auftrag laufen darf.\n  # {{max_turns}} ist ein vorsichtiger Startwert für {{profil_name}}.\n  max_turns: {{max_turns}}\n  gateway_timeout: {{gateway_timeout}}\n\n# Kanäle und Werkzeuge werden NICHT hier vorbelegt.\n# Nach dem Aufsetzen ausfüllen mit:  hermes gateway setup\n# Das fragt Kanal und Zugang ab und schreibt nur die nötigen Felder.\n",
    ".env.example": "# Harness Academy — Secrets für {{profil_name}}\n#\n# Diese Datei ist eine VORLAGE. Kopiere sie nach .env und trage die Werte ein.\n#   cp .env.example .env && chmod 600 .env\n#\n# Regel: Secrets liegen in .env, nie in config.yaml, nie in einem Chat,\n#        nie in einem Git-Repository.  .env gehört in .gitignore.\n\n# Zugang zum Modell-Anbieter ({{provider_key}})\n{{provider_secret}}=\n\n# Zugang zum Kanal ({{kanal}})\n{{kanal_secret}}=\n",
    "setup.sh": "#!/usr/bin/env bash\n# Harness Academy — Setup für {{profil_name}}\n# Erzeugt {{timestamp}} für {{ram_gb}} GB RAM.\n#\n# Idempotent: jeder Schritt prüft erst, ob er schon erledigt ist.\nset -euo pipefail\n\nHIER=\"$(cd \"$(dirname \"${BASH_SOURCE[0]}\")\" && pwd)\"\nPROFIL=\"{{profil_name}}\"\n\nschritt() { printf '\\n==> %s\\n' \"$1\"; }\nok()      { printf '    OK   %s\\n' \"$1\"; }\nwarn()    { printf '    WARN %s\\n' \"$1\"; }\n\n# ---------------------------------------------------------------- 1. Hardware\nschritt \"Hardware prüfen\"\nRAM_MB=$(awk '/MemTotal/ {printf \"%d\", $2/1024}' /proc/meminfo)\necho \"    RAM: ${RAM_MB} MB  (Profil {{profil_name}}: {{ram_mb}} MB, Hermes braucht ~850 MB)\"\nif [ \"$RAM_MB\" -lt 1024 ]; then\n  echo \"    FEHLER: Zu wenig RAM. Hermes belegt mehr als diese Maschine hat.\" >&2\n  exit 1\nelif [ \"$RAM_MB\" -lt 2048 ]; then\n  warn \"Wenig RAM — ohne Reserve für Browser-Tool oder Vektor-Store.\"\nelse\n  ok \"RAM reicht.\"\nfi\n\n# ---------------------------------------------------------------- 2. Hermes\nschritt \"Hermes installieren\"\nif command -v hermes >/dev/null 2>&1; then\n  ok \"schon vorhanden: $(hermes --version 2>/dev/null | head -1)\"\nelse\n  echo \"    installiere von hermes-agent.nousresearch.com ...\"\n  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash\n  # shellcheck disable=SC1091\n  [ -f \"$HOME/.bashrc\" ] && source \"$HOME/.bashrc\" || true\n  ok \"installiert\"\nfi\n\n# ---------------------------------------------------------------- 3. config\nschritt \"Konfiguration einspielen\"\nZIEL=\"$HOME/.hermes\"\nmkdir -p \"$ZIEL\"\nif [ -f \"$ZIEL/config.yaml\" ]; then\n  SICHERUNG=\"$ZIEL/config.yaml.vor-setup-$(date +%Y%m%d-%H%M%S)\"\n  cp \"$ZIEL/config.yaml\" \"$SICHERUNG\"\n  warn \"vorhandene config.yaml gesichert nach $SICHERUNG\"\nfi\ncp \"$HIER/config.yaml\" \"$ZIEL/config.yaml\"\nok \"config.yaml kopiert\"\n\nif [ -f \"$HIER/.env\" ]; then\n  cp \"$HIER/.env\" \"$ZIEL/.env\"\n  chmod 600 \"$ZIEL/.env\"\n  ok \".env kopiert und auf 600 gesetzt\"\nelse\n  warn \".env fehlt noch — cp .env.example .env und Werte eintragen\"\nfi\n\n# ---------------------------------------------------------------- 4. Kanal\nschritt \"Kanal einrichten\"\necho \"    Kanal '{{kanal_label}}' wird interaktiv eingerichtet:\"\necho \"      hermes gateway setup\"\necho \"    (hier absichtlich nicht automatisch — der Bot-Token gehört in .env)\"\n\n# ---------------------------------------------------------------- 5. Dienst\nschritt \"Hintergrunddienst einrichten\"\n# WICHTIG: Die Dienstdatei NICHT selbst schreiben. 'hermes gateway install'\n# erzeugt auf Linux eine systemd-Unit, auf macOS einen LaunchAgent — jeweils\n# passend zur Hermes-Version.\necho \"      hermes gateway install\"\n\n# ---------------------------------------------------------------- 6. Prüfen\nschritt \"Prüfen\"\necho \"      ./verify.sh\"\n\nprintf '\\nFertig. Nächster Schritt: hermes gateway setup\\n'\n",
    "verify.sh": "#!/usr/bin/env bash\n# Harness Academy — Verifikation für {{profil_name}}\n# Prüft eine bestehende Installation gegen das erwartete Profil.\n# Nur lesend: ändert nichts, sendet nichts nach außen.\nset -uo pipefail\n\nfehler=0\nzeile() { printf '%-34s %s\\n' \"$1\" \"$2\"; }\ngut()   { zeile \"$1\" \"OK   $2\"; }\nschlecht() { zeile \"$1\" \"FEHL $2\"; fehler=$((fehler+1)); }\n\necho \"Verifikation — Profil {{profil_name}} ({{arch}}, {{ram_gb}} GB)\"\necho \"Erwartet: Hermes ~850 MB, Dienst via {{service_manager}}\"\necho \"----------------------------------------------------------------\"\n\n# --- RAM\nRAM_MB=$(awk '/MemTotal/ {printf \"%d\", $2/1024}' /proc/meminfo 2>/dev/null || echo 0)\nif [ \"$RAM_MB\" -ge 2048 ]; then\n  gut \"RAM\" \"${RAM_MB} MB\"\nelse\n  schlecht \"RAM\" \"${RAM_MB} MB — zu wenig\"\nfi\n\n# --- Installation\nif command -v hermes >/dev/null 2>&1; then\n  gut \"hermes\" \"$(hermes --version 2>/dev/null | head -1)\"\nelse\n  schlecht \"hermes\" \"nicht im PATH\"\nfi\n\n# --- config.yaml\nif [ -f \"$HOME/.hermes/config.yaml\" ]; then\n  gut \"config.yaml\" \"vorhanden\"\nelse\n  schlecht \"config.yaml\" \"fehlt\"\nfi\n\n# --- Secrets\nif [ -f \"$HOME/.hermes/.env\" ]; then\n  RECHTE=$(stat -c '%a' \"$HOME/.hermes/.env\" 2>/dev/null || echo \"?\")\n  if [ \"$RECHTE\" = \"600\" ]; then\n    gut \".env\" \"vorhanden, Rechte 600\"\n  else\n    schlecht \".env\" \"Rechte $RECHTE — sollten 600 sein\"\n  fi\nelse\n  schlecht \".env\" \"fehlt\"\nfi\n\n# --- Dienst (Format hängt am Profil)\nif [ \"{{service_manager}}\" = \"systemd\" ]; then\n  if systemctl --user is-active hermes-gateway.service >/dev/null 2>&1; then\n    gut \"Dienst\" \"hermes-gateway.service läuft (systemd)\"\n  else\n    schlecht \"Dienst\" \"hermes-gateway.service nicht aktiv — hermes gateway install\"\n  fi\nelse\n  PLIST=\"$HOME/Library/LaunchAgents\"\n  if ls \"$PLIST\" 2>/dev/null | grep -qi hermes; then\n    gut \"Dienst\" \"LaunchAgent vorhanden (launchd)\"\n  else\n    schlecht \"Dienst\" \"kein LaunchAgent — hermes gateway install\"\n  fi\nfi\n\n# --- Speicherplatz\nFREI_GB=$(df -BG --output=avail \"$HOME\" 2>/dev/null | tail -1 | tr -dc '0-9')\nif [ -n \"${FREI_GB:-}\" ] && [ \"$FREI_GB\" -ge 5 ]; then\n  gut \"Speicher\" \"${FREI_GB} GB frei\"\nelif [ -n \"${FREI_GB:-}\" ]; then\n  schlecht \"Speicher\" \"nur ${FREI_GB} GB frei\"\nfi\n\necho \"----------------------------------------------------------------\"\nif [ \"$fehler\" -eq 0 ]; then\n  echo \"Alles in Ordnung.\"\n  exit 0\nelse\n  echo \"$fehler Punkt(e) offen.\"\n  exit 1\nfi\n",
    "CHECKLISTE.md": "# Checkliste — {{profil_name}}\n\nErzeugt {{timestamp}} · Profil `{{profil_id}}` ({{arch}}, {{ram_gb}} GB RAM)\n\nRAM-Stand: **{{auslastung}} %** durch Hermes belegt · `{{ram_status}}` — {{ram_text}}\n\n---\n\n## Vorbereitung\n\n- [ ] Gerät bereit: {{profil_name}}, Betriebssystem: {{os_empfehlung}}\n- [ ] Netzwerkzugang vorhanden\n- [ ] Zugang zum Modell-Anbieter (**{{provider_label}}**) — Schlüssel besorgt\n- [ ] {{kanal_secret}} besorgt (für Kanal: {{kanal_label}})\n\n## Installation\n\n- [ ] `.env.example` nach `.env` kopieren, Werte eintragen, `chmod 600 .env`\n- [ ] `./setup.sh` ausführen\n- [ ] `hermes gateway setup` — Kanal einrichten\n- [ ] `hermes gateway install` — Dienst einrichten\n      → erzeugt {{dienst_artefakt}}\n- [ ] `./verify.sh` ausführen — alles grün?\n\n## Erster Erfolg\n\n- [ ] Nachricht an den Bot senden, Antwort kommt zurück\n- [ ] Dienst neu starten, Nachricht kommt weiterhin an (also überlebt er einen Neustart)\n\n## Verstehen\n\n- [ ] `hermes --help` ansehen — welche Befehle gibt es?\n- [ ] `hermes tools` — welche Werkzeuge sind aktiv?\n- [ ] `hermes model` — welches Modell ist eingestellt?\n- [ ] Logs ansehen: `journalctl --user -u hermes-gateway -f` (Linux)\n- [ ] `~/.hermes/config.yaml` öffnen und die eigenen Einträge wiederfinden\n\n## Aufräumen und Betreiben\n\n- [ ] `.env` steht in `.gitignore` (falls du ein Repo anlegst)\n- [ ] `hermes update` einmal ausgeführt\n- [ ] Notiert: Wie viel RAM belegt der Gateway bei dir? (Vergleich zu den {{auslastung}} % aus dem Profil)\n\n---\n\n## Wenn etwas nicht läuft\n\n| Symptom | Erste Prüfung |\n|---|---|\n| Bot antwortet nicht | `systemctl --user status hermes-gateway` bzw. LaunchAgent prüfen |\n| Dienst startet nicht | `verify.sh` laufen lassen, alle Punkte durchgehen |\n| Modell-Fehler | Schlüssel in `.env` korrekt? `hermes model` |\n| Nach Neustart weg | `hermes gateway install` wurde ausgeführt? |\n\n## Noch offen in diesen Dateien\n\nPlatzhalter, die ersetzt werden müssen, stehen in spitzen Klammern — etwa\ndie Modell-Kennung. Der Renderer listet beim Erzeugen auf, welche offen sind\nund in welcher Datei sie stehen.\n"
  }
};
