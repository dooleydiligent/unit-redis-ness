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
 * Available since 2.0.0.
 *
 * ZCOUNT key min max
 *
 * Returns the number of elements in the sorted set at key with a score between min and max.
 *
 * The min and max arguments have the same semantic as described for ZRANGEBYSCORE.
 *
 * If the key does not exist then ZERO is returned.
 *
 * Note: the command has a complexity of just O(log(N)) because it uses elements ranks (see ZRANK)
 * to get an idea of the range. Because of this there is no need to do a work proportional to the
 * size of the range. **This may not be true for the unit-redis-ness implementation**
 *
 * **Return value**<br>
 * Integer reply: the number of elements in the specified score range.
 */
@DbDataType(DataType.ZSET)
@maxParams(3)
@minParams(3)
@name("zcount")
export class ZCountCommand extends IRespCommand {
  private DEFAULT_ERROR = "ERR min or max is not a float";

  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          request.getParams()
      );
      const skey: string = request.getParam(0),
          sMin: string = request.getParam(1),
          sMax: string = request.getParam(2);
      if (isNaN(Number(sMin)) || isNaN(Number(sMax))) {
          return RedisToken.error(this.DEFAULT_ERROR);
      }

      let result: number = 0;
      const dbKey: DatabaseValue = db.getOrDefault(
          skey,
          new DatabaseValue(
              DataType.ZSET,
              new SortedSet()
          )
      );
      result = dbKey.getSortedSet().count(
          Number(sMin),
          Number(sMax)
      );
      return RedisToken.integer(result);
  }
}
