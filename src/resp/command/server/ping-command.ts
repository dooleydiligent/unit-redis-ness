import { IRequest } from "../../../server/request";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

export class PingCommand extends IRespCommand {
  public maxParams = 0

  public minParams = 0

  public name = "ping"

  public static PONG: string = "PONG";

  public execSync(request: IRequest): RedisToken {
      return RedisToken.string(PingCommand.PONG);
  }
}
