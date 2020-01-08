import * as assert from 'assert';
import * as util from 'util';
// A rewrite of https://www.npmjs.com/package/redis-sorted-set
// tslint:disable:no-conditional-assignment
// tslint:disable:max-classes-per-file

// value is score, sorted
// key is obj, unique
class Node {
  public next: any[];
  public prev: any;
  constructor(public level: number, public key: any, public value: number) {
    this.next = new Array(this.level);
    this.prev = null;
  }
}

class Level {
  constructor(public next: Node, public span: number) {
  }
}

/**
 * A Typescript implementation of [redis-sorted-set](https://www.npmjs.com/package/redis-sorted-set)
 *
 * Largely unchanged
 *
 */
export class SortedSet implements Iterable<SortedSet> {
  public static intersect(...nodes: any[]): Node[] {
    let result: Node[] = [];
    let node: Node;
    let lookup: any;
    let x: number;
    let i: number;
    let j: number;
    let n: number;
    if (!nodes.length) {
      return [];
    }
    for (i = nodes.length - 1; i >= 0; i--) {
      if (!nodes[i].length) { // abort
        return [];
      }
      nodes[i] = nodes[i]._head.next[0].next;
    }
    if (nodes.length === 1) {
      return nodes[0].toArray({ field: 'key' });
    }
    if (nodes.length === 2) {
      return SortedSet.binaryIntersect(nodes[0], nodes[1]);
    }
    if (nodes.length === 3) {
      return SortedSet.ternaryIntersect(nodes[0], nodes[1], nodes[2]);
    }
    /*
      return nodes[0].length <= nodes[1].length ?
      binaryIntersect(nodes[0], nodes[1]) :
      binaryIntersect(nodes[1], nodes[0]);
    */
    lookup = Object.create(null);
    for (node = nodes.shift(); node; node = node.next[0].next) {
      lookup[node.key] = 0;
    }
    for (i = 0, n = nodes.length - 1; i < n; i++) {
      x = 0;
      j = i + 1;
      for (node = nodes[i]; node; node = node.next[0].next) {
        if (lookup[node.key] === i) {
          lookup[node.key] = j;
          x++;
        }
      }
      if (!x) { // useful?
        return [];
      }
    }
    result = [];
    for (node = nodes[i]; node; node = node.next[0].next) {
      if (lookup[node.key] === i) {
        result.push(node.key);
      }
    }
    return result;
  }

  private static binaryIntersect(a: Node, b: Node): Node[] {
    const lookup: any = Object.create(null);
    const result: Node[] = [];
    for (; a; a = a.next[0].next) {
      lookup[a.key] = true;
    }
    for (; b; b = b.next[0].next) {
      if (lookup[b.key]) {
        result.push(b.key);
      }
    }
    return result;
  }

  private static ternaryIntersect(a: Node, b: Node, c: Node): Node[] {
    const lookup: any = Object.create(null);
    const result: Node[] = [];
    for (; a; a = a.next[0].next) {
      lookup[a.key] = 0;
    }
    for (; b; b = b.next[0].next) {
      if (lookup[b.key] === 0) {
        lookup[b.key] = 1;
      }
    }
    for (; c; c = c.next[0].next) {
      if (lookup[c.key] === 1) {
        result.push(c.key);
      }
    }
    return result;
  }

  public length: number = 0;
  public _unique: boolean = false;
  // NOTE: These two are initialized only to get around Typescript's aggressive checking
  // for initialization.  They are also made public to satisfy the unit tests.
  public _head: Node = new Node(0, null, 0);
  public _tail: Node = new Node(0, null, 0);
  public _level: number = 1;
  private _map: any;

  constructor(options: any = { unique: false }) {
    this._unique = !!options.unique;
    this.empty();
  }

  public [Symbol.iterator]() {
    let pointer: number = 0;
    const items: any = this._map;
    return {
      /**
       * @hidden
       */
      next(): IteratorResult<any> {
        if (pointer < Object.keys(items).length) {
          return {
            done: false,
            value: items[Object.keys(items)[pointer++]]
          };
        } else {
          return {
            done: true,
            value: null
          };
        }
      }
    };
  }

