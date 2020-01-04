import { DataType } from './data-type';
// tslint:disable-next-line
const Zset = require('redis-sorted-set');

export class DatabaseValue {
  public static EMPTY_STRING: DatabaseValue = DatabaseValue.string('');
  public static EMPTY_LIST: DatabaseValue = DatabaseValue.list([]);
  public static EMPTY_SET: DatabaseValue = DatabaseValue.set(new Set());
  public static EMPTY_ZSET: DatabaseValue = DatabaseValue.zset(new Zset());
  // public static EMPTY_HASH: DatabaseValue = DatabaseValue.hash();

  // public static DatabaseValue string(String value) {
  //   return string(safeString(value));
  // }

  public static string(value: string): DatabaseValue {
    return new DatabaseValue(DataType.STRING, value);
  }

  public static list(values?: string[]): DatabaseValue {
    return new DatabaseValue(DataType.LIST, values);
  }

  // public static DatabaseValue list(Collection<SafeString> values) {
  //   return new DatabaseValue(DataType.LIST, ImmutableList.from(requireNonNull(values).stream()));
  // }

  // public static DatabaseValue list(SafeString... values) {
  //   return new DatabaseValue(DataType.LIST, ImmutableList.from(Stream.of(values)));
  // }

  public static set(values?: Set<any>): DatabaseValue {
    return new DatabaseValue(DataType.SET, values);
  }
  public static zset(values?: any): DatabaseValue {
    return new DatabaseValue(DataType.ZSET, values);
  }

  // public static DatabaseValue set(Collection<SafeString> values) {
  //   return new DatabaseValue(DataType.SET, ImmutableSet.from(requireNonNull(values).stream()));
  // }

  // public static DatabaseValue set(SafeString... values) {
  //   return new DatabaseValue(DataType.SET, ImmutableSet.from(Stream.of(values)));
  // }

  // public static DatabaseValue zset(Collection<Entry<Double, SafeString>> values) {
  //   return new DatabaseValue(DataType.ZSET,
  //       requireNonNull(values).stream().collect(collectingAndThen(toSortedSet(),
  //                                                                 Collections::unmodifiableNavigableSet)));
  // }

  // @SafeVarargs
  // public static DatabaseValue zset(Entry<Double, SafeString>... values) {
  //   return new DatabaseValue(DataType.ZSET,
  //       Stream.of(values).collect(collectingAndThen(toSortedSet(),
  //                                                   Collections::unmodifiableNavigableSet)));
  // }

  // public static DatabaseValue hash(ImmutableMap<SafeString, SafeString> values) {
  //   return new DatabaseValue(DataType.HASH, values);
  // }

  // public static DatabaseValue hash(Collection<Tuple2<SafeString, SafeString>> values) {
  //   return new DatabaseValue(DataType.HASH, ImmutableMap.from(requireNonNull(values).stream()));
  // }

  // public static DatabaseValue hash(Sequence<Tuple2<SafeString, SafeString>> values) {
  //   return new DatabaseValue(DataType.HASH, ImmutableMap.from(requireNonNull(values).stream()));
  // }

  // @SafeVarargs
  // public static DatabaseValue hash(Tuple2<SafeString, SafeString>... values) {
  //   return new DatabaseValue(DataType.HASH, ImmutableMap.from(Stream.of(values)));
  // }

  // public static DatabaseValue bitset(int... ones) {
  //   BitSet bitSet = new BitSet();
  //   for (int position : ones) {
  //     bitSet.set(position);
  //   }
  //   return new DatabaseValue(DataType.STRING, new SafeString(bitSet.toByteArray()));
  // }

  // public static Tuple2<SafeString, SafeString> entry(SafeString key, SafeString value) {
  //   return Tuple.of(key, value);
  // }

  // public static Entry<Double, SafeString> score(double score, SafeString value) {
  //   return new SimpleEntry<>(score, value);
  // }

  // private static Collector<Entry<Double, SafeString>, ?, NavigableSet<Entry<Double, SafeString>>> toSortedSet() {
  //   return toCollection(SortedSet::new);
  // }

  //  public static NULL: DatabaseValue = null;

  constructor(private type: DataType, private value: any, private expiredAt?: number) {
    if (!this.type || Object.values(DataType).indexOf(type) === -1) {
      throw new Error(`Cannot use ${type} to initialize DatabaseValue`);
    }
    // We'll allow values to be uninitialized
    // if (!this.value) {
    //   throw new Error('Value is required to initialize database-value');
    // }
  }

  public getType(): DataType {
    return this.type;
  }

  public getString(): string {
    return this.getValue();
  }

  public getList(): string[] {
    return this.getValue();
  }

  public getSet(): string[] {
    // requiredType(DataType.SET);
    return this.getValue();
  }

  // public NavigableSet<Entry<Double, SafeString>> getSortedSet() {
  //   requiredType(DataType.ZSET);
  //   return getValue();
  // }

  // public ImmutableMap<SafeString, SafeString> getHash() {
  //   requiredType(DataType.HASH);
  //   return getValue();
  // }

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
    return this.expiredAt ? this.expiredAt : 0;
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
      // This method returns the largest (closest to positive infinity) integer value
      // that is less than or equal to the algebraic quotient.
      return parseInt(`${this.timeToLive(now) / 1000}`, 10);
    }
    return -1;
  }

  // public  expiredAt( instant: number): DatabaseValue {
  //   return new DatabaseValue(this.type, this.value, instant);
  // }
  public setExpiredAt(ttlMillis: number): DatabaseValue {
    return new DatabaseValue(this.type, this.value, ttlMillis);
  }
  // public DatabaseValue expiredAt(int ttlSeconds) {
  //   return new DatabaseValue(this.type, this.value, toInstant(toMillis(ttlSeconds)));
  // }

  public noExpire(): DatabaseValue {
    return new DatabaseValue(this.type, this.value);
  }

  public toString(): string {
    return 'DatabaseValue [type=' + this.type + ', value=' + this.value +
      ', expireAt=' + this.expiredAt + ']';
  }

  private timeToLive(now: number): number {
    return Math.abs(this.expiredAt ? now - this.expiredAt : 0); // .toMillis();
  }

  // private Instant toInstant(long ttlMillis) {
  //   return now().plusMillis(ttlMillis);
  // }

  // private long toMillis(int ttlSeconds) {
  //   return TimeUnit.SECONDS.toMillis(ttlSeconds);
  // }

  // @SuppressWarnings('unchecked')
  private getValue(): any {
    return this.value;
  }

  private requiredType(type: DataType): void {
    if (this.type !== type) {
      throw new Error('invalid type: ' + type);
    }
  }
}
