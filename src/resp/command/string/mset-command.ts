import { maxParams, minParams, name } from "../../../decorators";
import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {DataType} from "../../data/data-type";
import {Database} from "../../data/database";
import {DatabaseValue} from "../../data/database-value";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

/**
 * ### Available since 1.0.1.
 * ### MSET key value [key value ...]
 * Sets the given keys to their respective values. MSET replaces existing values with new
 * values, just as regular [SET]{@link SetCommand}. See [MSETNX]{@lint MSetNxCommand} if you
 * don't want to overwrite existing values.
 *
 * MSET is atomic, so all given keys are set at once. It is not possible for clients to see
 * that some of the keys were updated while others are unchanged.
 *
 * ### Return value
 * Simple string reply: always OK since MSET can't fail.
 */
export class MsetCommand extends IRespCommand {
  maxParams = -1

  minParams = 2

  name = "mset"

  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          ...request.getParams()
      );
      // Params() must be an even number
      if (request.getParams().length % 2 !== 0) {
          return RedisToken.error("ERR wrong number of arguments for mset");
      }

      for (let index = 0; index < request.getParams().length; index += 2) {
          const key: string = request.getParam(index),
              value: string = request.getParam(index + 1);
          this.logger.debug(`Setting key ${key} to "${value}"`);
          db.put(
              key,
              new DatabaseValue(
                  DataType.STRING,
                  value
              )
          );
      }
      return RedisToken.responseOk();
  }
}
