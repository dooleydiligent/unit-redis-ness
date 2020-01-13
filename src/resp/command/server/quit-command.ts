import { Name } from '../../../decorators';
import { IRequest } from '../../../server/request';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';

@Name('quit')
export class QuitCommand implements IRespCommand {
  public execute(request: IRequest): Promise<RedisToken> {
    return new Promise((resolve) => {
      resolve(RedisToken.responseOk());
    });
  }
}
