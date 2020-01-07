import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import * as util from 'util';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe.only('zadd command test', () => {
  let respServer: RespServer;
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
  /**
   * Functional testing of the zadd command.
   */
  it('should require at least 3 parameters', async () => {
    let response: any = await sendCommand(client, ['zadd']);
    expect(response).to.equal('ReplyError: ERR wrong number of arguments for \'zadd\' command');
    response = await sendCommand(client, ['zadd', 'zkey']);
    expect(response).to.equal('ReplyError: ERR wrong number of arguments for \'zadd\' command');
    response = await sendCommand(client, ['zadd', 'zkey', '123']);
    expect(response).to.equal('ReplyError: ERR wrong number of arguments for \'zadd\' command');
    response = await sendCommand(client, ['zadd', 'zkey', '123', 'something']);
    expect(response).to.equal(1);
  });
  it('should reject even parameter counts', async () => {
    let response = await sendCommand(client, ['zadd', 'zkey', '123', 'something', '456']);
    expect(response).to.equal('ReplyError: ERR wrong number of arguments for \'zadd\' command');
    response = await sendCommand(client, ['zadd', 'zkey', '123', 'something', '456', 'another', '765']);
    expect(response).to.equal('ReplyError: ERR wrong number of arguments for \'zadd\' command');
    response = await sendCommand(client, ['zadd', 'zkey', '123', 'something', '456', 'another', '765', 'test']);
    // The "something" key should already exist so we only count 2 new fields
    expect(response).to.equal(2);
  });
  it('should reject an attempt to store non-floatish rankings', async () => {
    let response = await sendCommand(client, ['zadd', 'zkey', '__data__', 'something']);
    expect(response).to.equal('ReplyError: Error: value is not a valid float');
  });
});
