import { MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from './resp-command';

@MaxParams(1)
@MinParams(1)
@Name('echo')
export class EchoCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest): RedisToken {
    this.logger.debug(`execute(request, db)`, request.getParams());
    return RedisToken.string(request.getParam(0));
  }
}
