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
 * MOVE key db
 *
 * Move key from the currently selected database (see {@link SelectCommand}**[SELECT]**) to the specified destination
 * database. When key already exists in the destination database, or it does not exist in the
 * source database, it does nothing. It is possible to use MOVE as a locking primitive because
 * of this.
 *
 * **NOTE:  The primary developer of unit-redis-ness is not smart enough to know what is a**
 * **"locking primitive," so don't rely on this being a usable scenario**
 *
 * **Return value**<br>
 * Integer reply, specifically:
 *
 * 1 if key was moved.
 * 0 if key was not moved.
 */

@MaxParams(2)
@MinParams(2)
@Name('move')
export class MoveCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): Promise<RedisToken> {
    return new Promise((resolve) => {
      this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
      let response = 0;
      const currentDb: number = request.getSession().getCurrentDb();
      const key: string = request.getParam(0);

      const newDbIndex: string = request.getParam(1);
      this.logger.debug(`Target DB is ${newDbIndex}`);
      const targetDb = Number(newDbIndex);
      if (isNaN(targetDb) || targetDb < 0 || targetDb > 15) {
        this.logger.debug(`Target DB is invalid`);
        resolve(RedisToken.error(`ERR index out of range`));
      } else {
        if (targetDb === currentDb) {
          resolve(RedisToken.error(`ERR source and destination objects are the same`));
        } else {
          const dbValue: DatabaseValue = db.get(key);
          if (!dbValue) {
            this.logger.debug(
              `key ${key} does not exist in the current database ${request.getSession().getCurrentDb()}
            `);
            resolve(RedisToken.integer(response));
          } else {
            const newDb: Database = request.getServerContext().getDatabase(targetDb);
            const targetExists: boolean = newDb.exists(key);
            if (targetExists) {
              this.logger.debug(`Key ${key} already exists in db ${targetDb}.  Nothing doing`);
              resolve(RedisToken.integer(0));
            } else {
              newDb.put(key, dbValue);
              db.remove(key);
              response = 1;
              this.logger.debug(`${request.getCommand()}.execute: moved ${key} to ${targetDb}`);
              resolve(RedisToken.integer(response));
            }
          }
        }
      }
    });
  }
}
