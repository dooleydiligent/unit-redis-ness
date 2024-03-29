import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### GET key
 * Get the value of key.
 *
 * If the key does not exist the special value nil is returned.
 * An error is returned if the value stored at key is not a string,
 * because GET only handles string values
 */
export class GetCommand extends IRespCommand {
  public DbDataType = DataType.STRING

  public maxParams = 1

  public minParams = 1

  public name = "get"

  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      const key = request.getParam(0);
      this.logger.debug(`Getting ${key} from the db`);
      const item = db.get(key);
      this.logger.debug(`Got ${item} by key ${key} from the db`);
      if (item) {
          return item;
      }

      return RedisToken.nullString();
  }
}
