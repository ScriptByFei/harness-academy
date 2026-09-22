/* Harness Academy — ZIP-Schreiber.
 *
 * Erzeugt ein ZIP im Browser, ohne Bibliothek. Verfahren "store" (nicht
 * komprimiert): die Artefakte sind wenige Kilobyte Text, und ein
 * unkomprimiertes ZIP kann jeder Entpacker lesen — auch der von Windows,
 * auch in zehn Jahren.
 *
 * Läuft im Browser und unter Node (für die Prüfungen).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.HAZip = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* CRC-32, wie es das ZIP-Format verlangt. Tabelle wird einmal gebaut. */
  var TABELLE = null;
  function crcTabelle() {
    if (TABELLE) return TABELLE;
    TABELLE = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      TABELLE[n] = c >>> 0;
    }
    return TABELLE;
  }

  function crc32(bytes) {
    var t = crcTabelle(), c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8(text) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text);
    var buf = Buffer.from(text, "utf8");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  /* DOS-Zeitstempel. Feste Vorgabe, damit dasselbe Bundle bytegleich bleibt —
   * sonst ändert sich der Hash bei jedem Download. */
  function dosZeit(datum) {
    var d = datum || new Date(2026, 0, 1, 0, 0, 0);
    var jahr = d.getFullYear() < 1980 ? 1980 : d.getFullYear();
    var zeit = (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
    var tag = ((jahr - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { zeit: zeit, tag: tag };
  }

  function schreibeU16(sicht, pos, wert) { sicht.setUint16(pos, wert & 0xFFFF, true); }
  function schreibeU32(sicht, pos, wert) { sicht.setUint32(pos, wert >>> 0, true); }

  /* dateien: [{ name: "config.yaml", inhalt: "..." , ausfuehrbar: false }] */
  function baue(dateien) {
    var ts = dosZeit(null);
    var lokal = [], zentral = [], versatz = 0;

    dateien.forEach(function (d) {
      var nameBytes = utf8(d.name);
      var inhaltBytes = utf8(d.inhalt);
      var crc = crc32(inhaltBytes);
      var kopf = new Uint8Array(30 + nameBytes.length);
      var s = new DataView(kopf.buffer);
      schreibeU32(s, 0, 0x04034b50);
      schreibeU16(s, 4, 20);
      schreibeU16(s, 6, 0x0800);          /* UTF-8 */
      schreibeU16(s, 8, 0);               /* store */
      schreibeU16(s, 10, ts.zeit);
      schreibeU16(s, 12, ts.tag);
      schreibeU32(s, 14, crc);
      schreibeU32(s, 18, inhaltBytes.length);
      schreibeU32(s, 22, inhaltBytes.length);
      schreibeU16(s, 26, nameBytes.length);
      schreibeU16(s, 28, 0);
      kopf.set(nameBytes, 30);
      lokal.push(kopf, inhaltBytes);

      var zkopf = new Uint8Array(46 + nameBytes.length);
      var z = new DataView(zkopf.buffer);
      schreibeU32(z, 0, 0x02014b50);
      schreibeU16(z, 4, 20);
      schreibeU16(z, 6, 20);
      schreibeU16(z, 8, 0x0800);
      schreibeU16(z, 10, 0);
      schreibeU16(z, 12, ts.zeit);
      schreibeU16(z, 14, ts.tag);
      schreibeU32(z, 16, crc);
      schreibeU32(z, 20, inhaltBytes.length);
      schreibeU32(z, 24, inhaltBytes.length);
      schreibeU16(z, 28, nameBytes.length);
      schreibeU16(z, 30, 0);
      schreibeU16(z, 32, 0);
      schreibeU16(z, 34, 0);
      schreibeU16(z, 36, 0);
      schreibeU32(z, 38, d.ausfuehrbar ? (0x81ED << 16) : (0x81A4 << 16)); /* 0755 / 0644 */
      schreibeU32(z, 42, versatz);
      zkopf.set(nameBytes, 46);
      zentral.push(zkopf);

      versatz += kopf.length + inhaltBytes.length;
    });

    var zentralGroesse = zentral.reduce(function (n, a) { return n + a.length; }, 0);
    var ende = new Uint8Array(22);
    var e = new DataView(ende.buffer);
    schreibeU32(e, 0, 0x06054b50);
    schreibeU16(e, 4, 0);
    schreibeU16(e, 6, 0);
    schreibeU16(e, 8, dateien.length);
    schreibeU16(e, 10, dateien.length);
    schreibeU32(e, 12, zentralGroesse);
    schreibeU32(e, 16, versatz);
    schreibeU16(e, 20, 0);

    var teile = lokal.concat(zentral, [ende]);
    var gesamt = teile.reduce(function (n, a) { return n + a.length; }, 0);
    var out = new Uint8Array(gesamt), p = 0;
    teile.forEach(function (a) { out.set(a, p); p += a.length; });
    return out;
  }

  return { baue: baue, crc32: crc32 };
});
