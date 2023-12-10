import { Database } from "../data/database";
import { Logger } from "../../logger";
import { RedisToken } from "../protocol/redis-token";
import { IRequest } from "../../server/request";
import { IRespCommand } from "./resp-command";

/**
 * ### Available since 1.2.0.
 * ### MULTI
 *
 * Marks the start of a transaction block. Subsequent commands will be queued for atomic
 * execution using {@link resp/command/exec-command.ExecCommand | EXEC}.
 * ### Return value
 * Simple string reply: always OK.
 */
export class MultiCommand extends IRespCommand {
    public minParams = 0

    public maxParams = 0

    public name = "multi"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        if (!request.getSession().inTransaction()) {
            request.getSession().startTransaction();
            return RedisToken.responseOk();
        }

        return RedisToken.error("ERR MULTI calls can not be nested");
    }
}
