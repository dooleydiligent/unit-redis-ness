import { DbDataType, MaxParams, MinParams, Name } from '../../../../decorators';
import { Logger } from '../../../../logger';
import { IRequest } from '../../../../server/request';
import { DataType } from '../../../data/data-type';
import { Database } from '../../../data/database';
import { DatabaseValue } from '../../../data/database-value';
import { RedisToken } from '../../../protocol/redis-token';
import { IRespCommand } from '../resp-command';

/**
 * Available since v2.0.0
 *
 * HSET key field value [field value ...]
 *
 * Sets field in the hash stored at key to value. If key does not exist,
 * a new key holding a hash is created. If field already exists in the hash,
 * it is overwritten.
 *
 * As of Redis 4.0.0, HSET is variadic and allows for multiple field/value pairs.
 *
 * Return value
 * Integer reply: The number of fields that were added.
 */
@DbDataType(DataType.HASH)
@MaxParams(-1)
@MinParams(3)
@Name('hset')
export class HsetCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`execute(request, db)`, request.getParams());
    // params() must be an odd number
    if (request.getParams().length % 2 !== 1 ) {
      return RedisToken.error('ERR wrong number of arguments for \'hset\' command');
    }
    // Get the original HASH
    this.logger.debug(`Getting database key ${request.getParam(0)}`);
    let item: DatabaseValue = db.get(request.getParam(0));
    this.logger.debug(`ITEM is ${item}`, item);
    let fieldsAdded: number = 0;
    if (!item) {
      item = new DatabaseValue(DataType.HASH, {});
      this.logger.debug(`Instantiated new EMPTY_HASH`, item);
    }
    const hash = item.getHash();
    this.logger.debug(`Hash is `, item);
    this.logger.debug(`Processing ${request.getParams().length} params`);
    this.logger.debug(`hash has ${Object.keys(hash).length} key(s)`, Object.keys(hash));
    for (let index = 1; index < request.getParams().length; index += 2) {
      const field = request.getParam(index);
      const value = request.getParam(index + 1);
      this.logger.debug(`Got field ${field} with value ${value}`);
      if (!hash[field]) {
        this.logger.debug(`Adding field ${field}`);
        ++fieldsAdded;
      } else {
        this.logger.debug(`Replacing field ${field} - was ${hash[field]}`);
      }
      hash[field] = value;
    }
    this.logger.debug(`NOW hash has ${Object.keys(hash).length} key(s)`, Object.keys(hash));
    // If the has already had an expiredAt value it might have been replaced here
    // TODO: Create a special key (applicable to all DatabaseValue types) to
    // segregate admin values from public scrutiny.  Until then ...
    db.put(request.getParam(0), new DatabaseValue(DataType.HASH, hash));
    return RedisToken.integer(fieldsAdded);
  }
}
