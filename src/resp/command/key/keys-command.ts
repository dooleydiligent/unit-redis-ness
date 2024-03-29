import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { Database } from "../../data/database";
import { AbstractRedisToken } from "../../protocol/abstract-redis-token";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * Available since 1.0.0.
 *
 * KEYS pattern
 *
 * Returns all keys matching pattern.
 *
 * While the time complexity for this operation is O(N), the constant times are fairly low.
 * For example, Redis running on an entry level laptop can scan a 1 million key database in
 * 40 milliseconds.
 *
 * Warning: consider KEYS as a command that should only be used in production environments
 * with extreme care. It may ruin performance when it is executed against large databases.
 * This command is intended for debugging and special operations, such as changing your
 * keyspace layout. Don't use KEYS in your regular application code. If you're looking for
 * a way to find keys in a subset of your keyspace, consider using SCAN or sets.
 *
 * Supported glob-style patterns:
 *
 * - h?llo matches hello, hallo and hxllo
 * - h*llo matches hllo and heeeello
 * - h[ae]llo matches hello and hallo, but not hillo
 * - h[^e]llo matches hallo, hbllo, ... but not hello
 * - h[a-b]llo matches hallo and hbllo
 * - Use \ to escape special characters if you want to match them verbatim.
 *
 * <b>Return value</b><br>
 * Array reply: list of keys matching pattern.
 */
export class KeysCommand extends IRespCommand {
    public maxParams = 1

    public minParams = 1

    public name = "keys"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const keys: any[] = [],
            pattern: string = request.getParam(0),
            re = new RegExp(`^${pattern.replace(
                /\?/gu,
                "."
            ).replace(
                /\*/gu,
                ".*?"
            )}$`);
        this.logger.debug(
            "Searching for keys matching pattern /%s/",
            `${re}`
        );
        for (const key of db.keys()) {
            if (re.test(key)) {
                this.logger.debug(`Accepting ${key}`);
                keys.push(RedisToken.string(key) as AbstractRedisToken<string>);
            } else {
                this.logger.debug(`Rejecting ${key}`);
            }
        }
        // Keys are sorted alphabetically in redis
        return RedisToken.array(keys.sort((a, b) => (a.getValue() < b.getValue() ? 0 : 1)));
    }
}
