import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import * as util from 'util';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';
/**
 * Tests sadd, scard, sismember, smembers, smove, etc.
 */
describe('set commands test', () => {
  let respServer: RespServer;
  const WRONG_TYPE = `ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value`;
  const client: net.Socket = new net.Socket();
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
  it('should return ZERO when certain commands are applied against key that doesn\'t exist', async () => {
    let response: any = await sendCommand(client, ['scard', 'doesnotexist']);
    expect(response).to.equal(0);
    response = await sendCommand(client, ['sismember', 'doesnotexist', 'test']);
    expect(response).to.equal(0);
  });
  it('should throw an appropriate error when a "set" command is applied to a non-set key', async () => {
    let response: any = await sendCommand(client, ['set', 'wrongtype', 'test']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['sismember', 'wrongtype', 'set']);
    expect(response).to.equal(WRONG_TYPE);
  });
  it('should create a new key when sadd is called correctly', async () => {
    let response: any = await sendCommand(client, ['sadd', 'skey', 'test']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['exists', 'skey']);
    expect(response).to.equal(1);
  });
  it('should only report the number of added keys', async () => {
    let response: any = await sendCommand(client, ['sadd', 'skey', 'test', 'test2']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['smembers', 'skey']);
    expect(response).to.be.an('array');
    expect(response).to.eql(['test', 'test2']);
  });
  describe('smove, sismember, and scard tests', () => {
    const uniqueKey = `unique${new Date().getTime()}`;
    it('should do nothing when smove is called with a source key that does not exist', async () => {
      let response: any = await sendCommand(client, ['smove', 'fromskey', 'toskey', 'nothing']);
      expect(response).to.equal(0);
      response = await sendCommand(client, ['exists', 'fromskey', 'toskey']);
      expect(response).to.equal(0);
    });
    it('should move a key from one set to another (and create the target if necessary)', async () => {
      let response: any = await sendCommand(client, ['exists', 'tonewskey']);
      expect(response).to.equal(0);
      response = await sendCommand(client, ['smembers', 'tonewskey']);
      expect(response).to.eql([]);
      response = await sendCommand(client, ['sadd', uniqueKey, 'key1', 'key2', 'key3']);
      expect(response).to.equal(3);
      response = await sendCommand(client, ['smembers', uniqueKey]);
      expect(response).to.eql(['key1', 'key2', 'key3']);
      response = await sendCommand(client, ['smove', uniqueKey, 'tonewskey', 'key2']);
      expect(response).to.equal(1);
      response = await sendCommand(client, ['sismember', 'tonewskey', 'key2']);
      expect(response).to.equal(1);
      response = await sendCommand(client, ['smembers', uniqueKey]);
      expect(response).to.eql(['key1', 'key3']);
      response = await sendCommand(client, ['smembers', 'tonewskey']);
      expect(response).to.eql(['key2']);
    });
    it('should report cardinality of a set', async () => {
      let response: any = await sendCommand(client, ['scard', uniqueKey]);
      expect(response).to.equal(2);
      response = await sendCommand(client, ['scard', 'tonewskey']);
      expect(response).to.equal(1);
    });
    it('should report ismember true/false', async () => {
      let response: any = await sendCommand(client, ['sismember', 'tonewskey', 'key2']);
      expect(response).to.equal(1);
      response = await sendCommand(client, ['sismember', 'tonewskey', 'key1']);
      expect(response).to.equal(0);
      response = await sendCommand(client, ['sismember', uniqueKey, 'key1']);
      expect(response).to.equal(1);
      response = await sendCommand(client, ['sismember', uniqueKey, 'key3']);
      expect(response).to.equal(1);
      response = await sendCommand(client, ['sismember', uniqueKey, 'key2']);
      expect(response).to.equal(0);
    });
  });
});
