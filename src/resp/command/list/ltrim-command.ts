import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * ### Available since 1.0.0.
 *
 * ### LTRIM key start stop
 *
 * Trim an existing list so that it will contain only the specified range of elements specified.
 * Both start and stop are zero-based indexes, where 0 is the first element of the list (the
 * head), 1 the next element and so on.
 *
 * For example: LTRIM foobar 0 2 will modify the list stored at foobar so that only the first
 * three elements of the list will remain.
 *
 * start and end can also be negative numbers indicating offsets from the end of the list, where
 * -1 is the last element of the list, -2 the penultimate element and so on.
 *
 * Out of range indexes will not produce an error: if start is larger than the end of the list,
 * or start > end, the result will be an empty list (which causes key to be removed). If end is
 * larger than the end of the list, Redis will treat it like the last element of the list.
 *
 * A common use of LTRIM is together with LPUSH / RPUSH. For example:
 * ```
 * LPUSH mylist someelement
 * LTRIM mylist 0 99
 * ```
 *
 * This pair of commands will push a new element on the list, while making sure that the list will
 * not grow larger than 100 elements. This is very useful when using Redis to store logs for
 * example. It is important to note that when used in this way LTRIM is an O(1) operation because
 * in the average case just one element is removed from the tail of the list.
 *
 * ### Return value
 * Simple string reply
 *
 * ### Examples
 * ```
 * redis> RPUSH mylist "one"
 * (integer) 1
 * redis> RPUSH mylist "two"
 * (integer) 2
 * redis> RPUSH mylist "three"
 * (integer) 3
 * redis> LTRIM mylist 1 -1
 * "OK"
 * redis> LRANGE mylist 0 -1
 * 1) "two"
 * 2) "three"
 * redis>
 * ```
 */
@DbDataType(DataType.LIST)
@MaxParams(3)
@MinParams(3)
@Name('ltrim')
export class LTrimCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const key: string = request.getParam(0);
    let startIndex: any = Number(request.getParam(1));
    this.logger.debug(`startIndex is ${startIndex}`);
    let stopIndex: any = Number(request.getParam(2));
    this.logger.debug(`stopIndex is ${stopIndex}`);
    if (isNaN(startIndex) || isNaN(stopIndex) || !Number.isInteger(startIndex) || !Number.isInteger(stopIndex)) {
      this.logger.debug(`Invalid start or stop index`);
      return RedisToken.error('ERR value is not an integer or out of range');
    }
    const list: DatabaseValue = db.get(key);
    this.logger.debug(`Getting list "${key}"`);
    if (!list) {
      this.logger.debug(`LIST ${key} does not exist. Bailing`);
      return RedisToken.string('OK');
    }
    this.logger.debug(`The full list is [%s]`, list.getList());
    // Normalize start and stop indices
    if (startIndex < 0) {
      startIndex = list.getList().length + startIndex;
      if (startIndex < 0) {
        startIndex = 0;
      }
    }
    if (stopIndex < 0) {
      stopIndex = list.getList().length + stopIndex;
    }
    // create a temporary array with slice
    this.logger.debug(`startIndex is ${startIndex}, stopIndex = ${stopIndex + 1}`);
    // slice does not include the end element
    const temparray: any[] = list.getList().slice(startIndex, stopIndex + 1);
    // replace list with the slice
    list.getList().splice(0, list.getList().length, ...temparray);
    if (list.getList().length > 0) {
      this.logger.debug(`Saving potentially modified list ${key}: %s`, list.getList());
      db.put(key, list);
    } else {
      this.logger.debug(`Removing empty list ${key}`);
      db.remove(key);
    }
    return RedisToken.responseOk();
  }
}
