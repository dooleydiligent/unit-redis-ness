import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('move-command test', () => {
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
   * Functional testing of the move command
   */
  it('should report ZERO when the source key does not exist', async () => {
    response = await sendCommand(client, ['move', uniqueKey, '0']);
    expect(response).to.equal(0);
  });
  it('should also report ZERO when the target key already exists', async () => {
    response = await sendCommand(client, ['set', uniqueKey, 'database ZERO']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['exists', uniqueKey]);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['move', uniqueKey, '0']);
    expect(response).to.equal(0);
  });
  it('should move a key from one database to another otherwise', async () => {
    response = await sendCommand(client, ['move', uniqueKey, '14']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['exists', uniqueKey]);
    expect(response).to.equal(0);
    response = await sendCommand(client, ['select', '14']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['exists', uniqueKey]);
    expect(response).to.equal(1);
  });
  it('should report error when target database is invalid and key exists', async () => {
    // Database 14 is already selected
    response = await sendCommand(client, ['move', uniqueKey, 'InvalidDb']);
    expect(response).to.equal('ReplyError: ERR index out of range');
  });
});
