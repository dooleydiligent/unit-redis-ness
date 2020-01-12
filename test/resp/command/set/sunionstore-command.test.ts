import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('sunionstore-command test', () => {
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
   * Functional testing of the sunionstore command
   */
  it('should require a minimum of two parameters', async () => {
    response = await sendCommand(client, ['sunionstore', 'ary']);
    expect(response).to.match(/ERR wrong number of arguments for \'sunionstore\' command/i);
  });
  it('should return ZERO when the source set does not exist', async () => {
    response = await sendCommand(client, ['sunionstore', 'dest', 'src']);
    expect(response).to.eql(0);
  });
  it('should overwrite the destination and return the number of keys copied', async () => {
    response = await sendCommand(client, ['sadd', 'key1', 'a', 'b', 'c']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['sadd', 'key2', 'c', 'd', 'e']);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['set', 'key3', 'some text value']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['sunionstore', 'key3', 'key1', 'key2']);
    expect(response).to.equal(5);
    response = await sendCommand(client, ['smembers', 'key3']);
    expect(response).to.eql(['a', 'b', 'c', 'd', 'e']);
  });
});
