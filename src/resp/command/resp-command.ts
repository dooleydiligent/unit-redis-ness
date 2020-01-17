import { Logger } from '../../logger';
import { IRequest } from '../../server/request';
import { DataType } from '../data/data-type';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';
/**
 * We use decorators to supply much of the information required
 * Thus we make these fields optional
 */
export abstract class IRespCommand {
  public blocking?: boolean;
  /**
   * Sign is used in commands with a compliment command.
   * The only current example is INCR/DECR.  Sign is 1 for INCR and -1 for DECR
   */
  public sign?: number;
  /**
   * Used in transactions to enqueue a command.
   */
  public txIgnore?: boolean;
  /**
   * Used when PUB/SUB is in effect.
   */
  public pubSubAllowed?: boolean;
  /**
   * Used for "database" commands to enforce type checking.
   */
  public dataType?: DataType;
  /**
   * Minimum number of parameters require.
   */
  public minParams?: number;
  /**
   * Maximum number of parameters allowed.  -1 for no maximum.
   */
  public maxParams?: number;
  /**
   * Every command must implement the execute method.
   * @param request The original request
   * @param db The optional database argument
   */
  public abstract execSync(request: IRequest, db?: Database): RedisToken | Promise<RedisToken>;
}
