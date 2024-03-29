import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { TimedEmitter } from "../../../timed-emitter";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { RedisToken } from "../../protocol/redis-token";
import { RPoplPushCommand } from "./rpoplpush-command";

/**
 * ### Available since 2.2.0.
 * ### BRPOPLPUSH source destination timeout
 * BRPOPLPUSH is the blocking variant of [RPOPLPUSH]{@link RPoplPushCommand}. When source contains
 * elements, this command behaves exactly like RPOPLPUSH. When used inside a
 * {@link resp/command/multi-command.MultiCommand | MULTI}/{@link resp/command/exec-command.ExecCommand | EXEC} block,
 * this command behaves exactly like RPOPLPUSH. When source is empty, Redis will block the
 * connection until another client pushes to it or until timeout is reached. A timeout of zero
 * can be used to block indefinitely.
 *
 * See [RPOPLPUSH]{@link RPoplPushCommand} for more information.
 * ### Return value
 * Bulk string reply: the element being popped from source and pushed to destination. If timeout
 * is reached, a Null reply is returned.
 * ### Pattern: Reliable queue
 * Please see the pattern description in the [RPOPLPUSH]{@link RPoplPushCommand} documentation.
 * ### Pattern: Circular list
 * Please see the pattern description in the [RPOPLPUSH]{@link RPoplPushCommand} documentation.
 */
export class BRPoplPushCommand extends RPoplPushCommand {
    public blocking = true

    public dbDataType = DataType.LIST

    public minParams = 3

    public maxParams = 3

    public name = "brpoplpush"

    protected logger: Logger;

    constructor() {
        super();
        this.logger = new Logger(module.id);
    }

    public execSync(request: IRequest, db: Database): RedisToken | Promise<RedisToken> {
        return new Promise((resolve) => {
            const timeout: string = request.getParam(request.getParams().length - 1),
                // Run rpoplpush
                result: RedisToken = this.process(
                    request,
                    db
                );
            if (result === RedisToken.nullString()) {
                const eventNames: string[] = [],
                    eventCallbacks: any = {},
                    srcKey = request.getParam(0);
                eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:lpush ${srcKey}`);
                eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:rpush ${srcKey}`);
                eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:linsert ${srcKey}`);
                eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:lset ${srcKey}`);
                const timedEvent: TimedEmitter = new TimedEmitter(
                    Number(timeout),
                    eventNames,
                    request.getServerContext()
                );
                timedEvent.on(
                    "timeout",
                    () => {
                        this.logger.debug("Timeout");
                        this.removeListeners(
                            timedEvent,
                            eventCallbacks
                        );
                        resolve(RedisToken.nullString());
                    }
                );
                for (const eventName of eventNames) {
                    this.logger.debug(`Adding listener for ${eventName}`);
                    eventCallbacks[eventName] = () => {
                        this.logger.debug(`Received event ${eventName}`);
                        resolve(this.process(
                            request,
                            db
                        ));
                    };
                    timedEvent.on(
                        eventName,
                        eventCallbacks[eventName]
                    );
                }
            } else {
                this.logger.debug(`Resolving ${result}`);
                resolve(result);
            }
        });
    }

    private removeListeners(timedEvent: TimedEmitter, events: any) {
        for (const eName of Object.keys(events)) {
            this.logger.debug(`Removing listener for ${eName}`);
            timedEvent.off(
                eName,
                events[eName]
            );
        }
    }
}
