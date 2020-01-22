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
 * ### Available since 1.0.5.
 * ### ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]
 * Returns all the elements in the sorted set at key with a score between min and max
 * (including elements with score equal to min or max). The elements are considered to be
 * ordered from low to high scores.
 *
 * The elements having the same score are returned in lexicographical order (this follows
 * from a property of the sorted set implementation in Redis and does not involve further
 * computation).
 *
 * The optional LIMIT argument can be used to only get a range of the matching elements
 * (similar to SELECT LIMIT offset, count in SQL). A negative count returns all elements from
 * the offset. Keep in mind that if offset is large, the sorted set needs to be traversed for
 * offset elements before getting to the elements to return, which can add up to O(N) time
 * complexity.
 *
 * The optional WITHSCORES argument makes the command return both the element and its score,
 * instead of the element alone. This option is available since Redis 2.0.
 * ### Exclusive intervals and infinity
 *
 * min and max can be -inf and +inf, so that you are not required to know the highest or
 * lowest score in the sorted set to get all elements from or up to a certain score.
 *
 * By default, the interval specified by min and max is closed (inclusive). It is possible
 * to specify an open interval (exclusive) by prefixing the score with the character **(**.
 * For example:
 * ```
 * ZRANGEBYSCORE zset (1 5
 * ```
 * Will return all elements with 1 < score <= 5 while:
 * ```
 * ZRANGEBYSCORE zset (5 (10
 * ```
 * Will return all the elements with 5 < score < 10 (5 and 10 excluded).
 * ### Return value
 * Array reply: list of elements in the specified score range (optionally with their scores).
 * ### Examples
 * ```
 * redis> ZADD myzset 1 "one"
 * (integer) 1
 * redis> ZADD myzset 2 "two"
 * (integer) 1
 * redis> ZADD myzset 3 "three"
 * (integer) 1
 * redis> ZRANGEBYSCORE myzset -inf +inf
 * 1) "one"
 * 2) "two"
 * 3) "three"
 * redis> ZRANGEBYSCORE myzset 1 2
 * 1) "one"
 * 2) "two"
 * redis> ZRANGEBYSCORE myzset (1 2
 * 1) "two"
 * redis> ZRANGEBYSCORE myzset (1 (2
 * (empty list or set)
 * redis>
 * ```
 */
@DbDataType(DataType.ZSET)
@MaxParams(7)
@MinParams(3)
@Name('zrangebyscore')
export class ZRangeByScoreCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const zkey: string = request.getParam(0);
    this.logger.debug(`Zkey is ${zkey}`);
    let min: any = String(request.getParam(1)).toLowerCase();
    this.logger.debug(`min is ${min}`);
    let max: any = String(request.getParam(2)).toLowerCase();
    this.logger.debug(`max is ${max}`);
    let withScores: boolean = false;
    let minExclusive: boolean = false;
    let maxExclusive: boolean = false;
    if (min.startsWith('(')) {
      minExclusive = true;
      min = min.substring(1);
      this.logger.debug(`Setting minExclusive.`);
    }
    if (max.startsWith('(')) {
      maxExclusive = true;
      max = max.substring(1);
      this.logger.debug(`Setting maxExclusive.`);
    }
    if (min === '-inf') {
      min = -Infinity;
    } else {
      if (min === '+inf' || min === 'inf') {
        min = +Infinity;
      } else {
        min = Number(min);
      }
    }
    this.logger.debug(`min is now ${min}`);
    if (isNaN(min)) {
      return RedisToken.error(`ERR min or max is not a float`);
    }
    if (max === '-inf') {
      max = -Infinity;
    } else {
      if (max === '+inf' || max === 'inf') {
        max = +Infinity;
      } else {
        max = Number(max);
      }
    }
    this.logger.debug(`max is now ${max}`);
    if (isNaN(max)) {
      return RedisToken.error(`ERR min or max is not a float`);
    }
    let offset: number = 0;
    let count: any = '';
    if (request.getParams().length >= 4) {
      if (request.getParam(3).toLowerCase() === 'withscores') {
        this.logger.debug(`Set WITHSCORES`);
        withScores = true;
      }
      if (!withScores || request.getParams().length >= 5) {
        if (request.getParam(withScores ? 4 : 3).toLowerCase() !== 'limit') {
          this.logger.debug(`Param ${withScores ? 4 : 3} is ${request.getParam(withScores ? 4 : 3)}`);
          return RedisToken.error(`ERR syntax error`);
        }
        if (request.getParams().length - (withScores ? 4 : 3) > 0) {
          if (request.getParams().length - (withScores ? 4 : 3) !== 3) {
            this.logger.debug(`Param count is ${request.getParams().length}`);
            return RedisToken.error(`ERR syntax error`);
          }
          offset = Number(request.getParam(request.getParams().length - 2));
          count = Number(request.getParam(request.getParams().length - 1));
          if (isNaN(offset) || isNaN(count)) {
            this.logger.debug(`offset is ${offset}, count is ${count}`);
            return RedisToken.error(`ERR value is not an integer or out of range`);
          }
        }
      }
    }

    const dbKey: DatabaseValue = db.getOrDefault(zkey, new DatabaseValue(DataType.ZSET, new SortedSet()));
    if (count === '') {
      count = dbKey.getSortedSet().length;
    }
    const scores: any[] = [];
    const options: any = {
      maxExclusive,
      minExclusive,
      withScores
    };
    const set: any[] = dbKey.getSortedSet().rangeByScore(Number(min), Number(max), options);
    for (let index = offset; index < (count < 0 ? set.length : offset + count); index++) {
      if (index >= set.length) {
        break;
      }
      if (set[index].constructor.name === 'Array') {
        this.logger.debug(`pushing ${set[index][0]}, ${set[index][1]}}`);
        scores.push(
          RedisToken.string(set[index][0]),
          RedisToken.string(set[index][1])
        );
      } else {
        scores.push(RedisToken.string(set[index]));
      }
    }
    const finalValues = RedisToken.array(scores);
    this.logger.debug(`Returning array %s`, finalValues);
    return (finalValues);
  }
}
