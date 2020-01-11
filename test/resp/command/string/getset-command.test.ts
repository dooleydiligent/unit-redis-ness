import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('getset-command test', () => {
  let respServer: RespServer;
  const client: net.Socket = new net.Socket();
  let response: any;
  const uniqueKey = `move-key${new Date().getTime()}`;
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
   * Functional testing of the getset command
   */
  it('should report NIL when the original key does not exist', async () => {
    response = await sendCommand(client, ['getset', uniqueKey, '0']);
    expect(response).to.equal(null);
  });
  it('should report the previous value of the key', async () => {
    response = await sendCommand(client, ['getset', uniqueKey, 'ninety nine']);
    expect(response).to.equal('0');
    response = await sendCommand(client, ['getset', uniqueKey, 'nothing']);
    expect(response).to.equal('ninety nine');
  });
});
