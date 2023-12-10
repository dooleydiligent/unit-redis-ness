import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### LSET key index element
 * Sets the list element at index to element. For more information on the index argument,
 * see {@link resp/command/list/lindex-command.LIndexCommand | LINDEX}.
 *
 * **unit-redisness-test** follows the observed behavior of Redis - if the key does not exist
 * then we return 'ERR no such key'
 *
 * An error is returned for out of range indexes.
 *
 * ###Return value
 * Simple string reply
 */
export class LSetCommand extends IRespCommand {
    public DbDataType = DataType.LIST

    public maxParams = 3

    public minParams = 3

    public name = "lindex"

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
            this.logger.debug(`LIST ${key} does not exist.`);
            return RedisToken.error("ERR no such key");
        }

        // Validate the index exists.  Positive index from ZERO, Negative index from .length
        const index: string = request.getParam(1);
        this.logger.debug(`Validating list index ${index}`);
        if (isNaN(Number(index)) || Math.abs(Number(index)) >= list.getList().length) {
            this.logger.debug(`Index ${index} is invalid for ${key}`);
            return RedisToken.error("ERR value is not an integer or out of range");
        }

        const value: string = request.getParam(2);
        this.logger.debug(`Setting element ${index} of key ${key} to ${value}`);
        list.getList().splice(
            Number(index),
            1,
            value
        );
        db.put(
            key,
            list
        );
        return RedisToken.responseOk();
    }
}
