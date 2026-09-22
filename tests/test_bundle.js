/* Harness Academy — Prüfung: Browser-Renderer gegen Python-Renderer.
 *
 * Der eigentliche Beweis für Phase 1. Die Oberfläche darf nicht "ungefähr"
 * dasselbe erzeugen wie das geprüfte Skript, sondern Zeichen für Zeichen
 * dasselbe. Sonst ist jede Prüfung aus Phase 0 wertlos, sobald man die App
 * benutzt statt render.py.
 *
 * Aufruf (nach dem Python-Durchlauf):
 *     node tests/test_bundle.js
 */
"use strict";

var fs = require("fs");
var path = require("path");

var WURZEL = path.resolve(__dirname, "..");
var PHASE0 = path.join(WURZEL, "phase0");
var AUSGABE = path.join(__dirname, "_js_out");

/* daten.js setzt window.HADATEN — im Node-Lauf gibt es kein window. */
global.window = global;
require(path.join(WURZEL, "web", "js", "daten.js"));

var R = require(path.join(WURZEL, "web", "js", "render-core.js"));
var Z = require(path.join(WURZEL, "web", "js", "zip.js"));
var D = global.HADATEN;

/* Der Zeitstempel muss von aussen kommen und fuer beide Renderer derselbe
 * sein. Sonst vergleicht dieser Test nur, wie spaet es auf der Uhr ist:
 * Python wuerde die echte Uhrzeit einsetzen, der Browser einen leeren Wert,
 * und der Vergleich schluege fehl, obwohl beide richtig rechnen.
 * Lieber laut abbrechen als einen irrefuehrenden Fehler melden. */
var ZEITSTEMPEL = process.env.HA_ZEITSTEMPEL || "";
if (!ZEITSTEMPEL) {
  console.error("FEHLER: HA_ZEITSTEMPEL ist nicht gesetzt.");
  console.error("Dieser Vergleich braucht bei beiden Renderern denselben Zeitstempel,");
  console.error("sonst vergleicht er nur die Uhrzeit. Beispiel:");
  console.error("  HA_ZEITSTEMPEL='2026-09-22 23:40' node tests/test_bundle.js");
  process.exit(2);
}

var bestanden = 0, fehlgeschlagen = 0;
function ok(name) { console.log("OK    " + name); bestanden++; }
function fehl(name, detail) {
  console.log("FEHL  " + name);
  if (detail) console.log("      " + detail);
  fehlgeschlagen++;
}

/* ---------------------------------------------------------------------- */

function pruefeVorhandensein() {
  console.log("== Grundlagen ==");
  if (D && Array.isArray(D.profile) && D.profile.length === 3) {
    ok("daten.js liefert drei Geräteprofile");
  } else {
    fehl("daten.js liefert drei Geräteprofile");
  }
  if (D && D.vorlagen && Object.keys(D.vorlagen).length === 5) {
    ok("daten.js liefert fünf Vorlagen");
  } else {
    fehl("daten.js liefert fünf Vorlagen");
  }
  if (D && D.rechenregel_ram && D.dienstformate) {
    ok("daten.js liefert Rechenregel und Dienstformate");
  } else {
    fehl("daten.js liefert Rechenregel und Dienstformate");
  }
}

/* Das Beispiel-JSON ist die gemeinsame Eingabe für beide Renderer. */
function wahlAusBeispiel(pfad) {
  var roh = JSON.parse(fs.readFileSync(pfad, "utf8"));
  return {
    profil: roh.profil,
    provider: roh.provider,
    modell: roh.modell,
    agent: roh.agent,
    kanal: roh.kanal
  };
}

