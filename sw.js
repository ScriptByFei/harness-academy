/* Harness Academy — Service Worker.
 *
 * Die App ist vollständig statisch und hat keine Netzabhängigkeit zur Laufzeit.
 * Der Service Worker legt sie deshalb beim ersten Aufruf ab und liefert sie
 * danach aus dem Cache: man kann sie ohne Verbindung benutzen.
 *
 * Strategie: cache-first. Bei einer neuen Fassung wechselt CACHE_NAME, der
 * alte Cache wird beim Aktivieren entfernt — kein Resteverbleib.
 */
var CACHE_NAME = "harness-academy-v1";

var DATEIEN = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/daten.js",
  "js/render-core.js",
  "js/zip.js",
  "js/app.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];

self.addEventListener("install", function (ereignis) {
  ereignis.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(DATEIEN); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ereignis) {
  ereignis.waitUntil(
    caches.keys()
      .then(function (namen) {
        return Promise.all(namen.map(function (n) {
          return n === CACHE_NAME ? null : caches.delete(n);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ereignis) {
  if (ereignis.request.method !== "GET") return;
  var ziel = new URL(ereignis.request.url);
  if (ziel.origin !== location.origin) return;

  ereignis.respondWith(
    caches.match(ereignis.request).then(function (treffer) {
      if (treffer) return treffer;
      return fetch(ereignis.request).then(function (antwort) {
        if (antwort && antwort.status === 200 && antwort.type === "basic") {
          var kopie = antwort.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(ereignis.request, kopie); });
        }
        return antwort;
      }).catch(function () {
        return caches.match("index.html");
      });
    })
  );
});
