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
 * SCARD key
 *
 * Returns the set cardinality (number of elements) of the set stored at key.
 * **Return value**<br>
 * Integer reply: the cardinality (number of elements) of the set, or 0 if key does not exist.
 */
export class SCardCommand extends IRespCommand {
    public DbDataType = DataType.SET

    public maxParams = 1

    public minParams = 1

    public name = "scard"

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
            result: number = initial.getSet().size;
        return RedisToken.integer(result);
    }
}
