import {AbstractRedisToken} from "./abstract-redis-token";
import {RedisTokenType} from "./redis-token-type";

export class UnknownRedisToken extends AbstractRedisToken<string> {
    constructor(value: string) {
        super(
            RedisTokenType.UNKNOWN,
            value
        );
    }
}
