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
 * ### Pattern: Reliable queue
 * Redis is often used as a messaging server to implement processing of background jobs or other
 * kinds of messaging tasks. A simple form of queue is often obtained pushing values into a list
 * in the producer side, and waiting for this values in the consumer side using RPOP (using
 * polling), or BRPOP if the client is better served by a blocking operation.
 *
 * However in this context the obtained queue is not reliable as messages can be lost, for example
 * in the case there is a network problem or if the consumer crashes just after the message is
 * received but it is still to process.
 *
 * RPOPLPUSH (or [BRPOPLPUSH]{@link BRPoplPush} for the blocking variant) offers a way to avoid
 * this problem: the consumer fetches the message and at the same time pushes it into a processing
 * list. It will use the LREM command in order to remove the message from the processing list once
 * the message has been processed.
 *
 * An additional client may monitor the processing list for items that remain there for too much
 * time, and will push those timed out items into the queue again if needed.
 * ### Pattern: Circular list
 * Using RPOPLPUSH with the same source and destination key, a client can visit all the elements
 * of an N-elements list, one after the other, in O(N) without transferring the full list from
 * the server to the client using a single LRANGE operation.
 *
 * The above pattern works even if the following two conditions:
 * - There are multiple clients rotating the list: they'll fetch different elements, until all
 * the elements of the list are visited, and the process restarts.
 * - Even if other clients are actively pushing new items at the end of the list.
 *
 * The above makes it very simple to implement a system where a set of items must be processed
 * by N workers continuously as fast as possible. An example is a monitoring system that must
 * check that a set of web sites are reachable, with the smallest delay possible, using a number
 * of parallel workers.
 *
 * Note that this implementation of workers is trivially scalable and reliable, because even if
 * a message is lost the item is still in the queue and will be processed at the next iteration.
 */
@DbDataType(DataType.LIST)
@MaxParams(2)
@MinParams(2)
@Name('rpoplpush')
export class RPoplPushCommand extends IRespCommand {
  protected logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken | Promise<RedisToken>  {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    return (this.process(request, db));
  }
  protected process(request: IRequest, db: Database): RedisToken {
    const src: string = request.getParam(0);
    const dst: string = request.getParam(1);
    this.logger.debug(`process(src: ${src}, dst: ${dst})`);
    const dbSrcList: DatabaseValue = db.get(src);
    if (!dbSrcList) {
      this.logger.debug(`src list is empty`);
      return (RedisToken.nullString());
    } else {
      const dbDstList: DatabaseValue = db.getOrDefault(dst, new DatabaseValue(DataType.LIST, []));
      this.logger.debug(`src list is %s`, dbDstList.getList());
      const member: any = dbSrcList.getList().pop();
      this.logger.debug(`Member is ${member}`);
      dbDstList.getList().unshift(member);
      db.put(dst, dbDstList);
      // Fire events on dst?
      if (dst !== src) {
        if (dbSrcList.getList().length > 0) {
          db.put(src, dbSrcList);
          // fire events on src?
        } else {
          db.remove(src);
        }
      }
      return (RedisToken.string(member));
    }
  }
}
