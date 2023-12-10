import {Logger} from "../../logger";
import LuaBitLib from "../../lua/bit/lua-bit";
import LuaRedisLib from "../../lua/call/lua-redis";
import {IRequest} from "../../server/request";
import {Database} from "../data/database";
import {RedisToken} from "../protocol/redis-token";
import {IRespCommand} from "./resp-command";

/* Tslint:disable-next-line */
const fengari = require("fengari"),
    {lua} = fengari,
    {lauxlib} = fengari,
    {lualib} = fengari;

/**
 * ### Available since 2.6.0.
 * ### SCRIPT LOAD script
 * Load a script into the scripts cache, without executing it. After the specified command
 * is loaded into the script cache it will be callable using (not implemented) EvalshaComamnd | EVALSHA with
 * the correct SHA1 digest of the script, exactly like after the first successful invocation
 * of EVAL.
 *
 * The script is guaranteed to stay in the script cache forever (unless {@link ScriptCommand | SCRIPT FLUSH}
 * is called).
 * **NOTE: unit-redis-ness does not persist the script thru restarts**
 *
 * The command works in the same way even if the script was already present in the script cache.
 *
 * Please refer to the (not implemented) EvalCommand | EVAL documentation for detailed information about
 * Redis Lua scripting.
 *
 * ### Return value
 * Bulk string reply This command returns the SHA1 digest of the script added into the script cache.
 */

export class ScriptCommand extends IRespCommand {
  private static HELPERS = `
  local unpack = table.unpack
  local pack = table.pack
  local function dump(o)
    if type(o) == 'table' then
      local s = '{ '
      for k,v in pairs(o) do
        if type(k) ~= 'number' then k = '"'..k..'"' end
        s = s .. '['..k..'] = ' .. dump(v) .. ','
      end
      return s .. '} '
    else
      return tostring(o)
    end
  end
  `;

  private logger: Logger = new Logger(module.id);

