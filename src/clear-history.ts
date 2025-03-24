import type { Cache } from "./cache";

export function clearHistory(cache: Cache): void {
  cache.clear();
}
