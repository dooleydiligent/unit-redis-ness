import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('keys-command test', () => {
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
   * Functional testing of the keys command
   */
  it('should retrieve keys by glob patterns', async () => {
    response = await sendCommand(client, ['mset', 'firstname', 'Jack', 'lastname', 'Stuntman', 'age', '35']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['keys', '*name*']);
    expect(response).to.eql(['firstname', 'lastname']);
    response = await sendCommand(client, ['keys', 'a??']);
    expect(response).to.eql(['age']);
    response = await sendCommand(client, ['keys', '*']);
    expect(response).to.eql(['firstname', 'lastname', 'age']);
  });
});
