import * as util from "util";
import {dbDataType, maxParams, minParams, name} from "../../../decorators";
import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {DataType} from "../../data/data-type";
import {Database} from "../../data/database";
import {DatabaseValue} from "../../data/database-value";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";
interface IParameters {
  ifExists: boolean;
  ifNotExists: boolean;
  ttl: number | null;
}

/**
 * ### Available since 1.0.0.
 * ### SETNX key value
 *
 * Set key to hold string value if key does not exist. In that case, it is equal to SET. When
 * key already holds a value, no operation is performed. SETNX is short for "SET if Not eXists".
 *
 * ### Return value
 * Integer reply, specifically:
 * - 1 if the key was set
 * - 0 if the key was not set
 * ### Examples
 * ```
 * redis> SETNX mykey "Hello"
 * (integer) 1
 * redis> SETNX mykey "World"
 * (integer) 0
 * redis> GET mykey
 * "Hello"
 * redis>
 * ```
 */
export class SetNxCommand extends IRespCommand {
  dbDataType = DataType.STRING

  maxParams = 2

  minParams = 2

  name = "setnx"

  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          ...request.getParams()
      );
      const key: string = request.getParam(0);
      if (db.exists(key)) {
          this.logger.debug(`Key ${key} already exists`);
          return RedisToken.integer(0);
      }

      const value: string = request.getParam(1);
      this.logger.debug(`Setting Key ${key} to ${value}`);
      db.put(
          key,
          new DatabaseValue(
              DataType.STRING,
              value
          )
      );
      return RedisToken.integer(1);
  }
}
