import { MaxParams, MinParams, Name } from '../../decorators';
import { Logger } from '../../logger';
import { DefaultRequest } from '../../server/default-request';
import { IRequest } from '../../server/request';
import { IServerContext } from '../../server/server-context';
import { Session } from '../../server/session';
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
export class ScriptCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  private DEFAULT_ERROR: string = 'ERR Unknown subcommand or wrong number of arguments for \'%s\'. Try SCRIPT HELP.';
  private serverContext: IServerContext | null = null;
  private session: Session | null = null;
  public execute(request: IRequest, db: Database): Promise<RedisToken> {
    return new Promise(async (resolve) => {
      this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
      this.serverContext = request.getServerContext();
      this.session = request.getSession();
      let sha1: string | null;
      switch (request.getCommand().toLowerCase()) {
        case 'eval':
          // Replace the sha1 in the cache
          sha1 = this.loadScript(request, 0);
          if (sha1) {
            this.logger.debug(`Generated sha1 ${sha1}`);
            resolve(await this.executeLua(`${sha1}`, request));
          } else {
            resolve(RedisToken.error(`ERR Parsing script`));
          }
          break;
        case 'evalsha':
          sha1 = request.getParam(0);
          const code: string = request.getServerContext().getScript(sha1);
          if (!code) {
            resolve(RedisToken.error('NOSCRIPT No matching script. Please use EVAL.'));
          } else {
            resolve(this.executeLua(sha1, request));
          }
          break;
        default:
          switch (request.getParam(0)) {
            case 'load':
              sha1 = this.loadScript(request, 1);
              if (sha1) {
                this.logger.debug(`Returning sha1 ${sha1}`);
                resolve(RedisToken.string(`${sha1}`));
              } else {
                resolve(RedisToken.error(`ERR Parsing script`));
              }
              break;
            case 'exists':
              // array 0/1
              const exists: any = request.getServerContext().getScript(request.getParam(1));
              this.logger.debug(`EXISTS is ${request.getServerContext().scriptExists(request.getParam(1))}`);
              this.logger.debug(`The retured value is "%s"`, exists);
              resolve(RedisToken.array([
                RedisToken.integer(request.getServerContext().scriptExists(request.getParam(1)) ? 1 : 0)
              ]));
              break;
            case 'flush':
            case 'kill':
            case 'debug':
            default:
              resolve(RedisToken.error(this.DEFAULT_ERROR.replace('%s', request.getParam(0))));
          }
      }
    });
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
  private async executeLua(sha1: string, request: IRequest): Promise<RedisToken> {
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
    ///
    ///
    ///
    // push the global redis reference
    this.logger.debug(`Creating reference to REDIS`);
    // this.logger.debug(`Setting globals the flua way`);
    // this.flua_setglobals(L, {
    //   redis: {
    //     call: this.callcmd
    //   }
    // });
    ///
    lua.lua_createtable(L, 0, 1);
    lua.lua_pushstring(L, 'call');
    lua.lua_pushjsfunction(L, (L: any) => {
      const n = lua.lua_gettop(L);
      const args = new Array(n - 1);
      let cmd: any;
      this.logger.debug(`lua_pushjsfunction pushing ${n} args`);
      for (let i = 0; i < n; i++) {
        let value: any;
        switch (lua.lua_type(L, i + 1)) {
          case lua.LUA_TNIL:
            value = null;
            break;
          case lua.LUA_TNUMBER:
            value = lua.lua_tonumber(L, i + 1);
            break;
          case lua.LUA_TBOOLEAN:
            value = lua.lua_toboolean(L, i + 1);
            break;
          case lua.LUA_TSTRING:
            value = lua.lua_tojsstring(L, i + 1);
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
      // callcmd(command: string, ...params: any[]): Promise<any> {
      new Promise((resolve) => {
        this.logger.debug(`RCALL redis with ${cmd} and %s`, args);
        if (this.serverContext && this.session) {
          const execcommand: IRespCommand = this.serverContext.getCommand(cmd);
          // this.logger.debug(`Executing command "${command}"`);
          const request: IRequest = new DefaultRequest(this.serverContext, this.session, cmd, args);
          execcommand.execute(request)
            .then((response: any) => {
              // this.logger.debug(`command response is %j`, response);
              const serializedResponse: string = new RespSerialize(response).serialize();
              // this.logger.debug(`Serialized Response is "%j"`, serializedResponse);
              const parser: any = new Parser({
                returnBuffers: false,
                returnError: (err: any) => {
                  this.logger.warn(`returnError: "%j"`, err);
                  resolve(err);
                },
                returnReply: (result: any) => {
                  this.logger.debug(`Replying with: ${result}`);
                  resolve(result);
                },
                stringNumbers: false
              });
              parser.reset();
              parser.execute(Buffer.from(serializedResponse));
            });
        } else {
          console.warn(`ServerContext or Session was not initialized`);
          resolve();
        }
      })
        .then((returned: any) => {
          this.logger.debug(`LUA call returned ${returned}: %j`, returned);
          if (returned !== null && returned !== undefined) {
            this.logger.debug(`return value is ${returned.constructor.name}`);
          } else {
            this.logger.debug(`return value is null or undefined`);
          }
          //      this.pushany(L, returned);
          switch (true) {
            case (returned === undefined || returned === null):
              this.logger.debug(`Push nil`);
              lua.lua_pushnil(L);
              break;
            case (returned.constructor.name === 'String'):
              this.logger.debug(`Push string`);
              lua.lua_pushstring(L, returned);
              break;
            case (returned.constructor.name === 'Number'):
              this.logger.debug(`Push number`);
              lua.lua_pushnumber(L, returned);
              break;
            case (returned.constructor.name === 'Boolean'):
              this.logger.debug(`Push boolean`);
              lua.lua_pushboolean(L, returned);
              break;
            default:
              this.logger.warn(`Not prepared to push type "${returned.constructor.name}": %j`, returned);
          }
          this.logger.debug(`returned.length is ${Array.isArray(returned) ? returned.length : 1}`);
          return Array.isArray(returned) ? returned.length : 1;
        });
    });
    lua.lua_rawset(L, -3);
    lua.lua_setglobal(L, 'redis');
    ///
    this.logger.debug(`executeLua: Validating lua script "<script>"`);
    // const loadStatus = lauxlib.luaL_loadstring(L, fengari.to_luastring(`${tables}\n${code}`));
    const loadStatus = await lauxlib.luaL_loadstring(L, fengari.to_luastring(`${code}`));
    if (loadStatus !== lua.LUA_OK) {
      this.logger.warn(`Unexpected error parsing sha1: "${sha1}"`);
      throw new Error(`Unexpected error parsing sha1: "${sha1}"`);
    }
    this.logger.debug(`Calling script "{script}" with ARGV: ${JSON.stringify(argv)} and KEYS: ${JSON.stringify(keys)}`);
    const ok = await lua.lua_call(L, 0, lua.LUA_MULTRET);
    if (ok === undefined) { // A string return
      this.logger.debug(`The LUA call was undefined`);
      const stack: number = lua.lua_gettop(L);
      this.logger.debug(`The stack top is ${stack}`);
      if (stack === 0) {
        returnValue = RedisToken.nullString();
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
          result.push(RedisToken.nullString());
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
                  elementToken = RedisToken.nullString();
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
