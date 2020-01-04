import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { RedisToken } from '../../protocol/redis-token';

/**
 * We use decorators to supply much of the information required
 * Thus we make these fields optional
 */
export interface IRespCommand {
  txIgnore?: boolean;
  pubSubAllowed?: boolean;
  dataType?: DataType;
  minParams?: number;
  maxParams?: number;
  execute(request: IRequest, db?: Database): RedisToken;
}
