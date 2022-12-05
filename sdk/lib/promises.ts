import EventEmitter from 'events';

interface EventEmitterBase {
  on: (...p: Parameters<EventEmitter['on']>) => this,
  once: (...p: Parameters<EventEmitter['once']>) => this,
  off: (...p: Parameters<EventEmitter['off']>) => this,
  emit: (...p: Parameters<EventEmitter['emit']>) => this,
}

export type EventfullPromise<T> = Promise<T> & EventEmitterBase;

/**
 * Attach a `EventEmitter` to a `Promise` returned by the `executor`
 *
 * @param executor Executor returning the promise. The `emitter` is passed to the executor as param.
 * @param emitter `EventEmitter` attached. By default it's a new instance.
 *
 * @returns The EventfullPromise
 */
const createEventfullPromise = <T>(
  executor: (emitter: EventEmitter | EventEmitterBase) => Promise<T>,
  emitter = new EventEmitter(),
): EventfullPromise<T> => {
  const promise = executor(emitter);

  const res: EventfullPromise<T> = Object.assign(
    promise,
    {
      on: (...p) => { emitter.on(...p); return res; },
      once: (...p) => { emitter.on(...p); return res; },
      off: (...p) => { emitter.on(...p); return res; },
      emit: (...p) => { emitter.emit(...p); return res; },
    } as EventEmitterBase,
  );
  return res;
};

export default createEventfullPromise;
