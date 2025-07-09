import EventEmitter from 'events';

interface EventfulListener<E extends Record<string, any[]>> {
  on: <P extends keyof E>(eventName: P, listener: (...args: E[P]) => void) => this,
  once: <P extends keyof E>(eventName: P, listener: (...args: E[P]) => void) => this,
  off: <P extends keyof E>(eventName: P, listener: (...args: E[P]) => void) => this,
}
interface EventfulEmitter<E extends Record<string, any[]>> {
  emit: <P extends keyof E>(eventName: P, ...args: E[P]) => this,
}

export type EventfulPromise<T, E extends Record<string, any[]>> = Promise<T> & EventfulListener<E>;

/**
 * Attach a `EventEmitter` to a `Promise` returned by the `executor`
 *
 * @param executor Executor returning the promise. The `emitter` is passed to the executor as param.
 * @param emitter `EventEmitter` attached. By default it's a new instance.
 *
 * @returns The EventfulPromise
 */
const createEventfulPromise = <T, E extends Record<string, any[]> = Record<string, any[]>>(
  executor: (emitter: EventfulEmitter<E>, resolve: (value: T) => void) => Promise<T | void>,
  emitter = new EventEmitter(),
): EventfulPromise<T, E> => {
  const customEmitter: EventfulEmitter<E> = {
    emit: (eventName, ...args) => {
      emitter.emit(eventName.toString(), ...args);
      return customEmitter;
    },
  };

  const promise = new Promise<T>((resolve, reject) => {
    executor(customEmitter, resolve)
      .then((res) => res && resolve(res))
      .catch(reject);
  });

  const res: EventfulPromise<T, E> = Object.assign<Promise<T>, EventfulListener<E>>(
    promise,
    {
      on: (eventName, listener) => {
        emitter.on(eventName.toString(), (...p) => listener(...p as any));
        return res;
      },
      once: (eventName, listener) => {
        emitter.once(eventName.toString(), (...p) => listener(...p as any));
        return res;
      },
      off: (eventName, listener) => {
        emitter.off(eventName.toString(), (...p) => listener(...p as any));
        return res;
      },
    },
  );
  return res;
};

export default createEventfulPromise;
