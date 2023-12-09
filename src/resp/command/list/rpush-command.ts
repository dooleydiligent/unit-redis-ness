import {DbDataType, MaxParams, MinParams, Name} from "../../../decorators";
import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {DataType} from "../../data/data-type";
import {Database} from "../../data/database";
import {DatabaseValue} from "../../data/database-value";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### RPUSH key element [element ...]
 * Insert all the specified values at the tail of the list stored at key. If key does not exist,
 * it is created as empty list before performing the push operation. When key holds a value that
 * is not a list, an error is returned.
 *
 * It is possible to push multiple elements using a single command call just specifying multiple
 * arguments at the end of the command. Elements are inserted one after the other to the tail of
 * the list, from the leftmost element to the rightmost element. So for instance the command RPUSH
 * mylist a b c will result into a list containing a as first element, b as second element and c
 * as third element.
 *
 * ### Return value
 * Integer reply: the length of the list after the push operation.
 */
@DbDataType(DataType.LIST)
@maxParams(-1)
@minParams(2)
@name("rpush")
export class RPushCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          request.getParams()
      );
      const key: string = request.getParam(0);
      let list: DatabaseValue = db.get(key);
      this.logger.debug(`Getting list "${key}"`);
      if (!list) {
          this.logger.debug(`Creating new list: "${key}"`);
          list = new DatabaseValue(
              DataType.LIST,
              []
          );
      }
      for (let index = 1; index < request.getParams().length; index++) {
          const element = request.getParam(index);
          this.logger.debug(`PUSHING element "${element}" to list "${key}"`);
          list.getList().push(element);
      }
      const size: number = list.getList().length;
      db.put(
          key,
          list
      );
      for (let index = 1; index < request.getParams().length; index++) {
          request.getServerContext().emit(`__keyevent@${request.getSession().getCurrentDb()}__:rpush ${key}`);
      }
      this.logger.debug(`Returning list ${key} size ${size}`);
      return RedisToken.integer(size);
  }
}