  public add(key: string, value?: number | null): any {
    let current;
    // if (key === '__proto__') {
    //   throw new Error('invalid key __proto__');
    // }

    if (value == null || value === undefined) {
      return this.rem(key);
    }

    current = this._map[key];

    if (current !== undefined) {
      if (value === current) {
        return current;
      }
      this._remove(key, current);
    }

    const node = this._insert(key, value);
    if (!node) {
      if (current === undefined || this._insert(key, current)) {
        // TODO: can we defer _remove until after insert?
        throw new Error('unique constraint violated');
      }
    }

    this._map[key] = value;
    return current === undefined ? null : current;
  }
  public addAll(sortedSet: SortedSet): void {
    for (const key of sortedSet.keys()) {
      const value = sortedSet.get(key);
      this.add(key, value);
    }
  }
  public card(): number {
    // Returns the sorted set cardinality (number of elements)
    if (this.length) {
      return this.length;
    }
    return 0;
  }
  /**
   * Return the number of elements with a score between
   * min and max scores.  Inclusive.
   * @param min the minimum score
   * @param max the maximum score
   */

  public count(min?: number, max?: number): number {
    if (!this.length) {
      return 0;
    }

    if (min == null) {
      min = -Infinity;
    }
    if (max == null) {
      max = Infinity;
    }

    if (min <= this._head.next[0].next.value && max >= this._tail.value) {
      return this.length;
    }

    if (max < min || min > this._tail.value || max < this._head.next[0].next.value) {
      return 0;
    }

    let i;
    let node = this._first(min);
    let count = 0;

    if (!node) {
      return 0;
    }

    for (i = node.next.length - 1; i >= 0; i -= 1) {
      while (node.next[i].next && node.next[i].next.value <= max) {
        count += node.next[i].span;
        node = node.next[i].next;
      }
    }

    // feels hacky and error prone
    return count && count + 1;
  }

  public del(key: string): number {
    // Alias for .rem
    return this.rem(key);
  }
  public empty(): void {
    this.length = 0;
    this._level = 1;
    this._map = Object.create(null);
    this._head = new Node(32, null, 0);
    this._tail = null as any as Node;

    for (let i = 0; i < 32; i += 1) {
      // hrm
      this._head.next[i] = new Level(null as any as Node, 0);
    }
  }
  public get(key: string): number {
    // Alias for
    return this.score(key);
  }

  public has(key: string): boolean {
    return this._map[key] !== undefined;
  }

  public incrBy(increment: number, key: string): number {
    // Increases the score of the member specified by key.
    // If member does not exist, a new member is created with
    // the increment as its score.
    //
    // Parameters:
    //   increment
    //     number
    //   key
    //     string
    //
    // Return
    //   number, the new score of the member
    //
    // TODO: Shortcut, could optimize to half

    const score = this.score(key);

    if (score) {
      this.add(key, score + increment);
      return score + increment;
    }

    this.add(key, increment);
    return increment;
  }

  public keys(): string[] {
    if (!this.length) {
      return [];
    }

    let i;
    const array = new Array(this.length);
    let node = this._head.next[0].next;

    for (i = 0; node; node = node.next[0].next) {
      array[i] = node.key;
      i += 1;
    }

    return array;
  }

  public range(start?: number, stop?: number, options?: any): Node[] {
    // Parameters:
    //   start
    //     inclusive
    //   stop
    //     inclusive
    //   options (optional)
    //     withScores (optional, default to false)
    //
    // Return:
    //   an array
    let result;

    if (this.length === 0) {
      return [];
    }

    if (start == null) {
      start = 0;
    } else if (start < 0) {
      start = Math.max(this.length + start, 0);
    }

    if (stop == null) {
      stop = this.length - 1;
    } else if (stop < 0) {
      stop = this.length + stop;
    }

    if (start > stop || start >= this.length) {
      return [];
    }

    if (stop >= this.length) {
      stop = this.length - 1;
    }

    if (typeof options !== 'object') {
      options = {
        withScores: false,
      };
    }

    let i = 0;
    let length = stop - start + 1;
    try {
      result = new Array(length);
    } catch (e) {
      // console.log('start', start);
      // console.log('stop', stop);
      // console.log('Invalid length', length);
      throw e;
    }

    let node = start > 0 ? this._get(start) : this._head.next[0].next;

    if (options.withScores) {
      for (; length--; node = node.next[0].next) {
        result[i] = [node.key, node.value];
        i += 1;
      }
    } else {
      for (; length--; node = node.next[0].next) {
        result[i] = node.key;
        i += 1;
      }
    }

    return result;
  }

  public rangeByScore(min?: number | null, max?: number | null, options?: any): Node[] {
    // Return members with score within inclusive range [min, max].
    //
    // Parameters:
    //   min (number)
    //   max (number)
    //   options (object, optional)
    //     withScores (bool, optional, default false)

    if (!this.length) {
      return [];
    }

    if (typeof options !== 'object') {
      options = {
        withScores: false,
      };
    }

    if (min == null) {
      min = -Infinity;
    }
    if (max == null) {
      max = Infinity;
    }

    if (min <= this._head.next[0].next.value && max >= this._tail.value) {
      return this.toArray({ withScores: options.withScores });
    }

    if (max < min || min > this._tail.value || max < this._head.next[0].next.value) {
      return [];
    }

    let node = this._first(min);
    const result = [];

    if (options.withScores) {
      for (; node && node.value <= max; node = node.next[0].next) {
        result.push([node.key, node.value]);
      }
    } else {
      for (; node && node.value <= max; node = node.next[0].next) {
        result.push(node.key);
      }
    }

    return result;
  }

