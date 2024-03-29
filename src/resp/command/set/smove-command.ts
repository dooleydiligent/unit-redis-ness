import { Logger } from "../../../logger";
import { IRequest } from "../../../server/request";
import { DataType } from "../../data/data-type";
import { Database } from "../../data/database";
import { DatabaseValue } from "../../data/database-value";
import { RedisToken } from "../../protocol/redis-token";
import { IRespCommand } from "../resp-command";

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
export class SMoveCommand extends IRespCommand {
    public DbDataType = DataType.SET

    public maxParams = 3

    public minParams = 3

    public name = "smove"

    private logger: Logger = new Logger(module.id);

    public execSync(request: IRequest, db: Database): RedisToken {
        this.logger.debug(
            `${request.getCommand()}.execute(%s)`,
            ...request.getParams()
        );
        const skeyFrom: string = request.getParam(0),
            skeyTo: string = request.getParam(1),
            skeyName: string = request.getParam(2),
            dbFrom: DatabaseValue = db.getOrDefault(
                skeyFrom,
                new DatabaseValue(
                    DataType.SET,
                    new Set()
                )
            ),
            dbTo: DatabaseValue = db.getOrDefault(
                skeyTo,
                new DatabaseValue(
                    DataType.SET,
                    new Set()
                )
            );
        let result = 0;
        if (dbFrom.getSet().has(skeyName)) {
            dbFrom.getSet().delete(skeyName);
            if (!dbTo.getSet().has(skeyName)) {
                dbTo.getSet().add(skeyName);
                db.put(
                    skeyTo,
                    DatabaseValue.set(dbTo.getSet())
                );
                result = 1;
            } else {
                this.logger.debug(`${skeyTo}.${skeyName} already exists`);
                result = 1;
            }
            db.put(
                skeyFrom,
                DatabaseValue.set(dbFrom.getSet())
            );
        } else {
            this.logger.debug(`Did not find ${skeyFrom}.${skeyName}`);
        }
        return RedisToken.integer(result);
    }
}
