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
 * SISMEMBER key member
 *
 * Returns if member is a member of the set stored at key.
 *
 * **Return value**<br>
 * Integer reply, specifically:<br>
 * 1 if the element is a member of the set.
 * 0 if the element is not a member of the set, or if key does not exist.
 */
export class SIsMemberCommand extends IRespCommand {
    public DbDataType = DataType.SET

    public maxParams = 2

    public minParams = 2

    public name = "sismember"

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
            exists = initial.getSet().has(request.getParam(1))
                ? 1
                : 0;
        this.logger.debug(`${request.getCommand()}.execute returning ${exists}`);
        return RedisToken.integer(exists);
    }
}
