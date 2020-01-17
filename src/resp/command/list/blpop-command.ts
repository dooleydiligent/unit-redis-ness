import { DbDataType } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { TimedEmitter } from '../../../timed-emitter';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { RedisToken } from '../../protocol/redis-token';
import { LPopCommand } from './lpop-command';
/**
 * ### Available since 2.0.0.
 * ### BLPOP key [key ...] timeout
 * BLPOP is a blocking list pop primitive. It is the blocking version of LPOP because it blocks
 * the connection when there are no elements to pop from any of the given lists. An element is
 * popped from the head of the first list that is non-empty, with the given keys being checked
 * in the order that they are given.
 *
 * ### Non-blocking behavior
 * When BLPOP is called, if at least one of the specified keys contains a non-empty list, an
 * element is popped from the head of the list and returned to the caller together with the key
 * it was popped from.
 *
 * Keys are checked in the order that they are given. Let's say that the key list1 doesn't exist
 * and list2 and list3 hold non-empty lists. Consider the following command:
 * ```
 * BLPOP list1 list2 list3 0
 * ```
 * BLPOP guarantees to return an element from the list stored at list2 (since it is the first
 * non empty list when checking list1, list2 and list3 in that order).
 * ### Blocking behavior
 * If none of the specified keys exist, BLPOP blocks the connection until another client performs
 * an LPUSH or RPUSH operation against one of the keys.
 *
 * Once new data is present on one of the lists, the client returns with the name of the key
 * unblocking it and the popped value.
 *
 * When BLPOP causes a client to block and a non-zero timeout is specified, the client will
 * unblock returning a nil multi-bulk value when the specified timeout has expired without a
 * push operation against at least one of the specified keys.
 *
 * The timeout argument is interpreted as an integer value specifying the maximum number of
 * seconds to block. A timeout of zero can be used to block indefinitely.
 */
@DbDataType(DataType.LIST)
export class BLPopCommand extends LPopCommand {
  protected logger: Logger;
  constructor(maxParams: number, minParams: number, name: string) {
    super();
    this.constructor.prototype.maxParams = maxParams;
    this.constructor.prototype.minParams = minParams;
    this.constructor.prototype.name = name;
    this.logger = new Logger(module.id);
  }
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const timeout: string = request.getParam(request.getParams().length - 1);
    // Check all source keys first
    const results: RedisToken[] = [];
    for (let index = 0; index < request.getParams().length - 1; index++) {
      const key = request.getParam(index);
      const result = this.process(request, db, key);
      if (result !== RedisToken.nullString()) {
        results.push(RedisToken.string(key));
        results.push(result);
        break;
      }
    }
    if (results.length > 0) {
      return (RedisToken.array(results));
    } else {
      const eventNames: string[] = [];
      const eventCallbacks: any = {};
      for (let index = 0; index < request.getParams().length - 1; index++) {
        const key = request.getParam(index);
        eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:lpush ${key}`);
        eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:rpush ${key}`);
        eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:linsert ${key}`);
        eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:lset ${key}`);
      }
      const timedEvent: TimedEmitter = new TimedEmitter(Number(timeout), eventNames, request.getServerContext());
      timedEvent.on('timeout', () => {
        this.logger.debug(`Timeout`);
        this.removeListeners(timedEvent, eventCallbacks);
        return (RedisToken.nullString());
      });
      for (const eventName of eventNames) {
        this.logger.debug(`Adding listener for ${eventName}`);
        eventCallbacks[eventName] = () => {
          const keyName: string = `${eventName.split(' ')[1]}`;
          const callresults: RedisToken[] = [RedisToken.string(keyName)];
          callresults.push(this.process(request, db, keyName));
          return (RedisToken.array(callresults));
        };
        timedEvent.on(eventName, eventCallbacks[eventName]);
      }
      return (RedisToken.array(results));
    }
  }
  private removeListeners(timedEvent: TimedEmitter, events: any) {
    for (const eName of Object.keys(events)) {
      this.logger.debug(`Removing listener for ${eName}`);
      timedEvent.off(eName, events[eName]);
    }
  }
}
