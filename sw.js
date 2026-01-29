const CACHE_NAME = "hdxwill-cs-form-v3.2.1";

const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./sw.js",
  "./logo.png",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.webmanifest",

  // ✅ flags precache (41)
  "./flags/de.png",
  "./flags/at.png",
  "./flags/ch.png",
  "./flags/fr.png",
  "./flags/it.png",
  "./flags/es.png",
  "./flags/pt.png",
  "./flags/nl.png",
  "./flags/be.png",
  "./flags/lu.png",

  "./flags/gb.png",
  "./flags/ie.png",
  "./flags/dk.png",
  "./flags/se.png",
  "./flags/no.png",
  "./flags/fi.png",
  "./flags/is.png",

  "./flags/pl.png",
  "./flags/cz.png",
  "./flags/sk.png",
  "./flags/hu.png",
  "./flags/ro.png",
  "./flags/bg.png",
  "./flags/gr.png",
  "./flags/hr.png",
  "./flags/si.png",
  "./flags/rs.png",
  "./flags/ba.png",
  "./flags/me.png",
  "./flags/mk.png",
  "./flags/al.png",
  "./flags/xk.png",

  "./flags/lt.png",
  "./flags/lv.png",
  "./flags/ee.png",
  "./flags/md.png",
  "./flags/ua.png",

  "./flags/tr.png",
  "./flags/il.png",
  "./flags/ge.png",
  "./flags/tn.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
