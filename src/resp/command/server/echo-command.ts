import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

export class EchoCommand extends IRespCommand {
  public maxParams = 1

  public minParams = 1

  public name = "echo"

  private logger: Logger = new Logger(module.id);

  public execSync(request: IRequest): RedisToken {
      this.logger.debug(
          `${request.getCommand()}.execute(%s)`,
          ...request.getParams()
      );
      return RedisToken.string(request.getParam(0));
  }
}
