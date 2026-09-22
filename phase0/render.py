#!/usr/bin/env python3
"""
Harness Academy — Phase 0 Renderer.

Nimmt ein Hardware-Profil + eine Nutzerwahl und erzeugt ein Artefakt-Bundle.
Kein UI, keine Abhängigkeiten außer der Standardbibliothek.

Aufruf:  python3 render.py examples/freund-pi5.json [--out out]
"""
import argparse, json, os, re, sys, datetime

HIER = os.path.dirname(os.path.abspath(__file__))
TPL  = os.path.join(HIER, "templates")
DATEN = os.path.join(HIER, "..", "data", "profiles.json")

PFLICHT_SCHLUESSEL = ["model", "agent"]

# Provider, die Hermes eingebaut kennt. Sie brauchen KEINE base_url — und
# dürfen sie auch nicht bekommen: eine gesetzte base_url schaltet Hermes
# messbar auf "Custom endpoint" um (live geprüft 2026-09-22).
EINGEBAUTE_PROVIDER = {
    "openrouter", "nous", "nous-api", "anthropic", "openai-codex", "copilot",
    "gemini", "zai", "kimi-coding", "minimax", "minimax-cn", "huggingface",
    "nvidia", "xiaomi", "arcee", "ollama-cloud", "deepinfra", "kilocode",
    "ai-gateway", "azure-foundry", "lmstudio", "auto",
}
PFLICHT_IN_MODEL = ["default", "provider"]

# Kanal -> Name der Umgebungsvariablen für den Zugang.
KANAL_SECRETS = {
    "telegram": "TELEGRAM_BOT_TOKEN",
    "discord":  "DISCORD_BOT_TOKEN",
    "slack":    "SLACK_BOT_TOKEN",
    "matrix":   "MATRIX_ACCESS_TOKEN",
}
KANAL_LABEL = {
    "telegram": "Telegram",
    "discord":  "Discord",
    "slack":    "Slack",
    "matrix":   "Matrix",
}


def lade(pfad):
    with open(pfad, encoding="utf-8") as f:
        return json.load(f)


def rendere(text, ctx, quelle):
    """Ersetzt {{platzhalter}}. Fehlender Platzhalter = harter Fehler."""
    def sub(m):
        k = m.group(1)
        if k not in ctx:
            raise KeyError(f"{quelle}: Platzhalter {{{{{k}}}}} hat keinen Wert")
        return str(ctx[k])
    return re.sub(r"\{\{(\w+)\}\}", sub, text)


def offene_platzhalter(text):
    """Werte, die der Nutzer noch ersetzen muss, z.B. <diesen-wert-eintragen>.

    Nur echte TODO-Marker zählen. Wortgruppen in Backticks (`hermes gateway
    install`) und Vergleichsoperatoren (<3.14) sind KEINE Platzhalter.
    """
    treffer = set()
    for m in re.finditer(r"<([a-z][a-z0-9_.\-]*[a-z0-9])>", text):
        treffer.add(m.group(0))
    return sorted(treffer)


def base_url_block(provider):
    """Rendert die base_url-Zeile — oder eine Begründung, warum sie fehlt."""
    key = provider["key"]
    url = provider.get("base_url", "")
    if key not in EINGEBAUTE_PROVIDER:
        if not url:
            raise KeyError(f"Provider '{key}' ist nicht eingebaut und hat keine base_url")
        return f"  base_url: {url}"
    if url:
        raise KeyError(
            f"Provider '{key}' ist in Hermes eingebaut. Eine gesetzte base_url "
            f"würde ihn auf 'Custom endpoint' umschalten — base_url entfernen "
            f"oder provider: custom verwenden.")
    return ("  # base_url bewusst nicht gesetzt: '" + key + "' kennt Hermes eingebaut.\n"
            "  # Eine gesetzte base_url schaltet den Provider auf 'Custom endpoint' um.\n"
            "  # Nur bei 'provider: custom' gehört hier eine URL hin.")


