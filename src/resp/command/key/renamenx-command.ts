import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### RENAMENX key newkey
 *
 * Renames key to newkey if newkey does not yet exist. It returns an error when key does not exist.
 *
 * In Cluster mode, both key and newkey must be in the same hash slot, meaning that in practice only
 * keys that have the same hash tag can be reliably renamed in cluster.
 *
 * ### History
 * <= 3.2.0: Before Redis 3.2.0, an error is returned if source and destination names are the same.
 * ### Return value
 * Integer reply, specifically:
 *
 * 1 if key was renamed to newkey.
 * 0 if newkey already exists.
 * ### Examples
 * ```
 * redis> SET mykey "Hello"
 * "OK"
 * redis> SET myotherkey "World"
 * "OK"
 * redis> RENAMENX mykey myotherkey
 * (integer) 0
 * redis> GET myotherkey
 * "World"
 * redis>
 * ```
 */

export class RenameNxCommand extends IRespCommand {
    public maxParams = 2

    public minParams = 2

    public name = "renamenx"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const oldKey: string = request.getParam(0),
            newKey: string = request.getParam(1),
            dbValue: DatabaseValue = db.get(oldKey);
        if (!dbValue) {
            this.logger.debug(`Key ${oldKey} does not exist`);
            return RedisToken.error("ERR no such key");
        } else if (db.exists(newKey)) {
            this.logger.debug(`Key ${newKey} already exists`);
            return RedisToken.integer(0);
        }
        db.rename(
            oldKey,
            newKey
        );
        this.logger.debug(`Renamed ${oldKey} to ${newKey}`);
        return RedisToken.integer(1);
    }
}
