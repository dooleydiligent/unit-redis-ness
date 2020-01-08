import { MaxParams, MinParams, Name } from '../../../decorators';
import { IRequest } from '../../../server/request';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';

@MaxParams(0)
@MinParams(0)
@Name('ping')
export class PingCommand implements IRespCommand {
  public static PONG: string = 'PONG';
  public execute(request: IRequest): RedisToken {
    return RedisToken.string(PingCommand.PONG);
  }
}
