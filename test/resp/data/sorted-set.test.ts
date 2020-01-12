import * as assert from 'assert';
import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import { SortedSet } from '../../../src/resp/data/sorted-set';
const Z = require('redis-sorted-set');

describe('sorted-set test', () => {
  let ss: SortedSet;
  let z: any;
  beforeEach(() => {
    sinon.createSandbox();
    ss = new SortedSet();
    z = new Z();
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
  });
  /**
   * I'm not an expert on sorted sets, so I'm out of my depth
   */
  it('should instantiate', async () => {
    z = new Z();
    expect(z.constructor.name).to.equal('Z');
    ss = new SortedSet();
    expect(ss.constructor.name).to.equal('SortedSet');
  });
  it('should add, get, and delete an entry', async () => {
    z = new Z();
    ss = new SortedSet();
    let added = z.add('test', 1);
    expect(added).to.equal(null);
    added = ss.add('test', 1);
    expect(added).to.equal(null);

    expect(z.keys().length).to.equal(1);
    expect(ss.keys().length).to.equal(1);

    let item = z.get('test');
    expect(item.constructor.name).to.equal('Number');
    item = ss.get('test');
    expect(item.constructor.name).to.equal('Number');

    z.del('test');
    expect(z.keys().length).to.equal(0);
    ss.del('test');
    expect(ss.keys().length).to.equal(0);
  });
  it('should throw when attempting to add __proto__ key', async () => {
    z = new Z();
    ss = new SortedSet();
    expect(() => {
      z.add('__proto__', 0)
    }).to.throw();
    // expect(() => {
    //   ss.add('__proto__', 0)
    // }).to.throw();
  });
  it('should not add an undefined or null score', async () => {
    z = new Z();
    ss = new SortedSet();
    let added = z.add('test', null);
    expect(added).to.equal(null);
    expect(z.keys().length).to.equal(0);
    added = z.add('test', undefined);
    expect(z.keys().length).to.equal(0);

    // Typescript prevents adding null
    // added = ss.add('test', null);
    // expect(added).to.equal(null);
    // expect(ss.keys().length).to.equal(0);
    // added = ss.add('test', undefined);
    // expect(z.keys().length).to.equal(0);
  });
  it('should not duplicate key/value pairs', async () => {
    z = new Z();
    ss = new SortedSet();
    let added = z.add('test', 123);
    expect(added).to.equal(null); // This is weird
    expect(z.keys().length).to.equal(1);
    added = z.add('test', 123);
    expect(added).to.equal(123); // and weirder
    expect(z.keys().length).to.equal(1);

    added = ss.add('test', 123);
    expect(added).to.equal(null); // This is weird
    expect(ss.keys().length).to.equal(1);
    added = ss.add('test', 123);
    expect(added).to.equal(123); // and weirder
    expect(ss.keys().length).to.equal(1);
  });
  it('should return the old rank when replacing a key', async () => {
    z = new Z();
    ss = new SortedSet();
    let added = z.add('test', 123);
    expect(added).to.equal(null);
    expect(z.keys().length).to.equal(1);
    added = z.add('test', 321);
    expect(added).to.equal(123);
    expect(z.keys().length).to.equal(1);
    added = z.get('test');
    expect(added).to.equal(321);

    added = ss.add('test', 123);
    expect(added).to.equal(null);
    expect(ss.keys().length).to.equal(1);
    added = ss.add('test', 321);
    expect(added).to.equal(123);
    expect(ss.keys().length).to.equal(1);
    added = ss.get('test');
    expect(added).to.equal(321);
  });
  // Seems like this requires that we replace keys along the way
  // I give up.  Dunno what add does with current === undefined || this._insert(...)
  xit('should return a value when adding at least 32 values (I think - it is difficult to tell)', async () => {
    z = new Z();
    ss = new SortedSet();
    let returnValue = undefined;
    for (let i = 0; i < 64; i++) {
      returnValue = z.add(`key${parseInt(String(z.keys().length / 2), 10)}`, z.keys().length % 2);
      if (returnValue !== undefined) {
        console.log(`Got ${returnValue} on iteration ${i}`);
        break;
      }
    }
    expect(returnValue).to.not.equal(undefined);
    expect(z.keys().length).to.be.lessThan(33);
  });
  it('should do what the documentation says here: https://www.npmjs.com/package/redis-sorted-set', async () => {
    z = new Z();
    ss = new SortedSet();
    expect(z.add('Terminator', 8.0)).to.equal(null); // => null
    expect(z.add('District 9', 8.0)).to.equal(null); // => null
    expect(z.add('Ex Machina', 0.7)).to.equal(null); // => null
    expect(z.add('Ex Machina', 7.7)).to.equal(0.7); // => 0.7

    // alias
    expect(z.set('The Matrix', 8.7)).to.equal(null); // => null

    // average O(1)
    expect(z.has('Terminator')).to.equal(true); // => true
    expect(z.has('Blade Runner')).to.equal(false); // => false

    // average O(1)
    expect(z.score('Ex Machina')).to.equal(7.7); // => 7.7
    expect(z.score('Blade Runner')).to.equal(null); // => null
    // alias
    expect(z.get('The Matrix')).to.equal(8.7); // => 8.7

    // average O(log(N))
    expect(z.rem('Ex Machina')).to.equal(7.7); // => 7.7
    // average O(1)
    expect(z.rem('Ex Machina')).to.equal(null); // => null
    // alias
    expect(z.del('Ex Machina')).to.equal(null); // => null
    // average O(log(N)+M) where M is the number of elements between min and max
    // This is not working as expected
    expect(z.rangeByScore(7, 8)).to.eql(['District 9', 'Terminator']);
    // => ['Ex Machina', 'District 9', 'Terminator']
    expect(z.rangeByScore(8)).to.eql(['District 9', 'Terminator', 'The Matrix']); // [8.0-∞)
    // => ['District 9', 'Terminator', 'The Matrix']
    expect(z.rangeByScore(8, null, { withScores: true })).to.eql([['District 9', 8.0], ['Terminator', 8.0], ['The Matrix', 8.7]]);
    // => [['District 9', 8.0], ['Terminator', 8.0], ['The Matrix', 8.7]]

    // average O(log(N)+log(M)) where M as in rangeByScore
    // Again - not as expected
    expect(z.count(7, 8)).to.equal(2); // => 3

    // average O(log(N))
    // Not working as expected
    expect(z.rank('Ex Machina')).to.equal(null); // => 0
    // Not working as expected
    expect(z.rank('Terminator')).to.equal(1); // => 2
    expect(z.rank('Blade Runner')).to.equal(null); // => null

    // average O(log(N)+M) where M as in range
    // Not working as expected
    expect(z.range(0, 2)).to.eql(['District 9', 'Terminator', 'The Matrix']);
    // => ['Ex Machina', 'District 9', 'Terminator']
    // Not working as expected
    expect(z.range(0, 2, { withScores: true })).to.eql([['District 9', 8], ['Terminator', 8], ['The Matrix', 8.7]]);
    // => [['Ex Machina', 7.7],
    //     ['District 9', 8],
    //     ['Terminator', 8]]
    expect(z.range(-1)).to.eql(['The Matrix']); // => ['The Matrix']
    // almost alias
    // Not working as expected
    expect(z.slice(0, 3)).to.eql(['District 9', 'Terminator', 'The Matrix']);
    // => ['Ex Machina', 'District 9', 'Terminator']

    // Set cardinality (number of elements)
    // average O(1)
    // Not working as expected
    expect(z.card()).to.equal(3); // => 4
    // alias
    // Not working as expected
    expect(z.length).to.equal(3) // => 4
  });
  it('the rewrite should do what the documentation says here: https://www.npmjs.com/package/redis-sorted-set', async () => {
    z = new Z();
    ss = new SortedSet();
    expect(ss.add('Terminator', 8.0)).to.equal(null); // => null
    expect(ss.add('District 9', 8.0)).to.equal(null); // => null
    expect(ss.add('Ex Machina', 0.7)).to.equal(null); // => null
    expect(ss.add('Ex Machina', 7.7)).to.equal(0.7); // => 0.7

    // alias
    expect(ss.set('The Matrix', 8.7)).to.equal(null); // => null

    // average O(1)
    expect(ss.has('Terminator')).to.equal(true); // => true
    expect(ss.has('Blade Runner')).to.equal(false); // => false

    // average O(1)
    expect(ss.score('Ex Machina')).to.equal(7.7); // => 7.7
    expect(ss.score('Blade Runner')).to.equal(null); // => null
    // alias
    expect(ss.get('The Matrix')).to.equal(8.7); // => 8.7

    // average O(log(N))
    expect(ss.rem('Ex Machina')).to.equal(7.7); // => 7.7
    // average O(1)
    expect(ss.rem('Ex Machina')).to.equal(null); // => null
    // alias
    expect(ss.del('Ex Machina')).to.equal(null); // => null
    // average O(log(N)+M) where M is the number of elements between min and max
    // This is not working as expected
    expect(ss.rangeByScore(7, 8)).to.eql(['District 9', 'Terminator']);
    // => ['Ex Machina', 'District 9', 'Terminator']
    expect(ss.rangeByScore(8)).to.eql(['District 9', 'Terminator', 'The Matrix']); // [8.0-∞)
    // => ['District 9', 'Terminator', 'The Matrix']
    expect(ss.rangeByScore(8, null, { withScores: true })).to.eql([['District 9', 8.0], ['Terminator', 8.0], ['The Matrix', 8.7]]);
    // => [['District 9', 8.0], ['Terminator', 8.0], ['The Matrix', 8.7]]

    // average O(log(N)+log(M)) where M as in rangeByScore
    // Again - not as expected
    expect(ss.count(7, 8)).to.equal(2); // => 3

    // average O(log(N))
    // Not working as expected
    expect(ss.rank('Ex Machina')).to.equal(null); // => 0
    // Not working as expected
    expect(ss.rank('Terminator')).to.equal(1); // => 2
    expect(ss.rank('Blade Runner')).to.equal(null); // => null

    // average O(log(N)+M) where M as in range
    // Not working as expected
    expect(ss.range(0, 2)).to.eql(['District 9', 'Terminator', 'The Matrix']);
    // => ['Ex Machina', 'District 9', 'Terminator']
    // Not working as expected
    expect(ss.range(0, 2, { withScores: true })).to.eql([['District 9', 8], ['Terminator', 8], ['The Matrix', 8.7]]);
    // => [['Ex Machina', 7.7],
    //     ['District 9', 8],
    //     ['Terminator', 8]]
    expect(ss.range(-1)).to.eql(['The Matrix']); // => ['The Matrix']
    // almost alias
    // Not working as expected
    expect(ss.slice(0, 3)).to.eql(['District 9', 'Terminator', 'The Matrix']);
    // => ['Ex Machina', 'District 9', 'Terminator']

    // Set cardinality (number of elements)
    // average O(1)
    // Not working as expected
    expect(ss.card()).to.equal(3); // => 4
    // alias
    // Not working as expected
    expect(ss.length).to.equal(3) // => 4
  });
  describe('skip map', () => {
    it('should support basic operations', () => {
      var z = new Z();

      expect(z).to.have.length(0);
      expect(z.toArray()).to.eql([]);
      expect(z.range()).to.eql([]);
      expect(z.rangeByScore()).to.eql([]);

      expect(() => {
        z.add('__proto__', 14);
      }).to.throw();

      z.add('5a600e16', 8);
      z.add('5a600e17', 9);
      expect(z.add('5a600e18', 10)).to.equal(null);
      expect(z.add('5a600e17', 12)).to.equal(9);

      expect(z).to.have.length(3);
      expect(z.toArray()).to.eql(['5a600e16', '5a600e18', '5a600e17']);
      expect(z.toArray()).to.eql(z.range(0, -1));
      expect(z.toArray()).to.eql(z.rangeByScore());

      expect(z.has('5a600e16')).to.be.ok;
      expect(z.has('5a600e17')).to.be.ok;
      expect(z.has('5a600e18')).to.be.ok;
      expect(z.has('5a600e19')).to.not.be.ok;

      expect(z.score('5a600e16')).to.equal(8);
      expect(z.score('5a600e17')).to.equal(12);
      expect(z.score('5a600e18')).to.equal(10);
      expect(z.score('5a600e19')).to.equal(null);

      expect(z.rem('5a600e16')).to.equal(8);

      expect(z).to.have.length(2);

      expect(z.rem('5a600e16')).to.equal(null);

      expect(z).to.have.length(2);

      expect(z.has('5a600e16')).to.not.be.ok;

      expect(z.toArray()).to.eql(['5a600e18', '5a600e17']);
      expect(z.toArray({ withScores: true }))
        .to.eql(z.range(0, -1, { withScores: true }));
      expect(z.toArray()).to.eql(z.rangeByScore());

      z.add('5a600e16', 10);
      z.add('5a600e10', 16);
      z.add('5a600e11', 6);
      z.add('5a600e12', 17);
      z.add('5a600e13', 11);
      z.add('5a600e14', 14);
      z.add('5a600e15', 19);
      z.add('5a600e16', 3);

      expect(z).to.have.length(9);

      // no change, so should be O(1)
      z.add('5a600e17', 12);

      expect(z.rank('5a600e17')).to.equal(4);

      expect(z).to.have.length(9);
      expect(z.toArray()).to.eql([
        '5a600e16',
        '5a600e11',
        '5a600e18',
        '5a600e13',
        '5a600e17',
        '5a600e14',
        '5a600e10',
        '5a600e12',
        '5a600e15',
      ]);
      expect(z.toArray()).to.eql(z.range(0, -1));
      expect(z.toArray()).to.eql(z.rangeByScore());

      expect(z.rangeByScore(14, 16, { withScores: true })).to.eql([
        ['5a600e14', 14],
        ['5a600e10', 16],
      ]);
    });


    describe('#add', () => {
      it('should implicitly delete', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(z.add('5a600e14', null)).to.equal(14);
        expect(z.add('5a600e19', null)).to.equal(null);

        expect(z).to.have.length(8);
      });
    });


    describe('#empty', () => {
      it('should remove all elements', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        z.empty();

        expect(z).to.have.length(0);
        expect(z.toArray()).to.eql([]);
      });
    });


    describe('#incrBy(increment, key)', () => {
      it('should increase rank', () => {
        var z = new Z();

        z.add('first', 1);
        z.add('second', 2);
        z.add('third', 3);
        z.add('fourth', 4);

        expect(z.incrBy(2, 'first')).to.equal(3);
        expect(z.rank('first')).to.equal(1);
      });

      it('should create if not found', () => {
        var z = new Z();
        z.add('first', 1);
        z.incrBy(2, 'second');
        expect(z.card()).to.equal(2);
        expect(z.rank('second')).to.equal(1);
      });
    });


    describe('#keys', () => {
      it('should return the keys', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(z.keys()).to.eql(['5a600e16', '5a600e11', '5a600e18', '5a600e13',
          '5a600e17', '5a600e14', '5a600e10', '5a600e12', '5a600e15']);
      });
    });

    describe('#rangeByScore', () => {
      it('should support special ranges', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(z.rangeByScore(14, null, { withScores: true })).to.eql([
          ['5a600e14', 14],
          ['5a600e10', 16],
          ['5a600e12', 17],
          ['5a600e15', 19],
        ]);

        expect(z.rangeByScore(null, 10, { withScores: true })).to.eql([
          ['5a600e16', 3],
          ['5a600e11', 6],
          ['5a600e18', 10],
        ]);

        expect(z.rangeByScore(-Infinity, Infinity)).to.eql(z.toArray());
        expect(z.rangeByScore(null, null)).to.eql(z.toArray());
      });
    });

    describe('#count', () => {
      it('should count elements', () => {
        var z = new Z();

        expect(z.count()).to.equal(0);

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);
        z.add('5a600e19', 14);
        z.add('5a600f00', 30.0);
        z.add('5a600f01', 30.5);
        z.add('5a600f02', 31.0);
        z.add('5a600f03', 31.5);
        z.add('5a600f04', 32.0);
        z.add('5a600f05', 32.0);
        z.add('5a600f06', 32.0);

        expect(z.count()).to.eql(z.rangeByScore().length);
        expect(z.count(8)).to.eql(z.rangeByScore(8).length);
        expect(z.count(3, 7)).to.eql(z.rangeByScore(3, 7).length);
        expect(z.count(5, 14)).to.eql(z.rangeByScore(5, 14).length);
        expect(z.count(5, 5)).to.eql(z.rangeByScore(5, 5).length);
        expect(z.count(5, 0)).to.eql(z.rangeByScore(5, 0).length);
        expect(z.count(30, 32)).to.eql(z.rangeByScore(30, 32).length);
        expect(z.count(40)).to.eql(z.rangeByScore(40).length);
      });
    });

    describe('#range', () => {
      it('should support special ranges', () => {
        var z = new Z();
        z.add('first', 1);
        z.add('second', 2);
        z.add('third', 3);
        z.add('fourth', 4);

        var array = ['first', 'second', 'third', 'fourth'];

        expect(z.range()).to.eql(array);

        expect(z.range(2)).to.eql(array.slice(2));
        expect(z.range(8)).to.eql(array.slice(8));
        expect(z.range(0, 2)).to.eql(array.slice(0, 3));
        expect(z.range(-1)).to.eql(['fourth']);
        expect(z.range(-4)).to.eql(array);
        expect(z.range(-4, -2)).to.eql(array.slice(0, 3));
        expect(z.range(-4, z.length + 1000))
          .to.eql(array.slice(-4, z.length + 1000));
      });

      it('should support withScores', () => {
        var z = new Z();
        z.add('first', 1);
        z.add('second', 2);

        expect(z.range(0, 0, { withScores: true }))
          .to.eql([['first', 1]]);
      });
    });

    describe('#intersect', () => {
      it('should intersect two sets', () => {
        var a = new Z(), b = new Z();

        a.add('5a600e10', 16);
        a.add('5a600e12', 10);
        a.add('5a600e14', 9);
        a.add('5a600e15', 14);
        a.add('5a600e17', 20);
        a.add('5a600e18', 13);
        a.add('5a600e19', 15);
        a.add('5a600e1a', 19);
        a.add('5a600e1b', 7);
        a.add('5a600e1c', 13);
        a.add('5a600e1e', 10);

        b.add('5a600e10', 0);
        b.add('5a600e11', 15);
        b.add('5a600e13', 5);
        b.add('5a600e14', 3);
        b.add('5a600e15', 14);
        b.add('5a600e17', 12);
        b.add('5a600e19', 12);
        b.add('5a600e1b', 16);
        b.add('5a600e1c', 12);
        b.add('5a600e1d', 17);
        b.add('5a600e1f', 3);

        expect(Z.intersect(a, b)).to.eql(['5a600e10', '5a600e14',
          '5a600e17', '5a600e19', '5a600e1c', '5a600e15', '5a600e1b']);
        expect(Z.intersect(b, a)).to.eql(['5a600e1b', '5a600e14',
          '5a600e1c', '5a600e15', '5a600e19', '5a600e10', '5a600e17']);
      });

      it('should intersect three sets', () => {
        var a = new Z(), b = new Z(), c = new Z();

        a.add('5a600e10', 16);
        a.add('5a600e12', 10);
        a.add('5a600e14', 9);
        a.add('5a600e15', 14);
        a.add('5a600e17', 20);
        a.add('5a600e18', 13);
        a.add('5a600e19', 15);
        a.add('5a600e1a', 19);
        a.add('5a600e1b', 7);
        a.add('5a600e1c', 13);
        a.add('5a600e1e', 10);

        b.add('5a600e10', 0);
        b.add('5a600e11', 15);
        b.add('5a600e13', 5);
        b.add('5a600e14', 3);
        b.add('5a600e15', 14);
        b.add('5a600e17', 12);
        b.add('5a600e19', 12);
        b.add('5a600e1b', 16);
        b.add('5a600e1c', 12);
        b.add('5a600e1d', 17);
        b.add('5a600e1f', 3);

        c.add('5a600e10', 7);
        c.add('5a600e12', 20);
        c.add('5a600e13', 9);
        c.add('5a600e14', 19);
        c.add('5a600e16', 19);
        c.add('5a600e17', 1);
        c.add('5a600e18', 18);
        c.add('5a600e1a', 6);
        c.add('5a600e1c', 15);
        c.add('5a600e1f', 4);

        expect(Z.intersect(c, a, b)).to.eql(['5a600e10', '5a600e14',
          '5a600e17', '5a600e1c']);

        expect(Z.intersect(c, a, b)).to.eql(c.intersect(a, b));
      });

      it('should intersect four sets', () => {
        var a = new Z();
        var b = new Z();
        var c = new Z();
        var d = new Z();

        a.add('5a600e10', 16);
        a.add('5a600e12', 10);
        a.add('5a600e14', 9);
        a.add('5a600e15', 14);
        a.add('5a600e17', 20);
        a.add('5a600e18', 13);
        a.add('5a600e19', 15);
        a.add('5a600e1a', 19);
        a.add('5a600e1b', 7);
        a.add('5a600e1c', 13);
        a.add('5a600e1e', 10);

        b.add('5a600e10', 0);
        b.add('5a600e11', 15);
        b.add('5a600e13', 5);
        b.add('5a600e14', 3);
        b.add('5a600e15', 14);
        b.add('5a600e17', 12);
        b.add('5a600e19', 12);
        b.add('5a600e1b', 16);
        b.add('5a600e1c', 12);
        b.add('5a600e1d', 17);
        b.add('5a600e1f', 3);

        c.add('5a600e10', 7);
        c.add('5a600e12', 20);
        c.add('5a600e13', 9);
        c.add('5a600e14', 19);
        c.add('5a600e16', 19);
        c.add('5a600e17', 1);
        c.add('5a600e18', 18);
        c.add('5a600e1a', 6);
        c.add('5a600e1c', 15);
        c.add('5a600e1f', 4);

        d.add('5a600e1c', 400);
        d.add('5a600e17', 500);
        d.add('5a600e1f', 600);
        d.add('5a600e20', 700);

        expect(Z.intersect(d, c, a, b)).to.eql(['5a600e17', '5a600e1c']);

        expect(Z.intersect(d, c, a, b)).to.eql(d.intersect(c, a, b));
      });
    });

    describe('#rank', () => {
      it('should get the correct rank', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(z.rank('5a600e12')).to.equal(7);
        expect(z.rank('5a600e13')).to.equal(3);
        expect(z.rank('5a600e16')).to.equal(0);
        expect(z.rank('5a600e15')).to.equal(8);

        expect(z.rank('not in set')).to.equal(null);
      });
    });

    describe('#rem', () => {
      it('should delete special elements', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(z.rem('5a600e15')).to.equal(19);

        expect(z).to.have.length(8);

        expect(z.rem('5a600e16')).to.equal(3);

        expect(z).to.have.length(7);

        expect(z.toArray({ withScores: true })).to.eql([
          ['5a600e11', 6],
          ['5a600e18', 10],
          ['5a600e13', 11],
          ['5a600e17', 12],
          ['5a600e14', 14],
          ['5a600e10', 16],
          ['5a600e12', 17],
        ]);
      });

      it('should delete many elements', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(z.rem('5a600e11')).to.equal(6);
        expect(z.rem('5a600e13')).to.equal(11);
        expect(z.rem('5a600e14')).to.equal(14);
        expect(z.rem('5a600e15')).to.equal(19);
        expect(z.rem('5a600e16')).to.equal(3);
        expect(z.rem('5a600e17')).to.equal(12);

        expect(z.length).to.equal(3);
        expect(z.toArray({ withScores: true })).to.eql([
          ['5a600e18', 10],
          ['5a600e10', 16],
          ['5a600e12', 17],
        ]);
      });
    });

    describe('#remRangeByScore', () => {
      it('should strip out a range of elements', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(z.remRangeByScore(4, 14)).to.equal(5);
        expect(z).to.have.length(4);

        expect(z.toArray({ withScores: true })).to.eql([
          ['5a600e16', 3],
          ['5a600e10', 16],
          ['5a600e12', 17],
          ['5a600e15', 19],
        ]);
      });

      it('should strip out all the elements', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(z.remRangeByScore(3, 19)).to.equal(9);
        expect(z).to.have.length(0);

        expect(z.toArray()).to.eql([]);
      });
    });

    describe('#remRangeByRank', () => {
      it('should strip out a slice of elements', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(z.remRangeByRank(1, 6)).to.equal(5);
        expect(z).to.have.length(4);

        expect(z.toArray({ withScores: true })).to.eql([
          ['5a600e16', 3],
          ['5a600e10', 16],
          ['5a600e12', 17],
          ['5a600e15', 19],
        ]);
      });

      it('should strip out all elements', () => {
        var z = new Z();

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(z.remRangeByRank(0, 9)).to.equal(9);
        expect(z).to.have.length(0);

        expect(z.toArray()).to.eql([]);
      });
    });

    describe('#values', () => {
      it('should return the values', () => {
        var z = new Z();

        z.add('first', -1);
        z.add('third', 5);
        z.add('second', 3);

        expect(z.values()).to.eql([-1, 3, 5]);
      });
    });

    describe('unique', () => {
      it('should ensure values are unique', () => {
        var z = new Z({ unique: true });
        assert.equal(z.keys().length, 0, 'Expected an empty SortedSet');

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(() => {
          z.add('5a600e19', 11);
        }).to.throw(/unique/);

        // quick exit test
        expect(() => {
          z.add('5a600dff', z._head.next[z._level - 1].next.value);
        }).to.throw(/unique/);

        // this test ensures the key < key check doesn't come into play
        expect(() => {
          z.add('5a600dff', 11);
        }).to.throw(/unique/);

        expect(() => {
          z.add('5a600e18', 10);
        }).to.not.throw();

        expect(z).to.have.length(9);

        expect(z.toArray({ withScores: true })).to.eql([
          ['5a600e16', 3],
          ['5a600e11', 6],
          ['5a600e18', 10],
          ['5a600e13', 11],
          ['5a600e17', 12],
          ['5a600e14', 14],
          ['5a600e10', 16],
          ['5a600e12', 17],
          ['5a600e15', 19],
        ]);
      });

      it('should revert keys if constraint broken during update', () => {
        var z = new Z({ unique: true });

        z.add('5a600e10', 16);
        z.add('5a600e11', 6);
        z.add('5a600e12', 17);
        z.add('5a600e13', 11);
        z.add('5a600e14', 14);
        z.add('5a600e15', 19);
        z.add('5a600e16', 3);
        z.add('5a600e17', 12);
        z.add('5a600e18', 10);

        expect(() => {
          z.add('5a600e13', 14);
        }).to.throw(/unique/);

        expect(z).to.have.length(9);
        expect(z.score('5a600e13')).to.equal(11);
      });
    });
  });
  describe('skip map rewrite', () => {
    it('should support basic operations', () => {
      let ss = new SortedSet();

      expect(ss).to.have.length(0);
      expect(ss.toArray()).to.eql([]);
      expect(ss.range()).to.eql([]);
      expect(ss.rangeByScore()).to.eql([]);

      // expect(() => {
      //   ss.add('__proto__', 14);
      // }).to.throw();

      ss.add('5a600e16', 8);
      ss.add('5a600e17', 9);
      expect(ss.add('5a600e18', 10)).to.equal(null);
      expect(ss.add('5a600e17', 12)).to.equal(9);

      expect(ss).to.have.length(3);
      expect(ss.toArray()).to.eql(['5a600e16', '5a600e18', '5a600e17']);
      expect(ss.toArray()).to.eql(ss.range(0, -1));
      expect(ss.toArray()).to.eql(ss.rangeByScore());

      expect(ss.has('5a600e16')).to.be.ok;
      expect(ss.has('5a600e17')).to.be.ok;
      expect(ss.has('5a600e18')).to.be.ok;
      expect(ss.has('5a600e19')).to.not.be.ok;

      expect(ss.score('5a600e16')).to.equal(8);
      expect(ss.score('5a600e17')).to.equal(12);
      expect(ss.score('5a600e18')).to.equal(10);
      expect(ss.score('5a600e19')).to.equal(null);

      expect(ss.rem('5a600e16')).to.equal(8);

      expect(ss).to.have.length(2);

      expect(ss.rem('5a600e16')).to.equal(null);

      expect(ss).to.have.length(2);

      expect(ss.has('5a600e16')).to.not.be.ok;

      expect(ss.toArray()).to.eql(['5a600e18', '5a600e17']);
      expect(ss.toArray({ withScores: true }))
        .to.eql(ss.range(0, -1, { withScores: true }));
      expect(ss.toArray()).to.eql(ss.rangeByScore());

      ss.add('5a600e16', 10);
      ss.add('5a600e10', 16);
      ss.add('5a600e11', 6);
      ss.add('5a600e12', 17);
      ss.add('5a600e13', 11);
      ss.add('5a600e14', 14);
      ss.add('5a600e15', 19);
      ss.add('5a600e16', 3);

      expect(ss).to.have.length(9);

      // no change, so should be O(1)
      ss.add('5a600e17', 12);

      expect(ss.rank('5a600e17')).to.equal(4);

      expect(ss).to.have.length(9);
      expect(ss.toArray()).to.eql([
        '5a600e16',
        '5a600e11',
        '5a600e18',
        '5a600e13',
        '5a600e17',
        '5a600e14',
        '5a600e10',
        '5a600e12',
        '5a600e15',
      ]);
      expect(ss.toArray()).to.eql(ss.range(0, -1));
      expect(ss.toArray()).to.eql(ss.rangeByScore());

      expect(ss.rangeByScore(14, 16, { withScores: true })).to.eql([
        ['5a600e14', 14],
        ['5a600e10', 16],
      ]);
    });


    describe('#add', () => {
      it('should implicitly delete', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(ss.add('5a600e14', null)).to.equal(14);
        expect(ss.add('5a600e19', null)).to.equal(null);

        expect(ss).to.have.length(8);
      });
    });


    describe('#empty', () => {
      it('should remove all elements', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        ss.empty();

        expect(ss).to.have.length(0);
        expect(ss.toArray()).to.eql([]);
      });
    });


    describe('#incrBy(increment, key)', () => {
      it('should increase rank', () => {
        let ss = new SortedSet();

        ss.add('first', 1);
        ss.add('second', 2);
        ss.add('third', 3);
        ss.add('fourth', 4);

        expect(ss.incrBy(2, 'first')).to.equal(3);
        expect(ss.rank('first')).to.equal(1);
      });

      it('should create if not found', () => {
        let ss = new SortedSet();
        ss.add('first', 1);
        ss.incrBy(2, 'second');
        expect(ss.card()).to.equal(2);
        expect(ss.rank('second')).to.equal(1);
      });
    });


    describe('#keys', () => {
      it('should return the keys', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(ss.keys()).to.eql(['5a600e16', '5a600e11', '5a600e18', '5a600e13',
          '5a600e17', '5a600e14', '5a600e10', '5a600e12', '5a600e15']);
      });
    });

    describe('#rangeByScore', () => {
      it('should support special ranges', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(ss.rangeByScore(14, null, { withScores: true })).to.eql([
          ['5a600e14', 14],
          ['5a600e10', 16],
          ['5a600e12', 17],
          ['5a600e15', 19],
        ]);

        expect(ss.rangeByScore(null, 10, { withScores: true })).to.eql([
          ['5a600e16', 3],
          ['5a600e11', 6],
          ['5a600e18', 10],
        ]);

        expect(ss.rangeByScore(-Infinity, Infinity)).to.eql(ss.toArray());
        expect(ss.rangeByScore(null, null)).to.eql(ss.toArray());
      });
    });

    describe('#count', () => {
      it('should count elements', () => {
        let ss = new SortedSet();

        expect(ss.count()).to.equal(0);

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);
        ss.add('5a600e19', 14);
        ss.add('5a600f00', 30.0);
        ss.add('5a600f01', 30.5);
        ss.add('5a600f02', 31.0);
        ss.add('5a600f03', 31.5);
        ss.add('5a600f04', 32.0);
        ss.add('5a600f05', 32.0);
        ss.add('5a600f06', 32.0);

        expect(ss.count()).to.eql(ss.rangeByScore().length);
        expect(ss.count(8)).to.eql(ss.rangeByScore(8).length);
        expect(ss.count(3, 7)).to.eql(ss.rangeByScore(3, 7).length);
        expect(ss.count(5, 14)).to.eql(ss.rangeByScore(5, 14).length);
        expect(ss.count(5, 5)).to.eql(ss.rangeByScore(5, 5).length);
        expect(ss.count(5, 0)).to.eql(ss.rangeByScore(5, 0).length);
        expect(ss.count(30, 32)).to.eql(ss.rangeByScore(30, 32).length);
        expect(ss.count(40)).to.eql(ss.rangeByScore(40).length);
      });
    });

    describe('#range', () => {
      it('should support special ranges', () => {
        let ss = new SortedSet();
        ss.add('first', 1);
        ss.add('second', 2);
        ss.add('third', 3);
        ss.add('fourth', 4);

        let array = ['first', 'second', 'third', 'fourth'];

        expect(ss.range()).to.eql(array);

        expect(ss.range(2)).to.eql(array.slice(2));
        expect(ss.range(8)).to.eql(array.slice(8));
        expect(ss.range(0, 2)).to.eql(array.slice(0, 3));
        expect(ss.range(-1)).to.eql(['fourth']);
        expect(ss.range(-4)).to.eql(array);
        expect(ss.range(-4, -2)).to.eql(array.slice(0, 3));
        expect(ss.range(-4, ss.length + 1000))
          .to.eql(array.slice(-4, ss.length + 1000));
      });

      it('should support withScores', () => {
        let ss = new SortedSet();
        ss.add('first', 1);
        ss.add('second', 2);

        expect(ss.range(0, 0, { withScores: true }))
          .to.eql([['first', 1]]);
      });
    });

    describe('#intersect', () => {
      it('should intersect two sets', () => {
        let a = new SortedSet(), b = new SortedSet();

        a.add('5a600e10', 16);
        a.add('5a600e12', 10);
        a.add('5a600e14', 9);
        a.add('5a600e15', 14);
        a.add('5a600e17', 20);
        a.add('5a600e18', 13);
        a.add('5a600e19', 15);
        a.add('5a600e1a', 19);
        a.add('5a600e1b', 7);
        a.add('5a600e1c', 13);
        a.add('5a600e1e', 10);

        b.add('5a600e10', 0);
        b.add('5a600e11', 15);
        b.add('5a600e13', 5);
        b.add('5a600e14', 3);
        b.add('5a600e15', 14);
        b.add('5a600e17', 12);
        b.add('5a600e19', 12);
        b.add('5a600e1b', 16);
        b.add('5a600e1c', 12);
        b.add('5a600e1d', 17);
        b.add('5a600e1f', 3);

        expect(SortedSet.intersect(a, b)).to.eql(['5a600e10', '5a600e14',
          '5a600e17', '5a600e19', '5a600e1c', '5a600e15', '5a600e1b']);
        expect(SortedSet.intersect(b, a)).to.eql(['5a600e1b', '5a600e14',
          '5a600e1c', '5a600e15', '5a600e19', '5a600e10', '5a600e17']);
      });

      it('should intersect three sets', () => {
        let a = new SortedSet(), b = new SortedSet(), c = new SortedSet();

        a.add('5a600e10', 16);
        a.add('5a600e12', 10);
        a.add('5a600e14', 9);
        a.add('5a600e15', 14);
        a.add('5a600e17', 20);
        a.add('5a600e18', 13);
        a.add('5a600e19', 15);
        a.add('5a600e1a', 19);
        a.add('5a600e1b', 7);
        a.add('5a600e1c', 13);
        a.add('5a600e1e', 10);

        b.add('5a600e10', 0);
        b.add('5a600e11', 15);
        b.add('5a600e13', 5);
        b.add('5a600e14', 3);
        b.add('5a600e15', 14);
        b.add('5a600e17', 12);
        b.add('5a600e19', 12);
        b.add('5a600e1b', 16);
        b.add('5a600e1c', 12);
        b.add('5a600e1d', 17);
        b.add('5a600e1f', 3);

        c.add('5a600e10', 7);
        c.add('5a600e12', 20);
        c.add('5a600e13', 9);
        c.add('5a600e14', 19);
        c.add('5a600e16', 19);
        c.add('5a600e17', 1);
        c.add('5a600e18', 18);
        c.add('5a600e1a', 6);
        c.add('5a600e1c', 15);
        c.add('5a600e1f', 4);

        expect(SortedSet.intersect(c, a, b)).to.eql(['5a600e10', '5a600e14',
          '5a600e17', '5a600e1c']);

        // expect(SortedSet.intersect(c, a, b)).to.eql(c.intersect(a, b));
      });

      it('should intersect four sets', () => {
        let a = new SortedSet();
        let b = new SortedSet();
        let c = new SortedSet();
        let d = new SortedSet();

        a.add('5a600e10', 16);
        a.add('5a600e12', 10);
        a.add('5a600e14', 9);
        a.add('5a600e15', 14);
        a.add('5a600e17', 20);
        a.add('5a600e18', 13);
        a.add('5a600e19', 15);
        a.add('5a600e1a', 19);
        a.add('5a600e1b', 7);
        a.add('5a600e1c', 13);
        a.add('5a600e1e', 10);

        b.add('5a600e10', 0);
        b.add('5a600e11', 15);
        b.add('5a600e13', 5);
        b.add('5a600e14', 3);
        b.add('5a600e15', 14);
        b.add('5a600e17', 12);
        b.add('5a600e19', 12);
        b.add('5a600e1b', 16);
        b.add('5a600e1c', 12);
        b.add('5a600e1d', 17);
        b.add('5a600e1f', 3);

        c.add('5a600e10', 7);
        c.add('5a600e12', 20);
        c.add('5a600e13', 9);
        c.add('5a600e14', 19);
        c.add('5a600e16', 19);
        c.add('5a600e17', 1);
        c.add('5a600e18', 18);
        c.add('5a600e1a', 6);
        c.add('5a600e1c', 15);
        c.add('5a600e1f', 4);

        d.add('5a600e1c', 400);
        d.add('5a600e17', 500);
        d.add('5a600e1f', 600);
        d.add('5a600e20', 700);

        expect(SortedSet.intersect(d, c, a, b)).to.eql(['5a600e17', '5a600e1c']);

        // expect(SortedSet.intersect(d, c, a, b)).to.eql(d.intersect(c, a, b));
      });
    });

    describe('#rank', () => {
      it('should get the correct rank', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(ss.rank('5a600e12')).to.equal(7);
        expect(ss.rank('5a600e13')).to.equal(3);
        expect(ss.rank('5a600e16')).to.equal(0);
        expect(ss.rank('5a600e15')).to.equal(8);

        expect(ss.rank('not in set')).to.equal(null);
      });
    });

    describe('#rem', () => {
      it('should delete special elements', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(ss.rem('5a600e15')).to.equal(19);

        expect(ss).to.have.length(8);

        expect(ss.rem('5a600e16')).to.equal(3);

        expect(ss).to.have.length(7);

        expect(ss.toArray({ withScores: true })).to.eql([
          ['5a600e11', 6],
          ['5a600e18', 10],
          ['5a600e13', 11],
          ['5a600e17', 12],
          ['5a600e14', 14],
          ['5a600e10', 16],
          ['5a600e12', 17],
        ]);
      });

      it('should delete many elements', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(ss.rem('5a600e11')).to.equal(6);
        expect(ss.rem('5a600e13')).to.equal(11);
        expect(ss.rem('5a600e14')).to.equal(14);
        expect(ss.rem('5a600e15')).to.equal(19);
        expect(ss.rem('5a600e16')).to.equal(3);
        expect(ss.rem('5a600e17')).to.equal(12);

        expect(ss.length).to.equal(3);
        expect(ss.toArray({ withScores: true })).to.eql([
          ['5a600e18', 10],
          ['5a600e10', 16],
          ['5a600e12', 17],
        ]);
      });
    });

    describe('#remRangeByScore', () => {
      it('should strip out a range of elements', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(ss.remRangeByScore(4, 14)).to.equal(5);
        expect(ss).to.have.length(4);

        expect(ss.toArray({ withScores: true })).to.eql([
          ['5a600e16', 3],
          ['5a600e10', 16],
          ['5a600e12', 17],
          ['5a600e15', 19],
        ]);
      });

      it('should strip out all the elements', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(ss.remRangeByScore(3, 19)).to.equal(9);
        expect(ss).to.have.length(0);

        expect(ss.toArray()).to.eql([]);
      });
    });

    describe('#remRangeByRank', () => {
      it('should strip out a slice of elements', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(ss.remRangeByRank(1, 6)).to.equal(5);
        expect(ss).to.have.length(4);

        expect(ss.toArray({ withScores: true })).to.eql([
          ['5a600e16', 3],
          ['5a600e10', 16],
          ['5a600e12', 17],
          ['5a600e15', 19],
        ]);
      });

      it('should strip out all elements', () => {
        let ss = new SortedSet();

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(ss.remRangeByRank(0, 9)).to.equal(9);
        expect(ss).to.have.length(0);

        expect(ss.toArray()).to.eql([]);
      });
    });

    describe('#values', () => {
      it('should return the values', () => {
        let ss = new SortedSet();

        ss.add('first', -1);
        ss.add('third', 5);
        ss.add('second', 3);

        expect(ss.values()).to.eql([-1, 3, 5]);
      });
    });

    describe('unique rewrite', () => {
      it('should ensure values are unique', () => {
        const options = { unique: true};
        let ss = new SortedSet(options);

        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(() => {
          ss.add('5a600e19', 11);
        }).to.throw(/unique/);

        // quick exit test
        expect(() => {
          ss.add('5a600dff', ss._head.next[ss._level - 1].next.value);
        }).to.throw(/unique/);

        // this test ensures the key < key check doesn't come into play
        expect(() => {
          ss.add('5a600dff', 11);
        }).to.throw(/unique/);

        expect(() => {
          ss.add('5a600e18', 10);
        }).to.not.throw();

        expect(ss).to.have.length(9);

        expect(ss.toArray({ withScores: true })).to.eql([
          ['5a600e16', 3],
          ['5a600e11', 6],
          ['5a600e18', 10],
          ['5a600e13', 11],
          ['5a600e17', 12],
          ['5a600e14', 14],
          ['5a600e10', 16],
          ['5a600e12', 17],
          ['5a600e15', 19],
        ]);
      });

      it('should revert keys if constraint broken during update', () => {
        let ss = new SortedSet({ unique: true });
        ss.add('5a600e10', 16);
        ss.add('5a600e11', 6);
        ss.add('5a600e12', 17);
        ss.add('5a600e13', 11);
        ss.add('5a600e14', 14);
        ss.add('5a600e15', 19);
        ss.add('5a600e16', 3);
        ss.add('5a600e17', 12);
        ss.add('5a600e18', 10);

        expect(() => {
          ss.add('5a600e13', 14);
        }).to.throw(/unique/);

        expect(ss).to.have.length(9);
        expect(ss.score('5a600e13')).to.equal(11);
      });
    });
  });
});
