import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { DataType } from '../../data/data-type';
import { Database } from '../../data/database';
import { DatabaseValue } from '../../data/database-value';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * Available since 1.0.0.
 *
 * SMOVE source destination member
 *
 * Move member from the set at source to the set at destination.
 * **Unlike the original implementation, this operation is **NOT** atomic. The key will be removed**
 * **from the source set before it is added to the destination set.**
 *
 * If the source set does not exist or does not contain the specified element, no operation
 * is performed and 0 is returned. Otherwise, the element is removed from the source set and
 * added to the destination set. When the specified element already exists in the destination
 * set, it is only removed from the source set.
 *
 * An error is returned if source or destination does not hold a set value.
 *
 * **Return value**<br>
 * Integer reply, specifically:
 *
 * 1 if the element is moved.
 * 0 if the element is not a member of source and no operation was performed.
 */
@DbDataType(DataType.SET)
@MaxParams(3)
@MinParams(3)
@Name('smove')
export class SMoveCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): Promise<RedisToken> {
    return new Promise((resolve) => {
      this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
      const skeyFrom: string = request.getParam(0);
      const skeyTo: string = request.getParam(1);
      const skeyName: string = request.getParam(2);
      const dbFrom: DatabaseValue = db.getOrDefault(skeyFrom, new DatabaseValue(DataType.SET, new Set()));
      const dbTo: DatabaseValue = db.getOrDefault(skeyTo,  new DatabaseValue(DataType.SET, new Set()));
      let result = 0;
      if (dbFrom.getSet().has(skeyName)) {
        this.logger.debug(`deleting ${skeyFrom}.${skeyName} from %j`, dbFrom.getSet().entries());
        dbFrom.getSet().delete(skeyName);
        this.logger.debug(`after delete, ${skeyFrom} is %j`, dbFrom.getSet().entries());
        if (!dbTo.getSet().has(skeyName)) {
          this.logger.debug(`adding ${skeyTo}.${skeyName} to %j`, dbTo.getSet().entries());
          dbTo.getSet().add(skeyName);
          this.logger.debug(`saving ${skeyTo} %j`, dbTo.getSet().entries());
          db.put(skeyTo, DatabaseValue.set(dbTo.getSet()));
          result = 1;
        } else {
          this.logger.debug(`${skeyTo}.${skeyName} already exists`);
          result = 1;
        }
        this.logger.debug(`saving ${skeyFrom} %j`, dbFrom.getSet().entries());
        db.put(skeyFrom, DatabaseValue.set(dbFrom.getSet()));
      } else {
        this.logger.debug(`Did not find ${skeyFrom}.${skeyName}`);
      }
      resolve(RedisToken.integer(result));
    });
  }
}
