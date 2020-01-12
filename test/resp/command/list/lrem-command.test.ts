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
    response = await sendCommand(client, ['RPUSH', 'mylist', 'hello']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['RPUSH', 'mylist', 'hello']);
    expect(response).to.equal(2);
    response = await sendCommand(client, ['RPUSH', 'mylist', 'foo']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['RPUSH', 'mylist', 'hello']);
    expect(response).to.equal(4);
    response = await sendCommand(client, ['lrem', 'mylist', '-2', 'hello']);
    expect(response).to.equal(2);
    response = await sendCommand(client, ['lrange', 'mylist', '0', '-1']);
    expect(response).to.eql(['hello', 'foo']);
  });
  it('should return a ZERO result when the key does not exist', async () => {
    response = await sendCommand(client, ['lrem', 'otherlist', '1', 'test']);
    expect(response).to.equal(0);
  });
  it('should remove every matchin element when count is 0', async () => {
    response = await sendCommand(client, ['flushdb']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['RPUSH', 'mylist', 'hello']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['RPUSH', 'mylist', 'hello']);
    expect(response).to.equal(2);
    response = await sendCommand(client, ['RPUSH', 'mylist', 'foo']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['RPUSH', 'mylist', 'hello']);
    expect(response).to.equal(4);
    response = await sendCommand(client, ['lrem', 'mylist', '0', 'hello']);
    expect(response).to.equal(3);
  });
  it('should remove the list when all elements are gone', async () => {
    response = await sendCommand(client, ['lrem', 'mylist', '0', 'foo']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['exists', 'mylist']);
    expect(response).to.equal(0);
  });
  it('should remove only the number of requested elements when count > 0', async () => {
    response = await sendCommand(client, ['RPUSH', 'mylist', 'hello']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['RPUSH', 'mylist', 'hello']);
    expect(response).to.equal(2);
    response = await sendCommand(client, ['RPUSH', 'mylist', 'calibrate']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['RPUSH', 'mylist', 'hello']);
    expect(response).to.equal(4);
    response = await sendCommand(client, ['lrem', 'mylist', '1', 'hello']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['lrange', 'mylist', '0', '2']);
    expect(response).to.eql(['hello', 'calibrate', 'hello']);
  });
  it('should default to startIndex ZERO when it is less than ZERO', async () => {
    for (let i = 0; i< 10; i++) {
      response = await sendCommand(client, ['RPUSH', 'newlist', `${i}`]);
      expect(response).to.equal(i+1);
    }
    response = await sendCommand(client, ['ltrim', 'newlist', '-100', '2']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['llen', 'newlist']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['lrange', 'newlist', '0', '3']);
    expect(response).to.eql(['0', '1', '2']);
  });
  it('should remove the list when start > end or start > llen', async () => {
    response = await sendCommand(client, ['exists', 'newlist']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['ltrim', 'newlist', '10', '2']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['exists', 'newlist']);
    expect(response).to.equal(0);
  });
  it('should properly handle a negative endIndex', async () => {
    for (let i = 0; i< 7; i++) {
      response = await sendCommand(client, ['RPUSH', 'neglist', `${i}`]);
      expect(response).to.equal(i+1);
    }
    response = await sendCommand(client, ['ltrim', 'neglist', '-100', '-3']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['lrange', 'neglist', '0', '100']);
    expect(response).to.eql(['0', '1', '2', '3', '4']);
  });
  it('should remove the key when abs(endIndex) is > llen', async () => {
    response = await sendCommand(client, ['ltrim', 'neglist', '-100', '-6']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['exists', 'neglist']);
    expect(response).to.eql(0);
  });
});
