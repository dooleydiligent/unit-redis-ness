import {AbstractRedisToken} from "./abstract-redis-token";
import {RedisTokenType} from "./redis-token-type";

export class NumberRedisToken extends AbstractRedisToken<number> {
    constructor(value: number) {
        super(
            RedisTokenType.INTEGER,
            value
        );
    }
}
