import { EventEmitter } from 'events';
import { Logger } from './logger';
/**
 * Setup a blocking wait.  Used in B(locking)* commands, such as [BRPOP]{@link BRPopCommand}.
 *
 * Unlike redis, which allows an infinite wait when timoutSeconds is ZERO, **unit-redis-ness**
 * allows only for a maximum of about 24.85 days
 *
 * @param timeoutSeconds Number of seconds to wait
 * @param keyEventNames Array of events to wait for
 * @param emitter The serverContext is the emitter
 * @returns TimedEmitter EventEmitter
 *
 * ### Events: timout
 */

export class TimedEmitter extends EventEmitter {
  private logger: Logger = new Logger(module.id);
  constructor(private timeoutSeconds: number, private keyEventNames: string[], emitter: EventEmitter) {
    super();
    setTimeout(() => {
      this.emit('timeout');
      // This is 24.855134803 days
    }, timeoutSeconds === 0 ? 2147483647 : timeoutSeconds * 1000);
    for (const eventName of keyEventNames) {
      emitter.on(eventName, () => {
        this.logger.debug(`Triggered ${eventName}`);
        this.emit(eventName);
      });
    }
  }
}
