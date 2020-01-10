import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('hget command test', () => {
  let respServer: RespServer;
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
   * Functional testing of the hget command.
   * Primary functionality is already covered in the hset suite
   */
  it('should require exactly 2 parameters', (done) => {
    sendCommand(new net.Socket(), ['hget', 'test'])
      .then((response1: any) => {
        expect(response1).to.equal('ReplyError: ERR wrong number of arguments for \'hget\' command');
        sendCommand(new net.Socket(), ['hget', 'test', 'one', 'two'])
          .then((response2: any) => {
            expect(response2).to.equal('ReplyError: ERR wrong number of arguments for \'hget\' command');
            sendCommand(new net.Socket(), ['hget', 'test', 'one'])
              .then((response3: any) => {
                expect(response3).to.equal(null);
                done();
              });
          });
      });
  });
  it('should get a value after it has be set', (done) => {
    sendCommand(new net.Socket(), ['hset', 'test', 'one', 'two'])
      .then(() => {
        sendCommand(new net.Socket(), ['hget', 'test', 'one'])
          .then((response: any) => {
            expect(response).to.equal('two');
            done();
          });
      });
  });
  it('should return nil string when the key exists but the field does not', (done) => {
    sendCommand(new net.Socket(), ['hget', 'test', 'two'])
      .then((response: any) => {
        expect(response).to.equal(null);
        done();
      });
  });
});
