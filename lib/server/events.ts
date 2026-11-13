import type { RealtimeUpdate } from "@/lib/types";

type Listener = (update: RealtimeUpdate) => void;

const globalForEvents = globalThis as unknown as {
  bsafeChannels?: Map<string, Set<Listener>>;
};

const channels = (globalForEvents.bsafeChannels ??= new Map<string, Set<Listener>>());

export function subscribe(channel: string, listener: Listener): () => void {
  let listeners = channels.get(channel);
  if (!listeners) {
    listeners = new Set<Listener>();
    channels.set(channel, listeners);
  }
  listeners.add(listener);
  return () => {
    const current = channels.get(channel);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) channels.delete(channel);
  };
}

export function publish(channelsToNotify: string | string[], reason: RealtimeUpdate["reason"]): void {
  const list = Array.isArray(channelsToNotify) ? channelsToNotify : [channelsToNotify];
  const update: RealtimeUpdate = { reason, at: new Date().toISOString() };
  for (const channel of list) {
    const listeners = channels.get(channel);
    if (!listeners) continue;
    for (const listener of listeners) {
      try {
        listener(update);
      } catch {
        // A broken SSE client must never break the alert write path.
      }
    }
  }
}
