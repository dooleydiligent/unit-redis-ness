import { maxParams, minParams, name } from "../../../decorators";
import { Database } from "../../data/database";
import { IRequest } from "../../../server/request";
import { IRespCommand } from "../resp-command";
import { Logger } from "../../../logger";
import { RedisToken } from "../../protocol/redis-token";

/**
 * ### Available since 1.0.0.
 * ### FLUSHALL
 * Delete all the keys of all the existing databases, not just the currently selected one.
 * This command never fails.
 *
 * The time-complexity for this operation is O(N), N being the number of keys in all existing
 * databases.
 */
@maxParams(0)
@minParams(0)
@name("flushall")
export class FlushAllCommand extends IRespCommand {
    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        for (let i = 0; i < 16; i++) {
            const mydb = request.getServerContext().getDatabase(i);
            this.logger.debug(`Selected database ${i}`);
            for (const key of mydb.keys()) {
                this.logger.debug(`Deleting key ${key} from database ${request.getSession().getCurrentDb()}`);
                mydb.remove(key);
            }
        }
        return RedisToken.responseOk();
    }
}
