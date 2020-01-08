import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { SortedSet } from '../../data/sorted-set';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * Available since 1.2.0.
 *
 * ZINCRBY key increment member
 *
 * Increments the score of member in the sorted set stored at key by increment. If member
 * does not exist in the sorted set, it is added with increment as its score (as if its
 * previous score was 0.0). If key does not exist, a new sorted set with the specified
 * member as its sole member is created.
 *
 * An error is returned when key exists but does not hold a sorted set.
 *
 * The score value should be the string representation of a numeric value, and accepts double
 * precision floating point numbers. It is possible to provide a negative value to decrement
 * the score.
 *
 * **There is no compliment ZDECRBY.  Us a negative increment for that**
 *
 * **Return value**<br>
 * Bulk string reply: the new score of member (a double precision floating point number),
 * represented as string.
 *
 */
@DbDataType(DataType.ZSET)
@MaxParams(3)
@MinParams(3)
@Name('zincrby')
export class ZIncrByCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const zkey: string = request.getParam(0);
    const zmember: string = request.getParam(1);
    const zIncr: string = request.getParam(2);
    if (isNaN(Number(zIncr))) {
      return RedisToken.error('value is not a valid float');
    }
    let score: number = 0;
    const dbKey: DatabaseValue = db.getOrDefault(zkey, new DatabaseValue(DataType.ZSET, new SortedSet()));
    score = dbKey.getSortedSet().get(zmember);
    if (score) {
      score += Number(zIncr);
    } else {
      score = Number(zIncr);
    }
    return RedisToken.string(String(score));
  }
}
