import { defaultCache, PAGES_CACHE_NAME } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import type { RuntimeCaching } from "serwist";
import { Serwist } from "serwist";

// TypeScript 전역 객체 확장
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const pageRuntimeCacheNames = new Set<string>([
  PAGES_CACHE_NAME.rscPrefetch,
  PAGES_CACHE_NAME.rsc,
  PAGES_CACHE_NAME.html,
  "next-data",
  "others",
]);

const runtimeCaching = defaultCache.filter((entry: RuntimeCaching) => {
  const handler = entry.handler as { cacheName?: string };
  return !handler.cacheName || !pageRuntimeCacheNames.has(handler.cacheName);
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all(Array.from(pageRuntimeCacheNames, (cacheName) => caches.delete(cacheName))).then(
      () => undefined,
    ),
  );
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();
