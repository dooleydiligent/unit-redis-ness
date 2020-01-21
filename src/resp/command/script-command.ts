import { MaxParams, MinParams, Name } from '../../decorators';
import { Logger } from '../../logger';
import LuaBitLib from '../../lua/bit/lua-bit';
import { DefaultRequest } from '../../server/default-request';
import { IRequest } from '../../server/request';
// import { IServerContext } from '../../server/server-context';
// import { Session } from '../../server/session';
import LuaRedisLib from '../../lua/call/lua-redis';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';
import { RespSerialize } from '../protocol/resp-serialize';
import { IRespCommand } from './resp-command';
/* tslint:disable-next-line */
const fengari = require('fengari');
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
/* tslint:disable-next-line */
const Parser = require('redis-parser');
/**
 * ### Available since 2.6.0.
 * ### SCRIPT LOAD script
 * Load a script into the scripts cache, without executing it. After the specified command
 * is loaded into the script cache it will be callable using [EVALSHA]{@EvalshaComamnd} with
 * the correct SHA1 digest of the script, exactly like after the first successful invocation
 * of EVAL.
 *
 * The script is guaranteed to stay in the script cache forever (unless [SCRIPT FLUSH]{@link ScriptCommand}
 * is called).
 * **NOTE: unit-redis-ness does not persist the script thru restarts**
 *
 * The command works in the same way even if the script was already present in the script cache.
 *
 * Please refer to the [EVAL]{@link EvalCommand} documentation for detailed information about
 * Redis Lua scripting.
 *
 * ### Return value
 * Bulk string reply This command returns the SHA1 digest of the script added into the script cache.
 */
