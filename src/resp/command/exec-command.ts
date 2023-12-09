import { Database } from "../data/database";
import { IRequest } from "../../server/request";
import { ICmdReq } from "../../server/session";
import { blocking } from "../../decorators";
import { Logger } from "../../logger";
import { IRespCommand } from "./resp-command";
import { RedisToken } from "../protocol/redis-token";

/**
 * ### Available since 1.2.0.
 * ### EXEC
 * Executes all previously queued commands in a transaction and restores the connection state
 * to normal.
 *
 * When using [WATCH]{@link WatchCommand}, EXEC will execute commands only if the watched keys were not modified,
 * allowing for a check-and-set mechanism.
 * ### Return value
 * Array reply: each element being the reply to each of the commands in the atomic transaction.
 *
 * When using [WATCH]{@link WatchCommand}, EXEC can return a Null reply if the execution was aborted.
 */
@blocking(true)
@minParams(0)
@maxParams(0)
@name("exec")
export class ExecCommand extends IRespCommand {
    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        if (!request.getSession().inTransaction()) {
            return RedisToken.error("ERR EXEC without MULTI");
        } else if (request.getSession().isErrored()) {
            request.getSession().abortTransaction();
            return RedisToken.error("EXECABORT Transaction discarded because of previous errors.");
        }
        const commands: ICmdReq[] = request.getSession().getTransaction(),
            tokens: any[] = [];
        commands.map(async(cmdReq) => {
            this.logger.debug(`Executing transaction command ${cmdReq.request.getCommand()}`);
            const token = await cmdReq.command.execSync(
                cmdReq.request,
                db
            );
            tokens.push(token);
        });
        return RedisToken.array(tokens);
    }
}
