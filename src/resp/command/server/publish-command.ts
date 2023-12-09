import { maxParams, minParams, name } from "../../../decorators";
import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

/**
 * ### Available since 2.0.0.
 * ### PUBLISH channel message
 *
 * Posts a message to the given channel.
 *
 * ### Return value
 * Integer reply: the number of clients that received the message.
 */
@maxParams(2)
@minParams(2)
@name("publish")
export class PublishCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          request.getParams()
      );
      const channel: string = request.getParam(0),
          message: string = request.getParam(1);
      this.logger.debug(`Publishing to channel "${channel}" > "${message}"`);
      const responses: number = request.getServerContext().publish(
          channel,
          message
      );
      this.logger.debug(`The message was delivered to ${responses} client(s)`);
      return RedisToken.integer(responses);
  }
}