function pruefeGleichstand() {
  console.log("== Browser-Bundle gegen Python-Bundle ==");
  var beispiele = fs.readdirSync(path.join(PHASE0, "examples"))
    .filter(function (n) { return /^freund-.*\.json$/.test(n); })
    .sort();

  if (beispiele.length !== 3) {
    fehl("drei Beispielwahlen gefunden", "gefunden: " + beispiele.length);
    return;
  }

  beispiele.forEach(function (name) {
    var wahl = wahlAusBeispiel(path.join(PHASE0, "examples", name));
    var ziel = path.join(AUSGABE, wahl.profil);
    var bundle;

    try {
      bundle = R.baueBundle(D, wahl, ZEITSTEMPEL);
    } catch (e) {
      fehl("baut Bundle für " + wahl.profil, e.message);
      return;
    }

    fs.mkdirSync(ziel, { recursive: true });
    Object.keys(bundle.dateien).forEach(function (n) {
      fs.writeFileSync(path.join(ziel, n), bundle.dateien[n], "utf8");
    });

    /* Vergleich gegen die Ausgabe von render.py */
    var pyZiel = path.join(PHASE0, "out", wahl.profil);
    if (!fs.existsSync(pyZiel)) {
      fehl("Vergleich " + wahl.profil, "phase0/out/" + wahl.profil + " fehlt — render.py zuerst laufen lassen");
      return;
    }

    var abweichungen = [];
    Object.keys(bundle.dateien).forEach(function (n) {
      var pyPfad = path.join(pyZiel, n);
      if (!fs.existsSync(pyPfad)) { abweichungen.push(n + ": fehlt im Python-Ergebnis"); return; }
      var py = fs.readFileSync(pyPfad, "utf8");
      var js = bundle.dateien[n];
      if (py !== js) {
        var zeile = 0, pyZ = py.split("\n"), jsZ = js.split("\n");
        while (zeile < Math.max(pyZ.length, jsZ.length) && pyZ[zeile] === jsZ[zeile]) zeile++;
        abweichungen.push(n + ": erste Abweichung Zeile " + (zeile + 1) +
          "\n        Python: " + JSON.stringify((pyZ[zeile] || "").slice(0, 90)) +
          "\n        Browser: " + JSON.stringify((jsZ[zeile] || "").slice(0, 90)));
      }
    });

    if (abweichungen.length) {
      fehl("Bundle " + wahl.profil + " identisch", abweichungen.join("\n      "));
    } else {
      ok("Bundle " + wahl.profil + " identisch (5 Dateien)");
    }
  });

  /* Und einmal gegen ein Gerät, das den Rechner nicht kennt: der Kern muss
   * auch bei unbekanntem Profil sauber scheitern. */
  try {
    R.baueBundle(D,
      { profil: "gibtsnicht", provider: { key: "openrouter", label: "O" },
        modell: { id: "x/y", context_length: 200000 },
        agent: { max_turns: 60, gateway_timeout: 600 }, kanal: "telegram" }, ZEITSTEMPEL);
    fehl("unbekanntes Profil wird abgelehnt");
  } catch (e) {
    if (/unbekannt/.test(e.message)) ok("unbekanntes Profil wird abgelehnt");
    else fehl("unbekanntes Profil wird abgelehnt", "falsche Meldung: " + e.message);
  }

  /* Eingebauter Provider MIT base_url muss scheitern (der Fallstrick). */
  try {
    R.baueBundle(D,
      { profil: "pi5", provider: { key: "openrouter", label: "O", base_url: "https://x.y" },
        modell: { id: "x/y", context_length: 200000 },
        agent: { max_turns: 60, gateway_timeout: 600 }, kanal: "telegram" }, ZEITSTEMPEL);
    fehl("base_url bei eingebautem Provider wird abgelehnt");
  } catch (e) {
    if (/base_url/.test(e.message)) ok("base_url bei eingebautem Provider wird abgelehnt");
    else fehl("base_url bei eingebautem Provider wird abgelehnt", e.message);
  }

  /* Fremder Provider OHNE base_url muss scheitern. */
  try {
    R.baueBundle(D,
      { profil: "vps", provider: { key: "mein-lokaler", label: "L" },
        modell: { id: "x/y", context_length: 200000 },
        agent: { max_turns: 60, gateway_timeout: 600 }, kanal: "telegram" }, ZEITSTEMPEL);
    fehl("fremder Provider ohne base_url wird abgelehnt");
  } catch (e) {
    if (/base_url/.test(e.message)) ok("fremder Provider ohne base_url wird abgelehnt");
    else fehl("fremder Provider ohne base_url wird abgelehnt", e.message);
  }

  /* Fremder Provider MIT base_url muss gelingen. */
  try {
    var b = R.baueBundle(D,
      { profil: "vps", provider: { key: "mein-lokaler", label: "L", base_url: "http://127.0.0.1:1234/v1" },
        modell: { id: "x/y", context_length: 200000 },
        agent: { max_turns: 60, gateway_timeout: 600 }, kanal: "telegram" }, ZEITSTEMPEL);
    if (/base_url: http:\/\/127\.0\.0\.1:1234\/v1/.test(b.dateien["config.yaml"])) {
      ok("fremder Provider mit base_url wird übernommen");
    } else {
      fehl("fremder Provider mit base_url wird übernommen", "base_url fehlt in der config");
    }
  } catch (e) {
    fehl("fremder Provider mit base_url wird übernommen", e.message);
  }
}

