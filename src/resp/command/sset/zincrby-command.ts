import {DbDataType, MaxParams, MinParams, Name} from "../../../decorators";
import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {DataType} from "../../data/data-type";
import {Database} from "../../data/database";
import {DatabaseValue} from "../../data/database-value";
import {SortedSet} from "../../data/sorted-set";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

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
@maxParams(3)
@minParams(3)
@name("zincrby")
export class ZIncrByCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          request.getParams()
      );
      const zkey: string = request.getParam(0),
          zIncr: string = request.getParam(1),
          zmember: string = request.getParam(2);
      if (isNaN(Number(zIncr))) {
          return RedisToken.error("ERR value is not a valid float");
      }

      let score: number = 0;
      const dbKey: DatabaseValue = db.getOrDefault(
          zkey,
          new DatabaseValue(
              DataType.ZSET,
              new SortedSet()
          )
      );
      if (!dbKey.getSortedSet().has(zmember)) {
          this.logger.debug(`Creating new ZSET ${zkey} member ${zmember}`);
          dbKey.getSortedSet().add(
              zmember,
              0
          );
      }
      this.logger.debug(`Incrementing existing ZSET ${zkey} member ${zmember}`);
      dbKey.getSortedSet().incrBy(
          Number(zIncr),
          zmember
      );

      score = dbKey.getSortedSet().score(zmember);
      this.logger.debug(
          `Saving ZSET ${zkey} as %s`,
          dbKey.getSortedSet().toArray({"withScores": true})
      );
      db.put(
          zkey,
          dbKey
      );
      return RedisToken.string(String(score));
  }
}
