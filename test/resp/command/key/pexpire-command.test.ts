import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('pexpire-command test', () => {
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
   * Functional testing of the pexpire command
   */
  it('should report ZERO when expire called on non-existent key', async () => {
    response = await sendCommand(client, ['pexpire', 'no-key', '1000']);
    expect(response).to.equal(0);
  });
  it('should require an integer value for the ttl parameter', async () => {
    response = await sendCommand(client, ['set', 'mykey', 'value']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['pexpire', 'mykey', '10.2']);
    expect(response).to.equal('ReplyError: ERR value is not an integer or out of range');
    response = await sendCommand(client, ['pexpire', 'mykey', 'ten']);
    expect(response).to.equal('ReplyError: ERR value is not an integer or out of range');
  });
  it('should set the requested ttl on a key', async () => {
    response = await sendCommand(client, ['pexpire', 'mykey', '10000']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['exists', 'mykey']);
    expect(response).to.equal(1);
  });
  it('should expire a key when we set a negative ttl', async () => {
    // Note that this is not consistent with documentation
    response = await sendCommand(client, ['pexpire', 'mykey', '-1']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['exists', 'mykey']);
    expect(response).to.equal(0);
  });
  it('should work with ZKEYs (and other key types - as yet untested)', (done) => {
    sendCommand(client, ['zadd', 'zkey', '1', 'member'])
      .then((response: any) => {
        expect(response).to.equal(1);
        sendCommand(client, ['exists', 'zkey'])
          .then((response: any) => {
            expect(response).to.equal(1);
            sendCommand(client, ['pexpire', 'zkey', '1'])
              .then((response: any) => {
                expect(response).to.equal(1);
                setTimeout(() => {
                  sendCommand(client, ['exists', 'zkey'])
                    .then((response: any) => {
                      expect(response).to.equal(0, `Unexpected response ${response} should be ZERO`);
                      done();
                    });
                }, 2000);
              });
          });
      });
  });
  it('should survive the RENAME operation', async () => {
    response = await sendCommand(client, ['set', 'rename-test', 'value']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['pexpire', 'rename-test', '1000']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['rename', 'rename-test', 'new-name']);
    expect(response).to.equal('OK');
    response = await sendCommand(client, ['exists', 'new-name']);
    expect(response).to.equal(1);
    response = await sendCommand(client, ['exists', 'rename-test']);
    expect(response).to.equal(0);
    await setTimeout(async () => {
      response = await sendCommand(client, ['exists', 'new-name']);
      expect(response).to.equal(0);
    }, 2000);
  });
});
