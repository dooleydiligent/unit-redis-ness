
import Parser = require("redis-parser");
const fengari = require("fengari");

import { DefaultRequest } from "../../server/default-request";
import { IRequest } from "../../server/request";
import { IRespCommand } from "../../resp/command/resp-command";
import { Logger } from "../../logger";
import { RespSerialize } from "../../resp/protocol/resp-serialize";

const { lua } = fengari;

export default class LuaRedisLib {
    public static stringFrom(element: any[]): string {
        let elementValue: string = "";
        if (element) {
            element.forEach((c) => {
                elementValue += String.fromCharCode(c);
            });
        }
        return elementValue;
    }

    public static LoadLibrary(L: any, request: IRequest): void {
        this.logger.debug("Assembling lua redis library");
        const argv: string[] = [],
            keycount: string = request.getParam(1),
            keys: string[] = [];
        for (let index = 2; index < request.getParams().length; index++) {
            if (index > Number(keycount) + 1) {
                argv.push(request.getParam(index));
            } else {
                keys.push(request.getParam(index));
            }
        }
        this.createLuaTable(
            L,
            "ARGV",
            argv
        );
        this.createLuaTable(
            L,
            "KEYS",
            keys
        );

        const redis: any = {
            "call": () => {
                const n = lua.lua_gettop(L);
                const args : string[] = new Array(n - 1);
                let cmd: any = null;
                this.logger.debug(`CALL pushing ${n} args`);
                let returned: any = null;
                for (let i = 0; i < n; i++) {
                    let value: any = null;
                    switch (lua.lua_type(
                        L,
                        i + 1
                    )) {
                    case lua.LUA_TNIL:
                        this.logger.debug("RCALL: LUA_TNIL");
                        value = null;
                        break;
                    case lua.LUA_TNUMBER:
                        value = lua.lua_tonumber(
                            L,
                            i + 1
                        );
                        value = String(Number(parseInt(
                            value,
                            10
                        )));
                        this.logger.debug(`RCALL: LUA_TNUMBER: ${value}`);
                        break;
                    case lua.LUA_TBOOLEAN:
                        value = lua.lua_toboolean(
                            L,
                            i + 1
                        );
                        this.logger.debug(`RCALL: LUA_TBOOLEAN: ${value}`);
                        break;
                    case lua.LUA_TSTRING:
                        value = lua.lua_tojsstring(
                            L,
                            i + 1
                        );
                        this.logger.debug(`RCALL: LUA_TSTRING: ${value}`);
                        break;
                    case lua.LUA_TTABLE:
                    default:
                        this.logger.warn("Not prepared to readtable");
                        // Value = this.flua_readtable(L, i + 1);
                        break;
                    }
                    if (i === 0) {
                        cmd = value;
                        this.logger.debug(`pushjs setting cmd to ${cmd}`);
                    } else {
                        args[i - 1] = value;
                        this.logger.debug(
                            `pushjs setting arg[${i - 1}] to "%s"`,
                            value
                        );
                    }
                }
                this.logger.debug(`LUA starting call to ${cmd} (${args})`);
                this.logger.debug(
                    `RCALL redis with ${cmd} and %s`,
                    ...args
                );
                const execcommand: IRespCommand = request.getServerContext().getCommand(cmd),
                    rqst: IRequest = new DefaultRequest(
                        request.getServerContext(),
                        request.getSession(),
                        cmd,
                        args
                    );
                const response: any = execcommand.execSync(rqst);
                this.logger.debug(`Type of response is ${response.constructor.name}`);
                const parser: Parser = new Parser({
                    "returnBuffers": false,
                    "returnError": (err: any) => {
                        this.logger.warn(
                            "returnError: \"%j\"",
                            err
                        );
                        return err;
                    },
                    "returnReply": (result: any) => {
                        this.logger.debug(`Replying with: ${result}`);
                        returned = result;
                    },
                    // Force numbers from double precision to integer
                    "stringNumbers": true
                }),
                    serializedResponse: string = new RespSerialize(response).serialize();
                parser.execute(Buffer.from(serializedResponse));
                this.logger.debug(
                    "parsedReply is %s",
                    returned
                );
                this.logger.debug(
                    `LUA call returned ${returned}: %j`,
                    returned
                );
                if (returned) {
                    this.logger.debug(`return value is ${returned.constructor.name}`);
                    if (returned.constructor.name === "Number") {
                        this.logger.debug(`Adjusting Number (${returned}) to Integer`);
                        returned = String(parseInt(
                            String(returned),
                            10
                        ));
                    }
                } else {
                    this.logger.debug("return value is null or undefined");
                }
                if (Array.isArray(returned) && returned.length === 0) {
                    this.logger.debug("Pushing NIL into empty returned array");
                    returned.push(null);
                }

                /*
                 * If (Array.isArray(returned)) {
                 *   This.logger.debug(`Preserving returned value(s) %j`, returned);
                 *   Request.getResponses().push(returned);
                 * }
                 */

                this.pushany(
                    L,
                    returned
                );
                this.logger.debug(`returned.length is ${Array.isArray(returned)
                    ? returned.length
                    : 1}`);
                this.logger.debug(`Returning ${Array.isArray(returned)
                    ? returned.length
                    : 1}`);
                return String(Array.isArray(returned)
                    ? returned.length
                    : 1);
            }
        };

        lua.lua_createtable(
            L,
            0,
            Object.keys(redis).length
        );
        //    For (const key of Object.keys(redis)) {
        this.logger.debug("Registering redis lib function \"call\"");
        lua.lua_pushstring(
            L,
            "call"
        );
        lua.lua_pushjsfunction(
            L,
            (LIB: any) => {
                /*
                 * This is the entry point for redis.call()
                 * Which we call below with redis['call'].call(null, ...args);
                 */
                const n = lua.lua_gettop(LIB);
                const args = new Array(n),
                    stringArgs = new Array(n - 1);
                let cmd: string = "";
                for (let i = 0; i < n; i++) {
                    const value: any = lua.lua_tonumber(
                        LIB,
                        i + 1
                    );
                    args[i] = value;
                    if (i === 0) {
                        cmd = LuaRedisLib.stringFrom(lua.lua_tostring(
                            LIB,
                            i + 1
                        ));
                    } else {
                        stringArgs[i - 1] = LuaRedisLib.stringFrom(lua.lua_tostring(
                            LIB,
                            i + 1
                        ));
                    }
                }
                this.logger.debug(
                    `lua_pushjsfunction: REDIS calling '${cmd}' with %j`,
                    ...stringArgs
                );

                const callReturn: any = redis.call.call(
                    null,
                    ...args
                );
                // CallReturn is the number of arguments that were pushed to the stack by lua
                this.logger.debug(
                    `lua_pushjsfunction: REDIS "call" returned ${callReturn}: %j`,
                    callReturn
                );
                this.logger.debug(`lua_pushjsfunction: return value is ${callReturn
                    ? callReturn.constructor.name
                    : "not defined"}`);

                switch (true) {
                case callReturn && callReturn.constructor.name === "Number":
                    // CallReturn is the number of arguments that were pushed to the stack by lua
                    this.logger.debug(`lua_pushjsfunction: Pushing returned argument count ${callReturn} as number`);
                    lua.lua_pushnumber(
                        LIB,
                        callReturn
                    );
                    break;
                default:
                    this.logger.warn(
                        `Ignore:  Not pushing type "${callReturn
                            ? callReturn.constructor.name
                            : "null or undefined"} %j`,
                        callReturn
                    );
                }
                this.logger.debug(`lua_pushjsfunction: callReturn.length is ${Array.isArray(callReturn)
                    ? callReturn.length
                    : 1}`);
                return Array.isArray(callReturn)
                    ? callReturn.length
                    : 1;
            }
        );
        lua.lua_rawset(
            L,
            -3
        );
        //    }
        this.logger.debug("Setting \"redis\" global");
        lua.lua_setglobal(
            L,
            "redis"
        );
    }

