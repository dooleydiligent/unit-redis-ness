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
 * ### SDIFF key [key ...]
 *
 * Returns the members of the set resulting from the difference between the first set and all
 * the successive sets.
 *
 * ### For example:
 * ```
 * key1 = {a,b,c,d}
 * key2 = {c}
 * key3 = {a,c,e}
 * SDIFF key1 key2 key3 = {b,d}
 * ```
 * Keys that do not exist are considered to be empty sets.
 * ### Return value
 * Array reply: list with members of the resulting set.
 * ### Examples
 * ```
 * redis> SADD key1 "a"
 * (integer) 1
 * redis> SADD key1 "b"
 * (integer) 1
 * redis> SADD key1 "c"
 * (integer) 1
 * redis> SADD key2 "c"
 * (integer) 1
 * redis> SADD key2 "d"
 * (integer) 1
 * redis> SADD key2 "e"
 * (integer) 1
 * redis> SDIFF key1 key2
 * 1) "a"
 * 2) "b"
 * redis>
 * ```
 */
@DbDataType(DataType.SET)
@MaxParams(-1)
@MinParams(1)
@Name('sdiff')
export class SDiffCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const result: RedisToken[] = [];
    const skey: string = request.getParam(0);
    if (db.exists(skey)) {
      const dbKey: DatabaseValue = db.get(skey);
      const diffset: Set<any> = new Set();
      for (let index = 1; index < request.getParams().length; index++) {
        const dbDiff: DatabaseValue = db.get(request.getParam(index));
        if (dbDiff && dbDiff.getType() === DataType.SET) {
          dbDiff.getSet().forEach((element) => {
            if (!diffset.has(element)) {
              diffset.add(element);
            }
          });
        }
      }
      dbKey.getSet().forEach((element) => {
        if (!diffset.has(element)) {
          result.push(RedisToken.string(element));
        }
      });
    }
    return (RedisToken.array(result));
  }
}
