import { MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { Database } from '../../data/database';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * Available since 1.0.0.
 *
 * FLUSHALL
 *
 * Delete all the keys of all the existing databases, not just the currently selected one.
 * This command never fails.
 *
 * The time-complexity for this operation is O(N), N being the number of keys in all existing
 * databases.
 *
 */
@MaxParams(0)
@MinParams(0)
@Name('flushall')
export class FlushAllCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    for (let i = 0; i < 16; i++) {
      const mydb = request.getServerContext().getDatabase(i);
      this.logger.debug(`Selected database ${i}`);
      for (const key of mydb.keys()) {
        this.logger.debug(`Deleting key ${key} from database ${request.getSession().getCurrentDb()}`);
        mydb.remove(key);
      }
    }
    return RedisToken.string('OK');
  }
}
