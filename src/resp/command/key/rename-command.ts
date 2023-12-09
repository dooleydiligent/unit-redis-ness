import { maxParams, minParams, name } from "../../../decorators";
import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {Database} from "../../data/database";
import {DatabaseValue} from "../../data/database-value";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### RENAME key newkey
 *
 * Renames key to newkey. It returns an error when key does not exist. If newkey already exists
 * it is overwritten, when this happens RENAME executes an implicit DEL operation, so if the
 * deleted key contains a very big value it may cause high latency even if RENAME itself is
 * usually a constant-time operation.
 * **NOTE: unit-redis-ness development does not track the timing of operations.**
 *
 * In Cluster mode, both key and newkey must be in the same hash slot, meaning that in practice
 * only keys that have the same hash tag can be reliably renamed in cluster.
 * **Also NOTE: There is no 'cluster mode' available for unit-redis-ness**
 *
 * ### History
 * <= 3.2.0: Before Redis 3.2.0, an error is returned if source and destination names are the same.
 */

@maxParams(2)
@minParams(2)
@name("rename")
export class RenameCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          request.getParams()
      );
      const oldKey: string = request.getParam(0),
          newKey: string = request.getParam(1),
          dbValue: DatabaseValue = db.get(oldKey);
      if (!dbValue) {
          this.logger.debug(`key ${oldKey} does not exist`);
          return RedisToken.error("ERR no such key");
      }

      db.rename(
          oldKey,
          newKey
      );
      this.logger.debug(`${request.getCommand()}.execute name set to ${newKey}`);
      return RedisToken.responseOk();
  }
}
