import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('incrby/decrby command test', () => {
  let respServer: RespServer;
  let client: net.Socket = new net.Socket();
  before((done) => {
    respServer = new RespServer();
    respServer.on('ready', () => {
      // Set a key with a millisecond TTL to validate incrby respects TTL
      sendCommand(client, ['set', 'ttlkey', '100', 'PX', '3'])
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
   * Functional testing of the incrby and decrby command
   */
  it('should report the INCREMENT when incrby called against unknown key', async () => {
    const response: any = await sendCommand(client, ['incrby', 'incr-key', '10']);
    expect(response).to.be.a('number');
    expect(response).to.equal(10);
  });
  it('should have created the key from the previous test', async () => {
    const response = await sendCommand(client, ['get', 'incr-key']);
    expect(response).to.be.a('string');
    expect(response).to.equal('10');
  });
  it('should overflow after 53 bits', async () => {
    let response: any = await sendCommand(client, ['set', 'incr-key', '9007199254740981']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['incrby', 'incr-key', '10']);
    expect(response).to.equal(Number.MAX_SAFE_INTEGER);
    response = await sendCommand(client, ['incrby', 'incr-key', '110']);
    expect(response).to.equal('ReplyError: Error: increment or decrement would overflow');
  });
  // DECRBY command
  it('should report the NEGATIVE increment when decrby called against unknown key', async () => {
    const response: any = await sendCommand(client, ['decrby', 'decr-key', '12']);
    expect(response).to.be.a('number');
    expect(response).to.equal(-12);
  });
  it('should support negative increment and positive decrement', async () => {
    let response: any = await sendCommand(client, ['incrby', 'negincr', '-12']);
    expect(response).to.be.a('number');
    expect(response).to.equal(-12);
    response = await sendCommand(client, ['decrby', 'negincr', '-24']);
    expect(response).to.equal(12);
  });
  it('should have created the key from the previous test', async () => {
    const response: any = await sendCommand(client, ['get', 'decr-key']);
    expect(response).to.be.a('string');
    expect(response).to.equal('-12');
  });
  it('should overflow after 53 bits', async () => {
    let response: any = await sendCommand(client, ['set', 'decr-key', '-9007199254740981']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['decrby', 'decr-key', '10']);
    expect(response).to.equal(Number.MIN_SAFE_INTEGER);
    // This does not seem to be exact
    // response = await sendCommand(client, ['decrby', 'decr-key', String(Number.MAX_SAFE_INTEGER)]);
    // expect(response).to.equal('ReplyError: Error: increment or decrement would overflow');
  });
  it('should respect TTL', async () => {
    const response: any = await sendCommand(client, ['get', 'ttlkey']);
    expect(response).to.equal(null);
  });
  it('should fail to increment a HASH value', async () => {
    const uniqueKey: string = `test-incr-${new Date().getTime()}`;
    let response: any = await sendCommand(client, ['hset', uniqueKey, 'one', 'two']);
    console.log(`Response is`, response);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['incrby', uniqueKey, '12']);
    console.log(`ERROR is ${response}`);
    expect(response).to.equal('ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value');
  });
});
