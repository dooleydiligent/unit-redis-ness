/* tslint:disable:no-bitwise */
import { Logger } from '../../logger';

/* tslint:disable-next-line */
const fengari = require('fengari');
const lua = fengari.lua;

export default class LuaBitLib {
  public static LoadLibrary(L: any): void {
    if (L.constructor.name !== 'lua_State') {
      throw new Error(`Must instantiate ${this.constructor.name} with fengari.lauxlib.lua_State object`);
    }

    this.logger.debug(`Assembling lua bit library`);
    const band = (x1: any, x2: any) => x1 & x2;
    const bor = (x1: any, x2: any) => x1 | x2;
    const bxor = (x1: any, x2: any) => x1 ^ x2;
    const bnot = (x1: any) => ~x1;
    const lshift = (x1: any, x2: any) => x1 << x2;
    const rshift = (x1: any, x2: any) => x1 >> x2;
    const arshift = (x1: any, x2: any) => x1 >>> x2;
    const bit: any = {
      arshift,
      band,
      bnot,
      bor,
      bxor,
      lshift,
      rshift
    };

    lua.lua_createtable(L, 0, Object.keys(bit).length);
    for (const key of Object.keys(bit)) {
      this.logger.debug(`Registering bit lib function ${key}: %j`, bit[key]);
      lua.lua_pushstring(L, key);
      lua.lua_pushjsfunction(L, (LIB: any) => {
        const n = lua.lua_gettop(LIB);
        const args = new Array(n);

        this.logger.debug(`BIT calling ${key} with %j`, args);

        for (let i = 0; i < n; i++) {
          let value: any;
          switch (lua.lua_type(LIB, i + 1)) {
            case lua.LUA_TNIL:
              value = null;
              break;
            case lua.LUA_TNUMBER:
              this.logger.debug(`lua_type is TNUMBER`);
              value = lua.lua_tonumber(LIB, i + 1);
              // Numbers are always integer to redis
              value = parseInt(value, 10);
              break;
            case lua.LUA_TBOOLEAN:
              this.logger.debug(`lua_type is TBOOLEAN`);
              value = lua.lua_toboolean(LIB, i + 1);
              break;
            case lua.LUA_TSTRING:
              this.logger.debug(`lua_type is TSTRING`);
              value = lua.lua_tojsstring(LIB, i + 1);
              break;
            case lua.LUA_TTABLE:
              this.logger.warn(`Not prepared to readtable`);
              // value = this.flua_readtable(L, i + 1);
              break;
          }
          args[i] = value;
//          this.logger.debug(`pushjs setting arg[${i}] to "%s"`, value);
        }
        //
//        this.logger.debug(`Calling ${key} with %s`, ...args);
        const returned: any = bit[key].call(null, ...args);

        this.logger.debug(`BIT ${key} returned ${returned}: %j`, returned);
        if (returned !== null && returned !== undefined) {
          this.logger.debug(`return value is ${returned.constructor.name}`);
        } else {
          this.logger.debug(`return value is null or undefined`);
        }

        switch (true) {
          case (returned === undefined || returned === null):
            this.logger.debug(`Push nil`);
            lua.lua_pushnil(LIB);
            break;
          case (returned.constructor.name === 'String'):
            this.logger.debug(`Push string`);
            lua.lua_pushstring(LIB, returned);
            break;
          case (returned.constructor.name === 'Number'):
            this.logger.debug(`Push number`);
            lua.lua_pushnumber(LIB, returned);
            break;
          case (returned.constructor.name === 'Boolean'):
            this.logger.debug(`Push boolean`);
            lua.lua_pushboolean(LIB, returned);
            break;
          default:
            this.logger.warn(`Not prepared to push type "${returned.constructor.name}": %j`, returned);
        }
        this.logger.debug(`returned.length is ${Array.isArray(returned) ? returned.length : 1}`);
        return (Array.isArray(returned) ? returned.length : 1);
      });
      lua.lua_rawset(L, -3);
    }
    this.logger.debug(`Setting "bit" global`);
    lua.lua_setglobal(L, 'bit');
  }
  private static logger: Logger = new Logger(module.id);
}
