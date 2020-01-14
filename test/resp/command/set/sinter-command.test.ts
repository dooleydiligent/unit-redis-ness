import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('sinter-command test', () => {
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
   * Functional testing of the sinter command
   */
  it('should return EMPTY SET when the source set does not exist', async () => {
    response = await sendCommand(client, ['sinter', 'ary']);
    expect(response).to.eql([]);
  });
  it('should return EMPTY SET when any other set does not exist', async () => {
    response = await sendCommand(client, ['flushall']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['sadd', 'key1', 'a', 'b', 'c', 'd']);
    expect(response).to.equal(4);
    response = await sendCommand(client, ['sinter', 'key1', 'empty']);
    expect(response).to.eql([]);
  });
  it('should fail when the other key is not a set', async () => {
    response = await sendCommand(client, ['zadd', 'zkey', '1', 'two'] );
    expect(response).to.equal(1);
    response = await sendCommand(client, ['sinter', 'key1', 'zkey']);
    expect(response).to.equal('ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value');
    response = await sendCommand(client, ['set', 'skey1', 'test']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['sinter', 'key1', 'skey1']);
    expect(response).to.equal('ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value');
  });
  it('should return the intersection of one or more sets', async () => {
    response = await sendCommand(client, ['sadd', 'key1', 'a', 'b', 'c', 'd']);
    expect(response).to.equal(0);
    response = await sendCommand(client, ['sadd', 'key2', 'c']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['sadd', 'key3', 'a', 'c', 'e']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['sinter', 'key1', 'key2', 'key3']);
    expect(response).to.eql(['c']);
    response = await sendCommand(client, ['sadd', 'key2', 'a']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['sinter', 'key2', 'key1', 'key3']);
    expect(response.length).to.equal(2);
    // Redis does not guarantee the order of a set
    expect(response.sort()).to.eql(['a', 'c']);
  });
});
