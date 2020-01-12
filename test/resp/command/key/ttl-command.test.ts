import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('ttl-command test', () => {
  let respServer: RespServer;
  const client: net.Socket = new net.Socket();
  let response: any;
  before((done) => {
    respServer = new RespServer();
    respServer.on('ready', () => {
      // Set a key with a couple - second TTL to validate exists respects TTL
      sendCommand(new net.Socket(), ['set', 'ttlkey', 'value', 'EX', '30'])
      .then(() => {
        done();
      });
    });
    respServer.start();
  });
  beforeEach(() => {
    sinon.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
    await respServer.stop();
  });
  /**
   * Functional testing of the ttl command
   */
  it('should report -2 when the key does not exist', async () => {
    response = await sendCommand(client, ['ttl', 'nokey']);
    expect(response).to.equal(-2);
  });
  it('should return -1 when the key exists but does not have a ttl', async () => {
    response = await sendCommand(client, ['set', 'newkey', 'test']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['ttl', 'newkey']);
    expect(response).to.equal(-1);
  });
  it('should return the current ttl in seconds when available', async () => {
    response = await sendCommand(client, ['ttl', 'ttlkey']);
    expect(response).to.be.greaterThan(0);
    expect(response).to.be.lessThan(31);
  });
});
