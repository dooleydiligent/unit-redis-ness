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
 * ### Available since 1.2.0.
 *
 * ### ZRANGE key start stop [WITHSCORES]
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
 * ### Return value
 * Array reply: list of elements in the specified range (optionally with their scores, in case
 * the WITHSCORES option is given).
 *
 * ### Examples
 * ```
 * redis> ZADD myzset 1 "one"
 * (integer) 1
 * redis> ZADD myzset 2 "two"
 * (integer) 1
 * redis> ZADD myzset 3 "three"
 * (integer) 1
 * redis> ZRANGE myzset 0 -1
 * 1) "one"
 * 2) "two"
 * 3) "three"
 * redis> ZRANGE myzset 2 3
 * 1) "three"
 * redis> ZRANGE myzset -2 -1
 * 1) "two"
 * 2) "three"
 * ```
 *
 * The following example using WITHSCORES shows how the command returns always an array, but
 * this time, populated with element_1, score_1, element_2, score_2, ..., element_N, score_N.
 * ```
 * redis> ZRANGE myzset 0 1 WITHSCORES
 * 1) "one"
 * 2) "1"
 * 3) "two"
 * 4) "2"
 * ```
 */
@DbDataType(DataType.ZSET)
@MaxParams(4)
@MinParams(3)
@Name('zrange')
export class ZRangeCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const withScores: string = request.getParams().length === 4 ? request.getParam(3) : '';
    if (withScores && withScores.toLowerCase() !== 'withscores') {
      this.logger.debug(`Invalid fourth parameter ${request.getParam(3)}`);
      return RedisToken.error('ERR syntax error');
    }
    const zstart: string = request.getParam(1);
    this.logger.debug(`Requested start index: ${zstart}`);
    const zend: string = request.getParam(2);
    this.logger.debug(`Requested end index: ${zend}`);

    if (isNaN(Number(zstart)) || isNaN(Number(zend))) {
      this.logger.debug(`Invalid start or stop index: ${zstart} / ${zend}`);
      return RedisToken.error('ERR value is not an integer or out of range');
    }
    const zkey: string = request.getParam(0);
    this.logger.debug(`ZKey is ${zkey}`);
    const options = { withScores: withScores ? true : false };
    this.logger.debug(`WithScores is {%j}`, options);
    const dbKey: DatabaseValue = db.getOrDefault(zkey, new DatabaseValue(DataType.ZSET, new SortedSet()));
    let start: number = Number(zstart);
    if (start < 0) {
      start = dbKey.getSortedSet().length + start;
      if (start < 0) {
        start = 0;
      }
    }
    let end: number = Number(zend);
    if (end < 0) {
      end = dbKey.getSortedSet().length + 1 + end;
      if (end < 0) {
        end = 0;
      }
    }
    if (start > end || start > dbKey.getSortedSet().length) {
      return RedisToken.array([]);
    }
    // SortedSet().rangeByScore uses inclusive ranges so we increment to account for that
    this.logger.debug(`Getting possibly modified range ${start} - ${end} from %s`,
      dbKey.getSortedSet().toArray({ withScores: true }));
    const range: any[] = dbKey.getSortedSet().range(start, end, options);
    const values: RedisToken[] = [];
    for (const item of range) {
      this.logger.debug(`Item is ${item.constructor.name} %s`, item);
      if (item.constructor.name === 'Array') {
        this.logger.debug(`pushing ${item[0]}, ${item[1]}}`);
        values.push(
          RedisToken.string(item[0]),
          RedisToken.string(item[1])
        );
      } else {
        values.push(RedisToken.string(item));
      }
    }
    const finalValues = RedisToken.array(values);
    this.logger.debug(`Returning array %s`, finalValues);
    return finalValues;
  }
}
