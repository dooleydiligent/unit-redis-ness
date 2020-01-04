import { RedisToken } from './redis-token';
import { RedisTokenType } from './redis-token-type';

export abstract class AbstractRedisToken<T> implements RedisToken {
  private static SEPARATOR: string = '=>';

  constructor(private type: RedisTokenType, private value: T ) {
  }
  public getType(): RedisTokenType {
    return this.type;
  }
  public getValue(): T {
    return this.value;
  }
  public toString(): string {
    return `${this.type}${AbstractRedisToken.SEPARATOR}${this.value}`;
  }
}
