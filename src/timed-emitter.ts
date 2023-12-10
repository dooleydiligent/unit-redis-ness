import {EventEmitter} from "events";
import {Logger} from "./logger";

/**
 * Setup a blocking wait.  Used in B(locking)* commands, such as [[BRPOP]][[BRPopCommand]].
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
  public callback: any = null;

  private logger: Logger = new Logger(module.id);

  constructor(private timeoutSeconds: number, private keyEventNames: string[], emitter: EventEmitter) {
      super();
      setTimeout(
          () => {
              this.emit(
                  "timeout",
                  keyEventNames
              );
              // This is 24.855134803 days
          },
          timeoutSeconds === 0
              // eslint-disable-next-line no-magic-numbers
              ? 2147483647
              // eslint-disable-next-line no-magic-numbers
              : timeoutSeconds * 1000
      );
      for (const eventName of keyEventNames) {
          emitter.on(
              eventName,
              (data: any) => {
                  this.logger.debug(
                      `Triggered channel "${eventName}" with %j`,
                      data
                  );
                  this.emit(
                      eventName,
                      data
                  );
              }
          );
      }
  }
}
