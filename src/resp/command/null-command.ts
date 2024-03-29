import { IRequest } from "../../server/request";

import { IRespCommand } from "./resp-command";
import { RedisToken } from "../protocol/redis-token";


export class NullCommand extends IRespCommand {
    public name = "null"

    public execSync(request: IRequest): RedisToken {
        request.getSession().setError();
        let params: string = "";
        request.getParams().forEach((param) => {
            params += `\`${param}\`, `;
        });
        const response: string = `ERR unknown command \`${request.getCommand()}\`, with args beginning with: ${params}`;
        return RedisToken.error(response);
    }
}
