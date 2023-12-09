import {Blocking, MaxParams, MinParams, Name} from "../../../decorators";
import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {TimedEmitter} from "../../../timed-emitter";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

/**
 * ### Available since 2.0.0.
 * ### SUBSCRIBE channel [channel ...]
 *
 * Subscribes the client to the specified channels.
 *
 * Once the client enters the subscribed state it is not supposed to issue any other commands,
 * except for additional SUBSCRIBE, PSUBSCRIBE, UNSUBSCRIBE, PUNSUBSCRIBE, PING and QUIT commands.
 * ### Return value
 * Array reply: The 'subscribe' keyword followed by [channel name, aggregate subscribe count]
 * for each channel supplied.
 */
@Blocking(true)
@maxParams(-1)
@minParams(1)
@name("subscribe")
export class SubscribeCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest): Promise<RedisToken> {
      return new Promise((resolve) => {
          this.logger.debug(
              `${request.getCommand()}.execute(%s)`,
              request.getParams()
          );
          const channels: string[] = [];

          for (const channel of request.getParams()) {
              if (!request.getSession().isSubscribed(channel)) {
                  channels.push(channel);
              }
          }
          if (channels.length > 0) {
              for (const channel of channels) {
                  const timedEvent: TimedEmitter = new TimedEmitter(
                      0,
                      [channel],
                      request.getServerContext()
                  ),

                      removeListener: any = (name: string, te: TimedEmitter, callback: any) => {
                          this.logger.debug(`Removing listener for ${name}`);
                          te.off(
                              name,
                              callback
                          );
                      };
                  timedEvent.on(
                      "timeout",
                      (eventNames: string[]) => {
                          for (const name of eventNames) {
                              this.logger.debug(`Timeout on channel "${name}"`);
                              removeListener(
                                  name,
                                  timedEvent,
                                  request.getSession().getSubscription(name)
                              );
                              // Reinstate these listeners
                              this.execSync(request);
                          }
                      }
                  );
                  this.logger.debug(`Adding listener for channel "${channel}"`);
                  timedEvent.callback = (data: any) => {
                      this.logger.debug(
                          "TimedEvent.callback received name: \"%s\"",
                          data
                      );
                      const publish: RedisToken[] = [
                          RedisToken.string("message"),
                          RedisToken.string(data.channel),
                          RedisToken.string(data.message)
                      ];
                      request.getSession().publish(RedisToken.array(publish));
                  };
                  timedEvent.on(
                      channel,
                      timedEvent.callback
                  );
                  request.getSession().subscribe(
                      channel,
                      timedEvent
                  );
                  const response: RedisToken[] = [RedisToken.string("subscribe")];
                  response.push(RedisToken.string(channel));
                  response.push(RedisToken.integer(request.getSession().getSubscriptionNames().length));
                  request.getSession().publish(RedisToken.array(response));
              }

              /*
               * This will not return until unsubscribe is called on all of the channels in this request
               * TODO: actually resolve this when required
               * Return (RedisToken.responseOk());
               */
          } else {
              // I'm only guessing this is the proper response
              return RedisToken.responseOk();
          }
      });
  }
}
