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
 * SMEMBERS key
 *
 * Returns all the members of the set value stored at key.
 *
 * This has the same effect as running SINTER with one argument key.
 *
 * **Return value**<br>
 * Array reply: all elements of the set.
 */
@DbDataType(DataType.SET)
@MaxParams(1)
@MinParams(1)
@Name('smembers')
export class SMembersCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const skey: string = request.getParam(0);
    const initial: DatabaseValue = db.getOrDefault(skey, new DatabaseValue(DataType.SET, new Set()));
    const values: RedisToken[] = [];
    for (const item of initial.getSet()) {
      values.push(RedisToken.string(item));
    }
    const retval = RedisToken.array(values);
    this.logger.debug(`${request.getCommand()}.execute returning (%s)`, retval);
    return retval;
  }
}
