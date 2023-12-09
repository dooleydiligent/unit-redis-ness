import { maxParams, minParams, name } from "../../../decorators";
import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {Database} from "../../data/database";
import {DatabaseValue} from "../../data/database-value";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### FLUSHDB [ASYNC]
 *
 * Delete all the keys of the currently selected DB. This command never fails.
 *
 * The time-complexity for this operation is O(N), N being the number of keys in the database.
 *
 * ### FLUSHDB ASYNC (Redis 4.0.0 or greater) **NOT IMPLEMENTED in unit-redis-ness**
 * See [FLUSHALL]{@link FlushAllCommand} for documentation.
 */
@maxParams(0)
@minParams(0)
@name("flushdb")
export class FlushDbCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          request.getParams()
      );
      for (const key of db.keys()) {
          this.logger.debug(`Deleting key ${key} from database ${request.getSession().getCurrentDb()}`);
          db.remove(key);
      }
      return RedisToken.responseOk();
  }
}
