export function createTimerRegistry(timerApi = globalThis) {
  const pending = new Set();
  let generation = 0;

  return {
    schedule(callback, delayMs) {
      const scheduledGeneration = generation;
      const id = timerApi.setTimeout(() => {
        pending.delete(id);
        if (scheduledGeneration === generation) callback();
      }, delayMs);
      pending.add(id);
      return id;
    },
    reset() {
      generation += 1;
      pending.forEach((id) => timerApi.clearTimeout(id));
      pending.clear();
    },
    get size() {
      return pending.size;
    },
  };
}
