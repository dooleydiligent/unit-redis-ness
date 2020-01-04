import * as util from 'util';
/**
 * A simple logger.  Supports info, and warn without any configuration
 *
 * Leverages {@util}.debuglog(...) to enable debug logging
 * To use debug logging:
 *
 * ```
 * export NODE_DEBUG=module-name.js,other-module.js
 * ```
 *
 */
export class Logger {
  private logger: (msg: string, ...param: any[]) => void;
  /**
   * Initialize a logger
   * @param modname Should always be the value module.id
   */
  constructor(private modname: string) {
    if (this.modname) {
      this.modname = this.modname.split(/\//).pop() || this.modname;
      this.modname = this.modname.substring(0, this.modname.lastIndexOf('.'));
    } else {
      throw new Error('You must initialize the logger with module.id');
    }
    this.logger = util.debuglog(this.modname);
  }
  public info = (message: string, ...args: any[]) => {
    // tslint:disable-next-line
    console.info(this.format('info', message, true), args);
  }
  public debug = (message: string, ...args: any[]) => {
    this.logger(this.format('debug', message, false), args);
  }
  public warn = (message: string, ...args: any[]) => {
    // tslint:disable-next-line
    console.warn(this.format('warn', message, true), args);
  }
  private format(level: string, message: string, showName: boolean): string {
    if (showName) {
      return util.format(
        '%s %d: %s - [%s] - %s', this.modname.toUpperCase(),
        process.pid, new Date().toISOString(), level, message);
    } else {
      return util.format('%s - [%s] - %s', new Date().toISOString(), level, message);
    }
  }
}
