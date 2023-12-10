import {AbstractRedisToken} from "./abstract-redis-token";
import {RedisTokenType} from "./redis-token-type";

export class ErrorRedisToken extends AbstractRedisToken<string> {
    constructor(value: string) {
        super(
            RedisTokenType.ERROR,
            value
        );
    }
}
