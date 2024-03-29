import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * #### Available since 1.0.0.
 *
 * ### LRANGE key start stop
 *
 * Returns the specified elements of the list stored at key. The offsets start and stop are
 * zero-based indexes, with 0 being the first element of the list (the head of the list), 1
 * being the next element and so on.
 *
 * These offsets can also be negative numbers indicating offsets starting at the end of the
 * list. For example, -1 is the last element of the list, -2 the penultimate, and so on.
 *
 * Consistency with range functions in various programming languages
 * Note that if you have a list of numbers from 0 to 100, LRANGE list 0 10 will return 11
 * elements, that is, the rightmost item is included. This **may or may not be** consistent with
 * behavior of range-related functions in your programming language of choice (think Ruby's
 * Range.new, Array#slice or Python's range() function).
 *
 * ### Out-of-range indexes
 * Out of range indexes will not produce an error. If start is larger than the end of the list,
 * an empty list is returned. If stop is larger than the actual end of the list, Redis will
 * treat it like the last element of the list.
 *
 * ### Return value
 * Array reply: list of elements in the specified range.
 */
export class LRangeCommand extends IRespCommand {
    public DbDataType = DataType.LIST

    public maxParams = 3

    public minParams = 3

    public name = "lrange"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const key: string = request.getParam(0);
        let list: DatabaseValue = db.get(key);
        this.logger.debug(`Getting list "${key}"`);
        if (!list) {
            this.logger.debug(`LIST ${key} does not exist. Generating empty list`);
            list = new DatabaseValue(
                DataType.LIST,
                []
            );
        }
        this.logger.debug(
            "The full list is [%s]",
            ...list.getList()
        );
        let startIndex: any = Number(request.getParam(1));
        this.logger.debug(`startIndex is ${startIndex}`);
        let stopIndex: any = Number(request.getParam(2));
        this.logger.debug(`stopIndex is ${stopIndex}`);
        if (isNaN(startIndex) || isNaN(stopIndex) || !Number.isInteger(startIndex) || !Number.isInteger(stopIndex)) {
            this.logger.debug("Invalid start or stop index");
            return RedisToken.error("ERR value is not an integer or out of range");
        }

        // Normalize start and stop indices
        if (startIndex < 0) {
            startIndex = list.getList().length + startIndex;
            if (startIndex < 0) {
                startIndex = 0;
            }
        }
        if (stopIndex < 0) {
            stopIndex = list.getList().length + stopIndex;
            if (stopIndex < 0) {
                stopIndex = 0;
            }
        }
        this.logger.debug(`startIndex is ${startIndex}, stopIndex = ${stopIndex}`);
        const response: RedisToken[] = [];
        for (const item of list.getList().slice(
            Number(startIndex),
            Number(stopIndex) + 1
        )) {
            response.push(RedisToken.string(item));
        }
        return RedisToken.array(response);
    }
}
