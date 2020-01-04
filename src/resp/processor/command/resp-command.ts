import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { RedisToken } from '../../protocol/redis-token';

export interface IRespCommand {
  readOnly: boolean;
  txIgnore: boolean;
  pubSubAllowed: boolean;
  dataType: DataType;
  isDbCommand: boolean;
  minParams: number;
  maxParams: number;
  isRespCommand: boolean;
  execute(request: IRequest, db?: Database): RedisToken;
}
