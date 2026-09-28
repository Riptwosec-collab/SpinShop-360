/* SpinShop public offline shell. Never cache a fetched page, session or API response. */
const CACHE = "spinshop-public-shell-v1";
const SHELL = "/offline.html";
const STATIC_FILES = [SHELL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(STATIC_FILES.map(async (path) => {
      const response = await fetch(new Request(new URL(path, self.location.origin), { credentials: "omit", cache: "reload" }));
      if (!response.ok || response.redirected) throw new Error("Offline shell could not be installed");
      await cache.put(path, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("spinshop-public-shell-") && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || request.mode !== "navigate" || url.origin !== self.location.origin) return;
  if (request.headers.has("authorization") || request.headers.has("RSC") || url.searchParams.has("_rsc")) return;
  // An allowlist deliberately leaves account, orders, checkout, cart, wishlist,
  // admin, auth and all API/resource requests outside this handler entirely.
  const publicPage = url.pathname === "/" || /^\/products(?:\/[^/]+)?\/?$/.test(url.pathname) ||
    ["/about", "/contact", "/shipping", "/how-to-order", "/payment-methods", "/privacy", "/terms", "/offline", SHELL].includes(url.pathname);
  if (!publicPage) return;
  event.respondWith((async () => {
    try { return await fetch(request); }
    catch {
      const cache = await caches.open(CACHE);
      return await cache.match(SHELL) || new Response("Offline / ออฟไลน์", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
