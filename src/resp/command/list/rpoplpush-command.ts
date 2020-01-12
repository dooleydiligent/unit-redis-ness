import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * ### Available since 1.2.0.
 * ### RPOPLPUSH source destination
 *
 * Atomically returns and removes the last element (tail) of the list stored at source, and
 * pushes the element at the first element (head) of the list stored at destination.
 *
 * For example: consider source holding the list a,b,c, and destination holding the list x,y,z.
 * Executing RPOPLPUSH results in source holding a,b and destination holding c,x,y,z.
 *
 * If source does not exist, the value nil is returned and no operation is performed. If source
 * and destination are the same, the operation is equivalent to removing the last element from
 * the list and pushing it as first element of the list, so it can be considered as a list
 * rotation command.
 *
 * ### Return value
 * Bulk string reply: the element being popped and pushed.
 *
 * ### Examples
 * ```
 * redis> RPUSH mylist "one"
 * (integer) 1
 * redis> RPUSH mylist "two"
 * (integer) 2
 * redis> RPUSH mylist "three"
 * (integer) 3
 * redis> RPOPLPUSH mylist myotherlist
 * "three"
 * redis> LRANGE mylist 0 -1
 * 1) "one"
 * 2) "two"
 * redis> LRANGE myotherlist 0 -1
 * 1) "three"
 * redis>
 * ```
 */
@DbDataType(DataType.LIST)
@MaxParams(2)
@MinParams(2)
@Name('rpoplpush')
export class RPoplPushCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const src: string = request.getParam(0);
    const dst: string = request.getParam(1);
    const dbSrcList: DatabaseValue = db.get(src);
    if (!dbSrcList) {
      return RedisToken.NULL_STRING;
    } else {
      const dbDstList: DatabaseValue = db.getOrDefault(dst, new DatabaseValue(DataType.LIST, []));
      const member: any = dbSrcList.getList().pop();
      dbDstList.getList().unshift(member);
      db.put(dst, dbDstList);
      if (dst !== src) {
        db.put(src, dbSrcList);
      }
      return RedisToken.string(member);
    }
  }
}
