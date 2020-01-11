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
 * LSET key index element
 *
 * Sets the list element at index to element. For more information on the index argument,
 * see {@link LinkCommand} [**LINDEX**].
 *
 * **unit-redisness-test** follows the observed behavior of Redis - if the key does not exist
 * then we return 'ERR no such key'
 *
 * An error is returned for out of range indexes.
 *
 * **Return value**<br>
 * Simple string reply
 */
@DbDataType(DataType.LIST)
@MaxParams(3)
@MinParams(3)
@Name('lindex')
export class LSetCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const key: string = request.getParam(0);
    const list: DatabaseValue = db.get(key);
    this.logger.debug(`Getting list "${key}"`);
    if (!list) {
      this.logger.debug(`LIST ${key} does not exist.`);
      return RedisToken.error('ERR no such key');
    }
    this.logger.debug(`BEFORE shift LIST is "%j`, list.getList());
    const result: any = list.getList().shift();
    db.put(key, list);
    this.logger.debug(`Returning element ${result}`);
    return RedisToken.string(result);
  }
}
