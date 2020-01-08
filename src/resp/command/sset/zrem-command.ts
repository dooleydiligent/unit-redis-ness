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
 * ZREM key member [member ...]
 *
 * Removes the specified members from the sorted set stored at key. Non existing members are ignored.
 *
 * An error is returned when key exists and does not hold a sorted set.
 *
 * **Return value**<br>
 * Integer reply, specifically:
 *
 * The number of members removed from the sorted set, not including non existing members.
 *
 */
@DbDataType(DataType.ZSET)
@MaxParams(-1)
@MinParams(2)
@Name('zrem')
export class ZRemCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const zkey: string = request.getParam(0);
    let result: number = 0;
    const dbKey: DatabaseValue = db.getOrDefault(zkey, new DatabaseValue(DataType.ZSET, new SortedSet()));
    for (let index = 1; index < request.getParams().length; index++) {
      if (dbKey.getSortedSet().has(request.getParam(index))) {
        ++result;
        dbKey.getSortedSet().del(request.getParam(index));
      }
    }
    if (result > 0) {
      db.put(zkey, dbKey);
    }
    return RedisToken.integer(result);
  }
}
