import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('type-command test', () => {
  let respServer: RespServer;
  let client: net.Socket = new net.Socket();
  before((done) => {
    respServer = new RespServer();
    respServer.on('ready', () => {
      done();
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
   * Functional testing of the type command
   */
  it('should report the type of key', async () => {
    let response: any = await sendCommand(client, ['set', 'string-key', 'test']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['type', 'string-key']);
    expect(response).to.equal('string');

    response = await sendCommand(client, ['lpush', 'list-key', 'test']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['type', 'list-key']);
    expect(response).to.equal('list');

    response = await sendCommand(client, ['sadd', 'set-key', 'test']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['type', 'set-key']);
    expect(response).to.equal('set');

    response = await sendCommand(client, ['zadd', 'zkey', '123', 'something']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['type', 'zkey']);
    expect(response).to.equal('zset');
  });
});
