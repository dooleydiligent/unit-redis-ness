import {AbstractRedisToken} from "./abstract-redis-token";
import {RedisTokenType} from "./redis-token-type";

export class ArrayRedisToken extends AbstractRedisToken<any[]> {
    constructor(value: any[]) {
        super(
            RedisTokenType.ARRAY,
            value
        );
    }
}
