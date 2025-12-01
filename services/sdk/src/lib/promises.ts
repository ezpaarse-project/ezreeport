// oxlint-disable-next-line prefer-node-protocol
import { EventEmitter } from 'native-events';

// oxlint-disable-next-line no-explicit-any
type EventMap = Record<string, any[]>;

interface EventfulListener<Events extends EventMap> {
  on: <Name extends keyof Events>(
    eventName: Name,
    listener: (...args: Events[Name]) => void
  ) => this;
  once: <Name extends keyof Events>(
    eventName: Name,
    listener: (...args: Events[Name]) => void
  ) => this;
  off: <Name extends keyof Events>(
    eventName: Name,
    listener: (...args: Events[Name]) => void
  ) => this;
}
interface EventfulEmitter<Events extends EventMap> {
  emit: <Name extends keyof Events>(
    eventName: Name,
    ...args: Events[Name]
  ) => this;
}

export type EventfulPromise<Data, Events extends EventMap> = Promise<Data> &
  EventfulListener<Events>;

/**
 * Attach a `EventEmitter` to a `Promise` returned by the `executor`
 *
 * @param executor Executor returning the promise. The `emitter` is passed to the executor as param.
 * @param emitter `EventEmitter` attached. By default it's a new instance.
 *
 * @returns The EventfulPromise
 */
const createEventfulPromise = <Data, Events extends EventMap = EventMap>(
  executor: (
    emitter: EventfulEmitter<Events>,
    resolve: (value: Data) => void
  ) => Promise<Data | void>,
  // oxlint-disable-next-line unicorn/prefer-event-target
  emitter = new EventEmitter()
): EventfulPromise<Data, Events> => {
  const customEmitter: EventfulEmitter<Events> = {
    emit: (eventName, ...args) => {
      emitter.emit(eventName.toString(), ...args);
      return customEmitter;
    },
  };

  // oxlint-disable-next-line promise/avoid-new
  const promise = new Promise<Data>((resolve, reject) => {
    executor(customEmitter, resolve)
      // oxlint-disable-next-line prefer-await-to-then
      .then((res) => res && resolve(res))
      // oxlint-disable-next-line prefer-await-to-then
      .catch(reject);
  });

  const res: EventfulPromise<Data, Events> = Object.assign<
    Promise<Data>,
    EventfulListener<Events>
  >(promise, {
    on: (eventName, listener) => {
      emitter.on(eventName.toString(), (...params) =>
        // oxlint-disable-next-line no-explicit-any
        listener(...(params as any))
      );
      return res;
    },
    once: (eventName, listener) => {
      emitter.once(eventName.toString(), (...params) =>
        // oxlint-disable-next-line no-explicit-any
        listener(...(params as any))
      );
      return res;
    },
    off: (eventName, listener) => {
      emitter.off(eventName.toString(), (...params) =>
        // oxlint-disable-next-line no-explicit-any
        listener(...(params as any))
      );
      return res;
    },
  });
  return res;
};

export default createEventfulPromise;