  public rank(key: string): number {
    // Rank of key, ordered by value.
    //
    // Return
    //   integer
    //     if member exists
    //  null
    //     if member does not exist

    const value = this._map[key];

    if (value === undefined) {
      return null as any as number;
    }

    let i;
    let node = this._head;
    let next = null;
    let rank = -1;

    for (i = this._level - 1; i >= 0; i -= 1) {
      while ((next = node.next[i].next) && (next.value < value || (next.value === value && next.key <= key))) {
        rank += node.next[i].span;
        node = next;
      }
      if (node.key && node.key === key) {
        return rank;
      }
    }

    return null as any as number;
  }

  public rem(key: string): number {
    // Remove single member by key.
    //
    // Return
    //   value of the removed key
    //   or null if key does not exist.

    const value = this._map[key];
    if (value !== undefined) {
      this._remove(key, value);
      delete this._map[key];
      return value;
    }
    return null as any as number;
  }

  public remRangeByRank(start: number, end: number): number {
    // Parameters:
    //   start
    //     inclusive
    //   end
    //     exclusive
    //
    // Return
    //   positive integer, the number of removed keys.

    const len = this.length;

    if (!len) {
      return 0;
    }

    if (start == null) {
      start = 0;
    } else if (start < 0) {
      start = Math.max(len + start, 0);
    }

    if (end == null) {
      end = len;
    } else if (end < 0) {
      end = len + end;
    }

    if (start > end || start >= len) {
      return 0;
    }
    if (end > len) {
      end = len;
    }

    if (start === 0 && end === len) {
      this.empty();
      return len;
    }

    let node = this._head;
    const update = new Array(32);
    let i: number;
    let next;
    let traversed = -1;

    for (i = this._level - 1; i >= 0; i -= 1) {
      while ((next = node.next[i].next) && (traversed + node.next[i].span) < start) {
        traversed += node.next[i].span;
        node = next;
      }
      update[i] = node;
    }

    let removed = 0;
    traversed += 1;
    node = node.next[0].next;

    while (node && traversed < end) {
      next = node.next[0].next;
      this._removeNode(node, update);
      delete this._map[node.key];
      removed += 1;
      traversed += 1;
      node = next;
    }

    this.length -= removed;
    return removed;
  }

  public remRangeByScore(min: number, max: number): number {
    // Remove members with value between min and max (inclusive).
    //
    // Return
    //   positive integer, the number of removed elements.

    let removed = 0;

    if (!this.length) {
      return 0;
    }

    if (min == null) {
      min = -Infinity;
    }
    if (max == null) {
      max = Infinity;
    }

    if (min <= this._head.next[0].next.value && max >= this._tail.value) {
      removed = this.length;
      this.empty();
      return removed;
    }

    let next;
    let i;
    let node = this._head;
    const update = new Array(32);

    for (i = this._level - 1; i >= 0; i -= 1) {
      while ((next = node.next[i].next) && next.value < min) {
        node = next;
      }
      update[i] = node;
    }
    node = node.next[0].next;

    while (node && node.value <= max) {
      next = node.next[0].next;
      this._removeNode(node, update);
      delete this._map[node.key];
      removed += 1;
      node = next;
    }

    this.length -= removed;
    return removed;
  }

  public score(key: string): number {
    // Return
    //   number, the score of member in the sorted set.
    //   null, if member does not exist in the sorted set.
    const score = this._map[key];
    return score === undefined ? null : score;
  }

  public set(key: string, value: number): number {
    // Alias for
    return this.add(key, value);
  }

  public slice(start: number, end: number, options?: any): Node[] {
    // Almost alias for range. Only difference is that
    // the end is exclusive i.e. not included in the range.
    if (typeof end === 'number' && end !== 0) {
      end -= 1;
    }
    return this.range(start, end, options);
  }

  public toArray(options?: any): Node[] {
    // The whole set, ordered from smallest to largest.
    //
    // Parameters
    //   options (optional)
    //     withScores (optional, default false)
    //       bool

    if (!this.length) {
      return [];
    }

    if (typeof options !== 'object') {
      options = {
        withScores: false,
      };
    }

    let i;
    const array = new Array(this.length);
    let node = this._head.next[0].next;

    if (options.withScores) {
      for (i = 0; node; node = node.next[0].next) {
        array[i] = [node.key, node.value];
        i += 1;
      }
    } else {
      for (i = 0; node; node = node.next[0].next) {
        array[i] = node.key;
        i += 1;
      }
    }

    return array;
  }

