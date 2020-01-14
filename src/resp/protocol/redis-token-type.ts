/**
 * The only supported [RESP](https://redis.io/topics/protocol) response types
 */
export enum RedisTokenType {
  ARRAY = 'array',
  ERROR = 'error',
  INTEGER = 'integer',
  STATUS = 'status',
  STRING = 'string',
  UNKNOWN = 'unknown'
}
