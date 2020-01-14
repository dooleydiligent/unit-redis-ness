import { Name } from '../../decorators';
import { IRequest } from '../../server/request';
import { RedisToken } from '../protocol/redis-token';
import { IRespCommand } from './resp-command';

@Name('null')
export class NullCommand implements IRespCommand {
  public execute(request: IRequest): Promise<RedisToken> {
    return new Promise((resolve) => {
      request.getSession().setError();
      let params: string = '';
      request.getParams().forEach((param) => {
        params += '`' + param + '`, ';
      });
      const response: string = 'ERR unknown command `' + request.getCommand() +
        '`, with args beginning with: ' + params;
      resolve(RedisToken.error(response));
    });
  }
}
