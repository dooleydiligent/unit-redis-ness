# unit-redis-ness
![dooley](https://dooleydiligent.github.io/unit-redis-ness/doc/images/dooley.gif)
- A fully in-memory ![Redis][redis] redis implementation in typescript to aid unit testing of redis-based nodejs applications brought to you by [yours truly!](http://www.joeandlane.com)

Initially inspired by [mini-redis](https://github.com/meteor/miniredis) but ulitimately adapted from the very well-designed [ClauDB](https://github.com/tonivade/claudb.git)

The reason?  I 100% agree with [Antonio](https://github.com/tonivade)

- "Just For Fun!"

But also because I had need of redis for unit testing on my last project, where we used [bull](https://www.npmjs.com/package/bull).  But I found it difficult to unit test the queue processors without spinning up a fully functional redis implementation.  Since we use CI/CD it was not practical to have a redis farm just for testing.  Instead I embedded a klunky precursor to this project and never felt good about it.

Now I feel good.

Well, better.

This project is released under the [MIT license](https://opensource.org/licenses/MIT)

# [Code Coverage Report](https://dooleydiligent.github.io/unit-redis-ness/coverage/index.html)
# [Code Documentation](https://dooleydiligent.github.io/unit-redis-ness/doc/index.html)
# [Repository](https://github.com/dooleydiligent/unit-redis-ness)
# How to use
Have a look at the skeleton project [test-unit-redisness](https://github.com/dooleydiligent/unit-redis-ness/tree/master/test-unit-redis-ness) included with the distribution. Or read along here:

```
npm install -D unit-redis-ness mocha @types/node chai net source-map-support ts-node typescript @types/chai @types/mocha
```
Configure ./test/mocha.opts like so (if you don't already have it configured):
```
--require source-map-support/register
--require ts-node/register
--full-trace
--bail
--timeout=5000
test/**/*.test.ts test/*.test.ts
```
Use this template:
```
import { RespServer, sendCommand } from 'unit-redis-ness';
import { expect } from 'chai';
import 'mocha';
import * as net from 'net';

process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6378';

const respServer = new RespServer();
const client: net.Socket = new net.Socket();

before((done) => {
  respServer.on('ready', () => {
    console.log(`The redis server is ready to test your application`);
    done();
  });
  respServer.start();
});

after((done) => {
  respServer.on('closed', () => {
    console.log(`The redis server has shut down`);
    done();
  });
  respServer.stop();
});

describe('Some test suite', () => {
  it('should start the redis server and allow a connection', async () => {
    const response = await sendCommand(client, ['PING']);
    expect(response).to.be.a('string');
    expect(response).to.equal('PONG');
  });
})
```
# Current State
As of 1.0.4 **unit-redis-ness* includes embedded [fengari](https://www.npmjs.com/package/fengari), which means that LUA is now available.

Otherwise, unit-redis only supports 5 "server" commands:

- ping
- echo
- time
- quit
- info

Plus some "database" commands - **implemented as of 1.0.4**:

- get
- set
- exists
- del
- hset
- hget
- incr
- decr
- incrby
- decrby
- client (partial)
- select
- dbsize
- sadd
- scard
- sismember
- smembers
- smove
- zadd
- zrange
- zcount
- zcard
- zincrby
- zrem
- type
- script
- eval
- evalsha

Todo (to complete v1.0.0 command set)

- expire
- flushdb
- flushall
- getset
- keys
- lindex
- llen
- lpop
- lpush
- lset
- lrem
- lrange
- ltrim
- mget
- move
- mset
- randomkey
- rename
- renamenx
- rpush
- rpoplpush
- rpop
- sdiff
- setnx
- sinter
- sinterstore
- sort
- spop
- srandmember
- srem
- sunion
- sunionstore
- ttl
- z*?

Probably Won't do

- auth
- bgsave
- monitor
- save
- shutdown
- slaveof
- anything that involves replication, clustering, or persistence to disk

This is, after all, intended as a unit test tool

# Future plans

Time permitting, I expect to:

- implement the full redis command set up to [2.6.x](http://download.redis.io/releases/) (maybe later)
<img width="100px" src="https://dooleydiligent.github.io/unit-redis-ness/doc/images/redis-white.png"><br/>


- embed [lua](https://www.lua.org/)<img width="100px" src="https://dooleydiligent.github.io/unit-redis-ness/doc/images/luaa.gif"><br/>

- circle back around to validate that [Bull](https://www.npmjs.com/package/bull ) can be thoroughly tested
<img width="100px" src="https://dooleydiligent.github.io/unit-redis-ness/doc/images/bull.png"><br/>

