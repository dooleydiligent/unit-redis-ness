import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from './resp-command';

interface IParameters {
  ifExists: boolean;
  ifNotExists: boolean;
  ttl: number | null;
}
// Set must have at least two parameters.  They are key and value.  Both are strings
// Set can have one or two optional parameters
// These are:
// NX: Only set if it does not exist
// XX: Only set if it DOES exist
// EX <seconds> set ttl to <seconds>
// PX <millis>  set ttl to millis
export class SetCommand implements IRespCommand {
  public minParams: number = 2;
  public maxParams: number = 4;
  public isRespCommand: boolean = false;
  public paramLength: number = 2;
  public readOnly: boolean = false;
  public txIgnore: boolean = true;
  public pubSubAllowed: boolean = false;
  public dataType: DataType = DataType.STRING;
  public isDbCommand: boolean = true;
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`executeDBRequest()`, request.getParams());
    try {
      const parameters: IParameters = this.parse(request);
      const key: string = request.getParam(0).toString();
      const value: DatabaseValue = this.parseValue(request, parameters);
      const savedValue = this.saveValue(db, parameters, key, value);
      return value.toString() === savedValue.toString() ? RedisToken.responseOk() : RedisToken.nullString();
    } catch (ex) {
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
            throw new Error('Syntax Exception - cannot set NX twice');
          }
          parameters.ifNotExists = true;
        } else if (this.match('XX', option)) {
          if (parameters.ifNotExists) {
            throw new Error('Syntax Exception - cannot set XX twice');
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
      throw new Error(`ttl cannot be less than 1`);
    }
    return value;
  }
  private parseValue(request: IRequest, parameters: IParameters): DatabaseValue {
    let value: DatabaseValue = DatabaseValue.string(request.getParam(1).toString());
    if (parameters.ttl != null) {
      value = value.setExpiredAt(new Date().getTime() + parameters.ttl);
    }
    return value;
  }
  private saveValue(db: Database, params: IParameters, key: string, value: DatabaseValue): DatabaseValue {
    let savedValue: DatabaseValue;
    if (params.ifExists) {
      savedValue = db.putIfPresent(key, value);
    } else if (params.ifNotExists) {
      savedValue = db.putIfAbsent(key, value);
    } else {
      savedValue = db.put(key, value);
    }
    return savedValue;
  }
}
