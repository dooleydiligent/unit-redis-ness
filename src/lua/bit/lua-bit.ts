/* tslint:disable:no-bitwise */
import { Logger } from '../../logger';

/* tslint:disable-next-line */
const fengari = require('fengari');
const lua = fengari.lua;

export default class LuaBitLib {
  public static LoadLibrary(L: any): void {
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

        for (let i = 0; i < n; i++) {
          let value: any;
          value = lua.lua_tonumber(LIB, i + 1);
          // Numbers are always integer to redis
          // value = parseInt(value, 10);
          args[i] = value;
        }
        this.logger.debug(`BIT calling ${key} with %j`, args);

        const returned: any = bit[key].call(null, ...args);

        this.logger.debug(`BIT ${key} returned ${returned}: %j`, returned);
        this.logger.debug(`return value is ${returned ? returned.constructor.name : 'not defined'}`);

        switch (true) {
          case (returned && returned.constructor.name === 'Number'):
            this.logger.debug(`Push number`);
            lua.lua_pushnumber(LIB, returned);
            break;
          default:
            this.logger.warn(`Not prepared to push type %j`, returned);
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
