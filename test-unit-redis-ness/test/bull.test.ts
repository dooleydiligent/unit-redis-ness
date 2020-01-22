import { BullTest, JobOp } from '../src/bull-queue';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../src/server/resp-server';
import { sendCommand } from '../../test/common.test';

describe.only('bull queue test', () => {
  let respServer: RespServer;
  let client: net.Socket = new net.Socket();
  let response: any;
  let bullTest: BullTest;
  let jobname: string;
  before((done) => {
    respServer = new RespServer();
    respServer.on('ready', async () => {
      await sendCommand(client, ['flushall']);
      await sendCommand(client, ['select', '0'])
      await sendCommand(client, ['script', 'flush']);
      bullTest = new BullTest();
      bullTest.on('jobstart', (data: any) => {
        console.log(`\n\n\n***jobstart `, data);
        jobname = data.name;
      });
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
  it('should not create any keys when bull is instantiated with no queue processor', async () => {
    response = await sendCommand(client, ['keys', '*']);
    expect(response.sort()).to.eql([]);
  });
  it('should not create any keys when a bull processor is started', (done) => {
    bullTest.work();
    sendCommand(client, ['keys', '*'])
      .then((response: any) => {
        expect(response.sort()).to.eql([]);
        done();
      });
  });
  it('should create one or more keys when a job is added to a bull queue with a processor', async () => {
    await bullTest.queueJob({ factor1: 100, factor2: 200, operation: JobOp.MULTIPLY });
    response = await sendCommand(client, ['keys', '*']);
    expect(response.sort()).to.eql(['bull:test:1', 'bull:test:id', 'bull:test:wait']);
  });
  it('should have created the expected key types', (done) => {
    setTimeout(() => {
      // sendCommand(client, ['hgetall', 'bull:test:1'])
      //   .then((response: any) => {
      //     expect(response[0]).to.equal('name');
      //     expect(response[1]).to.equal('multiply');
          expect(jobname).to.equal('multiply');
          done();
        // });
    }, 7000);
  });
});
