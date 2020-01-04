import { expect } from 'chai';
import 'mocha';
import * as net from 'net';

/* tslint:disable-next-line */
const Parser = require('redis-parser');

process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6378';

export const sendCommand = (client: net.Socket, commands: string[]): Promise<string | string[] | null> => {
  let commandString = `*${commands.length}\r\n`;
  for (const element of commands) {
    commandString += `$${element.length}\r\n${element}\r\n`;
  }
  return new Promise((resolve) => {
    let response: string | null = null;
    client.on('data', (data) => {
    console.debug(`\n\n\nclient REPLY: ${data.toString().replace(/\r/g, '\\r').replace(/\n/g, '\\n')}`);

      expect(data.constructor.name).to.equal('Buffer');
      const parser = new Parser({
        returnBuffers: false,
        returnError: (err: any) => {
          response = err.toString();
          client.destroy();
        },
        returnReply: (reply: string) => {
          response = reply;
          client.destroy();
        },
        stringNumbers: true
      });
      parser.reset();
      parser.execute(data);
    });

    client.on('close', () => {
      resolve(response);
    });

    client.connect(Number(process.env.REDIS_PORT || 6379), process.env.REDIS_HOST || 'localhost', () => {
      client.write(commandString);
    });
  });
};

/**
 * Rool-level before and after run only once
 * before and after the universe of tests
 */
before((done) => {
  done();
});

after(async () => {
});
