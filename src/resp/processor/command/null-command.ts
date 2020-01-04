import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from './resp-command';

export class NullCommand implements IRespCommand {
  public readOnly: boolean = true;
  public txIgnore: boolean = true;
  public pubSubAllowed: boolean = false;
  public dataType: DataType = DataType.NONE;
  public isDbCommand: boolean = false;
  public maxParams: number = -1;
  public minParams: number = -1;
  public isRespCommand: boolean = false;
  public execute(request: IRequest): RedisToken {
    let params: string = '';
    request.getParams().forEach((param) => {
      params += '`' + param + '`, ';
    });
    const response: string = 'ERR unknown command `' + request.getCommand() + '`, with args beginning with: ' + params;
    return RedisToken.error(response);
  }
}
