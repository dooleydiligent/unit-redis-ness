import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from './../resp-command';
/**
 * Available since 1.0.0.
 *
 * SADD key member [member ...]
 *
 * Add the specified members to the set stored at key. Specified members that are already
 * a member of this set are ignored. If key does not exist, a new set is created before
 * adding the specified members.
 *
 * An error is returned when the value stored at key is not a set.
 *
 * **Return value**<br>
 * Integer reply: the number of elements that were added to the set, not including all the
 * elements already present into the set.
 *
 * **History**<br>
 * >= 2.4: Accepts multiple member arguments. Redis versions before 2.4 are only able to add a
 * single member per call. **unit-redis-ness implements the 2.4 version of this command.**
 */
@DbDataType(DataType.SET)
@MaxParams(-1)
@MinParams(2)
@Name('sadd')
export class SAddCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): Promise<RedisToken> {
    return new Promise((resolve) => {
      this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
      const skey: string = request.getParam(0);
      const initial: DatabaseValue = db.getOrDefault(skey, new DatabaseValue(DataType.SET, new Set()));
      const originalSet: Set<any> = initial.getSet();
      const initialCount: number = originalSet.size;
      this.logger.debug(`Initial key length of ${skey} is ${initialCount}`);
      for (let index = 1; index < request.getParams().length; index++) {
        const newValue = request.getParam(index);
        if (!originalSet.has(newValue)) {
          originalSet.add(newValue);
        }
      }
      this.logger.debug(`Final key length of ${skey} is ${originalSet.size}`);
      db.put(skey, DatabaseValue.set(originalSet));
      resolve(RedisToken.integer(originalSet.size - initialCount));
    });
  }
}
