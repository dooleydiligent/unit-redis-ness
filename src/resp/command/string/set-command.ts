import * as util from 'util';
import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
interface IParameters {
  ifExists: boolean;
  ifNotExists: boolean;
  ttl: number | null;
}
/**
 * Available (in this form) since v2.6.12
 *
 * Set key to hold the string value.
 * If key already holds a value, it is overwritten,
 * regardless of its type.
 *
 * Any previous time to live associated with the key is discarded on successful SET operation.
 *
 * EX seconds -- Set the specified expire time, in seconds.
 * PX milliseconds -- Set the specified expire time, in milliseconds.
 * NX -- Only set the key if it does not already exist.
 * XX -- Only set the key if it already exist.
 *
 * RETURNS:
 * Simple string reply:
 * OK if SET was executed correctly.
 * Null reply: a Null Bulk Reply is returned if the SET operation was not performed
 * because the user specified the NX or XX option but the condition was not met.
 *
 * Note that XX or NX can be specified multiple times without change in behavior
 */
@DbDataType(DataType.STRING)
@MaxParams(5)
@MinParams(2)
@Name('set')
export class SetCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`executeDBRequest()`, request.getParams());
    try {
      const parameters: IParameters = this.parse(request);
      const key: string = request.getParam(0).toString();
      const value: DatabaseValue = this.parseValue(request, parameters);
      const savedValue = this.saveValue(db, parameters, key, value);
      return savedValue && savedValue.toString() === value.toString() ?
        RedisToken.responseOk() : RedisToken.nullString();
    } catch (ex) {
      this.logger.warn(`Exception processing request SET ${request.getParams()}`, ex);
      return RedisToken.error(ex);
    }
  }
  private parse(request: IRequest): IParameters {
    const parameters: IParameters = {
      ifExists: false,
      ifNotExists: false,
      ttl: null
    };
    if (request.getLength() > 2) {
      for (let i = 2; i < request.getLength(); i++) {
        const option: string = request.getParam(i);
        if (this.match('EX', option)) {
          if (parameters.ttl != null) {
            throw new Error('Syntax Exception - cannot set ttl twice');
          }
          parameters.ttl = (this.parseTtl(request, ++i) * 1000);
        } else if (this.match('PX', option)) {
          if (parameters.ttl != null) {
            throw new Error('Syntax Exception - cannot set ttl twice');
          }
          parameters.ttl = this.parseTtl(request, ++i);
        } else if (this.match('NX', option)) {
          if (parameters.ifExists) {
            throw new Error('Syntax Exception - cannot set NX with XX');
          }
          parameters.ifNotExists = true;
        } else if (this.match('XX', option)) {
          if (parameters.ifNotExists) {
            throw new Error('Syntax Exception - cannot set XX with NX');
          }
          parameters.ifExists = true;
        } else {
          throw new Error('Cannot parse the command');
        }
      }
    }
    return parameters;
  }
  private match(str: string, option: string): boolean {
    return str.toLowerCase() === option.toString().toLowerCase();
  }
  private parseTtl(request: IRequest, i: number): number {
    const ttlOption: string = request.getParam(i);
    const value: number = parseInt(ttlOption.toString(), 10);
    if (value < 1) {
      throw new Error(`invalid expire time in set`);
    }
    return value;
  }
  private parseValue(request: IRequest, parameters: IParameters): DatabaseValue {
    const value: DatabaseValue = new DatabaseValue(
      DataType.STRING,
      request.getParam(1).toString(),
      parameters.ttl ? new Date().getTime() + parameters.ttl : undefined);
    return value;
  }
  private saveValue(db: Database, params: IParameters, key: string, value: DatabaseValue): DatabaseValue {
    let savedValue: DatabaseValue;
    if (params.ifExists) {
      savedValue = db.putIfPresent(key, value);
    } else if (params.ifNotExists) {
      savedValue = db.putIfAbsent(key, value);
    } else {
      this.logger.debug(`Setting ${util.inspect(key)} to ${util.inspect(value)}`);
      savedValue = db.put(key, value);
      this.logger.debug(`Returning ${util.inspect(savedValue)}`);
    }
    return savedValue;
  }
}