@MaxParams(-1)
@MinParams(1)
@Name('script')
export class ScriptCommand extends IRespCommand {
  private static HELPERS = `local unpack = table.unpack\r\nlocal pack = table.pack`;
  private logger: Logger = new Logger(module.id);
  private DEFAULT_ERROR: string = 'ERR Unknown subcommand or wrong number of arguments for \'%s\'. Try SCRIPT HELP.';
  // private serverContext: IServerContext | null = null;
  // private session: Session | null = null;
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    // this.serverContext = request.getServerContext();
    // this.session = request.getSession();
    let sha1: string | null;
    switch (request.getCommand().toLowerCase()) {
      case 'eval':
        // Replace the sha1 in the cache
        sha1 = this.loadScript(request, 0);
        if (sha1) {
          this.logger.debug(`Generated sha1 ${sha1}`);
          return (this.executeLua(`${sha1}`, request));
        } else {
          return (RedisToken.error(`ERR Parsing script`));
        }
      case 'evalsha':
        sha1 = request.getParam(0);
        const code: string = request.getServerContext().getScript(sha1);
        if (!code) {
          return (RedisToken.error('NOSCRIPT No matching script. Please use EVAL.'));
        } else {
          return (this.executeLua(sha1, request));
        }
      default:
        switch (request.getParam(0)) {
          case 'load':
            sha1 = this.loadScript(request, 1);
            if (sha1) {
              this.logger.debug(`Returning sha1 ${sha1}`);
              return (RedisToken.string(`${sha1}`));
            } else {
              return (RedisToken.error(`ERR Parsing script`));
            }
          case 'exists':
            // array 0/1
            const exists: any = request.getServerContext().getScript(request.getParam(1));
            this.logger.debug(`EXISTS is ${request.getServerContext().scriptExists(request.getParam(1))}`);
            this.logger.debug(`The retured value is "%s"`, exists);
            return (RedisToken.array([
              RedisToken.integer(request.getServerContext().scriptExists(request.getParam(1)) ? 1 : 0)
            ]));
          case 'flush':
          case 'kill':
          case 'debug':
          default:
            return (RedisToken.error(this.DEFAULT_ERROR.replace('%s', request.getParam(0))));
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
    this.logger.debug(`loadScript(): Validating lua script "<script>"`);
    const L: any = lauxlib.luaL_newstate();
    this.logger.debug(`Opening lua libraries`);
    lualib.luaL_openlibs(L);
    const loadStatus = lauxlib.luaL_loadstring(L, fengari.to_luastring(code));
    if (loadStatus !== lua.LUA_OK) {
      this.logger.warn(`Caught loadStatus error "%s"`, loadStatus);
      let info: string = 'Unknown LUA error %s';
      switch (loadStatus) {
        case lua.LUA_YIELD: //     1,
        case lua.LUA_ERRRUN:  //    2,
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
    this.logger.debug(`Caching script`);
    const sha1: string = request.getServerContext().setScript(code);
    this.logger.debug(`Script sha1 is "%s"`, sha1);
    return sha1;
  }
  private executeLua(sha1: string, request: IRequest): RedisToken {
    this.logger.debug(`executeLua sha1: %s`, sha1);
    let returnValue: RedisToken;
    // Validate the 2nd parameter
    // evalsha sha1 <key_count> ...keys ...argv
    // eval code <key_count> ...keys ...argv
    const code: string = `${ScriptCommand.HELPERS}\r\n${request.getServerContext().getScript(sha1)}`;

    const keycount: string = request.getParam(1);
    this.logger.debug(`key count %s`, keycount);
    if (isNaN(Number(keycount))) {
      return RedisToken.error('ERR value is not an integer or out of range');
    }
    if (Number(keycount) < 0) {
      return RedisToken.error('ERR Number of keys can\'t be negative');
    }

    // Setup the script
    const L: any = lauxlib.luaL_newstate();
    this.logger.debug(`executeLua: Opening lua libraries`);
    lualib.luaL_openlibs(L);
    // this.createLuaTable(L, 'ARGV', argv);
    // this.createLuaTable(L, 'KEYS', keys);
    // this.createRedisCallback(L);
    LuaBitLib.LoadLibrary(L);

    LuaRedisLib.LoadLibrary(L, request);

    this.logger.debug(`executeLua(): Validating lua script "%s"`, code);
    const loadStatus = lauxlib.luaL_loadstring(L, fengari.to_luastring(`${code}`));
    if (loadStatus !== lua.LUA_OK) {
      const er: any = lauxlib.luaL_error(L, fengari.to_luastring('Unexpected error parsing error (%s)'), code);
      returnValue = RedisToken.error(er);
      this.logger.warn(er);
    } else {
      this.logger.debug(`Calling script "${code}"`);
      const stack: number = lua.lua_gettop(L);
      this.logger.debug(`The stack top is ${stack}`);
      const ok = lua.lua_call(L, 0, lua.LUA_MULTRET);
      if (ok === undefined) {
        this.logger.debug(`The LUA call was ok`);
        if (stack === 0) {
          returnValue = RedisToken.nullString();
        } else {
          returnValue = this.lua_print(L);
          //        returnValue = this.collectResults(L, stack);
        }
      } else {
        this.logger.warn(`The LUA call was NOT OK: ${ok}`);
        const er: any = lauxlib.luaL_error(L, fengari.to_luastring('processing error (%s)'), code);
        returnValue = RedisToken.error(er);
        this.logger.warn(er);
      }
    }
    this.logger.debug(`Releasing lua state`);
    lua.lua_close(L);
    return returnValue;
  }
/*
  private createRedisCallback(L: any) {
    this.logger.debug(`Creating reference to REDIS`);
    lua.lua_createtable(L, 0, 1);
    lua.lua_pushstring(L, 'call');
    lua.lua_pushjsfunction(L, (LIB: any) => {
      const stack: number = lua.lua_gettop(L);
      this.logger.debug(`lua_pushjsfunction() start - stack top is ${stack}`);

      const n = lua.lua_gettop(LIB);
      const args = new Array(n - 1);
      let cmd: any;
      this.logger.debug(`lua_pushjsfunction pushing ${n} args`);
      let returned: any;
      for (let i = 0; i < n; i++) {
        let value: any;
        switch (lua.lua_type(LIB, i + 1)) {
          case lua.LUA_TNIL:
            this.logger.debug(`RCALL: LUA_TNIL`);
            value = null;
            break;
          case lua.LUA_TNUMBER:
            value = lua.lua_tonumber(LIB, i + 1);
            value = Number(parseInt(value, 10));
            this.logger.debug(`RCALL: LUA_TNUMBER: ${value}`);
            break;
          case lua.LUA_TBOOLEAN:
            value = lua.lua_toboolean(LIB, i + 1);
            this.logger.debug(`RCALL: LUA_TBOOLEAN: ${value}`);
            break;
          case lua.LUA_TSTRING:
            value = lua.lua_tojsstring(LIB, i + 1);
            this.logger.debug(`RCALL: LUA_TSTRING: ${value}`);
            break;
          case lua.LUA_TTABLE:
            this.logger.warn(`Not prepared to readtable`);
            // value = this.flua_readtable(L, i + 1);
            break;
        }
        if (i === 0) {
          cmd = value;
          this.logger.debug(`pushjs setting cmd to ${cmd}`);
        } else {
          args[i - 1] = value;
          this.logger.debug(`pushjs setting arg[${i - 1}] to "%s"`, value);
        }
      }
      this.logger.debug(`LUA starting call to ${cmd} (${args})`);
      this.logger.debug(`RCALL redis with ${cmd} and %s`, args);
      if (this.serverContext && this.session) {
        const execcommand: IRespCommand = this.serverContext.getCommand(cmd);
        const rqst: IRequest = new DefaultRequest(this.serverContext, this.session, cmd, args);
        const response: any = execcommand.execSync(rqst);
        this.logger.debug(`Type of response is ${response.constructor.name}`);
        const serializedResponse: string = new RespSerialize(response).serialize();
        const parser: any = new Parser({
          returnBuffers: false,
          returnError: (err: any) => {
            this.logger.warn(`returnError: "%j"`, err);
            return (err);
          },
          returnReply: (result: any) => {
            this.logger.debug(`Replying with: ${result}`);
            returned = result;
          },
          // Force numbers from double precision to integer
          stringNumbers: true
        });
        parser.execute(Buffer.from(serializedResponse));
        this.logger.debug(`parsedReply is %s`, returned);
        this.logger.debug(`LUA call returned ${returned}: %j`, returned);
        if (returned !== null && returned !== undefined) {
          this.logger.debug(`return value is ${returned.constructor.name}`);
        } else {
          this.logger.debug(`return value is null or undefined`);
        }
        if (Array.isArray(returned) && returned.length === 0) {
          this.logger.debug(`Pushing NIL into empty returned array`);
          returned.push(null);
        }
        this.pushany(L, returned);
        this.logger.debug(`returned.length is ${Array.isArray(returned) ? returned.length : 1}`);
      } else {
        this.logger.warn(`ServerContext or Session was not initialized`);
        return RedisToken.error(`ServerContext or Session was not initialized`);
      }
      this.logger.debug(`Returning ${Array.isArray(returned) ? returned.length : 1}`);
      return (Array.isArray(returned) ? returned.length : 1);
    });
    lua.lua_rawset(L, -3);
    lua.lua_setglobal(L, 'redis');
  }
  private pushany(L: any, element: any) {
    switch (true) {
      case (element === undefined || element === null):
        this.logger.debug(`Push nil`);
        lua.lua_pushnil(L);
        break;
      case (element.constructor.name === 'String'):
        this.logger.debug(`Push string ${element}`);
        lua.lua_pushstring(L, element);
        break;
      case (element.constructor.name === 'Number'):
        this.logger.debug(`Push number: ${element}`);
        lua.lua_pushstring(L, element);
        break;
      case (element.constructor.name === 'Boolean'):
        this.logger.debug(`Push boolean: ${element}`);
        lua.lua_pushboolean(L, element);
        break;
      case (element.constructor.name === 'Array'):
        this.pushtable(L, element);
        break;
      default:
        this.logger.warn(`Not prepared to push type "${element.constructor.name}": %j`, element);
        throw new Error(`Not prepared to push type "${element.constructor.name}": ${element}`);
    }
  }
  private pushtable(L: any, table: any[]) {
    this.logger.debug(`pushtable(L, %j)`, table);
    this.logger.debug(`Table length is ${table.length}`);
    lua.lua_createtable(L, 0, table.length);
    for (let counter = 0; counter < table.length; counter++) {
      this.pushany(L, table[counter]);
      lua.lua_rawseti(L, -2, counter + 1);
    }
  }
  private createLuaTable(L: any, tableName: string, tableArray: string[]) {
    this.logger.debug(`Creating ${tableName} table`);
    lua.lua_createtable(L, tableArray.length, 0);
    // Reverse the value array
    for (let index = tableArray.length - 1; index > -1; index--) {
      lua.lua_pushstring(L, tableArray[index]);
      lua.lua_seti(L, -2, index + 1);
    }
    lua.lua_setglobal(L, fengari.to_luastring(tableName));
  }
  private collectResults(L: any, top: number): RedisToken {
    this.logger.debug(`collectResults(L, ${top})`);
    let value: any;
    const result: RedisToken[] = [];
    for (let i = 1; i <= top; i++) {  / * repeat for each level * /
      const t: number = lua.lua_type(L, i);
      switch (t) {
        case lua.LUA_TNUMBER:  / * numbers * /
          value = lua.lua_tonumber(L, i);
          value = parseInt(value, 10);
          result.push(RedisToken.integer(value));
          this.logger.debug(`NUMBER: '%s'`, value);
          break;
        case lua.LUA_TSTRING:  / * strings * /
          value = this.stringFrom(lua.lua_tostring(L, i));
          result.push(RedisToken.string(value));
          this.logger.debug(`STRING: '%s'`, value);
          break;
        case lua.LUA_TBOOLEAN:  / * booleans * /
          value = lua.lua_toboolean(L, i);
          result.push(RedisToken.boolean(value));
          this.logger.debug(`BOOLEAN: '%s'`, value);
          break;
        case lua.LUA_TNIL:
          value = null;
          result.push(RedisToken.nullString());
          this.logger.debug(`NIL: null`);
          break;
        case lua.LUA_TTABLE:
          value = this.collectTable(L);
          // reverse the returned values - feels awkward though
          result.push(RedisToken.array(value.reverse()));
          break;
        default:   / * other values * /
          const typenameString: string = this.stringFrom(lua.lua_typename(L, t));
          this.logger.warn(`Unexpected type ${typenameString}`);
          return RedisToken.error(`Unexpected type ${typenameString}`);
      }
    }
    if (result.length === 1) {
      return result[0];
    } else {
      return RedisToken.array(result);
    }
  }
  */
 private collectTable(L: any): RedisToken[] {
  this.logger.debug(`collectTable(L)`);
  let values: RedisToken[] = [];
  lua.lua_pushnil(L);
  let value: any;
  while (lua.lua_next(L, -2) !== 0) {
    const luaType: number = lua.lua_type(L, -1);
    switch (luaType) {
      case lua.LUA_TNIL:
        values = [];
        this.logger.debug(`NIL: null resets table contents`);
        break;
      case lua.LUA_TNUMBER:
        value = this.stringFrom(lua.lua_tostring(L, -1));
        this.logger.debug(`FOUND NUMBER: ${value}`);
        values.push(RedisToken.integer(Number(parseInt(value, 10))));
        break;
      case lua.LUA_TBOOLEAN:
        value = lua.lua_toboolean(L, -1);
        this.logger.debug(`FOUND BOOLEAN ${value}`);
        if (value) {
          values.push(RedisToken.integer(1));
        } else {
          values.push(RedisToken.nullString());
        }
        break;
      case lua.LUA_TSTRING:
        value = this.stringFrom(lua.lua_tostring(L, -1));
        this.logger.debug(`FOUND STRING ${value}`);
        values.push(RedisToken.string(value));
        break;
      case lua.LUA_TTABLE:
        this.logger.debug(`FOUND EMBEDDED TABLE`);
        values.push(RedisToken.array(this.collectTable(L).reverse()));
        break;
      default:
        values.push(RedisToken.error(`Can't manage luaType ${luaType} in collectTable(L)`));
        // throw new Error(`Can't manage luaType: ${luaType}`);
    }
    lua.lua_pop(L, 1);
  }
  return values;
}

  private stringFrom(element: any[]): string {
    let elementValue: string = '';
    if (element) {
      element.forEach((c) => {
        elementValue += String.fromCharCode(c);
      });
    }
    return elementValue;
  }
  private lua_print(L: any): RedisToken {
    const results: any[] = [];
    this.logger.debug(`lua_print(L)`);
    let wxReturnStr: string = '';
    let tempString: string = '';
    const nargs: number = lua.lua_gettop(L);

    for (let i = 1; i <= nargs; i++) {
      const type: number = lua.lua_type(L, i);
      switch (type) {
        case lua.LUA_TNIL:
          this.logger.debug(`Found LUA_TNIL`);
          results.push(RedisToken.nullString());
          break;
        case lua.LUA_TBOOLEAN:
          this.logger.debug(`Processing LUA_TBOOLEAN`);
          tempString = (Boolean(this.stringFrom(lua.lua_toboolean(L, i))) ? 'true' : 'false');
          results.push(RedisToken.boolean(Boolean(tempString)));
          break;
        case lua.LUA_TNUMBER:
          this.logger.debug(`Processing LUA_TNUMBER`);
          tempString = String(parseInt(lua.lua_tonumber(L, i), 10));
          results.push(RedisToken.integer(Number(tempString)));
          break;
        case lua.LUA_TSTRING:
          this.logger.debug(`Processing LUA_TSTRING`);
          tempString = this.stringFrom(lua.lua_tostring(L, i));
          // if (!isNaN(Number(tempString))) {
          //   this.logger.debug(`Adjusting ${tempString} to integer-like string`);
          //   tempString = String(parseInt(tempString, 10));
          // }
          results.push(RedisToken.string(tempString));
          break;
        case lua.LUA_TTABLE:
          this.logger.debug(`Processing LUA_TTABLE`);
          const values: RedisToken[] = [];
          let value: any;
          lua.lua_pushnil(L);
          while (lua.lua_next(L, -2) !== 0) {
            const luaType: number = lua.lua_type(L, -1);
            switch (luaType) {
              case lua.LUA_TNIL:
                values.push(RedisToken.nullString());
                this.logger.debug(`NIL: null should reset table contents`);
                break;
              case lua.LUA_TNUMBER:
                value = this.stringFrom(lua.lua_tostring(L, -1));
                this.logger.debug(`FOUND NUMBER: ${value}`);
                values.push(RedisToken.integer(Number(parseInt(value, 10))));
                break;
              case lua.LUA_TBOOLEAN:
                value = lua.lua_toboolean(L, -1);
                this.logger.debug(`FOUND BOOLEAN ${value}`);
                if (value) {
                  values.push(RedisToken.integer(1));
                } else {
                  values.push(RedisToken.nullString());
                }
                break;
              case lua.LUA_TSTRING:
                value = this.stringFrom(lua.lua_tostring(L, -1));
                this.logger.debug(`FOUND STRING ${value}`);
                values.push(RedisToken.string(value));
                break;
              case lua.LUA_TTABLE:
                this.logger.debug(`FOUND TABLE`);
                values.push(RedisToken.array(this.collectTable(L).reverse()));
                break;
              default:
                throw new Error(`Can't manage luaType: ${luaType}`);
            }
            lua.lua_pop(L, 1);
          }
          while (values.length) {
            results.push(values.pop());
          }
          //
          break;
        default:
          tempString = lua.lua_typename(L, type);
          results.push(RedisToken.string(`Unknown type ${tempString}`));
          break;
      }
      wxReturnStr += tempString + '\n';
      tempString = '';
    }
    lua.lua_pop(L, nargs);
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
