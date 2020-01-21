import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('brpoplpush-command test', () => {
  let respServer: RespServer;
  const client: net.Socket = new net.Socket();
  let response: any;
  before((done) => {
    respServer = new RespServer();
    respServer.on('ready', async () => {
      done();
    });
    respServer.start();
  });
  beforeEach(async () => {
    sinon.createSandbox();
    await sendCommand(client, ['flushall']);
    await sendCommand(client, ['select', '0'])
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
    await respServer.stop();
  });
  /**
   * Functional testing of the brpoplpush command
   */
  it('should return NIL when destination does not exist and timeout expires', async () => {
    response = await sendCommand(client, ['brpoplpush', 'src', 'dst', '2']);
    expect(response).to.equal(null);
  });
  it('should return the poplpushed value when lpush is called', (done) => {
    sendCommand(client, ['brpoplpush', 'poplpushkey', 'poplpopkey', '0'])
      .then((response: any) => {
        expect(response).to.equal('value1');
        done();
      });
    sendCommand(new net.Socket(), ['lpush', 'poplpushkey', 'value1', 'value2', 'value3'])
      .then((response: any) => {
        expect(response).to.equal(3);
      });
  });
  it('should return the pushd value when it already exists even if a timeout is set', (done) => {
    const uniqueKey = `poplpush${new Date().getTime()}`;
    sendCommand(new net.Socket(), ['lpush', uniqueKey, 'value1', 'value2', 'value3'])
      .then((response: any) => {
        expect(response).to.equal(3);
        sendCommand(client, ['brpoplpush', uniqueKey, 'poplpopkey', '0'])
          .then((response: any) => {
            expect(response).to.equal('value1');
            done();
          });
      });
  });
  it('should wait indefinitely (28 days) for a value to be available',  (done) => {
    const startTime = process.hrtime.bigint();
    sendCommand(client, ['brpoplpush', 'newpoplpushkey', 'newpoplpopkey', '0'])
    .then((response: any) => {
      expect(response).to.equal('newvalue1');
      const endTime = process.hrtime.bigint();
      console.log(`Duration is ${Number(endTime) - Number(startTime)}`);
      expect(Number(endTime - startTime)).to.be.greaterThan(4000000000);
      done();
    });
    setTimeout(() => {
      sendCommand(new net.Socket(), ['lpush', 'newpoplpushkey', 'newvalue1', 'newvalue2', 'newvalue3'])
      .then((response: any) => {
        expect(response).to.equal(3);
      });
    }, 4000);
  }).timeout(5000);
});
