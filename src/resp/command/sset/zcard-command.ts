import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { SortedSet } from '../../data/sorted-set';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * Available since 1.2.0.
 *
 * ZCARD key
 *
 * Returns the sorted set cardinality (number of elements) of the sorted set stored at key.
 *
 * **Return value**<br>
 * Integer reply: the cardinality (number of elements) of the sorted set, or 0 if key does not exist.
 */
@DbDataType(DataType.ZSET)
@MaxParams(1)
@MinParams(1)
@Name('zcard')
export class ZCardCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const zkey: string = request.getParam(0);
    let result: number = 0;
    const dbKey: DatabaseValue = db.getOrDefault(zkey, new DatabaseValue(DataType.ZSET, new SortedSet()));
    result = dbKey.getSortedSet().card();
    return (RedisToken.integer(result));
  }
}
