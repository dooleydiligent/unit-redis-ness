import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * Available since 1.0.0.
 *
 * SMEMBERS key
 *
 * Returns all the members of the set value stored at key.
 *
 * This has the same effect as running SINTER with one argument key.
 *
 * **Return value**<br>
 * Array reply: all elements of the set.
 */
export class SMembersCommand extends IRespCommand {
    public DbDataType = DataType.SET

    public maxParams = 1

    public minParams = 1

    public name = "smembers"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const skey: string = request.getParam(0),
            initial: DatabaseValue = db.getOrDefault(
                skey,
                new DatabaseValue(
                    DataType.SET,
                    new Set()
                )
            ),
            values: RedisToken[] = [];
        for (const item of initial.getSet()) {
            values.push(RedisToken.string(item));
        }
        // Redis can return a list in any order
        const retval = RedisToken.array(values);
        this.logger.debug(
            `${request.getCommand()}.execute returning (%s)`,
            `${retval}`
        );
        return retval;
    }
}
