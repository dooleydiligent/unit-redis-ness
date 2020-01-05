import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import * as util from 'util';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('client command test', () => {
  let respServer: RespServer;
  const DEFAULT_ERROR = `ReplyError: Unknown subcommand or wrong number of arguments for '%s'. Try CLIENT HELP`;
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
   * Functional testing of the client command.
   */
  it('should not allow more than 3 parameters', (done) => {
    sendCommand(client, ['client', 'one', 'two', 'three', 'four'])
    .then((response: any) => {
      expect(response).to.equal('ReplyError: ERR wrong number of arguments for \'client\' command');
      done();
    });
  });
  it('should fail predictably when an unknown subcommand is passed', async () => {
    const response = await sendCommand(client, ['client', 'whatever']);
    expect(response).to.equal(util.format(DEFAULT_ERROR, 'whatever'));
  });
  it('should return a NIL name when called with GETNAME subcommand', async () => {
    const response = await sendCommand(client, ['client', 'getname']);
    console.log(`RESPONSE: '${response}'`);
    expect(response).to.equal(null);
  });
  it('should fail predictably when GETNAME is called with too many parameters', async () => {
    const response = await sendCommand(client, ['client', 'getname', 'extra']);
    expect(response).to.equal(util.format(DEFAULT_ERROR, 'getname'));
  });
  it('should respond with "OK" when setname is called with a valid name', async () => {
    let response = await sendCommand(client, ['client', 'setname', 'whatever']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['client', 'getname']);
    expect(response).to.equal('whatever');
  });
  it('should persist the value for setname across tests', async () => { 
    const response = await sendCommand(client, ['client', 'getname']);
    expect(response).to.equal('whatever');
  });
});
