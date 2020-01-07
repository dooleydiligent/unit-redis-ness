import { Dictionary } from '../../dictionary';
import { Logger } from '../../logger';
import { DataType } from './data-type';
import { DatabaseValue } from './database-value';

export class Database extends Dictionary<string, DatabaseValue> {
  protected logger: Logger = new Logger(module.id);

  public isEmpty(): boolean {
    return this.size() === 0;
  }

  public exists(key: string): boolean {
    const item = this.get(key);
    return (!!item);
  }
  public get(key: string): any {
    const item = super.get(key);
    if (item && item.expiredAt && parseInt(item.expiredAt, 10) < new Date().getTime()) {
      this.remove(key);
      return null;
    }
    return item;
  }

  // public getString(key: string): string {
  //   return this.getOrDefault(DatabaseKey.safeKey(key.toString()), DatabaseValue.EMPTY_STRING).getString();
  // }

  // public getList(key: string): string[] {
  //   return this.getOrDefault(DatabaseKey.safeKey(key.toString()), DatabaseValue.EMPTY_LIST).getList();
  // }

  // public getSet(key: string): Set<any> {
  //   return this.getOrDefault(key, DatabaseValue.EMPTY_SET).getSet();
  // }

  //   public abstract NavigableSet < Entry < Double, SafeString >> getSortedSet(SafeString key) {
  //   return getOrDefault(safeKey(key), DatabaseValue.EMPTY_ZSET).getSortedSet();
  // }

  //   default ImmutableMap < SafeString, SafeString > getHash(SafeString key) {
  //   return getOrDefault(safeKey(key), DatabaseValue.EMPTY_HASH).getHash();
  // }

  //   default void putAll(ImmutableMap <? extends DatabaseKey, ? extends DatabaseValue > map) {
  //   map.forEach(this:: put);
  // }

  public putIfPresent(key: string, value: DatabaseValue): DatabaseValue {
    let oldKey = this.get(key);
    if (oldKey) {
      oldKey = this.put(key, value);
    }
    return oldKey;
  }
  public putIfAbsent(key: string, value: DatabaseValue): DatabaseValue {
    let oldValue = this.get(key);
    if (!oldValue) {
      oldValue = this.put(key, value);
    }
    return oldValue;
  }
  // tslint:disable-next-line
  public merge(key: string, value: DatabaseValue, callback: (oldVal: DatabaseValue, newVal: DatabaseValue) => DatabaseValue): DatabaseValue {
    this.logger.debug(`Keys: ${value.getSortedSet().keys()}, Values: ${value.getSortedSet().values()}`);
    this.logger.debug(`merge(${key}, with [%j])`, value.getSortedSet().toArray());
    const oldValue: DatabaseValue = this.get(key);
    const newValue: DatabaseValue = oldValue == null ? value : callback(oldValue, value);
    if (newValue == null) {
      this.remove(key);
    } else {
      this.put(key, newValue);
    }
    return newValue;
  }

  public getOrDefault(key: string, defaultValue: DatabaseValue): DatabaseValue {
    // Only return the value.  Don't add it to the database yet
    let value = this.get(key);
    if (!value) {
      value = defaultValue;
    }
    return value;
  }

  public isType(key: string, type: DataType): boolean {
    this.logger.debug(`isType(${key}, ${type})`, key, type);
    if (Object.values(DataType).indexOf(type) === -1) {
      throw new Error(`Invalid type ${type}`);
    }
    const value = this.get(key);
    if (value) {
      return value.getType() === type;
    }
    // If the type does not exist then it is OK to use type
    return true;
  }

  public rename(from: string, to: string): boolean {
    const value = this.remove(from);
    if (value != null) {
      this.put(to, value);
      return true;
    }
    return false;
  }

  //   default void overrideAll(ImmutableMap < DatabaseKey, DatabaseValue > value) {
  //   clear();
  //   putAll(value);
  // }

  //   default ImmutableSet < DatabaseKey > evictableKeys(Instant now) {
  //   return entrySet()
  //     .filter(entry -> entry.get2().isExpired(now))
  //     .map(Tuple2:: get1);
  // }
}
