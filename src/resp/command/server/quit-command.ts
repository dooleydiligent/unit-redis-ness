import { Name } from '../../../decorators';
import { IRequest } from '../../../server/request';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';

@Name('quit')
export class QuitCommand extends IRespCommand {
  public execSync(request: IRequest): RedisToken {
    return (RedisToken.responseOk());
  }
}
