import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../command/resp-command';

/**
 * Get the value of key.
 * If the key does not exist the special value nil is returned.
 * An error is returned if the value stored at key is not a string,
 * because GET only handles string values
 */
export class GetCommand implements IRespCommand {
  public minParams: number = 1;
  public maxParams: number = 1;
  public isRespCommand: boolean = false;
  public readOnly: boolean = true;
  public txIgnore: boolean = true;
  public pubSubAllowed: boolean = false;
  public dataType: DataType = DataType.STRING;
  public isDbCommand: boolean = true;
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    const key = request.getParam(0);
    this.logger.debug(`Getting ${key} from the db`);
    const item = db.get(key);
    this.logger.debug(`Got ${item} by key ${key} from the db`);
    if (item) {
      return item;
    } else {
      return RedisToken.NULL_STRING;
    }
  }
}
