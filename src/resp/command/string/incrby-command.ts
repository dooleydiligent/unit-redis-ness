import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * Available since v1.0.0
 *
 * This command implements both INCRBY and DECRBY by a flag passed during instantiation.
 * DECRBY key decrement
 *
 * Decrements the number stored at key by decrement. If the key does not exist, it is set
 * to 0 before performing the operation. An error is returned if the key contains a value
 * of the wrong type or contains a string that can not be represented as integer. This
 * operation is limited to 53 bit signed integers.
 *
 * See {@link IncrCommand} for extra information on increment/decrement operations.
 *
 * Return value
 * Integer reply: the value of key after the decrement
 */
export class IncrByCommand extends IRespCommand {
    public dbDataType = DataType.STRING

    public maxParams = 2

    public minParams = 2

    public name = "incrby"

    private logger: Logger = new Logger(module.id);

    constructor(public sign: number) {
        super();
    }

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const key: string = request.getParam(0),
            incr: string = request.getParam(1);
        let value: DatabaseValue = db.get(request.getParam(0));
        const increment: number = Number(request.getParam(1));
        if (!value) {
            value = DatabaseValue.string(String(this.sign * increment));
        } else {
            this.logger.debug(`The original value is ${value.getString()}`);
            if (Math.abs(Number(value.getString()) + increment) <= Number.MAX_SAFE_INTEGER) {
                const newValue: number = Number(value.getString()) + this.sign * increment,
                    ttl: number = value.timeToLiveMillis(Number(new Date().getTime()));
                value = new DatabaseValue(
                    DataType.STRING,
                    String(newValue),
                    ttl !== -1
                        ? ttl
                        : undefined
                );
                this.logger.debug(`The ${this.sign
                    ? "INCRBY"
                    : "DECRBY"} value is ${value.getString()}`);
            } else {
                return RedisToken.error("ERR increment or decrement would overflow");
            }
        }
        db.put(
            request.getParam(0),
            value
        );
        return RedisToken.integer(Number(value.getString()));
    }
}
