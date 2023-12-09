import * as util from "util";
import { DataType } from "./resp/data/data-type";

// Tslint:disable:ban-types
const debugLog = util.debuglog("decorators");

/**
 * Apply a DataType to the command
 * @param dataType DataType required by the command
 */
export const dbDataType = (dataType: DataType) => {
    debugLog(`dbDataType: ${dataType}`);
    return (constructor: () => void) => {
        constructor.prototype.dataType = dataType;
    };
};

/**
 * Apply a command name to the instantiated IRespCommand
 * @param nom The name of the class
 */
export const name = (nom: string) => {
    debugLog(`name: ${nom}`);
    return (constructor: () => void) => {
        constructor.prototype.name = nom;
    };
};

/**
 * Apply minimum number of parameters.  The command-wrapper supplies
 * -1 if it is not supplied on the command
 * @param minparams The minimum number of parameters required
 */
export const minParams = (minparams: number) => {
    debugLog(`minParams: ${minparams}`);
    return (constructor: () => void) => {
        constructor.prototype.minParams = minparams;
    };
};

/**
 * Apply maxixmum number of parameters.  The command-wrapper supplies
 * -1 if it is not supplied on the command
 * @param maxparams The maxixmum number of parameters supported
 */
export const maxParams = (maxparams: number) => {
    debugLog(`maxParams: ${maxparams}`);
    return (constructor: () => void) => {
        constructor.prototype.maxParams = maxparams;
    };
};
export const blocking = (block: boolean) => {
    debugLog(`blocking: ${block}`);
    return (constructor: () => void) => {
        constructor.prototype.blocking = block;
    };
};
