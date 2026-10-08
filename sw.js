"use strict";

const CACHE_NAME = "esther-portfolio-v3";
const APP_FILES = ["./", "./index.html", "./style.css", "./script.js", "./404.html"];
const INDEX_URL = new URL("./index.html", self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("esther-portfolio-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cachedResponse = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, cachedResponse)));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match(INDEX_URL)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const cachedResponse = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, cachedResponse)));
        }
        return response;
      });
    }),
  );
});
