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
 * SISMEMBER key member
 *
 * Returns if member is a member of the set stored at key.
 *
 * **Return value**<br>
 * Integer reply, specifically:<br>
 * 1 if the element is a member of the set.
 * 0 if the element is not a member of the set, or if key does not exist.
 */
@DbDataType(DataType.SET)
@MaxParams(2)
@MinParams(2)
@Name('sismember')
export class SIsMemberCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): Promise<RedisToken> {
    return new Promise((resolve) => {
      this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
      const skey: string = request.getParam(0);
      const initial: DatabaseValue = db.getOrDefault(skey, new DatabaseValue(DataType.SET, new Set()));
      const exists = initial.getSet().has(request.getParam(1)) ? 1 : 0;
      this.logger.debug(`${request.getCommand()}.execute returning ${exists}`);
      resolve(RedisToken.integer(exists));
    });
  }
}
