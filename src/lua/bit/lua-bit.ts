const fengari = require("fengari");
import { Logger } from "../../logger";

const { lua } = fengari;

export default class LuaBitLib {
    public static LoadLibrary(Lx: number): void {
        this.logger.debug("Assembling lua bit library");
        const bit : any = {
            "arshift": (x1: number, x2: number) => x1 >>> x2,
            "band": (x1: number, x2: number) => x1 & x2,
            "bnot": (x1: number) => ~x1,
            "bor": (x1: number, x2: number) => x1 ^ x2,
            "bxor": (x1: number, x2: number) => x1 ^ x2,
            "lshift": (x1: number, x2: number) => x1 << x2,
            "rshift": (x1: number, x2: number) => x1 >> x2
        };

        lua.lua_createtable(
            Lx,
            0,
            Object.keys(bit).length
        );
        for (const key of Object.keys(bit)) {
            this.logger.debug(
                `Registering bit lib function ${key}: %j`,
                bit[key]
            );
            lua.lua_pushstring(
                Lx,
                key
            );
            lua.lua_pushjsfunction(
                Lx,
                (LIB: any) => {
                    const n = lua.lua_gettop(LIB);
                    const args :string[] = new Array(n);

                    for (let i = 0; i < n; i++) {
                        const value: any = lua.lua_tonumber(
                            LIB,
                            i + 1
                        );

                        /*
                         * Numbers are always integer to redis
                         * Value = parseInt(value, 10);
                         */
                        args[i] = value;
                    }
                    this.logger.debug(
                        `BIT calling ${key} with %j`,
                        ...args
                    );

                    const returned: any = bit[key].call(
                        null,
                        ...args
                    );

                    this.logger.debug(
                        `BIT ${key} returned ${returned}: %j`,
                        returned
                    );
                    this.logger.debug(`return value is ${returned
                        ? returned.constructor.name
                        : "not defined"}`);

                    switch (true) {
                    case returned && returned.constructor.name === "Number":
                        this.logger.debug("Push number");
                        lua.lua_pushnumber(
                            LIB,
                            returned
                        );
                        break;
                    default:
                        this.logger.warn(
                            "Not prepared to push type %j",
                            returned
                        );
                    }
                    this.logger.debug(`returned.length is ${Array.isArray(returned)
                        ? returned.length
                        : 1}`);
                    return Array.isArray(returned)
                        ? returned.length
                        : 1;
                }
            );
            lua.lua_rawset(
                Lx,
                -3
            );
        }
        this.logger.debug("Setting \"bit\" global");
        lua.lua_setglobal(
            Lx,
            "bit"
        );
    }

    private static logger: Logger = new Logger(module.id);
}
