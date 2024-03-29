import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * Available since v1.0.0
 *
 * DEL key [key...]
 * Removes the specified keys. A key is ignored if it does not exist.
 *
 * RETURNS:
 * Integer reply: The number of keys that were removed.
 */
export class DelCommand extends IRespCommand {
    public maxParams = -1

    public minParams = 1

    public name = "del"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        let counter = 0;
        for (const key of request.getParams()) {
            if (db.remove(key)) {
                ++counter;
            }
        }
        return RedisToken.integer(counter);
    }
}
