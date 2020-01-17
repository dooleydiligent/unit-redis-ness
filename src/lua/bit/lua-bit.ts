import { Logger } from '../../logger';
/* tslint:disable-next-line */
const fengari = require('fengari');
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;

const logger: Logger = new Logger(module.id);

logger.debug(`Initializing lua`);
const L: any = lauxlib.luaL_newstate();

logger.debug(`Opening lua libraries`);
lualib.luaL_openlibs(L);

/* tslint:disable:no-bitwise */
logger.debug(`Assembling lua bit library`);
const band = (x1: any, x2: any) => x1 & x2;
const bor = (x1: any, x2: any) => x1 | x2;
const bxor = (x1: any, x2: any) => x1 ^ x2;
const bnot = (x1: any) => ~x1;
const lshift = (x1: any, x2: any) => x1 << x2;
const rshift = (x1: any, x2: any) => x1 >> x2;
const arshift = (x1: any, x2: any) => x1 >>> x2;
const lib: any = {
  arshift,
  band,
  bnot,
  bor,
  bxor,
  lshift,
  rshift
};
lua.lua_createtable(L, 0, 1);
for (const key of Object.keys(lib)) {
  lua.lua_pushstring(L, key);

  lua.lua_pushjsfunction(L, (LIB: any) => {
    const n = lua.lua_gettop(LIB);
    const args = new Array(n);
    logger.debug(`lua_pushjsfunction pushing ${n} args`);
    for (let i = 0; i < n; i++) {
      let value: any;
      switch (lua.lua_type(LIB, i + 1)) {
        case lua.LUA_TNIL:
          value = null;
          break;
        case lua.LUA_TNUMBER:
          value = lua.lua_tonumber(LIB, i + 1);
          break;
        case lua.LUA_TBOOLEAN:
          value = lua.lua_toboolean(LIB, i + 1);
          break;
        case lua.LUA_TSTRING:
          value = lua.lua_tojsstring(LIB, i + 1);
          break;
        case lua.LUA_TTABLE:
          logger.warn(`Not prepared to readtable`);
          break;
      }
      args[i] = value;
      logger.debug(`pushjs setting arg[${i}] to "%s"`, value);
    }
    logger.debug(`BIT op for args %s`, args);
    const returned = lib[key].apply(null, args);

    logger.debug(`Reply is %s`, returned);
    logger.debug(`LUA call returned ${returned}: %j`, returned);
    if (returned !== null && returned !== undefined) {
      logger.debug(`return value is ${returned.constructor.name}`);
    } else {
      logger.debug(`return value is null or undefined`);
    }

    switch (true) {
      case (returned === undefined || returned === null):
        logger.debug(`Push nil`);
        lua.lua_pushnil(LIB);
        break;
      case (returned.constructor.name === 'String'):
        logger.debug(`Push string`);
        lua.lua_pushstring(LIB, returned);
        break;
      case (returned.constructor.name === 'Number'):
        logger.debug(`Push number`);
        lua.lua_pushnumber(LIB, returned);
        break;
      case (returned.constructor.name === 'Boolean'):
        logger.debug(`Push boolean`);
        lua.lua_pushboolean(LIB, returned);
        break;
      default:
        logger.warn(`Not prepared to push type "${returned.constructor.name}": %j`, returned);
    }
    logger.debug(`returned.length is ${Array.isArray(returned) ? returned.length : 1}`);
    return (Array.isArray(returned) ? returned.length : 1);
  });
}

lua.lua_rawset(L, -3);
lua.lua_setglobal(L, 'bit');
