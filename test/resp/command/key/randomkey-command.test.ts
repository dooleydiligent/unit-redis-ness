import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('randomkey-command test', () => {
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
   * Functional testing of the randomkey command
   */
  it('should return NIL when the database is empty', async () => {
    response = await sendCommand(client, ['flushdb']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['randomkey']);
    expect(response).to.equal(null);
  });
  it('should return list, zkey, hash, and string keys without preference', async () => {
    const results: string[] = [];
    response = await sendCommand(client, ['hset', 'hash', 'field', 'value']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['lpush', 'list', 'element']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['zadd', 'zset', '1', 'member']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['set', 'string', 'value']);
    expect(response).to.equal('OK');
    for (let i = 0; i<15; i++) {
      response = await sendCommand(client, ['randomkey']);
      expect(response).to.be.a('string');
      response = await sendCommand(client, ['type', response]);
      expect(response).to.be.a('string');
      if (results.indexOf(response) === -1) {
        results.push(response);
      }
      if (results.length === 4) {
        break;
      }
    }
    expect(results.length).to.be.greaterThan(1);
  });
});
