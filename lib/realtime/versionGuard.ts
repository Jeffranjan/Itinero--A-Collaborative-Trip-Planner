/**
 * In-memory version guard that prevents out-of-order realtime events
 * from regressing cache state. Tracks the latest $updatedAt per document ID.
 */
const docVersionMap = new Map<string, string>();

export function shouldApplyEvent(payload: any): boolean {
  const id = payload?.$id;
  const updatedAt = payload?.$updatedAt;

  if (!id || !updatedAt) return true; // Allow if no version info

  const previous = docVersionMap.get(id);

  if (previous && previous > updatedAt) {
    return false; // Stale event — skip
  }

  docVersionMap.set(id, updatedAt);
  return true;
}

/** Clear version tracking (e.g. on reconnect) */
export function clearVersionMap() {
  docVersionMap.clear();
}
