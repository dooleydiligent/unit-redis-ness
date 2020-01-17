import { MaxParams, MinParams, Name } from '../../../decorators';
import { IRequest } from '../../../server/request';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';

@MaxParams(0)
@MinParams(0)
@Name('ping')
export class PingCommand extends IRespCommand {
  public static PONG: string = 'PONG';
  public execSync(request: IRequest): RedisToken {
    return (RedisToken.string(PingCommand.PONG));
  }
}
