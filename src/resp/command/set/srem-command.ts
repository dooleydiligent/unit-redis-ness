import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### SREM key member [member ...]
 *
 * Remove the specified members from the set stored at key. Specified members that are not a
 * member of this set are ignored. If key does not exist, it is treated as an empty set and
 * this command returns 0.
 *
 * An error is returned when the value stored at key is not a set.
 * ### Return value
 * Integer reply: the number of members that were removed from the set, not including non
 * existing members.
 * ### History
 * >= 2.4: Accepts multiple member arguments. Redis versions older than 2.4 can only remove a
 * set member per call.
 * ### Examples
 * ```
 * redis> SADD myset "one"
 * (integer) 1
 * redis> SADD myset "two"
 * (integer) 1
 * redis> SADD myset "three"
 * (integer) 1
 * redis> SREM myset "one"
 * (integer) 1
 * redis> SREM myset "four"
 * (integer) 0
 * redis> SMEMBERS myset
 * 1) "three"
 * 2) "two"
 * redis>
 * ```
 */
export class SRemCommand extends IRespCommand {
    public DbDataType = DataType.SET

    public maxParams = -1

    public minParams = 2

    public name = "srem"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const key: string = request.getParam(0),
            dbKey: DatabaseValue = db.get(key);
        if (!dbKey) {
            this.logger.debug(`Key ${key} does not exist.  Returning ZERO`);
            return RedisToken.integer(0);
        }

        let results: number = 0;
        for (let index = 1; index < request.getParams().length; index++) {
            const member = request.getParam(index);
            this.logger.debug(`Checking key ${key} for member ${member}`);
            if (dbKey.getSet().has(member)) {
                this.logger.debug(`Removing member ${member} from key ${key}`);
                dbKey.getSet().delete(member);
                ++results;
            }
        }
        if (results > 0) {
            if (dbKey.getSet().size > 0) {
                this.logger.debug(
                    `Saving updated set ${key} as %s`,
                    ...dbKey.getSet()
                );
                db.put(
                    key,
                    dbKey
                );
            } else {
                this.logger.debug(`Removing empty set ${key}`);
                db.remove(key);
            }
        }
        return RedisToken.integer(results);
    }
}
