/* Harness Academy — Oberfläche.
 *
 * Verbindet Formular und Renderer-Kern. Keine Bibliothek, kein Buildschritt
 * für die Oberfläche selbst: die Datei wird so ausgeliefert, wie sie hier steht.
 */
(function () {
  "use strict";

  var D = window.HADATEN;
  var R = window.HARender;
  var Z = window.HAZip;

  /* Anbieter zur Auswahl. Nur Namen, die Hermes eingebaut kennt — bei ihnen
   * darf keine base_url gesetzt werden. "custom" ist der Sonderfall für einen
   * eigenen Endpunkt (etwa ein lokales Modell). */
  var ANBIETER = [
    { key: "openrouter",  label: "OpenRouter",   hinweis: "Zugang zu vielen Modellen über einen Schlüssel. Für den Anfang die einfachste Wahl." },
    { key: "anthropic",   label: "Anthropic",    hinweis: "Direkt bei Anthropic. Gute Werkzeug-Nutzung." },
    { key: "openai-codex",label: "OpenAI (Codex)", hinweis: "Direkt bei OpenAI." },
    { key: "nous",        label: "Nous",         hinweis: "Nous Research. Betreibt auch Hermes selbst." },
    { key: "gemini",      label: "Google Gemini",hinweis: "Direkt bei Google." },
    { key: "ollama-cloud",label: "Ollama Cloud", hinweis: "Modelle im Betrieb eines anderen." },
    { key: "custom",      label: "Eigener Endpunkt", hinweis: "Ein selbst betriebenes Modell. Hier MUSS die Adresse angegeben werden — ohne sie findet Hermes nichts." }
  ];

  var KANAELE = [
    { key: "telegram", label: "Telegram" },
    { key: "discord",  label: "Discord" },
    { key: "slack",    label: "Slack" },
    { key: "matrix",   label: "Matrix (Element)" }
  ];

  var DATEIREIHENFOLGE = ["config.yaml", ".env.example", "setup.sh", "verify.sh", "CHECKLISTE.md"];
  var ZEITSTEMPEL = new Date().toISOString().slice(0, 16).replace("T", " ");

  var el = {
    geraeteliste: document.getElementById("geraeteliste"),
    ramurteil: document.getElementById("ramurteil"),
    anbieter: document.getElementById("anbieter"),
    modell: document.getElementById("modell"),
    kontext: document.getElementById("kontext"),
    anbieterhinweis: document.getElementById("anbieterhinweis"),
    kanal: document.getElementById("kanal"),
    maxturns: document.getElementById("maxturns"),
    timeout: document.getElementById("timeout"),
    fehler: document.getElementById("fehler"),
    fehlerliste: document.getElementById("fehlerliste"),
    herunterladen: document.getElementById("herunterladen"),
    zuruecksetzen: document.getElementById("zuruecksetzen"),
    zusammenfassung: document.getElementById("zusammenfassung"),
    dateireiter: document.getElementById("dateireiter"),
    dateiinhalt: document.getElementById("dateiinhalt"),
    kopieren: document.getElementById("kopieren"),
    kopierhinweis: document.getElementById("kopierhinweis"),
    offen: document.getElementById("offen")
  };

  var aktivesProfil = D.profile[0].id;
  var aktiveDatei = "config.yaml";

  /* ------------------------------------------------ Schlüssel im Speicher */

  var SPEICHER_SCHLUESSEL = "harness-academy-wahl-v1";

  function speichereWahl() {
    try {
      localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify({
        profil: aktivesProfil,
        anbieter: el.anbieter.value,
        modell: el.modell.value,
        kontext: el.kontext.value,
        kanal: el.kanal.value,
        maxturns: el.maxturns.value,
        timeout: el.timeout.value
      }));
    } catch (e) { /* privater Modus — kein Grund abzubrechen */ }
  }

  function ladeWahl() {
    try {
      var roh = localStorage.getItem(SPEICHER_SCHLUESSEL);
      return roh ? JSON.parse(roh) : null;
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------ Wahl auslesen */

  function wahl() {
    var k = el.anbieter.value;
    var p = null;
    for (var i = 0; i < ANBIETER.length; i++) if (ANBIETER[i].key === k) p = ANBIETER[i];
    return {
      profil: aktivesProfil,
      provider: { key: k, label: p ? p.label : k },
      modell: {
        id: el.modell.value.trim(),
        context_length: parseInt(el.kontext.value, 10) || 0
      },
      agent: {
        max_turns: parseInt(el.maxturns.value, 10) || 0,
        gateway_timeout: parseInt(el.timeout.value, 10) || 0
      },
      kanal: el.kanal.value
    };
  }

  /* ----------------------------------------------------------- Aufbau */

  function baueAnbieter() {
    ANBIETER.forEach(function (a) {
      var o = document.createElement("option");
      o.value = a.key; o.textContent = a.label;
      el.anbieter.appendChild(o);
    });
  }

  function baueKanaele() {
    KANAELE.forEach(function (k) {
      var o = document.createElement("option");
      o.value = k.key; o.textContent = k.label;
      el.kanal.appendChild(o);
    });
  }

  function baueGeraete() {
    el.geraeteliste.innerHTML = "";
    D.profile.forEach(function (p) {
      var ampel = R.ramAmpel(p.ram_mb, D.rechenregel_ram);
      var preisText = p.preis.monatlich_eur
        ? R.euro(p.preis.monatlich_eur.toFixed(2)) + " im Monat"
        : R.euro(p.preis.anschaffung_eur) + " einmalig";

      var b = document.createElement("button");
      b.type = "button";
      b.className = "geraet";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(p.id === aktivesProfil));
      b.dataset.profil = p.id;
      b.innerHTML =
        '<span class="geraet-balken ' + ampel.status + '" aria-hidden="true"></span>' +
        '<span class="geraet-text">' +
          '<span class="geraet-name">' + p.name + '</span>' +
          '<span class="geraet-tagline">' + p.tagline + '</span>' +
          '<span class="geraet-meta">' + Math.round(p.ram_mb / 1024) + ' GB RAM · ' + preisText + '</span>' +
        '</span>';
      b.addEventListener("click", function () {
        aktivesProfil = p.id;
        document.querySelectorAll(".geraet").forEach(function (x) {
          x.setAttribute("aria-checked", String(x.dataset.profil === p.id));
        });
        aktualisiere();
      });
      el.geraeteliste.appendChild(b);
    });
  }

  function baueDateireiter() {
    el.dateireiter.innerHTML = "";
    DATEIREIHENFOLGE.forEach(function (name) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "reiter";
      b.setAttribute("role", "tab");
      b.dataset.datei = name;
      b.textContent = name;
      b.addEventListener("click", function () {
        aktiveDatei = name;
        aktualisiere();
      });
      el.dateireiter.appendChild(b);
    });
  }

  /* -------------------------------------------------------- Anzeige */

  function zeigeRamurteil() {
    var p = R.findeProfil(D, aktivesProfil);
    var ampel = R.ramAmpel(p.ram_mb, D.rechenregel_ram);
    var basis = D.rechenregel_ram.hermes_belegt_mb;
    el.ramurteil.hidden = false;
    el.ramurteil.className = "urteil " + ampel.status;
    el.ramurteil.innerHTML =
      '<span class="urteil-marke">' + Math.round(p.ram_mb / 1024) + ' GB</span>' +
      '<span class="urteil-text">' + ampel.text +
        ' Der Assistent braucht rund ' + basis + ' MB, hier belegt er ' +
        R.prozent(p.hermes_auslastung_prozent) + '.</span>';
  }

  function zeigeAnbieterhinweis() {
    var k = el.anbieter.value, p = null;
    for (var i = 0; i < ANBIETER.length; i++) if (ANBIETER[i].key === k) p = ANBIETER[i];
    el.anbieterhinweis.hidden = false;
    el.anbieterhinweis.className = "hinweis" + (k === "custom" ? " warnung" : "");
    el.anbieterhinweis.textContent = p ? p.hinweis : "";
  }

  function leeresBundleOderNull() {
    try { return R.baueBundle(D, wahl(), ZEITSTEMPEL); }
    catch (e) { return null; }
  }

  function zeigeFehler(befund) {
    if (!befund.probleme.length) { el.fehler.hidden = true; return; }
    el.fehler.hidden = false;
    el.fehlerliste.innerHTML = "";
    befund.probleme.forEach(function (p) {
      var li = document.createElement("li");
      li.textContent = p.text;
      el.fehlerliste.appendChild(li);
    });
  }

  function zeigeZusammenfassung(bundle) {
    var p = bundle.profil, k = bundle.kontext;
    var preis = p.preis.monatlich_eur
      ? R.euro(p.preis.monatlich_eur.toFixed(2)) + " pro Monat"
      : R.euro(p.preis.anschaffung_eur) + " einmalig";

    var zeilen = [
      ["Gerät", p.name + " · " + Math.round(p.ram_mb / 1024) + " GB"],
      ["Kosten", preis],
      ["Dienst", k.service_manager === "systemd"
        ? "systemd — startet nach dem Anmelden von selbst"
        : "launchd — startet nach dem Anmelden von selbst"],
      ["Anbieter", k.provider_label],
      ["Modell", k.model_id || "— noch offen —"],
      ["Kanal", k.kanal_label]
    ];

    el.zusammenfassung.innerHTML = zeilen.map(function (z) {
      return '<div class="zeile"><span class="zeile-name">' + z[0] + '</span>' +
             '<span class="zeile-wert">' + z[1] + '</span></div>';
    }).join("");
  }

  function aktualisiere() {
    speichereWahl();
    zeigeRamurteil();
    zeigeAnbieterhinweis();

    var befund = R.pruefeEingabe(D, wahl());
    zeigeFehler(befund);

    var bundle = leeresBundleOderNull();

    document.querySelectorAll(".reiter").forEach(function (x) {
      x.setAttribute("aria-selected", String(x.dataset.datei === aktiveDatei));
    });

    if (bundle) {
      zeigeZusammenfassung(bundle);
      el.herunterladen.disabled = false;
      el.dateiinhalt.textContent = bundle.dateien[aktiveDatei] || "";
      var offeneDateien = {};
      bundle.todo.forEach(function (t) { offeneDateien[t.datei] = true; });
      if (bundle.todo.length) {
        el.offen.hidden = false;
        el.offen.innerHTML = "<strong>Noch einzutragen:</strong> " +
          bundle.todo.length + " Stelle(n) in " +
          Object.keys(offeneDateien).join(", ") +
          ". Sie stehen in spitzen Klammern und sind in der Vorschau zu sehen.";
      } else {
        el.offen.hidden = true;
      }
    } else {
      /* Noch nicht vollständig: Vorschau zeigen, soweit sie schon geht,
       * damit man sieht, wohin die Eingaben führen. */
      el.herunterladen.disabled = true;
      el.dateiinhalt.textContent = vorlageMitBekanntenWerten(aktiveDatei);
      el.zusammenfassung.innerHTML =
        '<div class="zeile"><span class="zeile-name">Gerät</span>' +
        '<span class="zeile-wert">' + R.findeProfil(D, aktivesProfil).name + '</span></div>';
      el.offen.hidden = true;
    }
  }

  /* Vorschau, solange die Eingabe noch unvollständig ist.
   *
   * Namen wie "profil_name" sagen einem Einsteiger nichts. Deshalb werden
   * hier alle Werte eingesetzt, die schon feststehen — aus dem gewählten
   * Gerät und aus dem Formular. Nur was wirklich fehlt, bleibt als
   * <diesen-wert-eintragen> stehen: dasselbe Zeichen, das der Nutzer später
   * in seinem Bundle ersetzt. So sieht die Vorschau genauso aus wie das
   * Ergebnis. */
  function vorlageMitBekanntenWerten(name) {
    var roh = D.vorlagen[name] || "";
    var w = wahl();
    var p = R.findeProfil(D, aktivesProfil);
    var ampel = R.ramAmpel(p.ram_mb, D.rechenregel_ram);
    var dienst = D.dienstformate[p.service_manager];
    var offen = "<diesen-wert-eintragen>";

    var werte = {
      timestamp: ZEITSTEMPEL,
      profil_id: p.id,
      profil_name: p.name,
      profil_tagline: p.tagline,
      arch: p.arch,
      ram_mb: p.ram_mb,
      ram_gb: (p.ram_mb / 1024).toFixed(1),
      auslastung: p.hermes_auslastung_prozent,
      reserve: p.reserve_prozent,
      ram_status: ampel.status,
      ram_text: ampel.text,
      service_manager: p.service_manager,
      dienst_artefakt: dienst.artefakt,
      os_empfehlung: p.os_empfehlung,
      install_weg: p.install_weg,
      provider_key: w.provider.key,
      provider_label: w.provider.label,
      model_id: w.modell.id || offen,
      context_length: w.modell.context_length,
      max_turns: w.agent.max_turns,
      gateway_timeout: w.agent.gateway_timeout,
      kanal: w.kanal,
      kanal_label: R.kanalLabel(w.kanal),
      kanal_secret: { telegram: "TELEGRAM_BOT_TOKEN", discord: "DISCORD_BOT_TOKEN",
                      slack: "SLACK_BOT_TOKEN", matrix: "MATRIX_ACCESS_TOKEN" }[w.kanal] || "KANAL_TOKEN",
      provider_secret: w.provider.key.toUpperCase().replace(/-/g, "_") + "_API_KEY"
    };

    /* base_url_block kennt nur der Kern — er wirft bei ungültiger Wahl.
     * Hier wird er deshalb direkt eingesetzt, nicht über die Vorlage. */
    var block;
    try {
      block = R.baseUrlBlock({ key: w.provider.key, label: w.provider.label });
    } catch (e) {
      block = w.provider.key === "custom"
        ? "  # Hier gehört die Adresse deines Endpunkts hin, z. B. http://127.0.0.1:1234/v1"
        : "";
    }
    werte.base_url_block = block;

    return roh.replace(/\{\{(\w+)\}\}/g, function (treffer, schluessel) {
      return (schluessel in werte) ? String(werte[schluessel]) : offen;
    });
  }

  /* ------------------------------------------------------- Download */

  function dateiname() {
    var p = R.findeProfil(D, aktivesProfil);
    return "harness-academy-" + p.id + ".zip";
  }

  function herunterladen() {
    var bundle = leeresBundleOderNull();
    if (!bundle) { aktualisiere(); return; }

    var ausfuehrbar = { "setup.sh": true, "verify.sh": true };
    var dateien = DATEIREIHENFOLGE.map(function (name) {
      return {
        name: name,
        inhalt: bundle.dateien[name],
        ausfuehrbar: !!ausfuehrbar[name]
      };
    });

    var bytes = Z.baue(dateien);
    var blob = new Blob([bytes], { type: "application/zip" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = dateiname();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);

    el.kopierhinweis.textContent = "Gespeichert als " + dateiname();
    setTimeout(function () { el.kopierhinweis.textContent = ""; }, 4000);
  }

  function kopieren() {
    var text = el.dateiinhalt.textContent;
    var fertig = function () {
      el.kopierhinweis.textContent = "Kopiert.";
      setTimeout(function () { el.kopierhinweis.textContent = ""; }, 2500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(fertig, function () {
        el.kopierhinweis.textContent = "Kopieren blockiert — bitte von Hand markieren.";
      });
    } else {
      el.kopierhinweis.textContent = "Kopieren blockiert — bitte von Hand markieren.";
    }
  }

  function zuruecksetzen() {
    try { localStorage.removeItem(SPEICHER_SCHLUESSEL); } catch (e) {}
    aktivesProfil = D.profile[0].id;
    el.anbieter.value = "openrouter";
    el.modell.value = "";
    el.kontext.value = "200000";
    el.kanal.value = "telegram";
    el.maxturns.value = "60";
    el.timeout.value = "600";
    aktiveDatei = "config.yaml";
    document.querySelectorAll(".geraet").forEach(function (x) {
      x.setAttribute("aria-checked", String(x.dataset.profil === aktivesProfil));
    });
    aktualisiere();
  }

  /* ------------------------------------------------------------ Start */

  function start() {
    baueAnbieter();
    baueKanaele();
    baueGeraete();
    baueDateireiter();

    var gespeichert = ladeWahl();
    if (gespeichert) {
      if (R.findeProfil(D, gespeichert.profil)) aktivesProfil = gespeichert.profil;
      if (gespeichert.anbieter) el.anbieter.value = gespeichert.anbieter;
      if (gespeichert.modell) el.modell.value = gespeichert.modell;
      if (gespeichert.kontext) el.kontext.value = gespeichert.kontext;
      if (gespeichert.kanal) el.kanal.value = gespeichert.kanal;
      if (gespeichert.maxturns) el.maxturns.value = gespeichert.maxturns;
      if (gespeichert.timeout) el.timeout.value = gespeichert.timeout;
      document.querySelectorAll(".geraet").forEach(function (x) {
        x.setAttribute("aria-checked", String(x.dataset.profil === aktivesProfil));
      });
    }

    ["change", "input"].forEach(function (ereignis) {
      [el.anbieter, el.modell, el.kontext, el.kanal, el.maxturns, el.timeout].forEach(function (f) {
        f.addEventListener(ereignis, aktualisiere);
      });
    });

    el.herunterladen.addEventListener("click", herunterladen);
    el.kopieren.addEventListener("click", kopieren);
    el.zuruecksetzen.addEventListener("click", zuruecksetzen);

    aktualisiere();

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(function () {
        /* Ohne Service Worker läuft die Seite weiter — nur nicht offline. */
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();