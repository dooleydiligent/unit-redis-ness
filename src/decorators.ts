import * as util from 'util';
import { DataType } from './resp/data/data-type';

const debugLog = util.debuglog('decorators');
/**
 * Apply a DataType to the command
 * @param dataType DataType required by the command
 */
export const DbDataType = (dataType: DataType ) => {
  debugLog(`DbDataType: ${dataType}`);
  // tslint:disable-next-line
  return (constructor: Function) => {
    constructor.prototype.dataType = dataType;
  };
};
/**
 * Apply a command name to the instantiated IRespCommand
 * @param name The name of the class
 */
export const Name = (name: string) => {
  debugLog(`Name: ${name}`);
  // tslint:disable-next-line
  return (constructor: Function) => {
    constructor.prototype.name = name;
  };
};
/**
 * Apply minimum number of parameters.  The command-wrapper supplies
 * -1 if it is not supplied on the command
 * @param minParams The minimum number of parameters required
 */
export const MinParams = (minParams: number) => {
  debugLog(`MinParams: ${minParams}`);
  // tslint:disable-next-line
  return (constructor: Function) => {
    constructor.prototype.minParams = minParams;
  };
};
/**
 * Apply maxixmum number of parameters.  The command-wrapper supplies
 * -1 if it is not supplied on the command
 * @param maxParams The maxixmum number of parameters supported
 */
export const MaxParams = (maxParams: number) => {
  debugLog(`MaxParams: ${maxParams}`);
  // tslint:disable-next-line
  return (constructor: Function) => {
    constructor.prototype.maxParams = maxParams;
  };
};
