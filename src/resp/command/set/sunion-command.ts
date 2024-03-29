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
 * ### SUNION key [key ...]
 * Returns the members of the set resulting from the union of all the given sets.
 * ### For example:
 * ```
 * key1 = {a,b,c,d}
 * key2 = {c}
 * key3 = {a,c,e}
 * SUNION key1 key2 key3 = {a,b,c,d,e}
 * ```
 * Keys that do not exist are considered to be empty sets.
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
 * redis> SUNION key1 key2
 * 1) "a"
 * 2) "c"
 * 3) "d"
 * 4) "b"
 * 5) "e"
 * redis>
 */
/*
 * NOTE: We don't supply a data type because sunionstore can overwrite the first param
 * even if it is not a SET
 */
export class SUnionCommand extends IRespCommand {
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
      case "sunionstore":
          return this.sunionstore(
              request,
              db
          );
      default:
          return this.sunion(
              request,
              db
          );
      }
  }

  private sunion(request: IRequest, db: Database): RedisToken {
      const result: RedisToken[] = this.union(
          0,
          request,
          db
      );
      if (result && result.length === 1 && result[0].getType() === RedisTokenType.ERROR) {
          return result[0];
      }
      return RedisToken.array(result);
  }

  private sunionstore(request: IRequest, db: Database): RedisToken {
      const result = this.union(
          1,
          request,
          db
      );
      if (result[0] === RedisToken.nullString()) {
          return RedisToken.integer(0);
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

  private union(start: number, request: IRequest, db: Database): RedisToken[] {
      const result: RedisToken[] = [],
          skey: string = request.getParam(start);
      if (!db.exists(skey)) {
          this.logger.debug(`Key ${skey} does not exist.  Return EMPTY set`);
          return [];
      }
      const members: Set<any> = new Set();
      for (let index = start; index < request.getParams().length; index++) {
          const tkey: string = request.getParam(index);
          this.logger.debug(`Getting list ${tkey}`);
          const dbInter: DatabaseValue = db.get(tkey);
          if (dbInter && dbInter.getType() === DataType.SET) {
              for (const key of dbInter.getSet().keys()) {
                  if (!members.has(key)) {
                      this.logger.debug(`Adding ${key} to the union set`);
                      members.add(key);
                      result.push(RedisToken.string(key));
                  }
              }
          } else {
              this.logger.debug(`Key ${tkey} is not a list.`);
              return [RedisToken.error("WRONGTYPE Operation against a key holding the wrong kind of value")];
          }
      }
      return result;
  }
}
