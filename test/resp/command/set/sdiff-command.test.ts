import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('sdiff-command test', () => {
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
   * Functional testing of the sdiff command
   */
  it('should return EMPTY ARRAY when the source set does not exist', async () => {
    response = await sendCommand(client, ['sdiff', 'ary']);
    expect(response).to.eql([]);
  });
  it('should return all members of source set when the destination set does not exist', async () => {
    response = await sendCommand(client, ['sadd', 'key1', 'a', 'b', 'c', 'd']);
    expect(response).to.equal(4);
    response = await sendCommand(client, ['sdiff', 'key1', 'empty']);
    // REDIS does not guarantee order of the set
    expect(response.sort()).to.eql(['a', 'b', 'c', 'd']);
  });
  it('should return a proper DIFF of one or more sets', async () => {
    response = await sendCommand(client, ['sadd', 'key2', 'c']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['sadd', 'key3', 'a', 'c', 'e']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['sdiff', 'key1', 'key2', 'key3']);
    expect(response.sort()).to.eql(['b', 'd']);
  });
  it('should ignore non-list keys', async () => {
    response = await sendCommand(client, ['set', 'list', '1']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['zadd', 'zset', '2', 'three']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['sdiff', 'key1', 'key2', 'key3']);
    expect(response.sort()).to.eql(['b', 'd']);
  })
});
