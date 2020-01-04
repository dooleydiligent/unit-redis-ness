import { Logger } from '../../logger';
import { AbstractRedisToken } from '../protocol/abstract-redis-token';
import { RedisTokenType } from '../protocol/redis-token-type';

export class RespSerialize {
  private static ARRAY = '*';
  private static ERROR = '-';
  private static INTEGER = ':';
  private static SIMPLE_STRING = '+';
  private static BULK_STRING = '$';
  private static DELIMITER = '\r\n';
  private logger: Logger = new Logger(module.id);
  private value: string = '';
  constructor(private message: AbstractRedisToken<any>) {
  }
  public serialize(): string {
    this.logger.debug(`serialize(${JSON.stringify(this.message)})`);
    if (this.message.getType() === RedisTokenType.ARRAY) {
      this.value += `${RespSerialize.ARRAY}${this.message.getValue().length}${RespSerialize.DELIMITER}`;
      for (const obj of this.message.getValue()) {
        this.value += new RespSerialize(obj).serialize();
      }
    } else {
      switch (this.message.getType()) {
        case RedisTokenType.STATUS:
          this.value += `${RespSerialize.SIMPLE_STRING}${this.message.getValue()}${RespSerialize.DELIMITER}`;
          break;
        case RedisTokenType.INTEGER:
          this.value += `${RespSerialize.INTEGER}${this.message.getValue()}${RespSerialize.DELIMITER}`;
          break;
        case RedisTokenType.STRING:
          if (this.message.getValue() && this.message.getValue().length > 0) {
            this.value += `${RespSerialize.BULK_STRING}${this.message.getValue().length}${RespSerialize.DELIMITER}${this.message.getValue().toString()}`;
          } else {
            this.value += `${RespSerialize.BULK_STRING}-1`;
          }
          this.value += `${RespSerialize.DELIMITER}`;
          break;
        case RedisTokenType.ERROR:
        default:
          this.logger.warn(`msg.type is unexpected: ${this.message.getType()}`);
          this.logger.warn(`RedisTokenType.STRING is ${RedisTokenType.STRING}`);
          this.value += `${RespSerialize.ERROR}${this.message.getValue()}${RespSerialize.DELIMITER}`;
      }
    }
    return this.value;
  }
}
