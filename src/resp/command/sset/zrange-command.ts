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
 * ZRANGE key start stop [WITHSCORES]
 *
 * Returns the specified range of elements in the sorted set stored at key. The elements
 * are considered to be ordered from the lowest to the highest score. Lexicographical order
 * is used for elements with equal score.
 *
 * See ZREVRANGE when you need the elements ordered from highest to lowest score (and
 * descending lexicographical order for elements with equal score).
 *
 * Both start and stop are zero-based indexes, where 0 is the first element, 1 is the next
 * element and so on. They can also be negative numbers indicating offsets from the end of
 * the sorted set, with -1 being the last element of the sorted set, -2 the penultimate element
 * and so on.
 *
 * start and stop are inclusive ranges, so for example ZRANGE myzset 0 1 will return both the
 * first and the second element of the sorted set.
 *
 * Out of range indexes will not produce an error. If start is larger than the largest index in
 * the sorted set, or start > stop, an empty list is returned. If stop is larger than the end of
 * the sorted set Redis will treat it like it is the last element of the sorted set.
 *
 * It is possible to pass the WITHSCORES option in order to return the scores of the elements
 * together with the elements. The returned list will contain value1,score1,...,valueN,scoreN
 * instead of value1,...,valueN. Client libraries are free to return a more appropriate data
 * type (suggestion: an array with (value, score) arrays/tuples).
 *
 * **Return value**<br>
 * Array reply: list of elements in the specified range (optionally with their scores, in case
 * the WITHSCORES option is given).
 *
 */
@DbDataType(DataType.ZSET)
@MaxParams(4)
@MinParams(3)
@Name('zrange')
export class ZRangeCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const zkey: string = request.getParam(0);
    const zstart: string = request.getParam(1);
    const zend: string = request.getParam(2);
    const withScores: string = request.getParams().length === 4 ? request.getParam(3) : '';
    if (withScores && withScores.toLowerCase() !== 'withscores') {
      return RedisToken.error('syntax error');
    }

    if (isNaN(Number(zstart)) || isNaN(Number(zend))) {
      return RedisToken.error('value is not an integer or out of range');
    }
    const options = { withScores: withScores ? true : false };

    const dbKey: DatabaseValue = db.getOrDefault(zkey, new DatabaseValue(DataType.ZSET, new SortedSet()));
    const range: any[] = dbKey.getSortedSet().rangeByScore(Number(zstart), Number(zend), options);
    const values: RedisToken[] = [];
    for (const item of range) {
      this.logger.debug(`Item is ${item.constructor.name} %s`, item);
      if (item.constructor.name === 'Array') {
        this.logger.debug(`pushing ${item[0]}, ${item[1]}}`);
        values.push(
          RedisToken.array([
            RedisToken.string(item[0]),
            RedisToken.string(item[1])
          ]));
      } else {
        values.push(RedisToken.string(item));
      }
    }
    const finalValues = RedisToken.array(values);
    this.logger.debug(`Returning array %s`, finalValues);
    return finalValues;
  }
}
