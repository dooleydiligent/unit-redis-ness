import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * Available since 1.0.0.
 *
 * GETSET key value
 *
 * Atomically sets key to value and returns the old value stored at key. Returns an error when
 * key exists but does not hold a string value.
 *
 * **Design pattern**<br>
 * GETSET can be used together with INCR for counting with atomic reset. For example: a process
 * may call INCR against the key mycounter every time some event occurs, but from time to time we
 * need to get the value of the counter and reset it to zero atomically. This can be done using
 * GETSET mycounter "0":
 *
 * redis> INCR mycounter
 * (integer) 1
 * redis> GETSET mycounter "0"
 * "1"
 * redis> GET mycounter
 * "0"
 * redis>
 *
 * **Return value**<br>
 * Bulk string reply: the old value stored at key, or nil when key did not exist.
 */
@DbDataType(DataType.STRING)
@MaxParams(2)
@MinParams(2)
@Name('getset')
export class GetSetCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const key: string = request.getParam(0);
    let result: RedisToken;
    const dbValue: DatabaseValue = db.get(key);
    if (!dbValue) {
      result = RedisToken.NULL_STRING;
    } else {
      result = RedisToken.string(dbValue.getString());
    }
    const newValue: string = request.getParam(1);
    db.put(key, new DatabaseValue(DataType.STRING, newValue));
    return result;
  }
}
