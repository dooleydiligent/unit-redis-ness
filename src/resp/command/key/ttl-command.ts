import { maxParams, minParams, name } from "../../../decorators";
import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {Database} from "../../data/database";
import {DatabaseValue} from "../../data/database-value";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### TTL key
 *
 * Returns the remaining time to live of a key that has a timeout. This introspection capability
 * allows a Redis client to check how many seconds a given key will continue to be part of the
 * dataset.
 *
 * In Redis 2.6 or older the command returns -1 if the key does not exist or if the key exist but
 * has no associated expire.
 *
 * Starting with Redis 2.8 the return value in case of error changed:
 * - The command returns -2 if the key does not exist.
 * - The command returns -1 if the key exists but has no associated expire.
 *
 * **unit-redis-ness** implementes the post 2.8 pattern
 *
 * See also the PTTL command that returns the same information with milliseconds resolution
 * (Only available in Redis 2.6 or greater).
 * ### Return value
 * Integer reply: TTL in seconds, or a negative value in order to signal an error (see the
 * description above).
 * ### Examples
 * ```
 * redis> SET mykey "Hello"
 * "OK"
 * redis> EXPIRE mykey 10
 * (integer) 1
 * redis> TTL mykey
 * (integer) 10
 * redis>
 * ```
 */

@maxParams(1)
@minParams(1)
@name("ttl")
export class TtlCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          request.getParams()
      );
      let ttl: number = -2;
      const key: string = request.getParam(0);
      this.logger.debug(`Getting dbValue ${key}`);
      const dbKey: DatabaseValue = db.get(key);
      if (dbKey) {
          ttl = dbKey.timeToLiveSeconds(new Date().getTime());
      }
      return RedisToken.integer(ttl);
  }
}
