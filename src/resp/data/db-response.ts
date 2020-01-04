import { DataType } from '../data/data-type';
import { DatabaseValue } from '../data/database-value';
import { RedisToken } from '../protocol/redis-token';

export class DBResponse {
  public static convertValue(value: DatabaseValue): RedisToken {
    if (value != null) {
      switch (value.getType()) {
        case DataType.STRING:
          const str: string = value.getString().toString();
          return RedisToken.string(str);
        case DataType.HASH:
          throw new Error('DataType.HASH is not implemented');
        // ImmutableMap<SafeString, SafeString> map = value.getHash();
        // return array(keyValueList(map).toList());
        case DataType.LIST:
        // ImmutableList<SafeString> list = value.getList();
        // return convertArray(list.toList());
        case DataType.SET:
        // ImmutableSet<SafeString> set = value.getSet();
        // return convertArray(set.toSet());
        case DataType.ZSET:
          // NavigableSet<Entry<Double, SafeString>> zset = value.getSortedSet();
          // return convertArray(serialize(zset));
          const list: RedisToken[] = [];
          for (const item of value.getList()) {
            list.push(RedisToken.string(item.toString()));
          }
          return RedisToken.array(list);
        default:
          break;
      }
    }
    return RedisToken.nullString();
  }
}
