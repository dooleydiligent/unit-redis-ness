import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('llen-command test', () => {
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
   * Functional testing of the llen command
   */
  it('should report 0 when llen called on non-existent key', async () => {
    response = await sendCommand(client, ['llen', 'no-key']);
    expect(response).to.equal(0);
  });
  it('should report WRONGTYPE when attempting to get llen of non-list key', async () => {
    response = await sendCommand(client, ['set', 'lkey', 'test']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['llen', 'lkey']);
    expect(response).to.equal('ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value');
  });
  it('should return the correct list length', async () => {
    const uniqueKey = `lkey-${new Date().getTime()}`;
    response = await sendCommand(client, ['rpush', uniqueKey, 'a', 'b', 'c']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['llen', uniqueKey]);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['rpop', uniqueKey]);
    expect(response).to.equal('c');
    response = await sendCommand(client, ['llen', uniqueKey]);
    expect(response).to.equal(2);
    response = await sendCommand(client, ['rpop', uniqueKey]);
    expect(response).to.equal('b');
    response = await sendCommand(client, ['llen', uniqueKey]);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['rpop', uniqueKey]);
    expect(response).to.equal('a');
    response = await sendCommand(client, ['rpop', uniqueKey]);
    expect(response).to.equal(null);
    // The list goes away when the last element is popped
    response = await sendCommand(client, ['exists', uniqueKey]);
    expect(response).to.equal(0);
    response = await sendCommand(client, ['rpush', uniqueKey, '-6']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['llen', uniqueKey]);
    expect(response).to.equal(1);
  });
});
