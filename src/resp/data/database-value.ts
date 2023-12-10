import {DataType} from "./data-type";
import {SortedSet} from "./sorted-set";

export class DatabaseValue {
    public static string(value: string): DatabaseValue {
        return new DatabaseValue(
            DataType.STRING,
            value
        );
    }

    public static set(values?: Set<any>): DatabaseValue {
        return new DatabaseValue(
            DataType.SET,
            values
        );
    }

    public static zset(values: SortedSet): DatabaseValue {
        return new DatabaseValue(
            DataType.ZSET,
            values
        );
    }

  private static WRONG_TYPE: string = "WRONGTYPE Operation against a key holding the wrong kind of value";

  constructor(private type: DataType, private value: any, private expiredAt?: number) {
      if (!this.type || Object.values(DataType).indexOf(type) === -1) {
          throw new Error(`Cannot use ${type} to initialize DatabaseValue`);
      }
  }

  public getSortedSet(): SortedSet {
      if (this.type !== DataType.ZSET) {
          throw new Error(DatabaseValue.WRONG_TYPE);
      }
      return this.getValue();
  }

  public getType(): DataType {
      return this.type;
  }

  public getString(): string {
      if (this.type !== DataType.STRING) {
          throw new Error(DatabaseValue.WRONG_TYPE);
      }
      return this.getValue();
  }

  public getList(): string[] {
      if (this.type !== DataType.LIST) {
          throw new Error(DatabaseValue.WRONG_TYPE);
      }
      return this.getValue();
  }

  public getSet(): Set<any> {
      if (this.type !== DataType.SET) {
          throw new Error(DatabaseValue.WRONG_TYPE);
      }
      return this.getValue();
  }

  public getHash(): any {
      if (this.type !== DataType.HASH) {
          throw new Error(DatabaseValue.WRONG_TYPE);
      }
      return this.getValue();
  }

  public size(): number {
      switch (this.type) {
      case DataType.STRING:
          return 1;
      case DataType.NONE:
          return 0;
      default:
          return this.value.length;
      }
  }

  public getExpiredAt(): number {
      return this.expiredAt
          ? this.expiredAt
          : -1;
  }

  public isExpired(now: number): boolean {
      if (this.expiredAt != null) {
          return now > this.expiredAt;
      }
      return false;
  }

  public timeToLiveMillis(now: number): number {
      if (this.expiredAt != null) {
          return this.timeToLive(now);
      }
      return -1;
  }

  public timeToLiveSeconds(now: number): number {
      if (this.expiredAt != null) {
          /*
           * This method returns the largest (closest to positive infinity) integer value
           * that is less than or equal to the algebraic quotient.
           */
          return parseInt(
              `${this.timeToLive(now) / 1000}`,
              10
          );
      }
      return -1;
  }

  public setExpiredAt(ttlMillis: number): DatabaseValue {
      return new DatabaseValue(
          this.type,
          this.value,
          ttlMillis
      );
  }

  public noExpire(): DatabaseValue {
      return new DatabaseValue(
          this.type,
          this.value
      );
  }

  public toString(): string {
      return `DatabaseValue [type=${this.type}, value=${this.value
      }, expireAt=${this.expiredAt}]`;
  }

  private timeToLive(now: number): number {
      return Math.abs(this.expiredAt
          ? now - this.expiredAt
          : 0); // .toMillis();
  }

  private getValue(): any {
      return this.value;
  }

  private requiredType(type: DataType): void {
      if (this.type !== type) {
          throw new Error(`invalid type: ${type}`);
      }
  }
}
