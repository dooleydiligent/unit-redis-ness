import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {DataType} from "../../data/data-type";
import {Database} from "../../data/database";
import {DatabaseValue} from "../../data/database-value";
import {AbstractRedisToken} from "../../protocol/abstract-redis-token";
import {RedisToken} from "../../protocol/redis-token";
import {RedisTokenType} from "../../protocol/redis-token-type";
import {IRespCommand} from "../resp-command";

/**
 * ### Available since 1.0.0.
 * ### SINTER key [key ...]
 * Returns the members of the set resulting from the intersection of all the given sets.
 *
 * ### SINTERSTORE destination key [key...]
 * This command is equal to {@link resp/command/set/sinter-command.SInterCommand | SINTER}, but instead of returning the
 * resulting set, it is stored in destination.
 *
 * If destination already exists, it is overwritten
 *
 * ### For example:
 * ```
 * key1 = {a,b,c,d}
 * key2 = {c}
 * key3 = {a,c,e}
 * SINTER key1 key2 key3 = {c}
 * ```
 * Keys that do not exist are considered to be empty sets. With one of the keys being an empty
 * set, the resulting set is also empty (since set intersection with an empty set always results
 * in an empty set).
 * ### Return value
 * Array reply: list with members of the resulting set.
 * ### Examples
 * ```
 * redis> SADD key1 "a"
 * (integer) 1
 * redis> SADD key1 "b"
 * (integer) 1
 * redis> SADD key1 "c"
 * (integer) 1
 * redis> SADD key2 "c"
 * (integer) 1
 * redis> SADD key2 "d"
 * (integer) 1
 * redis> SADD key2 "e"
 * (integer) 1
 * redis> SINTER key1 key2
 * 1) "c"
 * redis>
 * ```
 */
/*
 * NOTE: We don't supply a data type because sinterstore can overwrite the first param
 * even if it is not a SET
 */
export class SInterCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);

  constructor(maxParams: number, minParams: number, name: string) {
      super();
      this.constructor.prototype.maxParams = maxParams;
      this.constructor.prototype.minParams = minParams;
      this.constructor.prototype.name = name;
  }

  public execSync(request: IRequest, db: Database): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          ...request.getParams()
      );
      switch (request.getCommand().toLowerCase()) {
      case "sinterstore":
          const result: RedisToken = this.sinterstore(
              request,
              db
          );
          this.logger.debug(
              "sinterstore result is %s",
              `${result}`
          );
          return result;
          break;
      default:
          return this.sinter(
              request,
              db
          );
      }
  }

  private sinter(request: IRequest, db: Database): RedisToken {
      const result: RedisToken[] = this.intersection(
          0,
          request,
          db
      );
      if (result && result.length === 1 && result[0].getType() === RedisTokenType.ERROR) {
          return result[0];
      }
      return RedisToken.array(result);
  }

  private sinterstore(request: IRequest, db: Database): RedisToken {
      const result = this.intersection(
          1,
          request,
          db
      );
      this.logger.debug(`sinterstore received ${result.length} result(s)`);
      if (result && result.length === 1 && result[0].getType() === RedisTokenType.ERROR) {
          this.logger.debug(`returning error ${result[0].toString()}`);
          return result[0];
      }
      const newKey: DatabaseValue = new DatabaseValue(
          DataType.SET,
          new Set()
      );
      for (const token of result) {
          const stringRedisToken: AbstractRedisToken<string> = token as AbstractRedisToken<string>;
          newKey.getSet().add(stringRedisToken.getValue());
      }
      db.put(
          request.getParam(0),
          newKey
      );
      return RedisToken.integer(result.length);
  }

  private intersection(start: number, request: IRequest, db: Database): RedisToken[] {
      this.logger.debug(
          `intersection start: ${start}, params: "%s"`,
          ...request.getParams()
      );
      const result: RedisToken[] = [],
          skey: string = request.getParam(start);
      if (!db.exists(skey)) {
          return result;
      }
      const dbKey: DatabaseValue = db.get(request.getParam(start));
      if (dbKey.getType() !== DataType.SET) {
          return [RedisToken.error("WRONGTYPE Operation against a key holding the wrong kind of value")];
      }
      const dbKeys: DatabaseValue[] = [];
      for (let index = start + 1; index < request.getParams().length; index++) {
          const dbInter: DatabaseValue = db.get(request.getParam(index));
          if (dbInter && dbInter.getType() === DataType.SET) {
              dbKeys.push(dbInter);
          } else {
              this.logger.debug(
                  "dbInter is %s",
                  dbInter.getString()
              );
              if (!dbInter) {
                  return [];
              }

              this.logger.debug("Trying to return redistoken.error");
              return [RedisToken.error("WRONGTYPE Operation against a key holding the wrong kind of value")];
          }
      }
      this.logger.debug(
          "dbKey is %s",
          dbKey.getString()
      );
      dbKey.getSet().forEach((element) => {
          let candidate: any = null;
          for (const key of dbKeys) {
              if (key.getSet().has(element)) {
                  candidate = element;
              } else {
                  candidate = null;
                  break;
              }
          }
          if (candidate) {
              result.push(RedisToken.string(candidate));
          }
      });
      return result;
  }
}
