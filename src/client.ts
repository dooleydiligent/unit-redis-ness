import { expect } from 'chai';
import * as net from 'net';
import { Logger } from './logger';

/* tslint:disable-next-line */
const Parser = require('redis-parser');
const logger: Logger = new Logger(module.id);

process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6378';

export const sendCommand = (client: net.Socket, commands: string[]): Promise<string | string[] | null> => {
  let commandString = `*${commands.length}\r\n`;
  for (const element of commands) {
    commandString += `$${element.length}\r\n${element}\r\n`;
  }
  client.removeAllListeners();
  return new Promise((resolve) => {
    let response: string | null = null;
    client.on('data', (data) => {
      logger.debug(`client REPLY: ${data.toString().replace(/\r/g, '\\r').replace(/\n/g, '\\n')}`);

      expect(data.constructor.name).to.equal('Buffer');
      const parser = new Parser({
        returnBuffers: false,
        returnError: (err: any) => {
          response = err.toString();
          resolve(response);
        },
        returnReply: (reply: any) => {
          response = reply;
          //          client.destroy();
          resolve(response);
        },
        stringNumbers: false
      });
      parser.reset();
      parser.execute(data);
    });

    client.on('close', (hadError: boolean) => {
      logger.debug(`client.close() ERROR: ${hadError}`);
    });
    if (client.remoteAddress === undefined && client.remotePort === undefined) {
      client.connect(Number(process.env.REDIS_PORT || 6379), process.env.REDIS_HOST || 'localhost', () => {
        client.write(commandString);
      });
    } else {
      client.write(commandString);
    }
  });
};
