import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 2.0.0.
 * ### HGETALL key
 * Returns all fields and values of the hash stored at key. In the returned value, every
 * field name is followed by its value, so the length of the reply is twice the size of the
 * hash.
 * ### Return value
 * Array reply: list of fields and their values stored in the hash, or an empty list when key
 * does not exist.
 * ### Examples
 * ```
 * redis> HSET myhash field1 "Hello"
 * (integer) 1
 * redis> HSET myhash field2 "World"
 * (integer) 1
 * redis> HGETALL myhash
 * 1) "field1"
 * 2) "Hello"
 * 3) "field2"
 * 4) "World"
 * redis>
 * ```
 */
export class HgetallCommand extends IRespCommand {
    public DbDataType = DataType.HASH

    public maxParams = 1

    public minParams = 1

    public name = "hgetall"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const key: string = request.getParam(0);
        this.logger.debug(`Getting HASH ${key}`);
        const item: DatabaseValue = db.get(key),
            results: RedisToken[] = [];
        if (!item) {
            this.logger.debug(`HASH ${key} not found`);
            results.push(RedisToken.nullString());
        } else {
            const hash = item.getHash();
            for (const field of Object.keys(hash)) {
                results.push(RedisToken.string(field));
                results.push(RedisToken.string(hash[field]));
            }
        }
        return RedisToken.array(results);
    }
}
