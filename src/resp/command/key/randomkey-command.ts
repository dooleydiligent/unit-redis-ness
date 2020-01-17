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
 * ### RANDOMKEY
 *
 * Return a random key from the currently selected database.
 *
 * ### Return value
 * Bulk string reply: the random key, or nil when the database is empty.
 */
@MaxParams(0)
@MinParams(0)
@Name('randomkey')
export class RandomKeyCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    this.logger.debug(`There are ${db.keys().length} keys in the database`);
    const randomNumber: number = Math.floor(Math.random() * (db.keys().length));
    this.logger.debug(`Selected random number ${randomNumber}: ${db.keys()[randomNumber]}`);
    return (RedisToken.string(db.keys()[randomNumber]));
  }
}
