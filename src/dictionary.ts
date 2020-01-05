/**
 * Dictionary - an iterable data store
 *
 * Instantiate with a template type for the key:
 * ```
 * const store: Dictionary<string> = new Dictionary<string>();
 * ```
 */
export class Dictionary<K, T> implements Iterable<any> {
  private items: { [index: string]: any } = {};
  /**
   * Support for / each pattern:
   *
   * ```
   * for (const key of store) {
   *   const value = store.get(key);
   *   ...
   * }
   * ```
   */
  public [Symbol.iterator]() {
    let pointer: number = 0;
    const items: any = this.items;
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
  /**
   * Remove all elements - reset to empty
   */
  public clear(): void {
    Object.keys(this.items).forEach((key) => {
      delete this.items[key];
    });
  }
  /**
   * Check if an item exists - by value
   * @param value The item required
   * @returns
   */
  public contains(value: any): boolean {
    return this.values().indexOf(value) !== -1;
  }
  /**
   * Check if a key exists
   * @param key The key required
   * @returns
   */
  public exists(key: string): boolean {
    return !!this.items[key];
  }
  /**
   * Get an item by key
   * @param key The element key
   * @returns
   */
  public get(key: string): any {
    return this.items[key];
  }
  /**
   * The array of keys in the store
   * @returns
   */
  public keys(): string[] {
    return Object.keys(this.items);
  }
  /**
   * Put a new key/value pair
   * Overwrites an existing key
   * @param key The key
   * @param value The value - supports null
   * @returns
   */
  public put(key: string, value: any): any {
    this.items[key] = value;
    return value;
  }
  /**
   * Remove an item by key
   * @param key The key to remove
   * @returns
   */
  public remove(key: string): any {
    const item = this.items[key];
    if (item) {
      delete this.items[key];
    }
    return item;
  }
  /**
   * Report the number of keys in the store
   * @returns
   */
  public size(): number {
    return Object.keys(this.items).length;
  }
  /**
   * The array of values
   * @returns
   */
  public values(): any[] {
    return Object.values(this.items);
  }
}
