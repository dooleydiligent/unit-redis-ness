import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../src/server/resp-server';
import { sendCommand } from '../common.test';

describe('resp-server test', () => {
  let respServer: RespServer;
  beforeEach(() => {
    sinon.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
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
    respServer = new RespServer();
    respServer.on('ready', () => {
      sendCommand(new net.Socket(), ['ping'])
        .then((response) => {
          expect(response).to.equal('PONG');
          respServer.stop()
            .then(() => {
              done();
            });
        });
    });
    respServer.start();
  });
  it('should respond properly to the "echo" command', (done) => {
    respServer = new RespServer();
    respServer.on('ready', () => {
      sendCommand(new net.Socket(), ['echo', 'test'])
        .then((response) => {
          expect(response).to.equal('test');
          respServer.stop()
            .then(() => {
              done();
            });
        });
    });
    respServer.start();
  });
  it('should respond properly to the "quit" command', (done) => {
    // Note however that the server does not disconnect us.  That is the client's job
    respServer = new RespServer();
    respServer.on('ready', () => {
      sendCommand(new net.Socket(), ['quit'])
        .then((response) => {
          expect(response).to.equal('OK');
          respServer.stop()
            .then(() => {
              done();
            });
        });
    });
    respServer.start();
  });
  it('should respond with "ERR" when echo command has no parameters', (done) => {
    // Note that 'ReplyError:' is supplied by the redis parser, NOT by the code under test
    respServer = new RespServer();
    respServer.on('ready', () => {
      sendCommand(new net.Socket(), ['echo'])
        .then((response) => {
          expect(response).to.equal('ReplyError: ERR wrong number of arguments for \'echo\' command');
          respServer.stop()
            .then(() => {
              done();
            });
        });
    });
    respServer.start();
  });
  it('should respond to the "time" command with an array of two strings', (done) => {
    // Note: we use hrtime which should already do what we need so we don't validate
    respServer = new RespServer();
    respServer.on('ready', () => {
      sendCommand(new net.Socket(), ['time'])
        .then((response: any) => {
          expect(response).to.be.an('array');
          expect(response.length).to.equal(2);
          expect(parseInt(response[0], 10)).to.be.greaterThan(0);
          expect(parseInt(response[1], 10)).to.be.greaterThan(0);
          respServer.stop()
            .then(() => {
              done();
            });
        });
    });
    respServer.start();
  });
  it('should respond with nulCommand when the command is not known', (done) => {
    respServer = new RespServer();
    respServer.on('ready', () => {
      sendCommand(new net.Socket(), ['felix','the','cat'])
        .then((response: any) => {
          expect(response).to.match(/^ReplyError: ERR unknown command.*/);
          respServer.stop()
            .then(() => {
              done();
            });
        });
    });
    respServer.start();
  });
  it('should implement the info command', (done) => {
    respServer = new RespServer();
    respServer.on('ready', () => {
      sendCommand(new net.Socket(), ['info'])
        .then((response: any) => {
          expect(response).to.match(/^#server\r\nserver:node_version:.*/m);
          respServer.stop()
            .then(() => {
              done();
            });
        });
    });
    respServer.start();
  });
  it('should implement the SET command', (done) => {
    respServer = new RespServer();
    respServer.on('ready', () => {
      sendCommand(new net.Socket(), ['SET','this','that'])
        .then((response: any) => {
          expect(response).to.equal('OK');
          sendCommand(new net.Socket(), ['GET', 'this'])
          .then((getresponse: any) => {
            console.log(`getresponse is ${getresponse}`);
            expect(getresponse).to.equal('that');
            respServer.stop()
            .then(() => {
              done();
            });
          });
        });
    });
    respServer.start();
  });
});
