import { MaxParams, MinParams, Name } from '../../decorators';
import { Logger } from '../../logger';
import { IRequest } from '../../server/request';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';
import { IRespCommand } from './resp-command';

/* tslint:disable-next-line */
const fengari = require('fengari');
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
/**
 * Available since 2.6.0.
 *
 * SCRIPT LOAD script
 *
 * Load a script into the scripts cache, without executing it. After the specified command
 * is loaded into the script cache it will be callable using EVALSHA with the correct SHA1
 * digest of the script, exactly like after the first successful invocation of EVAL.
 *
 * The script is guaranteed to stay in the script cache forever (unless SCRIPT FLUSH is called).
 * **unit-redis-ness does not persist the script thru restarts**
 *
 * The command works in the same way even if the script was already present in the script cache.
 *
 * Please refer to the EVAL documentation for detailed information about Redis Lua scripting.
 *
 * **Return value**<br>
 * Bulk string reply This command returns the SHA1 digest of the script added into the script cache.
 */
@MaxParams(-1)
@MinParams(1)
@Name('script')
export class ScriptCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  private DEFAULT_ERROR: string = 'ERR Unknown subcommand or wrong number of arguments for \'%s\'. Try SCRIPT HELP.';
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    let sha1: string | null;
    switch (request.getCommand().toLowerCase()) {
      case 'eval':
        // Replace the sha1 in the cache
        sha1 = this.loadScript(request, 0);
        if (sha1) {
          return this.executeLua(`${sha1}`, request);
        } else {
          return RedisToken.error(`ERR Parsing script`);
        }
      case 'evalsha':
        sha1 = request.getParam(0);
        const code: string = request.getServerContext().getScript(sha1);
        if (!code) {
          return RedisToken.error('NOSCRIPT No matching script. Please use EVAL.');
        }
        return this.executeLua(sha1, request);
      default:
        switch (request.getParam(0)) {
          case 'load':
            sha1 = this.loadScript(request, 1);
            if (sha1) {
              return RedisToken.string(`${sha1}`);
            } else {
              return RedisToken.error(`ERR Parsing script`);
            }
          case 'exists':
            // array 0/1
            const exists: any = request.getServerContext().getScript(request.getParam(1));
            this.logger.debug(`EXISTS is ${request.getServerContext().scriptExists(request.getParam(1))}`);
            this.logger.debug(`The retured value is "%s"`, exists);
            return RedisToken.array([
              RedisToken.integer(request.getServerContext().scriptExists(request.getParam(1)) ? 1 : 0)
            ]);
          case 'flush':
          case 'kill':
          case 'debug':
          default:
            return RedisToken.error(this.DEFAULT_ERROR.replace('%s', request.getParam(0)));
        }
    }
  }

  /*
  const thread_status = {
    LUA_OK:        0,
    LUA_YIELD:     1,
    LUA_ERRRUN:    2,
    LUA_ERRSYNTAX: 3,
    LUA_ERRMEM:    4,
    LUA_ERRGCMM:   5,
    LUA_ERRERR:    6
  };
*/
  /**
   * Attempt to parse a lua script.
   * Returns a sha1 and stores the script if it can
   * @param request the client request
   * @returns
   */
  private loadScript(request: IRequest, scriptIndex: number): string | null {
    const code = request.getParam(scriptIndex);
    this.logger.debug(`loadScript(): Validating lua script "%s"`, code);
    const L: any = lauxlib.luaL_newstate();
    this.logger.debug(`Opening lua libraries`);
    lualib.luaL_openlibs(L);
    const loadStatus = lauxlib.luaL_loadstring(L, fengari.to_luastring(code));
    if (loadStatus !== lua.LUA_OK) {
      this.logger.warn(`Caught loadStatus error "%s"`, loadStatus);
      let info: string = 'Unknown LUA error %s';
      switch (loadStatus) {
        case lua.LUA_YIELD: //     1,
          info = 'LUA YIELD Error evaluating: "%s"';
          break;
        case lua.LUA_ERRRUN:  //    2,
          info = 'LUA RUN Error evaluating: "%s"';
          break;
        case lua.LUA_ERRSYNTAX: // 3,
          info = 'LUA SYNTAX Error evaluating: "%s"';
          break;
        case lua.LUA_ERRMEM: //   4,
          info = 'LUA MEMORY Error: evaluating "%s"';
          break;
        case lua.LUA_ERRGCMM: //  5,
          info = 'LUA GC Error: evaluating "%s"';
          break;
        case lua.LUA_ERRERR: //   6
          info = 'LUA ERR Error: evaluating "%s"';
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
    const code: string = request.getServerContext().getScript(sha1);
    const keycount: string = request.getParam(1);
    this.logger.debug(`key count %s`, keycount);
    if (isNaN(Number(keycount))) {
      return RedisToken.error('ERR value is not an integer or out of range');
    }
    if (Number(keycount) < 0) {
      return RedisToken.error('ERR Number of keys can\'t be negative');
    }
    const keys: string[] = [];
    const argv: string[] = [];
    for (let index = 2; index < request.getParams().length; index++) {
      if (index > Number(keycount) + 1) {
        argv.push(request.getParam(index));
      } else {
        keys.push(request.getParam(index));
      }
    }
    // Setup the script
    const L: any = lauxlib.luaL_newstate();
    this.logger.debug(`executeLua: Opening lua libraries`);
    lualib.luaL_openlibs(L);
    this.logger.debug(`Creating ARGV table`);
    lua.lua_createtable(L, argv.length, 0);
    // Reverse the value array
    for (let index = argv.length - 1; index > -1; index--) {
      lua.lua_pushstring(L, argv[index]);
      lua.lua_seti(L, -2, index + 1);
    }

    lua.lua_setglobal(L, fengari.to_luastring('ARGV'));

    this.logger.debug(`Creating KEYS tables`);
    lua.lua_createtable(L, keys.length, 0);
    for (let index = keys.length - 1; index > -1; index--) {
      lua.lua_pushstring(L, keys[index]);
      lua.lua_seti(L, -2, index + 1);
    }
    lua.lua_setglobal(L, fengari.to_luastring('KEYS'));

    this.logger.debug(`executeLua: Validating lua script "%s"`, code);
    // const loadStatus = lauxlib.luaL_loadstring(L, fengari.to_luastring(`${tables}\n${code}`));
    const loadStatus = lauxlib.luaL_loadstring(L, fengari.to_luastring(`${code}`));
    if (loadStatus !== lua.LUA_OK) {
      this.logger.warn(`Unexpected error parsing sha1: "${sha1}"`);
      throw new Error(`Unexpected error parsing sha1: "${sha1}"`);
    }
    this.logger.debug(`Calling script "%s" with ARGV: ${JSON.stringify(argv)} and KEYS: ${JSON.stringify(keys)}`, code);
    const ok = lua.lua_call(L, 0, lua.LUA_MULTRET);
    if (ok === undefined) { // A string return
      this.logger.debug(`The LUA call was undefined`);
      const stack: number = lua.lua_gettop(L);
      this.logger.debug(`The stack top is ${stack}`);
      if (stack === 0) {
        returnValue = RedisToken.NULL_STRING;
      } else {
        returnValue = this.collectResults(L, stack);
      }
    } else {
      this.logger.warn(`The LUA call was NOT OK: ${ok}`);
      returnValue = RedisToken.error(lauxlib.luaL_error(L, lua.to_luastring('processing error (%s)'), code));
    }
    this.logger.debug(`Releasing lua state`);
    lua.lua_close(L);
    return returnValue;
  }
  private collectResults(L: any, top: number): RedisToken {
    let value: any;
    const result: any[] = [];
    for (let i = 1; i <= top; i++) {  /* repeat for each level */
      const t: number = lua.lua_type(L, i);
      switch (t) {
        case lua.LUA_TNUMBER:  /* numbers */
          value = lua.lua_tonumber(L, i);
          result.push(RedisToken.integer(value));
          this.logger.debug(`NUMBER: '%s'`, value);
          break;
        case lua.LUA_TSTRING:  /* strings */
          value = this.stringFrom(lua.lua_tostring(L, i));
          result.push(RedisToken.string(value));
          this.logger.debug(`STRING: '%s'`, value);
          break;
        case lua.LUA_TBOOLEAN:  /* booleans */
          value = lua.lua_toboolean(L, i);
          result.push(RedisToken.boolean(value));
          this.logger.debug(`BOOLEAN: '%s'`, value);
          break;
        case lua.LUA_TNIL:
          value = null;
          result.push(RedisToken.NULL_STRING);
          this.logger.debug(`NIL: null`);
          break;
        case lua.LUA_TTABLE:  /* other values */
          value = [];
          this.logger.debug(`Invoking luaL_len against i`);
          const size = lauxlib.luaL_len(L, i);
          this.logger.debug(`Table ${i} size is ${size}`);
          /* table is in the stack at index 'i' */
          let elementValue: any;
          let elementToken: RedisToken;
          lua.lua_pushnil(L);  /* first key */
          while (lua.lua_next(L, i) !== 0) {
            this.logger.debug(`Traversing table`);
            switch (lua.lua_type(L, -1)) {
              case lua.LUA_TNUMBER:  /* numbers */
                elementValue = this.stringFrom(lua.lua_tostring(L, -1));
                elementToken = RedisToken.integer(parseInt(elementValue, 10));
                break;
              case lua.LUA_TBOOLEAN:
                elementValue = lua.lua_toboolean(L, -1);
                if (elementValue) {
                  elementToken = RedisToken.integer(1);
                } else {
                  elementToken = RedisToken.NULL_STRING;
                }
                this.logger.debug(`TABLE BOOLEAN: '%s'`, elementValue);
                break;
              default:
                elementValue = this.stringFrom(lua.lua_tostring(L, -1));
                elementToken = RedisToken.string(elementValue);
            }
            this.logger.debug(`ELEMENT: '%s'`, elementValue);
            /* removes 'value'; keeps 'key' for next iteration */
            lua.lua_pop(L, 1);
            elementValue = '';
            value.push(elementToken);
          }
          // reverse the returned values - feels awkward though
          result.push(RedisToken.array(value.reverse()));
          break;
        default:
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
  private stringFrom(element: any[]): string {
    let elementValue: string = '';
    if (element) {
      element.forEach((c) => {
        elementValue += String.fromCharCode(c);
      });
    }
    return elementValue;
  }
}
