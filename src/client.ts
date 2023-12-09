import Parser = require("redis-parser");
import * as net from "net";
import { Logger } from "./logger";

const logger: Logger = new Logger(module.id);

let previousListener: EventListener | null = null;

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
        previousListener = (data: Event) => {
            const newdata = Buffer.from(data.toString().replace(
                /\r/gu,
                "\\r"
            ).
                replace(
                    /\n/gu,
                    "\\n"
                ));
            logger.debug(`client REPLY: ${newdata.toString()}`);

            const parser = new Parser({
                "returnBuffers": false,
                "returnError": (err: Error) => {
                    response = err.toString();
                    resolve(response);
                },
                "returnReply": (reply: string) => {
                    response = reply;
                    //          Client.destroy();
                    resolve(response);
                },
                "stringNumbers": false
            });
            parser.reset();
            parser.execute(newdata);
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
        if (!client.remoteAddress && !client.remotePort) {
            client.connect(
                Number(process.env.REDIS_PORT || "6379"),
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
