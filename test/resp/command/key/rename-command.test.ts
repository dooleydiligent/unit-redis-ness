import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('rename-command test', () => {
  let respServer: RespServer;
  const client: net.Socket = new net.Socket();
  let response: any;
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
   * Functional testing of the rename command
   */
  it('should report an error when the key does not exist', async () => {
    response = await sendCommand(client, ['rename', 'mykey', 'my-otherkey']);
    expect(response).to.equal('ReplyError: ERR no such key');
  });
  it('should rename a key', async () => {
    response = await sendCommand(client, ['set', 'mykey', 'value']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['rename', 'mykey', 'my-otherkey']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['exists', 'mykey']);
    expect(response).to.equal(0);
    response = await sendCommand(client, ['exists', 'my-otherkey']);
    expect(response).to.equal(1);
  });
  it('should overwrite an existing key without notice', async () => {
    response = await sendCommand(client, ['set', 'myoriginalkey', 'something']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['rename', 'my-otherkey', 'myoriginalkey']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['get', 'myoriginalkey']);
    expect(response).to.equal('value');
  });
});