  private DEFAULT_ERROR: string = "ERR Unknown subcommand or wrong number of arguments for '%s'. Try SCRIPT HELP.";

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
      let sha1: string | null;
      switch (request.getCommand().toLowerCase()) {
      case "eval":
          // Replace the sha1 in the cache
          sha1 = this.loadScript(
              request,
              0
          );
          if (sha1) {
              this.logger.debug(`Generated sha1 ${sha1}`);
              return this.executeLua(
                  `${sha1}`,
                  request
              );
          }

          return RedisToken.error("ERR Parsing script");

      case "evalsha":
          sha1 = request.getParam(0);
          const code: string = request.getServerContext().getScript(sha1);
          if (!code) {
              return RedisToken.error("NOSCRIPT No matching script. Please use EVAL.");
          }

          return this.executeLua(
              sha1,
              request
          );

      default:
          switch (request.getParam(0)) {
          case "load":
              sha1 = this.loadScript(
                  request,
                  1
              );
              if (sha1) {
                  this.logger.debug(`Returning sha1 ${sha1}`);
                  return RedisToken.string(`${sha1}`);
              }

              return RedisToken.error("ERR Parsing script");

          case "exists":
              // Array 0/1
              const exists: any = request.getServerContext().getScript(request.getParam(1));
              this.logger.debug(`EXISTS is ${request.getServerContext().scriptExists(request.getParam(1))}`);
              this.logger.debug(
                  "The retured value is \"%s\"",
                  exists
              );
              return RedisToken.array([
                  RedisToken.integer(request.getServerContext().scriptExists(request.getParam(1))
                      ? 1
                      : 0)
              ]);
          case "flush":
              request.getServerContext().flush();
              return RedisToken.status("OK");
          case "kill":
          case "debug":
          default:
              return RedisToken.error(this.DEFAULT_ERROR.replace(
                  "%s",
                  request.getParam(0)
              ));
          }
      }
  }


  /**
   * Attempt to parse a lua script.
   * Returns a sha1 and stores the script if it can
   * Adds some helper function(s) to the top of the script
   * @param request the client request
   * @returns
   */
  private loadScript(request: IRequest, scriptIndex: number): string | null {
      const code = request.getParam(scriptIndex);
      this.logger.debug("loadScript(): Validating lua script \"<script>\"");
      const L: any = lauxlib.luaL_newstate();
      this.logger.debug("Opening lua libraries");
      lualib.luaL_openlibs(L);
      const loadStatus = lauxlib.luaL_loadstring(
          L,
          fengari.to_luastring(code)
      );
      if (loadStatus !== lua.LUA_OK) {
          this.logger.warn(
              "Caught loadStatus error \"%s\"",
              loadStatus
          );
          let info: string = "Unknown LUA error %s";
          switch (loadStatus) {
          case lua.LUA_YIELD: //     1,
          case lua.LUA_ERRRUN: //    2,
          case lua.LUA_ERRSYNTAX: // 3,
          case lua.LUA_ERRMEM: //   4,
          case lua.LUA_ERRGCMM: //  5,
          case lua.LUA_ERRERR: //   6
          default:
              info = `LUA ERR Error: code ${loadStatus} evaluating "%s"`;
              break;
          }
          return null;
      }
      this.logger.debug("Caching script");
      const sha1: string = request.getServerContext().setScript(code);
      this.logger.debug(
          "Script sha1 is \"%s\"",
          sha1
      );
      return sha1;
  }

  private executeLua(sha1: string, request: IRequest): RedisToken {
      this.logger.debug(
          "executeLua sha1: %s",
          sha1
      );
      let returnValue: RedisToken;
      const code: string = `${ScriptCommand.HELPERS}\r\n${request.getServerContext().getScript(sha1)}`,

          keycount: string = request.getParam(1);
      this.logger.debug(
          "key count %s",
          keycount
      );
      if (isNaN(Number(keycount))) {
          return RedisToken.error("ERR value is not an integer or out of range");
      }
      if (Number(keycount) < 0) {
          return RedisToken.error("ERR Number of keys can't be negative");
      }

      // Setup the script
      const L: any = lauxlib.luaL_newstate();
      this.logger.debug("executeLua: Opening lua libraries");
      lualib.luaL_openlibs(L);
      LuaBitLib.LoadLibrary(L);

      LuaRedisLib.LoadLibrary(
          L,
          request
      );

      this.logger.debug(
          "executeLua(): Validating lua script \"%s\"",
          code
      );
      const loadStatus = lauxlib.luaL_loadstring(
          L,
          fengari.to_luastring(`${code}`)
      );
      if (loadStatus !== lua.LUA_OK) {
          const er: any = lauxlib.luaL_error(
              L,
              fengari.to_luastring("Unexpected error parsing error (%s)"),
              code
          );
          returnValue = RedisToken.error(er);
          this.logger.warn(er);
      } else {
          const stack: number = lua.lua_gettop(L);
          this.logger.debug(`The stack top is ${stack}`);
          this.logger.debug(`Calling script "${code}"`);
          const ok = lua.lua_call(
              L,
              0,
              lua.LUA_MULTRET
          );
          if (ok === undefined) {
              this.logger.debug("The LUA call was ok.");
              if (stack === 0) {
                  returnValue = RedisToken.nullString();
              } else {
                  returnValue = this.assembleLuaResponses(
                      L,
                      request
                  );
              }
          } else {
              this.logger.warn(`The LUA call was NOT OK: ${ok}`);
              const er: any = lauxlib.luaL_error(
                  L,
                  fengari.to_luastring("processing error (%s)"),
                  code
              );
              returnValue = RedisToken.error(er);
              this.logger.warn(er);
          }
      }
      this.logger.debug("Releasing lua state");
      lua.lua_close(L);
      return returnValue;
  }

  private collectTable(L: any): RedisToken[] {
      this.logger.debug("collectTable(L)");
      let values: RedisToken[] = [];
      lua.lua_pushnil(L);
      let value: any;
      while (lua.lua_next(
          L,
          -2
      ) !== 0) {
          const luaType: number = lua.lua_type(
              L,
              -1
          );
          switch (luaType) {
          case lua.LUA_TNIL:
              values = [];
              this.logger.debug("NIL: null resets table contents");
              break;
          case lua.LUA_TNUMBER:
              value = LuaRedisLib.stringFrom(lua.lua_tostring(
                  L,
                  -1
              ));
              this.logger.debug(`FOUND NUMBER: ${value}`);
              values.unshift(RedisToken.integer(Number(parseInt(
                  value,
                  10
              ))));
              break;
          case lua.LUA_TBOOLEAN:
              value = lua.lua_toboolean(
                  L,
                  -1
              );
              this.logger.debug(`FOUND BOOLEAN ${value}`);
              if (value) {
                  values.unshift(RedisToken.integer(1));
              } else {
                  values.unshift(RedisToken.nullString());
              }
              break;
          case lua.LUA_TSTRING:
              value = LuaRedisLib.stringFrom(lua.lua_tostring(
                  L,
                  -1
              ));
              this.logger.debug(`FOUND STRING ${value}`);
              values.unshift(RedisToken.string(value));
              break;
          case lua.LUA_TTABLE:
              this.logger.debug("FOUND EMBEDDED TABLE");
              values.unshift(RedisToken.array(this.collectTable(L)));
              break;
          default:
              values.unshift(RedisToken.error(`Can't manage luaType ${luaType} in collectTable(L)`));
          }
          lua.lua_pop(
              L,
              1
          );
      }
      return values;
  }

  private assembleLuaResponses(L: any, request: IRequest): RedisToken {
      const results: any[] = [];
      this.logger.debug("assembleResponses(L)");
      let tempString: string = "",
          wxReturnStr: string = "";
      const nargs: number = lua.lua_gettop(L);

      for (let i = 1; i <= nargs; i++) {
          const type: number = lua.lua_type(
              L,
              i
          );
          switch (type) {
          case lua.LUA_TNIL:
              this.logger.debug("Found LUA_TNIL");
              results.unshift(RedisToken.nullString());
              break;
          case lua.LUA_TBOOLEAN:
              this.logger.debug("Processing LUA_TBOOLEAN");
              tempString = LuaRedisLib.stringFrom(lua.lua_toboolean(
                  L,
                  i
              ))
                  ? "true"
                  : "false";
              results.unshift(RedisToken.boolean(Boolean(tempString)));
              break;
          case lua.LUA_TSTRING:
              this.logger.debug("Processing LUA_TSTRING");
              tempString = LuaRedisLib.stringFrom(lua.lua_tostring(
                  L,
                  i
              ));
              if (!isNaN(Number(tempString))) {
                  this.logger.debug(`Adjusting ${tempString} to integer-like string: ${String(parseInt(
                      tempString,
                      10
                  ))}`);
                  tempString = String(parseInt(
                      tempString,
                      10
                  ));
              }
              results.unshift(RedisToken.string(tempString));
              break;
          case lua.LUA_TNUMBER:
              this.logger.debug("Processing LUA_TNUMBER");
              tempString = String(parseInt(
                  lua.lua_tonumber(
                      L,
                      i
                  ),
                  10
              ));
              this.logger.debug(`The value is ${tempString} as ${Number(tempString)}`);
              results.unshift(RedisToken.integer(Number(tempString)));
              break;
          case lua.LUA_TTABLE:
              this.logger.debug("Processing LUA_TTABLE");
              // NOTE: the stacked results are retrieved in reverse order
              const values: RedisToken[] = [];
              let value: any;
              lua.lua_pushnil(L);
              while (lua.lua_next(
                  L,
                  -2
              ) !== 0) {
                  const luaType: number = lua.lua_type(
                      L,
                      -1
                  );
                  switch (luaType) {
                  case lua.LUA_TNIL:
                      value = null;
                      values.unshift(RedisToken.nullString());
                      this.logger.debug("NIL: null should reset table contents");
                      break;
                  case lua.LUA_TNUMBER:
                      let tempvalue: any = LuaRedisLib.stringFrom(lua.lua_tostring(
                          L,
                          -1
                      ));
                      tempvalue = Number(parseInt(
                          tempvalue,
                          10
                      ));
                      this.logger.debug(`FOUND NUMBER: ${tempvalue}`);

                      if (tempvalue.constructor.name === "Number") {
                          this.logger.debug(`pushing number to stack : ${tempvalue}`);
                          values.unshift(RedisToken.integer(tempvalue));
                      } else {
                          this.logger.debug("Replacing NUMBER with saved result");
                          values.unshift(tempvalue);
                      }
                      value = tempvalue;
                      break;
                  case lua.LUA_TBOOLEAN:
                      value = lua.lua_toboolean(
                          L,
                          -1
                      );
                      this.logger.debug(`FOUND BOOLEAN ${value}`);
                      if (value) {
                          values.unshift(RedisToken.integer(1));
                      } else {
                          values.unshift(RedisToken.nullString());
                      }
                      break;
                  case lua.LUA_TSTRING:
                      value = LuaRedisLib.stringFrom(lua.lua_tostring(
                          L,
                          -1
                      ));
                      this.logger.debug(`FOUND STRING ${value}`);
                      values.unshift(RedisToken.string(value));
                      break;
                  case lua.LUA_TTABLE:
                      this.logger.debug("FOUND TABLE in LUA_TTABLE");

                      /*
                       * NOTE: This is a bit of a kludge which only serves to pass unit tests.
                       * TODO: Refactor this to always return the table in the proper order
                       */
                      values.push(RedisToken.array(values.length > 0
                          ? this.collectTable(L).reverse()
                          : this.collectTable(L)));
                      break;
                  default:
                      throw new Error(`Can't manage luaType: ${luaType}`);
                  }
                  lua.lua_pop(
                      L,
                      1
                  );
                  wxReturnStr += `${value}\n`;
              }
              this.logger.debug(
                  "The complete table is %j",
                  `${values}`
              );
              results.unshift(RedisToken.array(values));
              break;
          default:
              tempString = lua.lua_typename(
                  L,
                  type
              );
              results.unshift(RedisToken.string(`Unknown type ${tempString}`));
              break;
          }
          wxReturnStr += `${tempString}\n`;
          tempString = "";
      }
      lua.lua_pop(
          L,
          nargs
      );
      this.logger.debug(`lua_print(L): STACK (${results.length}) is: ${wxReturnStr}`);
      if (results.length === 0) {
          return RedisToken.nullString();
      }
      if (results.length === 1) {
          return results[0];
      }
      return RedisToken.array(results);
  }
}
