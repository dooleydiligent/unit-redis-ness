import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
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
@DbDataType(DataType.STRING)
@MaxParams(1)
@MinParams(1)
@Name('incr')
export class IncrCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  constructor(public sign: number) { }
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    try {
      let value: DatabaseValue = db.get(request.getParam(0));
      if (!value) {
        value = DatabaseValue.string(String( this.sign * 1));
      } else {
        this.logger.debug(`The original value is ${value.getString()}`);
        if (Math.abs(Number(value.getString())) < Number.MAX_SAFE_INTEGER) {
          const newValue: number = Number(value.getString()) + this.sign;
          const ttl: number = value.timeToLiveMillis(Number(new Date().getTime()));
          value = new DatabaseValue(
            DataType.STRING,
            String(newValue),
            ttl !== -1 ? ttl : undefined);
          this.logger.debug(`The ${this.sign ? 'INCR' : 'DECR'} value is ${value.getString()}`);
        } else {
          throw new Error(`increment or decrement would overflow`);
        }
      }
      db.put(request.getParam(0), value);

      return RedisToken.integer(Number(value.getString()));
    } catch (ex) {
      return RedisToken.error(ex);
    }
  }
}
