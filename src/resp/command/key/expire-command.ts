import { MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * Available since 1.0.0.
 *
 * EXPIRE key seconds
 *
 * Set a timeout on key. After the timeout has expired, the key will automatically be deleted.
 * A key with an associated timeout is often said to be volatile in Redis terminology.
 *
 * The timeout will only be cleared by commands that delete or overwrite the contents of the key,
 * including DEL, SET, GETSET and all the *STORE commands. This means that all the operations
 * that conceptually alter the value stored at the key without replacing it with a new one will
 * leave the timeout untouched. For instance, incrementing the value of a key with INCR, pushing
 * a new value into a list with LPUSH, or altering the field value of a hash with HSET are all
 * operations that will leave the timeout untouched.
 *
 * The timeout can also be cleared, turning the key back into a persistent key, using the PERSIST
 * command.
 *
 * If a key is renamed with RENAME, the associated time to live is transferred to the new key name.
 *
 * If a key is overwritten by RENAME, like in the case of an existing key Key_A that is
 * overwritten  * by a call like RENAME Key_B Key_A, it does not matter if the original
 * Key_A had a timeout associated or not, the new key Key_A will inherit all the characteristics
 * of Key_B.
 *
 * Note that calling EXPIRE/PEXPIRE with a non-positive timeout or EXPIREAT/PEXPIREAT with a
 * ime in the past will result in the key being deleted rather than expired (accordingly, the
 * emitted key event will be del, not expired).
 *
 * **NOTE: unit-redis-ness does NOT yet support key events**
 *
 * Refreshing expires
 * It is possible to call EXPIRE using as argument a key that already has an existing expire set.
 * In this case the time to live of a key is updated to the new value. There are many useful
 * applications for this, an example is documented in the Navigation session pattern section below.
 *
 * Differences in Redis prior 2.1.3
 * In Redis versions prior 2.1.3 altering a key with an expire set using a command altering its
 * value had the effect of removing the key entirely. This semantics was needed because of
 * limitations in the replication layer that are now fixed.
 *
 * EXPIRE would return 0 and not alter the timeout for a key with a timeout set.
 */

@MaxParams(2)
@MinParams(2)
@Name('exists')
export class ExpireCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    let response = 0;
    const key: string = request.getParam(0);
    let dbValue: DatabaseValue = db.get(key);
    if (!dbValue) {
      this.logger.debug(`key ${key} does not exist`);
      return (RedisToken.integer(response));
    } else {
      const newTtl: string = request.getParam(1);
      if (isNaN(Number(newTtl)) || Number(newTtl) > parseInt(newTtl, 10)) {
        this.logger.debug(`ttl ${newTtl} is invalid`);
        return (RedisToken.error('ERR value is not an integer or out of range'));
      } else {
        this.logger.debug(`Setting expiredAt to ${Number(newTtl) * 1000} on ${key}`);
        const ttlVal: number = Number(newTtl) < 1 ? -1 : new Date().getTime() + (Number(newTtl) * 1000);
        dbValue = db.put(key, dbValue.setExpiredAt(ttlVal));
        this.logger.debug(`Updated key is %j`, dbValue);
        response = 1;

        if (dbValue.getExpiredAt() < 0) {
          this.logger.debug(`Key ${key} is effectively deleted - returning ${response}`);
          return (RedisToken.integer(response));
        } else {
          this.logger.debug(`${request.getCommand()}.execute ttl set to ${dbValue.getExpiredAt()}`);
          return (RedisToken.integer(response));
        }
      }
    }
  }
}
