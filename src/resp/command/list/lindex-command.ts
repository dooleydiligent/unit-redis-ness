import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### LINDEX key index
 * Returns the element at index index in the list stored at key. The index is zero-based,
 * so 0 means the first element, 1 the second element and so on. Negative indices can be used
 * to designate elements starting at the tail of the list. Here, -1 means the last element,
 * -2 means the penultimate and so forth.
 *
 * When the value at key is not a list, an error is returned.
 *
 * ### Return value
 * Bulk string reply: the requested element, or nil when index is out of range.
 */
export class LIndexCommand extends IRespCommand {
    public DbDataType = DataType.LIST

    public maxParams = 2

    public minParams = 2

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
            this.logger.debug(`LIST ${key} does not exist.  Returning NIL`);
            return RedisToken.nullString();
        }

        const index: string = request.getParam(1);
        if (isNaN(Number(index)) || Number(index) !== parseInt(
            index,
            10
        )) {
            return RedisToken.error("ERR value is not an integer or out of range");
        }

        const len: number = Number(index) < 0 && Math.abs(Number(index)) < list.getList().length
            ? list.getList().length + 1 + Number(index)
            : Number(index) + 1,
            value: any = list.getList().slice(
                Number(index),
                len
            );
        this.logger.debug(
            `Returning element "${value}", "%s"`,
            typeof value
        );
        return RedisToken.string(value);
    }
}
