import { MaxParams, MinParams, Name } from '../../../decorators';
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
 * TYPE key
 *
 * Returns the string representation of the type of the value stored at key. The different
 * types that can be returned are: string, list, set, zset, hash and stream.
 *
 * **Return value**<br>
 * Simple string reply: type of key, or none when key does not exist.
 */

@MaxParams(1)
@MinParams(1)
@Name('type')
export class TypeCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const key: string = request.getParam(0);
    const dbField: DatabaseValue = db.get(key);
    if (dbField) {
      return (RedisToken.string(dbField.getType()));
    } else {
      return (RedisToken.string(DataType.NONE));
    }
  }
}
