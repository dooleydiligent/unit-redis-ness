import { ArrayRedisToken } from './array-redis-token';
import { ErrorRedisToken } from './error-redis-token';
import { NumberRedisToken } from './number-redis-token';
import { RedisTokenType } from './redis-token-type';
import { StatusRedisToken } from './status-redis-token';
import { StringRedisToken } from './string-redis-token';

/**
 * An abstract wrapper for RESP Protocol messages.
 * See {@link RedisTokenType}
 */
export abstract class RedisToken {
  public static nullString(): RedisToken {
    return RedisToken.NULL_STRING;
  }
  public static responseOk(): RedisToken {
    return RedisToken.RESPONSE_OK;
  }
  public static status(str: string): RedisToken {
    return new StatusRedisToken(str);
  }
  public static string(str: string): RedisToken {
    return new StringRedisToken(str);
  }
  public static boolean(tf: boolean): RedisToken {
    return new NumberRedisToken(tf ? 1 : 0);
  }
  public static integer(i: number): RedisToken {
    return new NumberRedisToken(i);
  }
  public static array(redisTokens: any[]): RedisToken {
    return new ArrayRedisToken(redisTokens);
  }
  public static error(str: string): RedisToken {
    return new ErrorRedisToken(str);
  }
  private static NULL_STRING: RedisToken = RedisToken.string('');
  private static RESPONSE_OK: RedisToken = RedisToken.status('OK');
  public abstract getType(): RedisTokenType;
}
