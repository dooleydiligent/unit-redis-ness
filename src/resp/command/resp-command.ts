import { IRequest } from '../../server/request';
import { DataType } from '../data/data-type';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';

/**
 * We use decorators to supply much of the information required
 * Thus we make these fields optional
 */
export interface IRespCommand {
  /**
   * Sign is used in commands with a compliment command.
   * The only current example is INCR/DECR.  Sign is 1 for INCR and -1 for DECR
   */
  sign?: number;
  /**
   * Used in transactions to enqueue a command.
   */
  txIgnore?: boolean;
  /**
   * Used when PUB/SUB is in effect.
   */
  pubSubAllowed?: boolean;
  /**
   * Used for "database" commands to enforce type checking.
   */
  dataType?: DataType;
  /**
   * Minimum number of parameters require.
   */
  minParams?: number;
  /**
   * Maximum number of parameters allowed.  -1 for no maximum.
   */
  maxParams?: number;
  /**
   * Every command must implement the execute method.
   * @param request The original request
   * @param db The optional database argument
   */
  execute(request: IRequest, db?: Database): RedisToken;
}
