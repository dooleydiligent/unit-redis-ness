import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from './resp-command';

export class EchoCommand implements IRespCommand {
  public readOnly: boolean = true;
  public txIgnore: boolean = true;
  public pubSubAllowed: boolean = false;
  public dataType: DataType = DataType.NONE;
  public isDbCommand: boolean = false;
  public minParams: number = 1;
  public maxParams: number = 1;
  public isRespCommand: boolean = true;
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest): RedisToken {
    this.logger.debug(`execute(request, db)`, request.getParams());
    return RedisToken.string(request.getParam(0));
  }
}
