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
 * ### RPOP key
 *
 * Removes and returns the last element of the list stored at key.
 * ### Return value
 * Bulk string reply: the value of the last element, or nil when key does not exist.
 * ### Examples
 * ```
 * redis> RPUSH mylist "one"
 * (integer) 1
 * redis> RPUSH mylist "two"
 * (integer) 2
 * redis> RPUSH mylist "three"
 * (integer) 3
 * redis> RPOP mylist
 * "three"
 * redis> LRANGE mylist 0 -1
 * 1) "one"
 * 2) "two"
 * redis>
 * ```
 */
@DbDataType(DataType.LIST)
@MaxParams(1)
@MinParams(1)
@Name('rpop')
export class RPopCommand extends IRespCommand {
  protected logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken | Promise<RedisToken> {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    return (this.process(request, db, request.getParam(0)));
  }
  protected process(request: IRequest, db: Database, key: string): RedisToken {
    const list: DatabaseValue = db.get(key);
    this.logger.debug(`Getting list "${key}"`);
    if (!list) {
      this.logger.debug(`LIST ${key} does not exist.  Returning NIL`);
      return RedisToken.nullString();
    } else {
      const result: any = list.getList().pop();
      if (list.getList().length > 0) {
        db.put(key, list);
        request.getServerContext().emit(`__keyevent@${request.getSession().getCurrentDb()}__:rpop ${key}`);
      } else {
        db.remove(key);
        request.getServerContext().emit(`__keyevent@${request.getSession().getCurrentDb()}__:rpop ${key}`);
        request.getServerContext().emit(`__keyevent@${request.getSession().getCurrentDb()}__:del ${key}`);
      }
      this.logger.debug(`Returning element ${result}`);
      return RedisToken.string(result);
    }
  }
}
