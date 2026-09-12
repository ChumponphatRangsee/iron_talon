import test from "node:test";
import assert from "node:assert/strict";

import { createTimerRegistry } from "../src/game/runtime/createTimerRegistry.js";

function createFakeTimerApi() {
  let nextId = 1;
  const callbacks = new Map();
  return {
    callbacks,
    setTimeout(callback) {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      callbacks.delete(id);
    },
    run(id) {
      const callback = callbacks.get(id);
      callbacks.delete(id);
      callback?.();
    },
  };
}

test("reset cancels every delayed callback from the previous match", () => {
  const timerApi = createFakeTimerApi();
  const timers = createTimerRegistry(timerApi);
  let calls = 0;

  timers.schedule(() => { calls += 1; }, 100);
  timers.schedule(() => { calls += 1; }, 200);
  timers.reset();

  assert.equal(timerApi.callbacks.size, 0);
  assert.equal(timers.size, 0);
  assert.equal(calls, 0);
});

test("new-match callbacks still run after a reset", () => {
  const timerApi = createFakeTimerApi();
  const timers = createTimerRegistry(timerApi);
  let calls = 0;

  timers.schedule(() => { calls += 10; }, 100);
  timers.reset();
  const currentId = timers.schedule(() => { calls += 1; }, 100);
  timerApi.run(currentId);

  assert.equal(calls, 1);
  assert.equal(timers.size, 0);
});
