/* Harness Academy — Renderer-Kern.
 *
 * Dieselbe Logik wie phase0/render.py, aber ohne Dateisystem und ohne DOM:
 * nimmt ein Profil + eine Nutzerwahl und liefert die Artefakte als Text.
 * Läuft im Browser und unter Node. Kein Framework, keine Abhängigkeiten.
 *
 * Vertrag (muss zu render.py passen):
 *   - fehlender Platzhalter  -> Fehler, nicht leerer String
 *   - eingebauter Provider MIT base_url -> Fehler (kippt auf "Custom endpoint")
 *   - fremder Provider OHNE base_url    -> Fehler
 *   - unbekanntes Profil                -> Fehler
 *   - model.provider leer oder "auto"   -> Fehler
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.HARender = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* Provider, die Hermes eingebaut kennt. Sie brauchen KEINE base_url —
   * und dürfen keine bekommen: eine gesetzte base_url schaltet Hermes messbar
   * auf "Custom endpoint" um (live geprüft am Referenzsystem, 2026-09-22). */
  var EINGEBAUTE_PROVIDER = [
    "openrouter", "nous", "nous-api", "anthropic", "openai-codex", "copilot",
    "gemini", "zai", "kimi-coding", "minimax", "minimax-cn", "huggingface",
    "nvidia", "xiaomi", "arcee", "ollama-cloud", "deepinfra", "kilocode",
    "ai-gateway", "azure-foundry", "lmstudio", "auto"
  ];

  var PFLICHT_SCHLUESSEL = ["model", "agent"];

  /* Kanal -> Name der Umgebungsvariablen für den Zugang. */
  var KANAL_SECRETS = {
    telegram: "TELEGRAM_BOT_TOKEN",
    discord:  "DISCORD_BOT_TOKEN",
    slack:    "SLACK_BOT_TOKEN",
    matrix:   "MATRIX_ACCESS_TOKEN"
  };
  var KANAL_LABEL = {
    telegram: "Telegram",
    discord:  "Discord",
    slack:    "Slack",
    matrix:   "Matrix"
  };

  function istEingebaut(key) {
    return EINGEBAUTE_PROVIDER.indexOf(key) !== -1;
  }

  /* ---------- Textwerkzeuge ---------- */

  /* Ersetzt alle {{platzhalter}}. Ein Platzhalter ohne Wert ist ein harter
   * Fehler: still einen leeren String einsetzen würde eine kaputte, aber
   * gültig aussehende Datei erzeugen. */
  function rendere(text, ctx, quelle) {
    var fehlend = [];
    var ergebnis = text.replace(/\{\{(\w+)\}\}/g, function (treffer, schluessel) {
      if (!(schluessel in ctx)) {
        fehlend.push(schluessel);
        return treffer;
      }
      return String(ctx[schluessel]);
    });
    if (fehlend.length) {
      throw new Error(quelle + ": Platzhalter ohne Wert: " + fehlend.join(", "));
    }
    return ergebnis;
  }

  /* Werte, die der Nutzer noch ersetzen muss, z.B. <diesen-wert-eintragen>.
   * Nur echte TODO-Marker zählen. Wortgruppen in Backticks und
   * Versionsoperatoren wie <3.14 sind KEINE Platzhalter. */
  function offenePlatzhalter(text) {
    var treffer = {}, m;
    var re = /<([a-z][a-z0-9_.\-]*[a-z0-9])>/g;
    while ((m = re.exec(text)) !== null) treffer[m[0]] = true;
    return Object.keys(treffer).sort();
  }

  /* Die base_url-Zeile — oder die Begründung, warum sie fehlt. */
  function baseUrlBlock(provider) {
    var key = provider.key;
    var url = provider.base_url || "";
    if (!istEingebaut(key)) {
      if (!url) {
        throw new Error("Provider '" + key + "' ist nicht eingebaut und hat keine base_url");
      }
      return "  base_url: " + url;
    }
    if (url) {
      throw new Error(
        "Provider '" + key + "' ist in Hermes eingebaut. Eine gesetzte base_url " +
        "würde ihn auf 'Custom endpoint' umschalten — base_url entfernen oder " +
        "provider: custom verwenden.");
    }
    return "  # base_url bewusst nicht gesetzt: '" + key + "' kennt Hermes eingebaut.\n" +
           "  # Eine gesetzte base_url schaltet den Provider auf 'Custom endpoint' um.\n" +
           "  # Nur bei 'provider: custom' gehört hier eine URL hin.";
  }

  /* ---------- Rechenregeln ---------- */

  function ramAmpel(ramMb, regel) {
    var stufen = regel.ampel;
    for (var i = 0; i < stufen.length; i++) {
      if (stufen[i].bis_mb === null || ramMb <= stufen[i].bis_mb) return stufen[i];
    }
    return stufen[stufen.length - 1];
  }

  function findeProfil(daten, id) {
    for (var i = 0; i < daten.profile.length; i++) {
      if (daten.profile[i].id === id) return daten.profile[i];
    }
    return null;
  }

  function profilIds(daten) {
    return daten.profile.map(function (p) { return p.id; });
  }

  /* Der Anzeigename eines Kanals, ohne die ganze Wahl zu brauchen. */
  function kanalLabel(kanal) { return KANAL_LABEL[kanal] || kanal; }

  /* Zahl im Deutschen: Komma als Trennzeichen, nicht Punkt.
   * "10.4 %" ist ein sichtbarer Fehler in einer deutschen Oberfläche. */
  function prozent(wert) {
    return String(wert).replace(".", ",") + " %";
  }

  function euro(wert) {
    return String(wert).replace(".", ",") + " €";
  }

  /* ---------- Kontext für die Vorlagen ---------- */

  function baueKontext(daten, wahl, timestamp) {
    var profil = findeProfil(daten, wahl.profil);
    if (!profil) {
      throw new Error("Profil '" + wahl.profil + "' unbekannt. Verfügbar: " + profilIds(daten).join(", "));
    }
    var ampel = ramAmpel(profil.ram_mb, daten.rechenregel_ram);
    var dienst = daten.dienstformate[profil.service_manager];
    if (!dienst) throw new Error("Kein Dienstformat für '" + profil.service_manager + "'");

    var kanal = wahl.kanal || "telegram";
    var providerKey = wahl.provider.key;

    return {
      timestamp: timestamp,
      profil_id: profil.id,
      profil_name: profil.name,
      profil_tagline: profil.tagline,
      arch: profil.arch,
      ram_mb: profil.ram_mb,
      /* Immer eine Nachkommastelle — muss zu render.py passen, weil
       * tests/test_bundle.js Zeichen für Zeichen vergleicht. */
      ram_gb: (profil.ram_mb / 1024).toFixed(1),
      auslastung: profil.hermes_auslastung_prozent,
      reserve: profil.reserve_prozent,
      ram_status: ampel.status,
      ram_text: ampel.text,
      service_manager: profil.service_manager,
      dienst_artefakt: dienst.artefakt,
      os_empfehlung: profil.os_empfehlung,
      install_weg: profil.install_weg,
      provider_key: providerKey,
      provider_label: wahl.provider.label,
      base_url_block: baseUrlBlock(wahl.provider),
      model_id: wahl.modell.id,
      context_length: wahl.modell.context_length,
      max_turns: wahl.agent.max_turns,
      gateway_timeout: wahl.agent.gateway_timeout,
      kanal: kanal,
      kanal_label: KANAL_LABEL[kanal] || kanal,
      kanal_secret: KANAL_SECRETS[kanal] || "KANAL_TOKEN",
      provider_secret: providerKey.toUpperCase().replace(/-/g, "_") + "_API_KEY"
    };
  }

  /* ---------- Prüfungen ---------- */

  /* Sammelt alle Beanstandungen, statt beim ersten Fehler abzubrechen —
   * die Oberfläche soll mehrere Probleme auf einmal anzeigen können. */
  function pruefe(daten, wahl) {
    var probleme = [];
    var profil = findeProfil(daten, wahl.profil);
    if (!profil) {
      probleme.push({
        feld: "profil",
        text: "Profil '" + wahl.profil + "' unbekannt. Verfügbar: " + profilIds(daten).join(", ")
      });
      return { probleme: probleme, profil: null, ampel: null };
    }
    var ampel = ramAmpel(profil.ram_mb, daten.rechenregel_ram);

    var p = wahl.provider || {};
    if (!p.key) {
      probleme.push({ feld: "provider", text: "Kein Modell-Anbieter gewählt." });
    } else if (istEingebaut(p.key)) {
      if (p.base_url) {
        probleme.push({
          feld: "provider",
          text: "'" + p.key + "' kennt Hermes eingebaut — eine base_url würde ihn auf " +
                "'Custom endpoint' umschalten. Feld leer lassen."
        });
      }
    } else if (!p.base_url) {
      probleme.push({
        feld: "provider",
        text: "'" + p.key + "' ist Hermes nicht bekannt und braucht deshalb eine base_url."
      });
    }

    /* Bewusst NICHT geprüft, ob die Modell-Kennung noch ein Platzhalter ist:
     * render.py lässt das ebenfalls durch und meldet offene Platzhalter nur
     * als Liste. Der Renderer soll die Eingabe treu umsetzen — ob ein Name
     * echt ist, entscheidet die Oberfläche, nicht die Umwandlung. */
    var m = wahl.modell || {};
    if (!m.id || !String(m.id).trim()) {
      probleme.push({ feld: "modell", text: "Keine Modell-Kennung angegeben." });
    }
    if (!m.context_length || m.context_length < 8000) {
      probleme.push({ feld: "modell", text: "Kontextlänge fehlt oder ist unrealistisch klein." });
    }

    var a = wahl.agent || {};
    if (!a.max_turns || a.max_turns < 1) {
      probleme.push({ feld: "agent", text: "max_turns muss mindestens 1 sein." });
    }
    if (!a.gateway_timeout || a.gateway_timeout < 30) {
      probleme.push({ feld: "agent", text: "gateway_timeout muss mindestens 30 Sekunden sein." });
    }
    if (!wahl.kanal) {
      probleme.push({ feld: "kanal", text: "Kein Kanal gewählt." });
    }

    return { probleme: probleme, profil: profil, ampel: ampel };
  }

  /* Die Sicht der Oberfläche: strenger als render.py.
   *
   * render.py setzt die Eingabe treu um und listet offene Platzhalter nur auf.
   * Die Oberfläche darf das nicht durchgehen lassen — sie weiß, dass der
   * Nutzer gerade tippt, und kann ihm sagen, was fehlt. Getrennt gehalten,
   * damit die Prüfung testbar bleibt und der Vergleich mit render.py sauber
   * ist. */
  function pruefeEingabe(daten, wahl) {
    var befund = pruefe(daten, wahl);
    var probleme = befund.probleme.slice();
    var m = wahl.modell || {};

    if (m.id && String(m.id).trim() && offenePlatzhalter(String(m.id)).length) {
      probleme.push({
        feld: "modell",
        text: "Die Modell-Kennung ist noch der Platzhalter. Beispiel: " +
              "anthropic/claude-sonnet-4.5 oder openai/gpt-5."
      });
    } else if (m.id && String(m.id).trim() && String(m.id).indexOf("/") === -1) {
      probleme.push({
        feld: "modell",
        text: "Die Modell-Kennung sieht unvollständig aus — sie hat die Form " +
              "anbieter/modell, zum Beispiel anthropic/claude-sonnet-4.5."
      });
    }
    return { probleme: probleme, profil: befund.profil, ampel: befund.ampel };
  }

  /* ---------- Bundle erzeugen ---------- */

  function baueBundle(daten, wahl, timestamp) {
    var vorlagen = daten.vorlagen;
    if (!vorlagen) throw new Error("Daten ohne Vorlagen — tools/build_web.py laufen lassen.");
    var befund = pruefe(daten, wahl);
    if (befund.probleme.length) {
      var e = new Error("Eingabe unvollständig: " +
        befund.probleme.map(function (p) { return p.text; }).join(" · "));
      e.probleme = befund.probleme;
      throw e;
    }

    var ctx = baueKontext(daten, wahl, timestamp);
    var dateien = {};
    var todo = [];

    Object.keys(vorlagen).forEach(function (name) {
      var text = rendere(vorlagen[name], ctx, name);
      offenePlatzhalter(text).forEach(function (t) { todo.push({ datei: name, platzhalter: t }); });
      dateien[name] = text;
    });

    /* Verifikation der erzeugten config.yaml — dieselben Regeln wie in
     * render.py. Läuft im Browser, deshalb ein kleiner eigener Parser für
     * genau die Felder, die geprüft werden. */
    var config = dateien["config.yaml"];
    if (!config) throw new Error("Vorlage config.yaml fehlt");
    PFLICHT_SCHLUESSEL.forEach(function (k) {
      if (!new RegExp("^" + k + ":", "m").test(config)) {
        throw new Error("Erzeugte config.yaml ohne Pflichtschlüssel: " + k);
      }
    });
    var mProv = config.match(/^\s{2}provider:\s*(\S+)\s*$/m);
    if (!mProv) throw new Error("Erzeugte config.yaml setzt model.provider nicht.");
    if (mProv[1] === "auto" || mProv[1] === "" || mProv[1] === '""') {
      throw new Error("model.provider steht auf 'auto' — kein reproduzierbarer Startpunkt.");
    }
    if (/^\s{2}base_url:/m.test(config) && istEingebaut(ctx.provider_key)) {
      throw new Error("Erzeugte config.yaml setzt base_url bei eingebautem Provider.");
    }

    return {
      profil: befund.profil,
      ampel: befund.ampel,
      kontext: ctx,
      dateien: dateien,
      todo: todo,
      zeitstempel: timestamp
    };
  }

  return {
    EINGEBAUTE_PROVIDER: EINGEBAUTE_PROVIDER,
    PFLICHT_SCHLUESSEL: PFLICHT_SCHLUESSEL,
    istEingebaut: istEingebaut,
    rendere: rendere,
    offenePlatzhalter: offenePlatzhalter,
    baseUrlBlock: baseUrlBlock,
    ramAmpel: ramAmpel,
    kanalLabel: kanalLabel,
    prozent: prozent,
    euro: euro,
    pruefeEingabe: pruefeEingabe,
    findeProfil: findeProfil,
    profilIds: profilIds,
    baueKontext: baueKontext,
    pruefe: pruefe,
    baueBundle: baueBundle
  };
});
