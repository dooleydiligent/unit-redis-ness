import { AbstractRedisToken } from './abstract-redis-token';
import { RedisTokenType } from './redis-token-type';

export class StatusRedisToken extends AbstractRedisToken<string> {
  constructor(value: string) {
    super(RedisTokenType.STATUS, value);
  }
}
