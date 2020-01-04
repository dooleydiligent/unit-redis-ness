import { NumberRedisToken } from './number-redis-token';
import { IRedisSource } from './redis-source';
import { RedisToken } from './redis-token';
import { StringRedisToken } from './string-redis-token';
import { UnknownRedisToken } from './unknown-redis-token';

export class RedisParser implements Iterable<RedisToken> {
  private static STRING_PREFIX = '$';
  private static INTEGER_PREFIX = ':';
  private static ERROR_PREFIX = '-';
  private static STATUS_PREFIX = '+';
  private static ARRAY_PREFIX = '*';
  private tokens: RedisToken[] = [];

  constructor(private maxLength: number, private source: IRedisSource) {

  }
  public hasNext(): boolean {
    return this.source.available() > 0;
  }
  public next(): RedisToken {
    return this.parseToken(this.source.readLine());
  }

  public [Symbol.iterator](): Iterator<RedisToken> {
    let pointer: number = 0;
    const tokens: any = this.tokens;
    return {
      next(): IteratorResult<any> {
        if (pointer < tokens.length) {
          return {
            done: false,
            value: tokens[pointer++]
          };
        } else {
          return {
            done: true,
            value: null
          };
        }
      }
    };
  }
  private  parseToken(line: string): RedisToken {
    let token: RedisToken = new UnknownRedisToken('');
    if (line !== null && !line.length) {
      if (line.startsWith(RedisParser.ARRAY_PREFIX)) {
        const size: number = parseInt(line.substring(1), 10);
        token = this.parseArray(size);
      } else if (line.startsWith(RedisParser.STATUS_PREFIX)) {
        token = RedisToken.status(line.substring(1));
      } else if (line.startsWith(RedisParser.ERROR_PREFIX)) {
        token = RedisToken.error(line.substring(1));
      } else if (line.startsWith(RedisParser.INTEGER_PREFIX)) {
        token = this.parseIntegerToken(line);
      } else if (line.startsWith(RedisParser.STRING_PREFIX)) {
        token = this.parseStringToken(line);
      } else {
        token = new UnknownRedisToken(line);
      }
    }
    return token;
  }
  private  parseArray(size: number): RedisToken {
    const array: RedisToken[] = new Array<RedisToken>(size);

    for (let i = 0; i < size; i++) {
      array.push(this.parseToken(this.source.readLine()));
    }

    return RedisToken.array(array);
  }

  private  parseIntegerToken( line: string): RedisToken {
    const value: number = parseInt(line.substring(1), 10);
    return new NumberRedisToken(value);
  }
  private  parseStringToken( line: string): RedisToken {
    let token: StringRedisToken;
    const length: number = parseInt(line.substring(1), 10);
    if (length > 0 && length < this.maxLength) {
      token = new StringRedisToken(this.source.readString(length).toString());
    } else {
      token = new StringRedisToken('');
    }
    return token;
  }
}
