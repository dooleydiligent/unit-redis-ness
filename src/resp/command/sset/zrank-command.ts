import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 2.0.0.
 * ### ZRANK key member
 * Returns the rank of member in the sorted set stored at key, with the scores ordered
 * from low to high. The rank (or index) is 0-based, which means that the member with
 * the lowest score has rank 0.
 *
 * Use (not implemented ZRevRankCommand | ZREVRANK) to get the rank of an element with the scores
 * ordered from high to low.
 *
 * ### Return value
 * If member exists in the sorted set, Integer reply: the rank of member.
 *
 * If member does not exist in the sorted set or key does not exist, Bulk string reply: nil.
 *
 * ### Examples
 * ```
 * redis> ZADD myzset 1 "one"
 * (integer) 1
 * redis> ZADD myzset 2 "two"
 * (integer) 1
 * redis> ZADD myzset 3 "three"
 * (integer) 1
 * redis> ZRANK myzset "three"
 * (integer) 2
 * redis> ZRANK myzset "four"
 * (nil)
 * redis>
 * ```
 */
export class ZRankCommand extends IRespCommand {
    public DbDataType = DataType.ZSET

    public maxParams = 2

    public minParams = 2

    public name = "zrank"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const key: string = request.getParam(0),
            member: string = request.getParam(1);
        this.logger.debug(`Getting zrank for member ${member} of key ${key}`);
        const dbValue: DatabaseValue = db.get(key);
        if (!dbValue) {
            this.logger.debug(`Key ${key} not found`);
            return RedisToken.nullString();
        }

        if (dbValue.getSortedSet().has(member)) {
            const result: number = dbValue.getSortedSet().rank(member);
            return RedisToken.integer(result);
        }

        this.logger.debug(`Member ${member} not found in key ${key}`);
        return RedisToken.nullString();
    }
}
