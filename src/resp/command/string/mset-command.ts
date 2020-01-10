import { MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
<<<<<<< HEAD
import { Database } from '../../data/database';
import { DataType } from '../../data/data-type';
=======
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
>>>>>>> dev
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * Available since 1.0.1.
 *
 * MSET key value [key value ...]
 *
<<<<<<< HEAD
 * Sets the given keys to their respective values. MSET replaces existing values with new values, just as regular SET. See MSETNX if you don't want to overwrite existing values.
 *
 * MSET is atomic, so all given keys are set at once. It is not possible for clients to see that some of the keys were updated while others are unchanged.
=======
 * Sets the given keys to their respective values. MSET replaces existing values with new
 * values, just as regular SET. See MSETNX if you don't want to overwrite existing values.
 *
 * MSET is atomic, so all given keys are set at once. It is not possible for clients to see
 * that some of the keys were updated while others are unchanged.
>>>>>>> dev
 *
 * **Return value**<br>
 * Simple string reply: always OK since MSET can't fail.
 */
@MaxParams(-1)
@MinParams(2)
@Name('mset')
export class MsetCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    // params() must be an even number
    if (request.getParams().length % 2 !== 0) {
      return RedisToken.error('ERR wrong number of arguments for \'mset\' command');
    }
<<<<<<< HEAD
    for (let index = 0; index<request.getParams().length; index+=2) {
      const key: string = request.getParam(index);
      const value: string = request.getParam(index+1);
=======
    for (let index = 0; index < request.getParams().length; index += 2) {
      const key: string = request.getParam(index);
      const value: string = request.getParam(index + 1);
>>>>>>> dev
      this.logger.debug(`Setting key ${key} to "${value}"`);
      db.put(key, new DatabaseValue(DataType.STRING, value));
    }
    return RedisToken.string('OK');
  }
}
