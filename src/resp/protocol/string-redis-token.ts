import {AbstractRedisToken} from "./abstract-redis-token";
import {RedisTokenType} from "./redis-token-type";

export class StringRedisToken extends AbstractRedisToken<string> {
    constructor(value: string) {
        super(
            RedisTokenType.STRING,
            value
        );
    }
}
