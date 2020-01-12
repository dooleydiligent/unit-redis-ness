import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('lrem-command test', () => {
  let respServer: RespServer;
  const client: net.Socket = new net.Socket();
  let response: any;
  before((done) => {
    respServer = new RespServer();
    respServer.on('ready', async () => {
      await sendCommand(client, ['flushall']);
      await sendCommand(client, ['select', '0'])
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
   * Functional testing of the lrem command
   */
  it('should NOT report 0 when lrem called with invalid non-existent key', async () => {
    response = await sendCommand(client, ['lrem', 'no-key', 'negative one thousand', 'test']);
    expect(response).to.equal('ReplyError: ERR value is not an integer or out of range');
  });
  it('should report ERR when lrem called against existing key with invalid count argument', async () => {
    response = await sendCommand(client, ['lpush', 'lrem', 'akey']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['lrem', 'lrem', 'negative one thousand', 'test']);
    expect(response).to.equal('ReplyError: ERR value is not an integer or out of range');
  });
  it('should report 0 when lrem called with valid arguments and non-existing element', async () => {
    response = await sendCommand(client, ['lrem', 'lrem', '0', 'does not exist']);
    expect(response).to.equal(0);
  });
  it('should use negative index counters', async () => {
    response = await sendCommand(client, ['RPUSH',  'mylist', 'hello']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['RPUSH',  'mylist', 'hello']);
    expect(response).to.equal(2);
    response = await sendCommand(client, ['RPUSH',  'mylist', 'foo']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['RPUSH',  'mylist', 'hello']);
    expect(response).to.equal(4);
    response = await sendCommand(client, ['lrem', 'mylist', '-2', 'hello']);
    expect(response).to.equal(2);
    response = await sendCommand(client, ['lrange', 'mylist', '0', '-1']);
    expect(response).to.eql(['hello', 'foo']);
  });
});
