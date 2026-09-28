import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { expect, it } from "vitest";

function worker() {
  const listeners = new Map<string, (event: any) => void>();
  const cache = new Map<string, Response>();
  let offline = false;
  const scope = {
    location: { origin: "https://shop.example" },
    addEventListener: (type: string, listener: (event: any) => void) => listeners.set(type, listener),
    skipWaiting: async () => {}, clients: { claim: async () => {} },
  };
  const file = path.join(process.cwd(), "public/sw.js");
  vm.runInNewContext(existsSync(file) ? readFileSync(file, "utf8") : "", {
    self: scope, URL, Request, Response,
    caches: {
      open: async () => ({ put: async (request: Request | string, response: Response) => cache.set(typeof request === "string" ? request : new URL(request.url).pathname, response), match: async (request: string) => cache.get(request)?.clone() }),
      keys: async () => [], delete: async () => true,
    },
    fetch: async () => { if (offline) throw new Error("Offline"); return new Response("<h1>You are offline</h1>", { headers: { "Content-Type": "text/html" } }); },
  });
  return {
    cache,
    setOffline: () => { offline = true; },
    install: async () => {
      const tasks: Promise<unknown>[] = [];
      expect(listeners.has("install")).toBe(true);
      listeners.get("install")?.({ waitUntil: (task: Promise<unknown>) => tasks.push(task) });
      await Promise.all(tasks);
    },
    request: (pathname: string, overrides: Record<string, unknown> = {}) => {
      let response: Promise<Response> | undefined;
      listeners.get("fetch")?.({ request: { url: `https://shop.example${pathname}`, method: "GET", mode: "navigate", headers: new Headers(), ...overrides }, respondWith: (task: Promise<Response>) => { response = task; } });
      return response;
    },
  };
}

it("provides a self-contained offline shell for public pages without caching visited content", async () => {
  const sw = worker();
  await sw.install();
  await sw.request("/products/example");
  expect([...sw.cache.keys()].every((url) => url === "/offline.html" || url.startsWith("/icons/"))).toBe(true);
  sw.setOffline();
  expect(await (await sw.request("/products/example"))?.text()).toContain("You are offline");
});

it.each(["/account", "/account/orders/123", "/orders/123", "/checkout", "/cart", "/admin/products", "/api/products", "/auth/callback", "/login", "/register", "/reset-password", "/forgot-password", "/wishlist"])("never intercepts sensitive route %s", async (route) => {
  const sw = worker();
  await sw.install();
  sw.setOffline();
  expect(sw.request(route)).toBeUndefined();
});

it("leaves API-like, cross-origin, non-GET, RSC and authorized requests entirely to the network", async () => {
  const sw = worker();
  await sw.install();
  expect(sw.request("/products", { method: "POST" })).toBeUndefined();
  expect(sw.request("/products", { mode: "cors" })).toBeUndefined();
  expect(sw.request("/products", { url: "https://another.example/products" })).toBeUndefined();
  expect(sw.request("/products", { headers: new Headers({ authorization: "Bearer secret" }) })).toBeUndefined();
  expect(sw.request("/products?_rsc=abc", { headers: new Headers({ RSC: "1" }) })).toBeUndefined();
});
