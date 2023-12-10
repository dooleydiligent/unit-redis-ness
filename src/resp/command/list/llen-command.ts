import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### LLEN key
 *
 * Returns the length of the list stored at key. If key does not exist, it is interpreted
 * as an empty list and 0 is returned. An error is returned when the value stored at key is
 * not a list.
 *
 * ### Return value
 * Integer reply: the length of the list at key.
 */
export class LLenCommand extends IRespCommand {
    public DbDataType = DataType.LIST

    public maxParams = 1

    public minParams = 1

    public name = "llen"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const key: string = request.getParam(0),
            list: DatabaseValue = db.get(key);
        this.logger.debug(`Getting list "${key}"`);
        if (!list) {
            this.logger.debug(`LIST ${key} does not exist.  Returning 0`);
            return RedisToken.integer(0);
        }

        this.logger.debug(`Returning list size ${list.getList().length}`);
        return RedisToken.integer(list.getList().length);
    }
}
