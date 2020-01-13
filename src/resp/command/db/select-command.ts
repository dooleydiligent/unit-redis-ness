import { MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { Database } from '../../data/database';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * ### Available since 1.0.0.
 * ### SELECT index
 * Out of the box, every Redis instance supports 16 databases.
 * The database index is the number you see at the end of a Redis
 * URL: redis://localhost:6379/0 . The default database is 0 but you can change
 * that to any number from 0-15
 *
 * Select the Redis logical database having the specified zero-based numeric index.
 * New connections always use the database 0.
 *
 * Selectable Redis databases are a form of namespacing: all databases are still
 * persisted in the same RDB / AOF file. However different databases can have keys
 * with the same name, and commands like [FLUSHDB]{@link FlushDbCommand},
 * [SWAPDB]{@link SwapDbCommand} or [RANDOMKEY]{@link RandomKeyCommand} work on specific
 * databases.
 *
 * In practical terms, Redis databases should be used to separate different keys
 * belonging to the same application (if needed), and not to use a single Redis
 * instance for multiple unrelated applications.
 *
 * When using Redis Cluster, the [SELECT]{@link SelectCommand} command cannot be used, since Redis Cluster
 * only supports database zero. In the case of a Redis Cluster, having multiple
 * databases would be useless and an unnecessary source of complexity. Commands
 * operating atomically on a single database would not be possible with the Redis
 * Cluster design and goals.
 *
 * Since the currently selected database is a property of the connection, clients
 * should track the currently selected database and re-select it on reconnection.
 * While there is no command in order to query the selected database in the current
 * connection, the [CLIENT LIST]{@link ClientCommand} output shows, for each client, the currently selected
 * database.
 *
 * Return value
 * Simple string reply
 */
@MaxParams(1)
@MinParams(1)
@Name('select')
export class SelectCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): Promise<RedisToken> {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    return new Promise((resolve) => {
      const id: any = Number(request.getParam(0));
      this.logger.debug(`DB Index is ${id}`);
      if (isNaN(id)) {
        resolve(RedisToken.error('ERR invalid DB index'));
      } else {
        if (id > -1) {
          if (id < 16) {
            request.getSession().setCurrentDb(id);
          } else {
            resolve(RedisToken.error('ERR DB index is out of range'));
            return;
          }
        } else {
          resolve(RedisToken.error('ERR DB index is out of range'));
        }
        resolve(RedisToken.responseOk());
      }
    });
  }
}
