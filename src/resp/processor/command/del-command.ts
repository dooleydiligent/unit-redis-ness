import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from './resp-command';
/**
 * Available since v1.0.0
 *
 * DEL key [key...]
 * Removes the specified keys. A key is ignored if it does not exist.
 *
 * RETURNS:
 * Integer reply: The number of keys that were removed.
 */
@DbDataType(DataType.STRING)
@MaxParams(-1)
@MinParams(1)
@Name('del')
export class DelCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`execute(request, db)`, request.getParams());
    let counter = 0;
    for (const key of request.getParams()) {
      if (db.remove(key)) {
        ++counter;
      }
    }
    return RedisToken.integer(counter);
  }
}
