import { fail } from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../src/server/resp-server';
import { sendCommand } from '../../common.test';

describe('script-command test', () => {
  let respServer: RespServer;
  let client: net.Socket = new net.Socket();
  let response: any;
  const code: string = 'return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]';
  const sha1: string = 'a42059b356c875f0717db19a51f6aaca9ae659ea';
  before((done) => {
    respServer = new RespServer();
    respServer.on('ready', async () => {
      await sendCommand(client, ['flushall']);
      await sendCommand(client, ['select', '0'])
      await sendCommand(client, ['script', 'flush']);
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
   * Functional testing of script commands
   */
  it('should calcuclate the correct sha1 of a script and store the script', async () => {
    response = await sendCommand(client, ['script', 'exists', sha1]);
    expect(response).to.eql([0]);
    // validate failure on unparseable script
    response = await sendCommand(client, ['script', 'load', code]);
    expect(response).to.match(/ReplyError: ERR .*/);
    // validate success on parseable script
    response = await sendCommand(client, ['script', 'load', `${code}}`]);
    expect(response).to.equal(sha1);
    // validate a script is persisted
    response = await sendCommand(client, ['script', 'exists', sha1]);
    expect(response).to.eql([1]);
    // validate response to unknown sub command
    response = await sendCommand(client, ['script', 'test', sha1]);
    expect(response).to.equal('ReplyError: ERR Unknown subcommand or wrong number of arguments for \'test\'. Try SCRIPT HELP.');
  });
  it('should evaluate a loaded lua script using evalsha', async () => {
    // Validate that NOSCRIPT is triggered
    response = await sendCommand(client, ['evalsha', `${sha1}xx`, '2', 'key1', 'key2', 'first', 'second']);
    expect(response).to.equal('ReplyError: NOSCRIPT No matching script. Please use EVAL.');
    // Validate that param 1 cannot be negative
    response = await sendCommand(client, ['evalsha', sha1, '-2', 'key1', 'key2', 'first', 'second']);
    expect(response).to.equal('ReplyError: ERR Number of keys can\'t be negative');
    // Validate that param 1 cannot be text
    response = await sendCommand(client, ['evalsha', sha1, 'two', 'key1', 'key2', 'first', 'second']);
    expect(response).to.equal('ReplyError: ERR value is not an integer or out of range');
  });
  it('should execute a simple script', async () => {
    // Validate that a simple script can be processed
    response = await sendCommand(client, ['EVAL', 'local val="Hello Compose" return val', '0']);
    expect(response).to.equal('Hello Compose');
  });
  it('should create and process the ARGV table', async () => {
    response = await sendCommand(client, ['eval', 'return ARGV[2]', '2', 'key1', 'key2', 'first', 'second']);
    expect(response).to.eql('second');
  });
  it('should create and process the KEYS table', async () => {
    response = await sendCommand(client, ['eval', 'return KEYS[1]', '2', 'key1', 'key2', 'first', 'second']);
    expect(response).to.equal('key1');
  });
  // NOTE: Any number is also a string to LUA
  it('should return a NUMBER when required', async () => {
    response = await sendCommand(client, ['eval', 'return 123', '2', 'key1', 'key2', 'first', 'second']);
    expect(response).to.equal(123);
  });
  it('should return NIL when there is no return value', async () => {
    response = await sendCommand(client, ['eval', 'print "Hello World"', '0']);
    expect(response).to.equal(null);
  });
  it('should return a TABLE when required', async () => {
    response = await sendCommand(client, [`eval`, `return ARGV`, '2', 'key1', 'key2', 'first', 'second', 'third']);
    expect(response).to.eql(['first', 'second', 'third']);
  });
  it('should return items in order', async () => {
    response = await sendCommand(client, ['eval', 'return {true, "test", false, 10, 10.2}', '0']);
    expect(response).to.eql([1, 'test', null, 10, 10]);
  })
  it('should return integer and nil for true and false, respectively', async () => {
    response = await sendCommand(client, ['eval', 'return { true, false, false}', '0']);
    expect(response).to.eql([1, null, null]);
  })
  it.only('should be able to execute a representative BULL script', async () => {
    response = await sendCommand(client, ['flushall']);
    const luaScriptPath = path.join(__dirname, '../../resources/bull.lua');
    console.log(`trying to load ${luaScriptPath}`);
    const luaScript = fs.readFileSync(luaScriptPath, 'utf8');
    const args: string[] = ['6', 'bull:some_queue:wait', 'bull:some_queue:paused', 'bull:some_queue:meta-paused', 'bull:some_queue:id', 'bull:some_queue:delayed', 'bull:some_queue:priority', 'bull:some_queue:', '', 'S1234_last_first', '{"trackid":"9405503699300066833313","filingKey":"S1234_last_first","name":"S1234_last_first","message":"Waiting to start"}', '{"delay":15,"attempts":1,"timestamp":1579142712160}', '1579142712160', '15', '1579142712175', '0', 'LPUSH', '9f187ecc-d502-4287-9f23-9978e6c2d67e'];
    response = await sendCommand(client, ['eval', luaScript, ...args]);
    expect(response).to.equal('1');
    response = await sendCommand(client, ['keys', '*']);
    expect(response.sort()).to.eql(['bull:some_queue:1', 'bull:some_queue:delayed', 'bull:some_queue:id']);
    response = await sendCommand(client, ['type', 'bull:some_queue:delayed']);
    expect(response).to.equal('zset');
    response = await sendCommand(client, ['type', 'bull:some_queue:id']);
    expect(response).to.equal('string');
    response = await sendCommand(client, ['type', 'bull:some_queue:1']);
    expect(response).to.equal('hash');
    response = await sendCommand(client, ['get', 'bull:some_queue:id']);
    expect(response).to.equal('1');
  });
});
