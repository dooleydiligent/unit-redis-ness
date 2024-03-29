import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { TimedEmitter } from "../../../timed-emitter";
import { RPopCommand } from "../../command/list/rpop-command";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { RedisToken } from "../../protocol/redis-token";

/**
 * ### Available since 2.0.0.
 * ### BRPOP key [key ...] timeout
 *
 * BRPOP is a blocking list pop primitive. It is the blocking version of {@link resp/command/list/rpop-command.RPopCommand | RPOP} because
 * it blocks the connection when there are no elements to pop from any of the given lists. An element
 * is popped from the tail of the first list that is non-empty, with the given keys being checked
 * in the order that they are given.
 *
 * ### See {@link TimedEmitter} for limitations
 *
 * See the {@link resp/command/list/blpop-command.BLPopCommand | BLPOP} documentation for the exact semantics, since BRPOP is
 * identical to BLPOP with the only difference being that it pops elements from the tail of a
 * list instead of popping from the head.
 * ### Return value
 * Array reply: specifically:
 * - A nil multi-bulk when no element could be popped and the timeout expired.
 * - A two-element multi-bulk with the first element being the name of the key where an element was
 * popped and the second element being the value of the popped element.
 * ### Examples
 * ```
 * redis> DEL list1 list2
 * (integer) 0
 * redis> RPUSH list1 a b c
 * (integer) 3
 * redis> BRPOP list1 list2 0
 * 1) "list1"
 * 2) "c"
 * ```
 */
export class BRPopCommand extends RPopCommand {
    public Blocking = true

    public DbDataType = DataType.LIST

    protected logger: Logger;

    constructor(maxParams: number, minParams: number, name: string) {
        super();
        this.constructor.prototype.maxParams = maxParams;
        this.constructor.prototype.minParams = minParams;
        this.constructor.prototype.name = name;
        this.logger = new Logger(module.id);
    }

    public execSync(request: IRequest, db: Database): RedisToken | Promise<RedisToken> {
        return new Promise((resolve) => {
            this.logger.debug(
                `${request.getCommand()}.execute(%s)`,
                ...request.getParams()
            );
            const timeout: string = request.getParam(request.getParams().length - 1),
                // Check all source keys first
                results: RedisToken[] = [];
            for (let index = 0; index < request.getParams().length - 1; index++) {
                const key = request.getParam(index),
                    result = this.process(
                        request,
                        db,
                        key
                    );
                if (result !== RedisToken.nullString()) {
                    results.push(RedisToken.string(key));
                    results.push(result);
                    break;
                }
            }
            if (results.length > 0) {
                resolve(RedisToken.array(results));
            } else {
                const eventNames: string[] = [],
                    eventCallbacks: any = {};
                for (let index = 0; index < request.getParams().length - 1; index++) {
                    const key = request.getParam(index);
                    eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:lpush ${key}`);
                    eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:rpush ${key}`);
                    eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:linsert ${key}`);
                    eventNames.push(`__keyevent@${request.getSession().getCurrentDb()}__:lset ${key}`);
                }
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
                        const keyName: string = `${eventName.split(" ")[1]}`,
                            callresults: RedisToken[] = [RedisToken.string(keyName)];
                        callresults.push(this.process(
                            request,
                            db,
                            keyName
                        ));
                        resolve(RedisToken.array(callresults));
                    };
                    timedEvent.on(
                        eventName,
                        eventCallbacks[eventName]
                    );
                }
                //        Resolve(RedisToken.array(results));
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
