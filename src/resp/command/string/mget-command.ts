import { dbDataType, maxParams, minParams, name } from "../../../decorators";
import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### MGET key [key ...]
 * Returns the values of all specified keys. For every key that does not hold a string value or
 * does not exist, the special value nil is returned. Because of this, the operation never fails.
 *
 * ### Return value
 * Array reply: list of values at the specified keys.
 * ### Examples
 * ```
 * redis> SET key1 "Hello"
 * "OK"
 * redis> SET key2 "World"
 * "OK"
 * redis> MGET key1 key2 nonexisting
 * 1) "Hello"
 * 2) "World"
 * 3) (nil)
 * redis>
 * ```
 */
export class MGetCommand extends IRespCommand {
    dbDataType = DataType.STRING

    maxParams = -1

    minParams = 1

    name = "mget"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const results: RedisToken[] = [];
        for (const key of request.getParams()) {
            this.logger.debug(`Getting key ${key}`);
            const dbValue: DatabaseValue = db.get(key);
            if (dbValue) {
                if (dbValue.getType() !== DataType.STRING) {
                    this.logger.debug(`Ignoring type ${dbValue.getType} for key ${key}`);
                    results.push(RedisToken.nullString());
                } else {
                    this.logger.debug(`Saving ${key} value ${dbValue.getString()}`);
                    results.push(RedisToken.string(dbValue.getString()));
                }
            } else {
                this.logger.debug(`Key ${key} does not exist`);
                results.push(RedisToken.nullString());
            }
        }
        return RedisToken.array(results);
    }
}
