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
 *
 * ### LREM key count element
 *
 * Removes the first count occurrences of elements equal to element from the list stored at key.
 * The count argument influences the operation in the following ways:
 *
 * - count > 0: Remove elements equal to element moving from head to tail.
 * - count < 0: Remove elements equal to element moving from tail to head.
 * - count = 0: Remove all elements equal to element.
 *
 * For example, LREM list -2 "hello" will remove the last two occurrences of "hello" in the
 * list stored at list.
 *
 * Note that non-existing keys are treated like empty lists, so when key does not exist, the
 * command will always return 0.
 *
 * ### Return value
 * Integer reply: the number of removed elements.
 * ### Examples
 * ```
 * redis> RPUSH mylist "hello"
 * (integer) 1
 * redis> RPUSH mylist "hello"
 * (integer) 2
 * redis> RPUSH mylist "foo"
 * (integer) 3
 * redis> RPUSH mylist "hello"
 * (integer) 4
 * redis> LREM mylist -2 "hello"
 * (integer) 2
 * redis> LRANGE mylist 0 -1
 * 1) "hello"
 * 2) "foo"
 * redis>
 * ```
 */
@DbDataType(DataType.LIST)
@maxParams(3)
@minParams(3)
@name("lrem")
export class LRemCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          request.getParams()
      );
      let result: number = 0;
      const key: string = request.getParam(0),
          list: DatabaseValue = db.get(key);
      this.logger.debug(`Getting list "${key}"`);

      const count: any = Number(request.getParam(1));
      this.logger.debug(`Evaluating count: ${request.getParam(1)} = ${count}`);
      if (isNaN(count) || count !== parseInt(
          String(count),
          10
      )) {
          this.logger.debug("Invalid count value");
          return RedisToken.error("ERR value is not an integer or out of range");
      } else if (!list) {
          this.logger.debug(`LIST ${key} does not exist.  Returning ${result}`);
          return RedisToken.integer(result);
      }
      const value: string = request.getParam(2),

          matching: number[] = [];
      for (let index = 0; index < list.getList().length; index++) {
          if (list.getList()[index] === value) {
              matching.push(index);
          }
      }
      this.logger.debug(
          "Matching elements found at indices: %j",
          matching
      );
      const toremove: number[] = [];
      // Tslint:disable-next-line
      for (let index = 0; index < matching.length; index++) {
          let remove: boolean = false;
          switch (true) {
          case count > 0:
              remove = true;
              break;
          case count < 0:
              if (matching[index] >= matching.length + count) {
                  this.logger.debug(`COUNT < 0: if ${matching[index]} >= ${matching.length} + ${count} - remove element ${list.getList()[matching[index]]}`);
                  remove = true;
              }
              break;
          default:
              // Remove all matching elements
              remove = true;
          }
          if (remove) {
              // List.getList().splice(Number(matching[index]), 1);
              toremove.push(matching[index]);
              if (count !== 0 && Math.abs(count) === toremove.length) {
                  break;
              }
          }
      }
      this.logger.debug(
          `Removing elements [${toremove.join(",")}] like "${value}" from [%s]`,
          list.getList()
      );
      while (toremove.length) {
          const item = toremove.pop();
          this.logger.debug(`Remove item ${item}: ${list.getList()[Number(item)]}`);
          list.getList().splice(
              Number(item),
              1
          );
          result++;
      }
      this.logger.debug(`Removed ${result} elements from key "${key}"`);
      if (list.getList().length > 0) {
          const check: DatabaseValue = db.put(
              key,
              list
          );
          this.logger.debug(
              "The final list is [%s]",
              check.getList()
          );
      } else {
          db.remove(key);
          this.logger.debug(`ZERO length list ${key} removed from the db`);
      }
      return RedisToken.integer(result);
  }
}
