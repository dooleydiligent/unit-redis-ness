import { expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import { Logger } from '../src/logger';

describe('logger test', () => {
  let logger: Logger;
  beforeEach(() => {
    sinon.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
  });

  /**
   * These tests are not yet verifiable.
   * TODO: Log to a stream and validate the contents of the stream
   */
  it('should construct', async () => {
    logger = new Logger(module.id);
    expect(logger.constructor.name).to.equal('Logger');
    logger.info(`This is an info message`);
    logger.warn('This is a warning message');
    logger.debug(`This is an invisible debug message`);
  });
  it('should not construct when initialized with an empty string', () => {
    expect(() => {
      logger = new Logger('');
    }).to.throw();
  });
});
