import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {DataType} from "../../data/data-type";
import {Database} from "../../data/database";
import {DatabaseValue} from "../../data/database-value";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

/**
 * Available since v1.0.0
 *
 * This command implements both INCR and DECR by a flag passed during instantiation.
 *
 * Increments the number stored at key by one. If the key does not exist,
 * it is set to 0 before performing the operation. An error is returned if
 * the key contains a value of the wrong type or contains a string that can
 * not be represented as integer. This operation is limited to 53 bit signed
 * integers.  Note that redis actually supports 64 bit integers, but javascript
 * does not.
 *
 * Number.MAX_SAFE_INTEGER is 9007199254740991
 *
 * Note: this is a string operation because Redis does not have a dedicated integer
 * type. The string stored at the key is interpreted as a base-10 53 bit signed integer
 * to execute the operation.
 *
 * Redis stores integers in their integer representation, so for string values that
 * actually hold an integer, there is no overhead for storing the string representation
 * of the integer.
 *
 * Return value
 * Integer reply: the value of key after the increment
 */
export class IncrCommand extends IRespCommand {
  public dbDataType = DataType.STRING

  public maxParams = 1

  public minParams = 1

  public name = "incr"

  private logger: Logger = new Logger(module.id);

  constructor(public sign: number) {
      super();
  }

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          ...request.getParams()
      );
      let value: DatabaseValue = db.get(request.getParam(0));
      if (!value) {
          value = DatabaseValue.string(String(Number(this.sign)));
      } else {
          this.logger.debug(`The original value is ${value.getString()}`);
          if (Math.abs(Number(value.getString())) < Number.MAX_SAFE_INTEGER) {
              const newValue: number = Number(value.getString()) + this.sign,
                  ttl: number = value.timeToLiveMillis(Number(new Date().getTime()));
              value = new DatabaseValue(
                  DataType.STRING,
                  String(newValue),
                  ttl !== -1
                      ? ttl
                      : undefined
              );
              this.logger.debug(`The ${this.sign
                  ? "INCR"
                  : "DECR"} value is ${value.getString()}`);
          } else {
              return RedisToken.error("ERR increment or decrement would overflow");
          }
      }
      db.put(
          request.getParam(0),
          value
      );
      this.logger.debug(`Returning ${value.getString()}`);
      return RedisToken.integer(Number(value.getString()));
  }
}
