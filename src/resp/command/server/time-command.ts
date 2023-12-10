import { IRequest } from "../../../server/request";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

/**
 * Available since v2.6.0
 * The TIME command returns the current server time as a two items lists:
 * a Unix timestamp and the amount of microseconds already elapsed in the
 * current second. Basically the interface is very similar to the one of
 * the gettimeofday system call.
 *
 * RETURNS: A multi bulk reply containing two elements:
 * unix time in seconds.
 * microseconds.
 */
export class TimeCommand extends IRespCommand {
    public maxParams = 0

    public minParams = 0

    public name = "time"

    public execSync(request: IRequest): RedisToken {
        const currentTime: number[] = process.hrtime();
        return RedisToken.array([
            RedisToken.string(String(currentTime[0])),
            RedisToken.string(String(currentTime[1]))
        ]);
    }
}
