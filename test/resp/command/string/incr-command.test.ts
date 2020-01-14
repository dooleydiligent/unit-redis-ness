import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('incr/decr command test', () => {
  let respServer: RespServer;
  before((done) => {
    respServer = new RespServer();
    respServer.on('ready', () => {
      // Set a key with a millisecond TTL to validate incr respects TTL
      sendCommand(new net.Socket(), ['set', 'ttlkey', '100', 'PX', '3'])
        .then(() => {
          done();
        });
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
   * Functional testing of the incr and decr command
   */
  it('should report ONE when incr called against unknown key', async () => {
    const response: any = await sendCommand(new net.Socket(), ['incr', 'incr-key']);
    expect(response).to.be.a('number');
    expect(response).to.equal(1);
  });
  it('should have created the key from the previous test', async () => {
    const response = await sendCommand(new net.Socket(), ['get', 'incr-key']);
    expect(response).to.be.a('string');
    expect(response).to.equal('1');
  });
  it('should overflow after 53 bits', async () => {
    let response: any = await sendCommand(new net.Socket(), ['info', 'server']);
    // Only run the remaining tests if this is NOT unit-redis-ness
    if (!/redis_version:5/gim.test(response)) {
      response = await sendCommand(new net.Socket(), ['set', 'incr-key', '9007199254740990']);
      expect(response).to.equal('OK');
      response = await sendCommand(new net.Socket(), ['incr', 'incr-key']);
      expect(response).to.equal(Number.MAX_SAFE_INTEGER);
      response = await sendCommand(new net.Socket(), ['incr', 'incr-key']);
      expect(response).to.equal('ReplyError: ERR increment or decrement would overflow');
    }
  });
  // DECR command
  it('should report -1 when decr called against unknown key', async () => {
    const response: any = await sendCommand(new net.Socket(), ['decr', 'decr-key']);
    expect(response).to.be.a('number');
    expect(response).to.equal(-1);
  });
  it('should have created the key from the previous test', async () => {
    const response: any = await sendCommand(new net.Socket(), ['get', 'decr-key']);
    expect(response).to.be.a('string');
    expect(response).to.equal('-1');
  });
  it('should overflow after 53 bits', async () => {
    let response: any = await sendCommand(new net.Socket(), ['info', 'server']);
    // Only run the remaining tests if this is NOT unit-redis-ness
    if (!/redis_version:5/gim.test(response)) {
      let response: any = await sendCommand(new net.Socket(), ['set', 'decr-key', '-9007199254740990']);
      expect(response).to.equal('OK');
      response = await sendCommand(new net.Socket(), ['decr', 'decr-key']);
      expect(response).to.equal(Number.MIN_SAFE_INTEGER);
      response = await sendCommand(new net.Socket(), ['decr', 'decr-key']);
      expect(response).to.equal('ReplyError: ERR increment or decrement would overflow');
    }
  });
  it('should respect TTL', async () => {
    const response: any = await sendCommand(new net.Socket(), ['get', 'ttlkey']);
    expect(response).to.equal(null);
  });
  it('should fail to increment a HASH value', async () => {
    const uniqueKey: string = `test-incr-${new Date().getTime()}`;
    let response: any = await sendCommand(new net.Socket(), ['hset', uniqueKey, 'one', 'two']);
    expect(response).to.equal(1);
    response = await sendCommand(new net.Socket(), ['incr', uniqueKey]);
    expect(response).to.equal('ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value');
  });
});
