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
 * ### LPUSH key element [element ...]
 * Insert all the specified values at the head of the list stored at key. If key does not
 * exist, it is created as empty list before performing the push operations. When key holds
 * a value that is not a list, an error is returned.
 *
 * It is possible to push multiple elements using a single command call just specifying
 * multiple arguments at the end of the command. Elements are inserted one after the other
 * to the head of the list, from the leftmost element to the rightmost element. So for instance
 * the command LPUSH mylist a b c will result into a list containing c as first element, b as
 * second element and a as third element.
 *
 * ### Return value
 * Integer reply: the length of the list after the push operations.
 */
@DbDataType(DataType.LIST)
@MaxParams(-1)
@MinParams(2)
@Name('lpush')
export class LPushCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): Promise<RedisToken> {
    return new Promise((resolve) => {
      this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
      const key: string = request.getParam(0);
      let list: DatabaseValue = db.get(key);
      this.logger.debug(`Getting list "${key}"`);
      if (!list) {
        this.logger.debug(`Creating new list: "${key}"`);
        list = new DatabaseValue(DataType.LIST, []);
      }
      for (let index = 1; index < request.getParams().length; index++) {
        const element = request.getParam(index);
        this.logger.debug(`PUSHING element "${element}" to list "${key}"`);
        list.getList().unshift(element);
      }
      const size: number = list.getList().length;
      // To remain consistent with redis 2.6+, we raise events only after all pushes have completed
      db.put(key, list);
      for (let index = 1; index < request.getParams().length; index++) {
        request.getServerContext().emit(`__keyevent@${request.getSession().getCurrentDb()}__:rpush ${key}`);
      }
      this.logger.debug(`Returning list ${key} size ${size}`);
      resolve(RedisToken.integer(size));
    });
  }
}
