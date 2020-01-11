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
 * LPOP key
 *
 * Removes and returns the first element of the list stored at key.
 *
 * **Return value**<br>
 * Bulk string reply: the value of the first element, or nil when key does not exist.
 */
@DbDataType(DataType.LIST)
@MaxParams(1)
@MinParams(1)
@Name('lpop')
export class LPopCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const key: string = request.getParam(0);
    const list: DatabaseValue = db.get(key);
    this.logger.debug(`Getting list "${key}"`);
    if (!list) {
      this.logger.debug(`LIST ${key} does not exist.  Returning NIL`);
      return RedisToken.NULL_STRING;
    }
    this.logger.debug(`BEFORE shift LIST is "%j`, list.getList());
    const result: any = list.getList().shift();
    db.put(key, list);
    this.logger.debug(`Returning element ${result}`);
    return RedisToken.string(result);
  }
}
