import { Database } from "../../data/database";
import { IRequest } from "../../../server/request";
import { IRespCommand } from "../resp-command";
import { Logger } from "../../../logger";
import { RedisToken } from "../../protocol/redis-token";

/**
 * Available since 1.0.0.
 *
 * DBSIZE
 *
 * Return the number of keys in the currently-selected database.
 *
 * Return value:
 *
 * Integer reply
 */
export class DBSizeCommand extends IRespCommand {
  public maxParams = 0

  public minParams = 0

  public name = "dbsize"

  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          ...request.getParams()
      );
      const count: number = db.keys().length;
      this.logger.debug(`Returning ${count}`);
      return RedisToken.integer(count);
  }
}
