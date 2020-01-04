import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../src/server/resp-server';
import { sendCommand } from '../../../common.test';

describe('set-command test', () => {
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
    respServer.stop();
  });
  /**
   * Functional testing of the set command
   */
  it('should allow us to set a several second ttl', (done) => {
    // During local testing there are 8 milliseconds from put to get
    sendCommand(new net.Socket(), ['set', 'TTLtest', 'key', 'EX', '1'])
      .then((response: any) => {
        expect(response).to.equal('OK');
          done();
      });
  })

  it('should NOT allow SET to invoke NX after XX', (done) => {
    sendCommand(new net.Socket(), ['set', 'test', 'key', 'XX', 'NX'])
      .then((response: any) => {
        expect(response).to.equal('ReplyError: Error: Syntax Exception - cannot set NX with XX');
        done();
      });
  });
  it('should NOT allow SET to invoke XX after NX', (done) => {
    sendCommand(new net.Socket(), ['set', 'test', 'key', 'NX', 'XX'])
      .then((response: any) => {
        expect(response).to.equal('ReplyError: Error: Syntax Exception - cannot set XX with NX');
        done();
      });
  });
  it('should return nil when SET invoked with XX on a key that doesn\'t exist', (done) => {
    const uniqueKey: string = `TEST${new Date().getTime()}`;
    sendCommand(new net.Socket(), ['set', uniqueKey, 'key', 'XX'])
      .then((response: any) => {
        expect(response).to.equal(null);
        done();
      });
  });
  it('should return OK when SET invoked with XX on a key that DOES exist', (done) => {
    const uniqueKey: string = `TEST${new Date().getTime()}`;
    // set the key with NX first to validate that functionality
    sendCommand(new net.Socket(), ['set', uniqueKey, 'key', 'NX'])
      .then((response: any) => {
        expect(response).to.equal('OK');
        sendCommand(new net.Socket(), ['set', uniqueKey, 'new value', 'XX'])
          .then((responseXX: any) => {
            expect(responseXX).to.equal('OK');
            // Now validate that the key is what we said last
            sendCommand(new net.Socket(), ['get', uniqueKey])
              .then((responseGet: any) => {
                expect(responseGet).to.equal('new value');
                done();
              });
          });
      });
  })
  it('should NOT allow SET to invoke EX and PX simultaneously', (done) => {
    // Note: Our behavior is different from redis.  This error is 'wrong number of args'
    sendCommand(new net.Socket(), ['set', 'test', 'key', 'EX', '100', 'PX', '100'])
      .then((response: any) => {
        expect(response).to.match(/^ReplyError: ERR wrong number of arguments.*/);
        done();
      });
  });
  it('should allow us to set a millisecond ttl', (done) => {
    // During local teseting there are 8 milliseconds from put to get
    sendCommand(new net.Socket(), ['set', 'MILLItest', 'key', 'PX', '1'])
      .then((response: any) => {
        expect(response).to.equal('OK');
        done();
      });
  });
  it('should prove that the milisecond TTL has expired', (done) => {
    sendCommand(new net.Socket(), ['get', 'MILLItest'])
    .then((responseGet: any) => {
      expect(responseGet).to.equal(null);
      done();
    });
  });
  it ('should prove that the one second TTL has expired', (done) => {
    setTimeout(() => {
      sendCommand(new net.Socket(), ['get', 'TTLtest'])
      .then((responseGet: any) => {
        expect(responseGet).to.equal(null);
        done();
      });
    }, 1000);
  });
  it('should not accept unknown parameters', (done) => {
    sendCommand(new net.Socket(), ['set', 'test', 'key', 'Q'])
      .then((response: any) => {
        expect(response).to.equal('ReplyError: Error: Cannot parse the command');
        done();
      });
  })
  it('should NOT allow SET to invoke PX after EX', (done) => {
    sendCommand(new net.Socket(), ['set', 'test', 'key', 'EX', '100', 'PX'])
      .then((response: any) => {
        expect(response).to.equal('ReplyError: Error: Syntax Exception - cannot set ttl twice');
        done();
      });
  });
  it('should NOT allow SET to invoke EX after PX', (done) => {
    sendCommand(new net.Socket(), ['set', 'test', 'key', 'PX', '100', 'EX'])
      .then((response: any) => {
        expect(response).to.equal('ReplyError: Error: Syntax Exception - cannot set ttl twice');
        done();
      });
  });
  it('should not allow a TTL less than 1ms', (done) => {
    sendCommand(new net.Socket(), ['set', 'MILLItest', 'key', 'PX', '0'])
      .then((response: any) => {
        expect(response).to.equal('ReplyError: Error: invalid expire time in set');
        done();
      });
  });
});
