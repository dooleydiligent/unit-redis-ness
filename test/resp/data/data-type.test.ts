import { expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import { DataType } from '../../../src/resp/data/data-type';

describe('data-type test', () => {
  beforeEach(() => {
    sinon.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
  });
  /**
   * Testing is used to ensure that these stay as they are
   */
  it('should enumerate data-types', async () => {
    expect(DataType.NONE).to.equal('none');
    expect(DataType.STRING).to.equal('string');
    expect(DataType.LIST).to.equal('list');
    expect(DataType.SET).to.equal('set');
    expect(DataType.ZSET).to.equal('zset');
    expect(DataType.HASH).to.equal('hash');
    expect(DataType.INTEGER).to.equal('integer');
    expect(Object.keys(DataType).length).to.equal(7);
  });
});