    private static logger: Logger = new Logger(module.id);

    private static createLuaTable(L: any, tableName: string, tableArray: string[]) {
        this.logger.debug(`Creating ${tableName} table`);
        lua.lua_createtable(
            L,
            tableArray.length,
            0
        );
        // Reverse the value array
        for (let index = tableArray.length - 1; index > -1; index--) {
            lua.lua_pushstring(
                L,
                tableArray[index]
            );
            lua.lua_seti(
                L,
                -2,
                index + 1
            );
        }
        lua.lua_setglobal(
            L,
            fengari.to_luastring(tableName)
        );
    }

    private static pushany(L: any, element: any) {
        switch (true) {
        case !element || element === null:
            this.logger.debug("Push nil");
            lua.lua_pushnil(L);
            break;
        case element.constructor.name === "String":
            this.logger.debug(`Push string ${element}`);
            if (!isNaN(Number(element))) {
                this.logger.debug(`Converting ${element} to integer`);
                // eslint-disable-next-line no-param-reassign
                element = String(parseInt(
                    element,
                    10
                ));
            }
            lua.lua_pushstring(
                L,
                element
            );
            break;
        case element.constructor.name === "Number":
            // eslint-disable-next-line no-param-reassign
            element = String(parseInt(
                String(element),
                10
            ));
            this.logger.debug(`Push number: ${element} as string`);
            lua.lua_pushstring(
                L,
                element
            );
            break;
        case element.constructor.name === "Boolean":
            this.logger.debug(`Push boolean: ${element}`);
            lua.lua_pushboolean(
                L,
                element
            );
            break;
        case element.constructor.name === "Array":
            this.pushtable(
                L,
                element
            );
            break;
        default:
            this.logger.warn(
                `Not prepared to push type "${element.constructor.name}": %j`,
                element
            );
            throw new Error(`Not prepared to push type "${element.constructor.name}": ${element}`);
        }
    }

    private static pushtable(L: any, table: any[]) {
        this.logger.debug(
            "pushtable(L, %j)",
            ...table
        );
        this.logger.debug(`Table length is ${table.length}`);
        lua.lua_createtable(
            L,
            0,
            table.length
        );
        for (let counter = 0; counter < table.length; counter++) {
            this.pushany(
                L,
                table[counter]
            );
            lua.lua_rawseti(
                L,
                -2,
                counter + 1
            );
        }
    }
}
