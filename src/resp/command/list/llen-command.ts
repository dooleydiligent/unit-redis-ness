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
 * ### LLEN key
 *
 * Returns the length of the list stored at key. If key does not exist, it is interpreted
 * as an empty list and 0 is returned. An error is returned when the value stored at key is
 * not a list.
 *
 * ### Return value
 * Integer reply: the length of the list at key.
 */
@DbDataType(DataType.LIST)
@MaxParams(1)
@MinParams(1)
@Name('llen')
export class LLenCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): Promise<RedisToken> {
    return new Promise((resolve) => {
      this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
      const key: string = request.getParam(0);
      const list: DatabaseValue = db.get(key);
      this.logger.debug(`Getting list "${key}"`);
      if (!list) {
        this.logger.debug(`LIST ${key} does not exist.  Returning 0`);
        resolve(RedisToken.integer(0));
      } else {
        this.logger.debug(`Returning list size ${list.getList().length}`);
        resolve(RedisToken.integer(list.getList().length));
      }
    });
  }
}