  public values(): number[] {
    // Return values as an array, the smallest value first.

    if (!this.length) {
      return [];
    }

    let i;
    const array = new Array(this.length);
    let node = this._head.next[0].next;

    for (i = 0; node; node = node.next[0].next) {
      array[i] = node.value;
      i += 1;
    }

    return array;
  }

  private _first(min: number): Node {
    let next;
    let node = this._tail;

    if (!node || node.value < min) {
      return null as any as Node;
    }

    node = this._head;
    let i: number;
    for (next = null, i = this._level - 1; i >= 0; i -= 1) {
      while ((next = node.next[i].next) && next.value < min) {
        node = next;
      }
    }

    return node.next[0].next;
  }

  private _get(index: number): Node {
    // Find and return the node at index.
    // Return null if not found.
    //
    // TODO: optimize when index is less than log(N) from the end
    let i;
    let node = this._head;
    let distance = -1;

    for (i = this._level - 1; i >= 0; i -= 1) {
      while (node.next[i].next && (distance + node.next[i].span) <= index) {
        distance += node.next[i].span;
        node = node.next[i].next;
      }
      if (distance === index) {
        return node;
      }
    }
    return null as any as Node;
  }

  private _insert(key: string, value: number): any {
    assert.notEqual(value, undefined, 'Value is unexpectedly undefined');
    // precondition: does not already have key
    // in unique mode, returns null if the value already exists
    const update = new Array(32);
    const rank = new Array(32);
    let node = this._head;
    let next = null;
    let i;

    for (i = this._level - 1; i >= 0; i -= 1) {
      rank[i] = (i === (this._level - 1) ? 0 : rank[i + 1]);
      // TODO: optimize some more?
      if (node) {
        while ((next = node.next[i].next) && next.value <= value) {
          if (next.value === value) {
            if (this._unique) {
              return null;
            }
            if (next.key >= key) {
              break;
            }
          }
          rank[i] += node.next[i].span;
          node = next;
        }
      }
      if (this._unique && node.value === value) {
        return null as any as Node;
      }
      update[i] = node;
    }

    if (this._unique && node.value === value) {
      return null as any as Node;
    }

    const level = this.randomLevel();
    if (level > this._level) {
      // TODO: optimize
      for (i = this._level; i < level; i += 1) {
        rank[i] = 0;
        update[i] = this._head;
        update[i].next[i].span = this.length;
      }
      this._level = level;
    }

    node = new Node(level, key, value);
    for (i = 0; i < level; i += 1) {
      node.next[i] = new Level(update[i].next[i].next, update[i].next[i].span - (rank[0] - rank[i]));
      update[i].next[i].next = node;
      update[i].next[i].span = (rank[0] - rank[i]) + 1;
    }

    for (i = level; i < this._level; i += 1) {
      update[i].next[i].span++;
    }

    node.prev = (update[0] === this._head) ? null : update[0];
    if (node.next[0].next) {
      node.next[0].next.prev = node;
    } else {
      this._tail = node;
    }

    this.length += 1;
    return node;
  }

  private _remove(key: string, value: number): void {
    // Z.prototype._remove = function (key, value) {
    const update = new Array(32);
    let node = this._head;
    let i: number;
    let next: Node;

    for (i = this._level - 1; i >= 0; i -= 1) {
      while ((next = node.next[i].next) && (next.value < value || (next.value === value && next.key < key))) {
        node = next;
      }
      update[i] = node;
    }

    node = node.next[0].next;

    if (!node || value !== node.value || node.key !== key) {
      return; // false;
    }

    // delete
    this._removeNode(node, update);
    this.length -= 1;
  }

  private _removeNode(node: Node, update: Node[]): void {
    // Z.prototype._removeNode = function (node, update) {
    let next = null;
    let i = 0;
    const n = this._level;

    for (; i < n; i += 1) {
      if (update[i].next[i].next === node) {
        update[i].next[i].span += node.next[i].span - 1;
        update[i].next[i].next = node.next[i].next;
      } else {
        update[i].next[i].span -= 1;
      }
    }
    next = node.next[0].next;
    if (next) {
      next.prev = node.prev;
    } else {
      this._tail = node.prev;
    }

    while (this._level > 1 && !this._head.next[this._level - 1].next) {
      this._level -= 1;
    }
  }
  private randomLevel(): number {
    let level = 1;
    while (Math.random() < (1 / Math.E)) {
      level += 1;
    }
    return level < 32 ? level : 32;
  }
}
