import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { Database } from "../../data/database";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### SELECT index
 * Out of the box, every Redis instance supports 16 databases.
 * The database index is the number you see at the end of a Redis
 * URL: redis://localhost:6379/0 . The default database is 0 but you can change
 * that to any number from 0-15
 *
 * Select the Redis logical database having the specified zero-based numeric index.
 * New connections always use the database 0.
 *
 * Selectable Redis databases are a form of namespacing: all databases are still
 * persisted in the same RDB / AOF file. However different databases can have keys
 * with the same name, and commands like {@link resp/command/db/flushdb-command.FlushDbCommand | FLUSHDB},
 * See: SWAPDB - (not implemented) or {@link resp/command/key/randomkey-command.RandomKeyCommand | RANDOMKEY} work on specific
 * databases.
 *
 * In practical terms, Redis databases should be used to separate different keys
 * belonging to the same application (if needed), and not to use a single Redis
 * instance for multiple unrelated applications.
 *
 * When using Redis Cluster, the {@link resp/command/db/select-command.SelectCommand | SELECT} command cannot be used, since Redis Cluster
 * only supports database zero. In the case of a Redis Cluster, having multiple
 * databases would be useless and an unnecessary source of complexity. Commands
 * operating atomically on a single database would not be possible with the Redis
 * Cluster design and goals.
 *
 * Since the currently selected database is a property of the connection, clients
 * should track the currently selected database and re-select it on reconnection.
 * While there is no command in order to query the selected database in the current
 * connection, the {@link resp/command/client-command.ClientCommand | CLIENT LIST} output shows, for each client, the currently selected
 * database.
 *
 * Return value
 * Simple string reply
 */
export class SelectCommand extends IRespCommand {
    public maxParams = 1

    public minParams = 1

    public name = "select"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const id: any = Number(request.getParam(0));
        this.logger.debug(`DB Index is ${id}`);
        if (isNaN(id)) {
            return RedisToken.error("ERR invalid DB index");
        }

        if (id > -1) {
            if (id < 16) {
                request.getSession().setCurrentDb(id);
            } else {
                return RedisToken.error("ERR DB index is out of range");
            }
        } else {
            return RedisToken.error("ERR DB index is out of range");
        }
        return RedisToken.responseOk();
    }
}
