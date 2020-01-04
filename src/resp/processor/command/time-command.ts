import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from './resp-command';
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
export class TimeCommand implements IRespCommand {
  public readOnly: boolean = true;
  public txIgnore: boolean = true;
  public pubSubAllowed: boolean = false;
  public dataType: DataType = DataType.NONE;
  public isDbCommand: boolean = false;
  public maxParams: number = 0;
  public minParams: number = 0;
  public isRespCommand: boolean = true;
  public execute(request: IRequest): RedisToken {
    const currentTime: number[] = process.hrtime();
    return RedisToken.array(
      RedisToken.string(String(currentTime[0])),
      RedisToken.string(String(currentTime[1])));
  }
}
