import * as util from "util";

/**
 * A simple logger.  Supports info, and warn without any configuration
 *
 * Leverages [util.debuglog](https://nodejs.org/api/util.html#util_util_debuglog_section) to enable debug logging
 * To use debug logging:
 *
 * ```
 * export NODE_DEBUG=module-name,other-module
 * ```
 *
 */
export class Logger {
    private logger: (msg: string, ...param: string[]) => void;


    /**
     * Initialize a logger
     * @param modname Should always be the value module.id
     */
    constructor(public modname: string) {
        if (this.modname) {
            this.modname = this.modname.split(/\//u).pop() || this.modname;
            this.modname = this.modname.substring(
                0,
                this.modname.lastIndexOf(".")
            );
        } else {
            throw new Error("You must initialize the logger with module.id");
        }
        this.logger = util.debuglog(this.modname);
    }

    public info(message: string, ...args: string[]) {
        console.info(this.format(
            "info",
            message,
            true,
            args
        ));
    }

    public debug(message: string, ...args: string[]) {
        this.logger(this.format(
            "debug",
            message,
            false,
            args
        ));
    }

    public warn(message: string, ...args: string[]) {
        console.warn(this.format(
            "warn",
            message,
            true,
            args
        ));
    }

    private format(level: string, message: string, showName: boolean, args: string[]): string {
        let formatString = "";
        if (showName) {
            formatString = util.format(
                "%s %d: %s - [%s] - %s",
                this.modname.toUpperCase(),
                process.pid,
                new Date().toISOString(),
                level,
                message
            );
        } else {
            formatString = util.format(
                "%s - [%s] - %s",
                new Date().toISOString(),
                level,
                message
            );
        }
        if ((/%s/gmu).test(formatString)) {
            formatString = util.format(
                formatString,
                args
            );
        } else if ((/%j/gmu).test(formatString)) {
            formatString = util.format(
                formatString,
                util.inspect(args)
            );
        }
        return formatString;
    }
}
