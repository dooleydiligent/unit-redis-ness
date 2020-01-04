import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../src/server/resp-server';
import { sendCommand } from '../common.test';

describe('resp-server test', () => {
  let respServer: RespServer;
  let testCounter: number = 0;
  beforeEach((done) => {
    sinon.createSandbox();
    if (++testCounter === 5) {
      respServer = new RespServer();
      respServer.on('ready', () => {
        done();
      })
      respServer.start();
    } else {
      done();
    }
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
    respServer.stop();
  });
  /**
   * Functional testing of each implemented command
   */
  it('should instantiate', async () => {
    respServer = new RespServer();
    expect(respServer.constructor.name).to.equal('RespServer');
  });
  it('should emit "ready" on startup', (done) => {
    respServer.on('ready', () => {
      done();
    });
    respServer.start();
  });
  it('should emit "closed" on shutdown', (done) => {
    respServer.on('closed', () => {
      done();
    });
    respServer.stop();
  });
  it('should accept connections on default localhost:6378', (done) => {
    respServer = new RespServer();
    respServer.on('ready', () => {
      const client = new net.Socket();
      client.on('ready', (data: any) => {
        respServer.on('closed', () => {
          done();
        })
        respServer.stop();
      });
      client.on('connect', (data: any) => {
      });
      client.on('error', (err) => {
        fail(`Unexpected error during connection`, err.stack);
      })
      client.connect(Number(process.env.REDIS_PORT || 6379), process.env.REDIS_HOST || 'localhost', () => {
      });
    });
    respServer.start();
  });
  it('should respond properly to the "ping" command', (done) => {
    sendCommand(new net.Socket(), ['ping'])
      .then((response) => {
        expect(response).to.equal('PONG');
        done();
      });
  });
  it('should respond properly to the "echo" command', (done) => {
    sendCommand(new net.Socket(), ['echo', 'test'])
      .then((response) => {
        expect(response).to.equal('test');
        done();
      });
  });
  it('should respond properly to the "quit" command', (done) => {
    // Note however that the server does not disconnect us.  That is the client's job
    sendCommand(new net.Socket(), ['quit'])
      .then((response) => {
        expect(response).to.equal('OK');
        done();
      });
  });
  it('should respond with "ERR" when echo command has no parameters', (done) => {
    // Note that 'ReplyError:' is supplied by the redis parser, NOT by the code under test
    sendCommand(new net.Socket(), ['echo'])
      .then((response) => {
        expect(response).to.equal('ReplyError: ERR wrong number of arguments for \'echo\' command');
        done();
      });
  });
  it('should respond with "ERR" when echo command has two or more parameters', (done) => {
    sendCommand(new net.Socket(), ['echo', 'one', 'two'])
      .then((response) => {
        expect(response).to.equal('ReplyError: ERR wrong number of arguments for \'echo\' command');
        done();
      });
  });
  it('should respond to the "time" command with an array of two strings', (done) => {
    // Note: we use hrtime which should already do what we need so we don't validate
    sendCommand(new net.Socket(), ['time'])
      .then((response: any) => {
        expect(response).to.be.an('array');
        expect(response.length).to.equal(2);
        expect(parseInt(response[0], 10)).to.be.greaterThan(0);
        expect(parseInt(response[1], 10)).to.be.greaterThan(0);
        done();
      });
  });
  it('should respond with nulCommand when the command is not known', (done) => {
    sendCommand(new net.Socket(), ['felix', 'the', 'cat'])
      .then((response: any) => {
        expect(response).to.match(/^ReplyError: ERR unknown command.*/);
        done();
      });
  });
  it('should implement the info command', (done) => {
    sendCommand(new net.Socket(), ['info'])
      .then((response: any) => {
        expect(response).to.match(/^#server\r\nserver:node_version:.*/m);
        done();
      });
  });
  it('should implement the SET command', (done) => {
    sendCommand(new net.Socket(), ['SET', 'this', 'that'])
      .then((response: any) => {
        expect(response).to.equal('OK');
        sendCommand(new net.Socket(), ['GET', 'this'])
          .then((getresponse: any) => {
            expect(getresponse).to.equal('that');
            done();
          });
      });
  });
  it('should return nil string when GET is invoked with unknown parameters', (done) => {
    sendCommand(new net.Socket(), ['GET', ' '])
      .then((getresponse: any) => {
        expect(getresponse).to.equal(null);
        done();
      });
  });
  it('should implement the info command with a known parameter', (done) => {
    sendCommand(new net.Socket(), ['info', 'memory'])
      .then((response: any) => {
        expect(response).to.match(/^#memory.*/m);
        done();
      });
  });
  it('should not respond when info is called with an unknown paramter', (done) => {
    sendCommand(new net.Socket(), ['info', 'juicy'])
      .then((response: any) => {
        expect(response).to.equal(null);
        done();
      });
  });
});
