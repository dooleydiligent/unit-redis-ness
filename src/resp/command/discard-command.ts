import { Database } from "../data/database";
import { Logger } from "../../logger";
import { RedisToken } from "../protocol/redis-token";
import { IRequest } from "../../server/request";
import { IRespCommand } from "./resp-command";

/**
 * ### Available since 2.0.0.
 * ### DISCARD
 * Flushes all previously queued commands in a transaction and restores the connection state
 * to normal.
 *
 * If [WATCH]{public link WatchCommand} was used, DISCARD unwatches all keys watched by the connection.
 * ### Return value
 * Simple string reply: always OK.
 */
export class DiscardCommand extends IRespCommand {
    public minParams = 0

    public maxParams = 0

    public name = "discard"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        if (!request.getSession().inTransaction()) {
            return RedisToken.error("ERR DISCARD without MULTI");
        }

        request.getSession().abortTransaction();
        return RedisToken.responseOk();
    }
}
