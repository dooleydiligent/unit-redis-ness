import { RespServer, sendCommand } from 'unit-redis-ness';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';

process.env.REDIS_HOST = '127.0.0.1';
// process.env.REDIS_PORT = '6379';

const respServer = new RespServer();
const client: net.Socket = new net.Socket();

describe('Some test suite', () => {
  before((done) => {
    respServer.on('ready', () => {
      console.log(`The redis server is ready to test your application`);
      done();
    });
    respServer.start();
  });

  after((done) => {
    respServer.on('closed', () => {
      console.log(`The redis server has shut down`);
      done();
    });
    respServer.stop();
  });
  it('should start the redis server and allow a connection', async () => {
    const response = await sendCommand(client, ['PING']);
    expect(response).to.be.a('string');
    expect(response).to.equal('PONG');
  });
});
