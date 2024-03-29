import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * ### Available since 2.0.0.
 * ### UNSUBSCRIBE [channel [channel ...]]
 *
 * Unsubscribes the client from the given channels, or from all of them if none is given.
 *
 * When no channels are specified, the client is unsubscribed from all the previously
 * subscribed channels. In this case, a message for every unsubscribed channel will be sent
 * to the client.
 * ### Return value
 * Appears to be an array.  The 'unsubscribe' keyword followed by the list of subscribed
 * channels and then the count of those channels.
 */
export class UnsubscribeCommand extends IRespCommand {
    public maxParams = -1

    public minParams = 1

    public name = "unsubscribe"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const response: RedisToken[] = [RedisToken.string("unsubscribe")],
            channels: string[] = [];
        for (const channel of request.getParams()) {
            if (channels.indexOf(channel) === -1) {
                channels.push(channel);
            }
        }
        if (channels.length === 0) {
            channels.push(...request.getSession().getSubscriptionNames());
        }
        for (const channel of channels) {
            this.logger.debug(`Trying to unsubscribe from channel "${channel}"`);
            response.push(RedisToken.string(channel));
            const timedEvent: any = request.getSession().getSubscription(channel);
            if (timedEvent) {
                request.getSession().unSubscribe(channel);
            }
        }
        response.push(RedisToken.integer(request.getSession().getSubscriptionNames().length));
        return RedisToken.array(response);
    }
}
