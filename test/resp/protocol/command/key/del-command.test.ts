import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../../src/server/resp-server';
import { sendCommand } from '../../../../common.test';

describe('del-command test', () => {
  let respServer: RespServer;
  before((done) => {
    respServer = new RespServer();
    respServer.on('ready', () => {
      done();
    })
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
   * Functional testing of the delete command
   */
  it('should report ZERO when called with no keys present', (done) => {
    sendCommand(new net.Socket(), ['del', 'key1', 'key2', 'key3'])
    .then((response: any) => {
      expect(response).to.be.a('number');
      expect(response).to.equal(0);
      done();
    });
  });
  it('should report the number of keys actually removed', (done) => {
    const client = new net.Socket();
    sendCommand(client, ['set', 'key1', 'data'])
    .then(() => {
      sendCommand(client, ['set', 'key2', 'data'])
      .then(() => {
        sendCommand(client, ['set', 'key3', 'data'])
        .then(() => {
          sendCommand(client, ['del', 'key1', 'key3'])
          .then((response: any) => {
            expect(response).to.equal(2);
            done();
          });
        });
      });
    });
  });
  it('should have retained key2 from the previous test', (done) => {
    sendCommand(new net.Socket(), ['del', 'key2'])
    .then((response: any) => {
      expect(response).to.equal(1);
      done();
    });
  });
});
