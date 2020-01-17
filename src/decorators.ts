import * as util from 'util';
import { DataType } from './resp/data/data-type';

// tslint:disable:ban-types
const debugLog = util.debuglog('decorators');
/**
 * Apply a DataType to the command
 * @param dataType DataType required by the command
 */
export const DbDataType = (dataType: DataType ) => {
  debugLog(`DbDataType: ${dataType}`);
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
  return (constructor: Function) => {
    constructor.prototype.maxParams = maxParams;
  };
};
export const Blocking = (blocking: boolean ) => {
  debugLog(`Blocking: ${blocking}`);
  return (constructor: Function) => {
    constructor.prototype.blocking = blocking;
  };
};
