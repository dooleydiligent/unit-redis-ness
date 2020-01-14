import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import * as util from 'util';
import { RespServer } from '../../../src/server/resp-server';
import { sendCommand } from '../../common.test';

describe('multi command test', () => {
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
   * Functional testing of the multi command.
   */
  it('should not allow nested MULTI invocations', async () => {
    response = await sendCommand(client, ['multi']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['multi']);
    expect(response).to.equal('ReplyError: ERR MULTI calls can not be nested');
  });
  it('should respect the DISCARD command', async () => {
    response = await sendCommand(client, ['discard']);
    expect(response).to.equal('OK');
  });
  it('should not allow DISCARD without MULTI', async () => {
    response = await sendCommand(client, ['discard']);
    expect(response).to.equal('ReplyError: ERR DISCARD without MULTI');
  });
  it('should continue to validate commands after MULTI', async () => {
    response = await sendCommand(client, ['multi']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['unknown', 'command']);
    expect(response).to.equal('ReplyError: ERR unknown command `unknown`, with args beginning with: `command`, ', `${response}`);
    response = await sendCommand(client, ['lpush', 'test', 'one', 'two', 'three']);
    expect(response).to.equal('QUEUED');
  });
  it('should EXECABORT from a previous error', async () => {
    response = await sendCommand(client, ['exec']);
    expect(response).to.equal('ReplyError: EXECABORT Transaction discarded because of previous errors.');
  });
  it('should queue a set of commands when there is no intervening error', async () => {
    response = await sendCommand(client, ['multi']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['lpush', 'test', 'one', 'two', 'three']);
    expect(response).to.equal('QUEUED');
    response = await sendCommand(client, ['exec']);
    expect(response).to.eql([3]);
  });
  it('should reset transaction state after executing commands', async () => {
    response = await sendCommand(client, ['multi']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['discard']);
    expect(response).to.equal('OK');
  });
  it('should return the results of multiple commands in the order provided', async () => {
    response = await sendCommand(client, ['multi']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['lpop', 'test']);
    expect(response).to.equal('QUEUED');
    response = await sendCommand(client, ['lpop', 'test']);
    expect(response).to.equal('QUEUED');
    response = await sendCommand(client, ['brpoplpush', 'test', 'dest', '0']);
    expect(response).to.equal('QUEUED');
    response = await sendCommand(client, ['exec']);
    expect(response).to.eql(['three', 'two', 'one']);
    response = await sendCommand(client, ['exists', 'test']);
    expect(response).to.equal(0);
    response = await sendCommand(client, ['exists', 'dest']);
    expect(response).to.equal(1);
  });
  it('should validate the behavior of brpoplpush', async () => {
    response = await sendCommand(client, ['flushall']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['lpush', 'test', 'one', 'two', 'three']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['lpop', 'test']);
    expect(response).to.equal('three');
    response = await sendCommand(client, ['lpop', 'test']);
    expect(response).to.equal('two');
    response = await sendCommand(client, ['brpoplpush', 'test', 'dest', '0']);
    expect(response).to.equal('one');
  });
  it('should fail when EXEC issued without MULTI', async () => {
    response = await sendCommand(client, ['exec']);
    expect(response).to.equal('ReplyError: ERR EXEC without MULTI');
  });
});
