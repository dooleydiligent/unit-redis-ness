import { IRequest } from "../../../server/request";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

export class QuitCommand extends IRespCommand {
    public name = "quit";

    public execSync(request: IRequest): RedisToken {
        return RedisToken.responseOk();
    }
}
