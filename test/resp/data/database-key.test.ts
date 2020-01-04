import { expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import { DatabaseKey } from '../../../src/resp/data/database-key';

describe('database-key test', () => {
  beforeEach(() => {
    sinon.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
  });
  it('should construct', async () => {
    const dbkey = new DatabaseKey('string');
  });
});
