import { maxParams, minParams, name } from "../../../decorators";
import {Logger} from "../../../logger";
import {IRequest} from "../../../server/request";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

@maxParams(1)
@minParams(1)
@name("echo")
export class EchoCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          request.getParams()
      );
      return RedisToken.string(request.getParam(0));
  }
}
