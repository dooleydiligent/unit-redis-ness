import { expect } from 'chai';
import 'mocha';
import * as net from 'net';
import * as sinon from 'sinon';
import { RespServer } from '../../../../../src/server/resp-server';
import { sendCommand } from '../../../../common.test';
/**
 * These tests are modeled directly after the original
 * node sorted-set https://www.npmjs.com/package/sorted-map by eli skaggs,
 * since that code has been recast in Typescript and included here
 * as SortedSet();
 */
describe('skip map rewrite', () => {
  let respServer: RespServer;
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
  it('should support basic operations', async () => {
    const uniqueZkey = `key${new Date().getTime()}`;
    let response: any = await sendCommand(client, ['zrange', 'testkey', String(Number.MIN_SAFE_INTEGER), String(Number.MAX_SAFE_INTEGER)]);
    expect(response).to.eql([]);
    response = await sendCommand(client, ['zadd', 'testkey', '14', '__proto__']);
    expect(response).to.equal(1);
    // response = await sendCommand(client, ['zadd', uniqueZkey, '14', 'proto']);
    // expect(response).to.equal(1);
    //   expect(() => {
    //     ss.add('__proto__', 14);
    //   }).to.throw();

    response = await sendCommand(client, ['zadd', uniqueZkey, '8', '5a600e16']);
    response = await sendCommand(client, ['zadd', uniqueZkey, '9', '5a600e17']);
    response = await sendCommand(client, ['zadd', uniqueZkey, '10', '5a600e18'])
    expect(response).to.equal(1);

    response = await sendCommand(client, ['zrange', uniqueZkey, String(Number.MIN_SAFE_INTEGER), String(Number.MAX_SAFE_INTEGER), 'withScores']);
    console.log(`response is `, response);

    //   ss.add('5a600e16', 8);
    //   ss.add('5a600e17', 9);
    //   expect(ss.add('5a600e18', 10)).to.equal(null);
    response = await sendCommand(client, ['zadd', uniqueZkey, '12', '5a600e17'])
    expect(response).to.equal(0);
    //   expect(ss.add('5a600e17', 12)).to.equal(9);
    response = await sendCommand(client, ['zcount', uniqueZkey, String(Number.MIN_SAFE_INTEGER), String(Number.MAX_SAFE_INTEGER)]);
    //   expect(ss).to.have.length(3);
    expect(response).to.equal(3);
    response = await sendCommand(client, ['zrange', uniqueZkey, String(Number.MIN_SAFE_INTEGER), String(Number.MAX_SAFE_INTEGER)]);
    expect(response.length).to.equal(3);
    expect(response).to.eql(['5a600e16', '5a600e18', '5a600e17']);
    response = await sendCommand(client, ['zrange', uniqueZkey, String(Number.MIN_SAFE_INTEGER), String(Number.MAX_SAFE_INTEGER), 'withScores']);
    expect(response).to.eql([['5a600e16', '8'], ['5a600e18', '10'], ['5a600e17', '12']]);
    //   expect(ss.toArray()).to.eql(['5a600e16', '5a600e18', '5a600e17']);
    //   expect(ss.toArray()).to.eql(ss.range(0, -1));

    //   expect(ss.toArray()).to.eql(ss.rangeByScore());


    //   expect(ss.has('5a600e16')).to.be.ok;
    //   expect(ss.has('5a600e17')).to.be.ok;
    //   expect(ss.has('5a600e18')).to.be.ok;
    //   expect(ss.has('5a600e19')).to.not.be.ok;

    //   expect(ss.score('5a600e16')).to.equal(8);
    //   expect(ss.score('5a600e17')).to.equal(12);
    //   expect(ss.score('5a600e18')).to.equal(10);
    //   expect(ss.score('5a600e19')).to.equal(null);

    //   expect(ss.rem('5a600e16')).to.equal(8);

    //   expect(ss).to.have.length(2);

    //   expect(ss.rem('5a600e16')).to.equal(null);

    //   expect(ss).to.have.length(2);

    //   expect(ss.has('5a600e16')).to.not.be.ok;

    //   expect(ss.toArray()).to.eql(['5a600e18', '5a600e17']);
    //   expect(ss.toArray({ withScores: true }))
    //     .to.eql(ss.range(0, -1, { withScores: true }));
    //   expect(ss.toArray()).to.eql(ss.rangeByScore());

    //   ss.add('5a600e16', 10);
    //   ss.add('5a600e10', 16);
    //   ss.add('5a600e11', 6);
    //   ss.add('5a600e12', 17);
    //   ss.add('5a600e13', 11);
    //   ss.add('5a600e14', 14);
    //   ss.add('5a600e15', 19);
    //   ss.add('5a600e16', 3);

    //   expect(ss).to.have.length(9);

    //   // no change, so should be O(1)
    //   ss.add('5a600e17', 12);

    //   expect(ss.rank('5a600e17')).to.equal(4);

    //   expect(ss).to.have.length(9);
    //   expect(ss.toArray()).to.eql([
    //     '5a600e16',
    //     '5a600e11',
    //     '5a600e18',
    //     '5a600e13',
    //     '5a600e17',
    //     '5a600e14',
    //     '5a600e10',
    //     '5a600e12',
    //     '5a600e15',
    //   ]);
    //   expect(ss.toArray()).to.eql(ss.range(0, -1));
    //   expect(ss.toArray()).to.eql(ss.rangeByScore());

    //   expect(ss.rangeByScore(14, 16, { withScores: true })).to.eql([
    //     ['5a600e14', 14],
    //     ['5a600e10', 16],
    //   ]);
    // });


    // describe('#add', () => {
    //   it('should implicitly delete', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(ss.add('5a600e14', null)).to.equal(14);
    //     expect(ss.add('5a600e19', null)).to.equal(null);

    //     expect(ss).to.have.length(8);
    //   });
    // });


    // describe('#empty', () => {
    //   it('should remove all elements', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     ss.empty();

    //     expect(ss).to.have.length(0);
    //     expect(ss.toArray()).to.eql([]);
    //   });
    // });


    // describe('#incrBy(increment, key)', () => {
    //   it('should increase rank', () => {
    //     let ss = new SortedSet();

    //     ss.add('first', 1);
    //     ss.add('second', 2);
    //     ss.add('third', 3);
    //     ss.add('fourth', 4);

    //     expect(ss.incrBy(2, 'first')).to.equal(3);
    //     expect(ss.rank('first')).to.equal(1);
    //   });

    //   it('should create if not found', () => {
    //     let ss = new SortedSet();
    //     ss.add('first', 1);
    //     ss.incrBy(2, 'second');
    //     expect(ss.card()).to.equal(2);
    //     expect(ss.rank('second')).to.equal(1);
    //   });
    // });


    // describe('#keys', () => {
    //   it('should return the keys', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(ss.keys()).to.eql(['5a600e16', '5a600e11', '5a600e18', '5a600e13',
    //       '5a600e17', '5a600e14', '5a600e10', '5a600e12', '5a600e15']);
    //   });
    // });

    // describe('#rangeByScore', () => {
    //   it('should support special ranges', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(ss.rangeByScore(14, null, { withScores: true })).to.eql([
    //       ['5a600e14', 14],
    //       ['5a600e10', 16],
    //       ['5a600e12', 17],
    //       ['5a600e15', 19],
    //     ]);

    //     expect(ss.rangeByScore(null, 10, { withScores: true })).to.eql([
    //       ['5a600e16', 3],
    //       ['5a600e11', 6],
    //       ['5a600e18', 10],
    //     ]);

    //     expect(ss.rangeByScore(-Infinity, Infinity)).to.eql(ss.toArray());
    //     expect(ss.rangeByScore(null, null)).to.eql(ss.toArray());
    //   });
    // });

    // describe('#count', () => {
    //   it('should count elements', () => {
    //     let ss = new SortedSet();

    //     expect(ss.count()).to.equal(0);

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);
    //     ss.add('5a600e19', 14);
    //     ss.add('5a600f00', 30.0);
    //     ss.add('5a600f01', 30.5);
    //     ss.add('5a600f02', 31.0);
    //     ss.add('5a600f03', 31.5);
    //     ss.add('5a600f04', 32.0);
    //     ss.add('5a600f05', 32.0);
    //     ss.add('5a600f06', 32.0);

    //     expect(ss.count()).to.eql(ss.rangeByScore().length);
    //     expect(ss.count(8)).to.eql(ss.rangeByScore(8).length);
    //     expect(ss.count(3, 7)).to.eql(ss.rangeByScore(3, 7).length);
    //     expect(ss.count(5, 14)).to.eql(ss.rangeByScore(5, 14).length);
    //     expect(ss.count(5, 5)).to.eql(ss.rangeByScore(5, 5).length);
    //     expect(ss.count(5, 0)).to.eql(ss.rangeByScore(5, 0).length);
    //     expect(ss.count(30, 32)).to.eql(ss.rangeByScore(30, 32).length);
    //     expect(ss.count(40)).to.eql(ss.rangeByScore(40).length);
    //   });
    // });

    // describe('#range', () => {
    //   it('should support special ranges', () => {
    //     let ss = new SortedSet();
    //     ss.add('first', 1);
    //     ss.add('second', 2);
    //     ss.add('third', 3);
    //     ss.add('fourth', 4);

    //     let array = ['first', 'second', 'third', 'fourth'];

    //     expect(ss.range()).to.eql(array);

    //     expect(ss.range(2)).to.eql(array.slice(2));
    //     expect(ss.range(8)).to.eql(array.slice(8));
    //     expect(ss.range(0, 2)).to.eql(array.slice(0, 3));
    //     expect(ss.range(-1)).to.eql(['fourth']);
    //     expect(ss.range(-4)).to.eql(array);
    //     expect(ss.range(-4, -2)).to.eql(array.slice(0, 3));
    //     expect(ss.range(-4, ss.length + 1000))
    //       .to.eql(array.slice(-4, ss.length + 1000));
    //   });

    //   it('should support withScores', () => {
    //     let ss = new SortedSet();
    //     ss.add('first', 1);
    //     ss.add('second', 2);

    //     expect(ss.range(0, 0, { withScores: true }))
    //       .to.eql([['first', 1]]);
    //   });
    // });

    // describe('#intersect', () => {
    //   it('should intersect two sets', () => {
    //     let a = new SortedSet(), b = new SortedSet();

    //     a.add('5a600e10', 16);
    //     a.add('5a600e12', 10);
    //     a.add('5a600e14', 9);
    //     a.add('5a600e15', 14);
    //     a.add('5a600e17', 20);
    //     a.add('5a600e18', 13);
    //     a.add('5a600e19', 15);
    //     a.add('5a600e1a', 19);
    //     a.add('5a600e1b', 7);
    //     a.add('5a600e1c', 13);
    //     a.add('5a600e1e', 10);

    //     b.add('5a600e10', 0);
    //     b.add('5a600e11', 15);
    //     b.add('5a600e13', 5);
    //     b.add('5a600e14', 3);
    //     b.add('5a600e15', 14);
    //     b.add('5a600e17', 12);
    //     b.add('5a600e19', 12);
    //     b.add('5a600e1b', 16);
    //     b.add('5a600e1c', 12);
    //     b.add('5a600e1d', 17);
    //     b.add('5a600e1f', 3);

    //     expect(SortedSet.intersect(a, b)).to.eql(['5a600e10', '5a600e14',
    //       '5a600e17', '5a600e19', '5a600e1c', '5a600e15', '5a600e1b']);
    //     expect(SortedSet.intersect(b, a)).to.eql(['5a600e1b', '5a600e14',
    //       '5a600e1c', '5a600e15', '5a600e19', '5a600e10', '5a600e17']);
    //   });

    //   it('should intersect three sets', () => {
    //     let a = new SortedSet(), b = new SortedSet(), c = new SortedSet();

    //     a.add('5a600e10', 16);
    //     a.add('5a600e12', 10);
    //     a.add('5a600e14', 9);
    //     a.add('5a600e15', 14);
    //     a.add('5a600e17', 20);
    //     a.add('5a600e18', 13);
    //     a.add('5a600e19', 15);
    //     a.add('5a600e1a', 19);
    //     a.add('5a600e1b', 7);
    //     a.add('5a600e1c', 13);
    //     a.add('5a600e1e', 10);

    //     b.add('5a600e10', 0);
    //     b.add('5a600e11', 15);
    //     b.add('5a600e13', 5);
    //     b.add('5a600e14', 3);
    //     b.add('5a600e15', 14);
    //     b.add('5a600e17', 12);
    //     b.add('5a600e19', 12);
    //     b.add('5a600e1b', 16);
    //     b.add('5a600e1c', 12);
    //     b.add('5a600e1d', 17);
    //     b.add('5a600e1f', 3);

    //     c.add('5a600e10', 7);
    //     c.add('5a600e12', 20);
    //     c.add('5a600e13', 9);
    //     c.add('5a600e14', 19);
    //     c.add('5a600e16', 19);
    //     c.add('5a600e17', 1);
    //     c.add('5a600e18', 18);
    //     c.add('5a600e1a', 6);
    //     c.add('5a600e1c', 15);
    //     c.add('5a600e1f', 4);

    //     expect(SortedSet.intersect(c, a, b)).to.eql(['5a600e10', '5a600e14',
    //       '5a600e17', '5a600e1c']);

    //     // expect(SortedSet.intersect(c, a, b)).to.eql(c.intersect(a, b));
    //   });

    //   it('should intersect four sets', () => {
    //     let a = new SortedSet();
    //     let b = new SortedSet();
    //     let c = new SortedSet();
    //     let d = new SortedSet();

    //     a.add('5a600e10', 16);
    //     a.add('5a600e12', 10);
    //     a.add('5a600e14', 9);
    //     a.add('5a600e15', 14);
    //     a.add('5a600e17', 20);
    //     a.add('5a600e18', 13);
    //     a.add('5a600e19', 15);
    //     a.add('5a600e1a', 19);
    //     a.add('5a600e1b', 7);
    //     a.add('5a600e1c', 13);
    //     a.add('5a600e1e', 10);

    //     b.add('5a600e10', 0);
    //     b.add('5a600e11', 15);
    //     b.add('5a600e13', 5);
    //     b.add('5a600e14', 3);
    //     b.add('5a600e15', 14);
    //     b.add('5a600e17', 12);
    //     b.add('5a600e19', 12);
    //     b.add('5a600e1b', 16);
    //     b.add('5a600e1c', 12);
    //     b.add('5a600e1d', 17);
    //     b.add('5a600e1f', 3);

    //     c.add('5a600e10', 7);
    //     c.add('5a600e12', 20);
    //     c.add('5a600e13', 9);
    //     c.add('5a600e14', 19);
    //     c.add('5a600e16', 19);
    //     c.add('5a600e17', 1);
    //     c.add('5a600e18', 18);
    //     c.add('5a600e1a', 6);
    //     c.add('5a600e1c', 15);
    //     c.add('5a600e1f', 4);

    //     d.add('5a600e1c', 400);
    //     d.add('5a600e17', 500);
    //     d.add('5a600e1f', 600);
    //     d.add('5a600e20', 700);

    //     expect(SortedSet.intersect(d, c, a, b)).to.eql(['5a600e17', '5a600e1c']);

    //     // expect(SortedSet.intersect(d, c, a, b)).to.eql(d.intersect(c, a, b));
    //   });
    // });

    // describe('#rank', () => {
    //   it('should get the correct rank', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(ss.rank('5a600e12')).to.equal(7);
    //     expect(ss.rank('5a600e13')).to.equal(3);
    //     expect(ss.rank('5a600e16')).to.equal(0);
    //     expect(ss.rank('5a600e15')).to.equal(8);

    //     expect(ss.rank('not in set')).to.equal(null);
    //   });
    // });

    // describe('#rem', () => {
    //   it('should delete special elements', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(ss.rem('5a600e15')).to.equal(19);

    //     expect(ss).to.have.length(8);

    //     expect(ss.rem('5a600e16')).to.equal(3);

    //     expect(ss).to.have.length(7);

    //     expect(ss.toArray({ withScores: true })).to.eql([
    //       ['5a600e11', 6],
    //       ['5a600e18', 10],
    //       ['5a600e13', 11],
    //       ['5a600e17', 12],
    //       ['5a600e14', 14],
    //       ['5a600e10', 16],
    //       ['5a600e12', 17],
    //     ]);
    //   });

    //   it('should delete many elements', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(ss.rem('5a600e11')).to.equal(6);
    //     expect(ss.rem('5a600e13')).to.equal(11);
    //     expect(ss.rem('5a600e14')).to.equal(14);
    //     expect(ss.rem('5a600e15')).to.equal(19);
    //     expect(ss.rem('5a600e16')).to.equal(3);
    //     expect(ss.rem('5a600e17')).to.equal(12);

    //     expect(ss.length).to.equal(3);
    //     expect(ss.toArray({ withScores: true })).to.eql([
    //       ['5a600e18', 10],
    //       ['5a600e10', 16],
    //       ['5a600e12', 17],
    //     ]);
    //   });
    // });

    // describe('#remRangeByScore', () => {
    //   it('should strip out a range of elements', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(ss.remRangeByScore(4, 14)).to.equal(5);
    //     expect(ss).to.have.length(4);

    //     expect(ss.toArray({ withScores: true })).to.eql([
    //       ['5a600e16', 3],
    //       ['5a600e10', 16],
    //       ['5a600e12', 17],
    //       ['5a600e15', 19],
    //     ]);
    //   });

    //   it('should strip out all the elements', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(ss.remRangeByScore(3, 19)).to.equal(9);
    //     expect(ss).to.have.length(0);

    //     expect(ss.toArray()).to.eql([]);
    //   });
    // });

    // describe('#remRangeByRank', () => {
    //   it('should strip out a slice of elements', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(ss.remRangeByRank(1, 6)).to.equal(5);
    //     expect(ss).to.have.length(4);

    //     expect(ss.toArray({ withScores: true })).to.eql([
    //       ['5a600e16', 3],
    //       ['5a600e10', 16],
    //       ['5a600e12', 17],
    //       ['5a600e15', 19],
    //     ]);
    //   });

    //   it('should strip out all elements', () => {
    //     let ss = new SortedSet();

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(ss.remRangeByRank(0, 9)).to.equal(9);
    //     expect(ss).to.have.length(0);

    //     expect(ss.toArray()).to.eql([]);
    //   });
    // });

    // describe('#values', () => {
    //   it('should return the values', () => {
    //     let ss = new SortedSet();

    //     ss.add('first', -1);
    //     ss.add('third', 5);
    //     ss.add('second', 3);

    //     expect(ss.values()).to.eql([-1, 3, 5]);
    //   });
    // });

    // describe('unique rewrite', () => {
    //   it('should ensure values are unique', () => {
    //     const options = { unique: true};
    //     let ss = new SortedSet(options);

    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     expect(() => {
    //       ss.add('5a600e19', 11);
    //     }).to.throw(/unique/);

    //     // quick exit test
    //     expect(() => {
    //       ss.add('5a600dff', ss._head.next[ss._level - 1].next.value);
    //     }).to.throw(/unique/);

    //     // this test ensures the key < key check doesn't come into play
    //     expect(() => {
    //       ss.add('5a600dff', 11);
    //     }).to.throw(/unique/);

    //     expect(() => {
    //       ss.add('5a600e18', 10);
    //     }).to.not.throw();

    //     expect(ss).to.have.length(9);

    //     expect(ss.toArray({ withScores: true })).to.eql([
    //       ['5a600e16', 3],
    //       ['5a600e11', 6],
    //       ['5a600e18', 10],
    //       ['5a600e13', 11],
    //       ['5a600e17', 12],
    //       ['5a600e14', 14],
    //       ['5a600e10', 16],
    //       ['5a600e12', 17],
    //       ['5a600e15', 19],
    //     ]);
    //   });

    //   it('should revert keys if constraint broken during update', () => {
    //     let ss = new SortedSet({ unique: true });
    //     ss.add('5a600e10', 16);
    //     ss.add('5a600e11', 6);
    //     ss.add('5a600e12', 17);
    //     ss.add('5a600e13', 11);
    //     ss.add('5a600e14', 14);
    //     ss.add('5a600e15', 19);
    //     ss.add('5a600e16', 3);
    //     ss.add('5a600e17', 12);
    //     ss.add('5a600e18', 10);

    //     console.log(`values is ${ss.values()}`);
    //     expect(() => {
    //       ss.add('5a600e13', 14);
    //     }).to.throw(/unique/);

    //     expect(ss).to.have.length(9);
    //     expect(ss.score('5a600e13')).to.equal(11);
    // });
  });
});
