import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';

/**
 * Available since v2.0.0
 *
 * HGET key field
 *
 * Returns the value associated with field in the hash stored at key.
 *
 * Return value
 * Bulk string reply: the value associated with field, or nil when field is not
 * present in the hash or key does not exist.
 */
@DbDataType(DataType.HASH)
@MaxParams(2)
@MinParams(2)
@Name('hget')
export class HgetCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    // Get the original HASH
    const item: DatabaseValue = db.get(request.getParam(0));
    if (!item) {
      return RedisToken.NULL_STRING;
    }
    const hash = item.getHash();
    if (!hash[request.getParam(1)]) {
      return RedisToken.NULL_STRING;
    }
    return RedisToken.string(hash[request.getParam(1)]);
  }
}
