import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 2.6.0.
 * ### PEXPIRE key milliseconds
 * This command works exactly like EXPIRE but the time to live of the key is specified in
 * milliseconds instead of seconds.
 * ### Return value
 * Integer reply, specifically:
 * - 1 if the timeout was set.
 * - 0 if key does not exist.
 * ### Examples
 * ```
 * redis> SET mykey "Hello"
 * "OK"
 * redis> PEXPIRE mykey 1500
 * (integer) 1
 * redis> TTL mykey
 * (integer) 1
 * redis> PTTL mykey
 * (integer) 1498
 * redis>
 * ```
 */

export class PExpireCommand extends IRespCommand {
    public maxParams = 2

    public minParams = 2

    public name = "exists"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        let response = 0;
        const key: string = request.getParam(0);
        let dbValue: DatabaseValue = db.get(key);
        if (!dbValue) {
            this.logger.debug(`key ${key} does not exist`);
            return RedisToken.integer(response);
        }

        const newTtl: string = request.getParam(1);
        if (isNaN(Number(newTtl)) || Number(newTtl) > parseInt(
            newTtl,
            10
        )) {
            this.logger.debug(`ttl ${newTtl} is invalid`);
            return RedisToken.error("ERR value is not an integer or out of range");
        }

        this.logger.debug(`Setting expiredAt to ${Number(newTtl)} on ${key}`);
        const ttlVal: number = Number(newTtl) < 1
            ? -1
            : new Date().getTime() + Number(newTtl);
        dbValue = db.put(
            key,
            dbValue.setExpiredAt(ttlVal)
        );
        this.logger.debug(
            "Updated key is %j",
            `${dbValue}`
        );
        response = 1;

        if (dbValue.getExpiredAt() < 0) {
            this.logger.debug(`Key ${key} is effectively deleted - returning ${response}`);
            return RedisToken.integer(response);
        }

        this.logger.debug(`${request.getCommand()}.execute ttl set to ${dbValue.getExpiredAt()}`);
        return RedisToken.integer(response);
    }
}