/* ---------------------------------------------------------------------- */

function pruefeZip() {
  console.log("== ZIP ==");
  var wahl = wahlAusBeispiel(path.join(PHASE0, "examples", "freund-pi5.json"));
  var bundle = R.baueBundle(D, wahl, ZEITSTEMPEL);

  var namen = ["config.yaml", ".env.example", "setup.sh", "verify.sh", "CHECKLISTE.md"];
  var dateien = namen.map(function (n) {
    return { name: n, inhalt: bundle.dateien[n], ausfuehrbar: /\.sh$/.test(n) };
  });

  var eins = Z.baue(dateien);
  var zwei = Z.baue(dateien);

  if (eins.length > 400 && eins[0] === 0x50 && eins[1] === 0x4B) {
    ok("ZIP beginnt mit der richtigen Signatur");
  } else {
    fehl("ZIP beginnt mit der richtigen Signatur");
  }

  if (eins.length === zwei.length && eins.every(function (b, i) { return b === zwei[i]; })) {
    ok("ZIP ist reproduzierbar (zweimal gebaut, gleiche Bytes)");
  } else {
    fehl("ZIP ist reproduzierbar");
  }

  fs.mkdirSync(AUSGABE, { recursive: true });
  fs.writeFileSync(path.join(AUSGABE, "bundle.zip"), Buffer.from(eins));
  console.log("      geschrieben: " + path.join(AUSGABE, "bundle.zip") + " (" + eins.length + " Bytes)");
}

/* ---------------------------------------------------------------------- */

function pruefeEingabesicht() {
  console.log("== Eingabe-Prüfung (nur Oberfläche) ==");
  var basis = {
    profil: "pi5",
    provider: { key: "openrouter", label: "OpenRouter" },
    modell: { id: "<diesen-wert-eintragen>", context_length: 200000 },
    agent: { max_turns: 60, gateway_timeout: 600 },
    kanal: "telegram"
  };

  var b1 = R.pruefeEingabe(D, basis);
  if (b1.probleme.some(function (p) { return /Platzhalter/.test(p.text); })) {
    ok("Platzhalter in der Modell-Kennung wird gemeldet");
  } else {
    fehl("Platzhalter in der Modell-Kennung wird gemeldet");
  }

  var ohneSchraegstrich = JSON.parse(JSON.stringify(basis));
  ohneSchraegstrich.modell.id = "irgendeinname";
  var b2 = R.pruefeEingabe(D, ohneSchraegstrich);
  if (b2.probleme.some(function (p) { return /anbieter\/modell/.test(p.text); })) {
    ok("Kennung ohne Schrägstrich wird gemeldet");
  } else {
    fehl("Kennung ohne Schrägstrich wird gemeldet");
  }

  var gut = JSON.parse(JSON.stringify(basis));
  gut.modell.id = "anthropic/claude-sonnet-4.5";
  var b3 = R.pruefeEingabe(D, gut);
  if (b3.probleme.length === 0) ok("vollständige Eingabe wird nicht beanstandet");
  else fehl("vollständige Eingabe wird nicht beanstandet",
            b3.probleme.map(function (p) { return p.text; }).join(" · "));

  /* Der Kern selbst muss den Platzhalter weiterhin durchlassen — sonst
   * weicht er von render.py ab. */
  try {
    var bb = R.baueBundle(D, gut, ZEITSTEMPEL);
    var b4 = R.baueBundle(D, basis, ZEITSTEMPEL);
    if (bb && b4 && b4.todo.length > 0) {
      ok("Kern reicht Platzhalter durch und listet sie auf (wie render.py)");
    } else {
      fehl("Kern reicht Platzhalter durch und listet sie auf");
    }
  } catch (e) {
    fehl("Kern reicht Platzhalter durch", e.message);
  }
}

pruefeVorhandensein();
pruefeEingabesicht();
pruefeGleichstand();
pruefeZip();

console.log("");
console.log("bestanden: " + bestanden + "   fehlgeschlagen: " + fehlgeschlagen);
process.exit(fehlgeschlagen === 0 ? 0 : 1);
