import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('lpush-command test', () => {
  let respServer: RespServer;
  const client: net.Socket = new net.Socket();
  let response: any;
  const testKey: string = `lpush-${new Date().getTime()}`;
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
   * Functional testing of the lpush command
   */
  it('should report ERR when attempting to lpush to a non-list key', async () => {
    response = await sendCommand(client, ['set', 'lkey', 'test']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['lpush', 'lkey', '0']);
    expect(response).to.equal('ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value');
  });
  it('should create a list if it doesn\'t already exist', async () => {
    response = await sendCommand(client, ['exists', testKey]);
    expect(response).to.equal(0);
    response = await sendCommand(client, ['lpush', testKey, 'a', 'b', 'c']);
    // The list is now 'c', 'b', 'a'
    expect(response).to.equal(3);
    response = await sendCommand(client, ['exists', testKey]);
    expect(response).to.equal(1);
  });
  it('should have created the list in a predicatble order', async () => {
    response = await sendCommand(client, ['lindex', testKey, '1']);
    expect(response).to.equal('b');
    response = await sendCommand(client, ['lpop', testKey]);
    expect(response).to.equal('c');
    response = await sendCommand(client, ['llen', testKey]);
    expect(response).to.equal(2);
    response = await sendCommand(client, ['rpop', testKey]);
    expect(response).to.equal('a');
  })
});
