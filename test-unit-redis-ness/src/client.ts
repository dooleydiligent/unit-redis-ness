import * as net from "net";
import {Logger} from "./logger";

/* Tslint:disable-next-line */
const Parser = require("redis-parser"),
    logger: Logger = new Logger(module.id);

let previousListener: any = null;

export const sendCommand = (client: net.Socket, commands: string[]): Promise<string | string[] | null> => {
    let commandString = `*${commands.length}\r\n`;
    for (const element of commands) {
        commandString += `$${element.length}\r\n${element}\r\n`;
    }
    if (previousListener) {
        client.removeListener(
            "data",
            previousListener
        );
    }
    return new Promise((resolve) => {
        let response: string | null = null;
        previousListener = (data: any) => {
            logger.debug(`client REPLY: ${data.toString().replace(
                /\r/g,
                "\\r"
            ).
                replace(
                    /\n/g,
                    "\\n"
                )}`);

            const parser = new Parser({
                "returnBuffers": false,
                "returnError": (err: any) => {
                    response = err.toString();
                    resolve(response);
                },
                "returnReply": (reply: any) => {
                    response = reply;
                    //          Client.destroy();
                    resolve(response);
                },
                "stringNumbers": false
            });
            parser.reset();
            parser.execute(data);
        };
        client.on(
            "data",
            previousListener
        );

        client.on(
            "close",
            (hadError: boolean) => {
                logger.debug(`client.close() ERROR: ${hadError}`);
            }
        );
        if (client.remoteAddress === undefined && client.remotePort === undefined) {
            client.connect(
                Number(process.env.REDIS_PORT || 6379),
                process.env.REDIS_HOST || "localhost",
                () => {
                    client.write(commandString);
                }
            );
        } else {
            client.write(commandString);
        }
    });
};
