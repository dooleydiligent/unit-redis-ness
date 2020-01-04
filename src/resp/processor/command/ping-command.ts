import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from './resp-command';

export class PingCommand implements IRespCommand {
  public static PONG: string = 'PONG';
  public readOnly: boolean = true;
  public txIgnore: boolean = true;
  public pubSubAllowed: boolean = true;
  public dataType: DataType = DataType.NONE;
  public isDbCommand: boolean = false;
  public maxParams: number = 0;
  public minParams: number = 0;
  public isRespCommand: boolean = true;
  public execute(request: IRequest): RedisToken {
    return RedisToken.string(PingCommand.PONG);
  }
}
