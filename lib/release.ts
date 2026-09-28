import { orders } from "@/lib/orders";

export type ReleaseStatus = "Not Released" | "Released";

const storageKey = "rescro-demo-released-orders";
// The first 42 records represent newly imported Shopify orders waiting for planning.
export const seededReleasedIds = new Set<string>();

export function readReleasedIds(): Set<string> {
  if (typeof window === "undefined") return seededReleasedIds;
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? new Set(JSON.parse(saved) as string[]) : new Set(seededReleasedIds);
  } catch {
    return new Set(seededReleasedIds);
  }
}

export function releaseOrders(orderIds: string[]) {
  const next = readReleasedIds();
  orderIds.forEach((id) => next.add(id));
  localStorage.setItem(storageKey, JSON.stringify([...next]));
  window.dispatchEvent(new Event("rescro-release-updated"));
  return next;
}

export function releaseStatus(id: string, releasedIds: Set<string>): ReleaseStatus {
  return releasedIds.has(id) ? "Released" : "Not Released";
}
