import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { SortedSet } from "../../data/sorted-set";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 1.2.0.
 * ### ZSCORE key member
 * Returns the score of member in the sorted set at key.
 *
 * If member does not exist in the sorted set, or key does not exist, nil is returned.
 * ### Return value
 * Bulk string reply: the score of member (a double precision floating point number),
 * represented as string.
 * ### Examples
 * ```
 * redis> ZADD myzset 1 "one"
 * (integer) 1
 * redis> ZSCORE myzset "one"
 * "1"
 * redis>
 * ```
 */
export class ZScoreCommand extends IRespCommand {
    public DbDataType = DataType.ZSET

    public maxParams = 2

    public minParams = 2

    public name = "zscore"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const zkey: string = request.getParam(0),
            member: string = request.getParam(1);
        this.logger.debug(`Getting zkey ${zkey}`);
        const dbValue: DatabaseValue = db.get(zkey);
        if (!dbValue) {
            this.logger.debug(`key ${zkey} not found`);
            return RedisToken.nullString();
        }
        const score: number = dbValue.getSortedSet().get(member);
        if (score !== null) {
            this.logger.debug(`Returning score ${score}`);
            return RedisToken.string(String(score));
        }

        this.logger.debug(`Member ${member} not found`);
        return RedisToken.nullString();
    }
}
