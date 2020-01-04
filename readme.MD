# unit-redis
- A fully in-memory redis implementation in typescript to aid unit testing of redis-based nodejs applications

Initially inspired by [mini-redis](https://github.com/meteor/miniredis) but ulitimately adapted from the very well-designed [ClauDB](https://github.com/tonivade/claudb.git)

The reason?  I 100% agree with [Antonio](https://github.com/tonivade)

- "Just For Fun!"

But also because I had need of redis for unit testing on my last project, where we used [bull](https://www.npmjs.com/package/bull).  But I found it difficult to unit test the queue processors without spinning up a fully functional redis implementation.  Since we use CI/CD it was not practical to have a redis farm just for testing.  Instead I embedded a klunky precursor to this project and never felt good about it.

Now I feel good.

Well, better.

This project is released under the [MIT license](https://opensource.org/licenses/MIT)

# Current State

In it's current pre-alpha state, unit-redis only supports 4 "server" commands:

- ping
- echo
- time
- quit

Plus two "database" commands:

- get
- set


# Future plans

Time permitting, I expect to:

- implement the full redis command set up to [2.6.x](http://download.redis.io/releases/) (maybe later)
- embed [Lua](https://www.lua.org/)
- circle back around to validate that Bull can be thoroughly tested
