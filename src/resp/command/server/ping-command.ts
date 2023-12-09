import { maxParams, minParams, name } from "../../../decorators";
import {IRequest} from "../../../server/request";
import {RedisToken} from "../../protocol/redis-token";
import {IRespCommand} from "../resp-command";

@maxParams(0)
@minParams(0)
@name("ping")
export class PingCommand extends IRespCommand {
  public static PONG: string = "PONG";

  public execSync(request: IRequest): RedisToken {
      return RedisToken.string(PingCommand.PONG);
  }
}