def ram_ampel(ram_mb, regel):
    for stufe in regel["ampel"]:
        grenze = stufe["bis_mb"]
        if grenze is None or ram_mb <= grenze:
            return stufe
    return regel["ampel"][-1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("wahl")
    ap.add_argument("--out", default="out")
    args = ap.parse_args()

    wahl  = lade(args.wahl)
    daten = lade(DATEN)

    pid = wahl["profil"]
    profil = next((p for p in daten["profile"] if p["id"] == pid), None)
    if profil is None:
        sys.exit(f"Profil '{pid}' unbekannt. Verfügbar: "
                 + ", ".join(p["id"] for p in daten["profile"]))

    ampel = ram_ampel(profil["ram_mb"], daten["rechenregel_ram"])
    dienst = daten["dienstformate"][profil["service_manager"]]

    ctx = {
        "timestamp":      (os.environ.get("HA_ZEITSTEMPEL")
                           or datetime.datetime.now().strftime("%Y-%m-%d %H:%M")),
        "profil_id":      profil["id"],
        "profil_name":    profil["name"],
        "profil_tagline": profil["tagline"],
        "arch":           profil["arch"],
        "ram_mb":         profil["ram_mb"],
        # Immer eine Nachkommastelle: "8.0", nicht "8". Der Browser-Renderer
        # erzeugt dasselbe, und tests/test_bundle.js vergleicht Zeichen für
        # Zeichen. Eine Formatabweichung hier wäre eine echte Abweichung.
        "ram_gb":         f"{profil['ram_mb'] / 1024:.1f}",
        "auslastung":     profil["hermes_auslastung_prozent"],
        "reserve":        profil["reserve_prozent"],
        "ram_status":     ampel["status"],
        "ram_text":       ampel["text"],
        "service_manager": profil["service_manager"],
        "dienst_artefakt": dienst["artefakt"],
        "os_empfehlung":  profil["os_empfehlung"],
        "install_weg":    profil["install_weg"],
        "provider_key":   wahl["provider"]["key"],
        "provider_label": wahl["provider"]["label"],
        "base_url_block": base_url_block(wahl["provider"]),
        "model_id":       wahl["modell"]["id"],
        "context_length": wahl["modell"]["context_length"],
        "max_turns":      wahl["agent"]["max_turns"],
        "gateway_timeout": wahl["agent"]["gateway_timeout"],
        "kanal":          wahl["kanal"],
        "kanal_secret":   KANAL_SECRETS.get(wahl["kanal"], "KANAL_TOKEN"),
        "kanal_label":    KANAL_LABEL.get(wahl["kanal"], wahl["kanal"]),
        "provider_secret": wahl["provider"]["key"].upper().replace("-","_") + "_API_KEY",
    }

    ziel = os.path.join(HIER, args.out, profil["id"])
    os.makedirs(ziel, exist_ok=True)

    dateien = {
        "config.yaml":     "config.yaml.tmpl",
        ".env.example":    "env.example.tmpl",
        "setup.sh":        "setup.sh.tmpl",
        "verify.sh":       "verify.sh.tmpl",
        "CHECKLISTE.md":   "CHECKLISTE.md.tmpl",
    }

    todo = []
    geschrieben = []
    for name, tmpl in dateien.items():
        with open(os.path.join(TPL, tmpl), encoding="utf-8") as f:
            roh = f.read()
        text = rendere(roh, ctx, tmpl)
        todo += [(name, t) for t in offene_platzhalter(text)]
        p = os.path.join(ziel, name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(text)
        if name.endswith(".sh"):
            os.chmod(p, 0o755)
        geschrieben.append((name, len(text)))

    # --- Verifikation: die erzeugte config.yaml muss valide und vollständig sein
    import yaml
    with open(os.path.join(ziel, "config.yaml"), encoding="utf-8") as f:
        geladen = yaml.safe_load(f)
    fehlend = [k for k in PFLICHT_SCHLUESSEL if k not in (geladen or {})]
    if fehlend:
        sys.exit(f"FEHLER: erzeugte config.yaml ohne Pflichtschlüssel: {fehlend}")
    if geladen.get("model", {}).get("provider") in (None, "", "auto"):
        sys.exit("FEHLER: model.provider fehlt oder steht auf 'auto' — "
                 "das ist kein reproduzierbarer Startpunkt.")
    # Ein providers:-Block mit dem Namen eines EINGEBAUTEN Providers würde
    # diesen überschreiben (Messung: Provider kippt dann auf 'Custom endpoint').
    eingebaut = {"openrouter", "nous", "anthropic", "openai-codex", "copilot",
                 "gemini", "zai", "kimi-coding", "minimax", "huggingface",
                 "nvidia", "ollama-cloud", "deepinfra", "kilocode"}
    pblock = (geladen or {}).get("providers") or {}
    kollision = eingebaut & set(pblock)
    if kollision:
        sys.exit(f"FEHLER: providers:-Block überschreibt eingebaute Provider: "
                 f"{sorted(kollision)}")

    print(f"Profil : {profil['name']} ({profil['id']}, {profil['arch']})")
    print(f"RAM    : {profil['ram_mb']} MB -> Hermes {profil['hermes_auslastung_prozent']} % "
          f"[{ampel['status']}] {ampel['text']}")
    print(f"Dienst : {profil['service_manager']} -> {dienst['artefakt']}")
    print(f"Ausgabe: {ziel}")
    for name, n in geschrieben:
        print(f"  {name:16s} {n:6d} Bytes")
    print(f"config.yaml valide, Pflichtschlüssel vorhanden: {PFLICHT_SCHLUESSEL}")
    if todo:
        print("\nNOCH ZU ERSETZEN:")
        for datei, t in todo:
            print(f"   {datei:16s} {t}")
    print("\nKein Secret liegt in diesen Dateien — nur Platzhalter." if not todo
          else "\nWerte in .env eintragen, niemals in config.yaml.")


if __name__ == "__main__":
    main()
