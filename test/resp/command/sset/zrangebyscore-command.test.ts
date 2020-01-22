import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('zrangebyscore-command test', () => {
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
   * Functional testing of the zrangebyscore command
   */
  it('should reproduce the redis documentation examples', async () => {
    response = await sendCommand(client, ['zadd', 'myzset', '1', 'one']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['zadd', 'myzset', '2', 'two']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['zadd', 'myzset', '3', 'three']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['zrangebyscore', 'myzset', '-inf', '+inf']);
    expect(response).to.eql(['one', 'two', 'three']);
    response = await sendCommand(client, ['ZRANGEBYSCORE', 'myzset', '1', '2']);
    expect(response).to.eql(['one', 'two']);
    response = await sendCommand(client, ['ZRANGEBYSCORE', 'myzset', '(1', '2']);
    expect(response).to.eql(['two']);
    response = await sendCommand(client, ['ZRANGEBYSCORE', 'myzset', '(1', '(2']);
    expect(response).to.eql([]);
  });
  it('should supply +Infinity for +inf as min parameter', async () => {
    response = await sendCommand(client, ['zrangebyscore', 'myzset', '+inf', '+inf']);
    expect(response).to.eql([]);
  });
  it('should supply -Infinity for -inf as max parameter', async () => {
    response = await sendCommand(client, ['zrangebyscore', 'myzset', '-inf', '-inf']);
    expect(response).to.eql([]);
  });
  it('should recognize invalid min parameter', async () => {
    // NOTE: 'inf' is NOT invalid to redis
    response = await sendCommand(client, ['zrangebyscore', 'myzset', 'inx', '+inf']);
    expect(response).to.equal('ReplyError: ERR min or max is not a float');
  });
  it('should recognize invalid max parameter', async () => {
    // NOTE: 'inf' is NOT invalid to redis
    response = await sendCommand(client, ['zrangebyscore', 'myzset', '-inf', 'int']);
    expect(response).to.equal('ReplyError: ERR min or max is not a float');
  });
  it('should recognize the WITHSCORES option', async () => {
    response = await sendCommand(client, ['zrangebyscore', 'myzset', '-inf', '+inf', 'withScores']);
    expect(response).to.eql(['one', '1', 'two', '2', 'three', '3']);
  });
  it('should error when an invalid limit option is specified', async () => {
    response = await sendCommand(client, ['zrangebyscore', 'myzset', '-inf', '+inf', 'limit']);
    expect(response).to.equal('ReplyError: ERR syntax error');
    response = await sendCommand(client, ['zrangebyscore', 'myzset', '-inf', '+inf', 'lizmit']);
    expect(response).to.equal('ReplyError: ERR syntax error');
    response = await sendCommand(client, ['zrangebyscore', 'myzset', '-inf', '+inf', 'limit', 'x']);
    expect(response).to.equal('ReplyError: ERR syntax error');
    response = await sendCommand(client, ['zrangebyscore', 'myzset', '-inf', '+inf', 'limit', '0', 'x']);
    expect(response).to.equal('ReplyError: ERR value is not an integer or out of range');
  });  
});