import {Dictionary} from "../../dictionary";
import {Logger} from "../../logger";
import {ClientCommand} from "../command/client-command";
import {DBSizeCommand} from "../command/db/dbsize-command";
import {FlushAllCommand} from "../command/db/flushall-command";
import {FlushDbCommand} from "../command/db/flushdb-command";
import {SelectCommand} from "../command/db/select-command";
import {DiscardCommand} from "../command/discard-command";
import {ExecCommand} from "../command/exec-command";
import {HgetCommand} from "../command/hash/hget-command";
import {HgetallCommand} from "../command/hash/hgetall-command";
import {HsetCommand} from "../command/hash/hset-command";
import {DelCommand} from "../command/key/del-command";
import {ExistsCommand} from "../command/key/exists-command";
import {ExpireCommand} from "../command/key/expire-command";
import {KeysCommand} from "../command/key/keys-command";
import {MoveCommand} from "../command/key/move-command";
import {PExpireCommand} from "../command/key/pexpire-command";
import {RandomKeyCommand} from "../command/key/randomkey-command";
import {RenameCommand} from "../command/key/rename-command";
import {RenameNxCommand} from "../command/key/renamenx-command";
import {TtlCommand} from "../command/key/ttl-command";
import {TypeCommand} from "../command/key/type-command";
import {BLPopCommand} from "../command/list/blpop-command";
import {BRPopCommand} from "../command/list/brpop-command";
import {BRPoplPushCommand} from "../command/list/brpoplpush-command";
import {LIndexCommand} from "../command/list/lindex-command";
import {LLenCommand} from "../command/list/llen-command";
import {LPopCommand} from "../command/list/lpop-command";
import {LPushCommand} from "../command/list/lpush-command";
import {LRangeCommand} from "../command/list/lrange-command";
import {LRemCommand} from "../command/list/lrem-command";
import {LSetCommand} from "../command/list/lset-command";
import {LTrimCommand} from "../command/list/ltrim-command";
import {RPopCommand} from "../command/list/rpop-command";
import {RPoplPushCommand} from "../command/list/rpoplpush-command";
import {RPushCommand} from "../command/list/rpush-command";
import {MultiCommand} from "../command/multi-command";
import {NullCommand} from "../command/null-command";
import {IRespCommand} from "../command/resp-command";
import {ScriptCommand} from "../command/script-command";
import {EchoCommand} from "../command/server/echo-command";
import {InfoCommand} from "../command/server/info-command";
import {PingCommand} from "../command/server/ping-command";
import {PublishCommand} from "../command/server/publish-command";
import {QuitCommand} from "../command/server/quit-command";
import {SubscribeCommand} from "../command/server/subscribe-command";
import {TimeCommand} from "../command/server/time-command";
import {UnsubscribeCommand} from "../command/server/unsubscribe-command";
import {SAddCommand} from "../command/set/sadd-command";
import {SCardCommand} from "../command/set/scard-command";
import {SDiffCommand} from "../command/set/sdiff-command";
import {SInterCommand} from "../command/set/sinter-command";
import {SIsMemberCommand} from "../command/set/sismember-command";
import {SMembersCommand} from "../command/set/smembers-command";
import {SMoveCommand} from "../command/set/smove-command";
import {SRemCommand} from "../command/set/srem-command";
import {SUnionCommand} from "../command/set/sunion-command";
import {ZaddCommand} from "../command/sset/zadd-command";
import {ZCardCommand} from "../command/sset/zcard-command";
import {ZCountCommand} from "../command/sset/zcount-command";
import {ZIncrByCommand} from "../command/sset/zincrby-command";
import {ZRangeCommand} from "../command/sset/zrange-command";
import {ZRangeByScoreCommand} from "../command/sset/zrangebyscore-command";
import {ZRankCommand} from "../command/sset/zrank-command";
import {ZRemCommand} from "../command/sset/zrem-command";
import {ZScoreCommand} from "../command/sset/zscore-command";
import {GetCommand} from "../command/string/get-command";
import {GetSetCommand} from "../command/string/getset-command";
import {IncrCommand} from "../command/string/incr-command";
import {IncrByCommand} from "../command/string/incrby-command";
import {MGetCommand} from "../command/string/mget-command";
import {MsetCommand} from "../command/string/mset-command";
import {SetCommand} from "../command/string/set-command";
import {SetNxCommand} from "../command/string/setnx-command";
import {CommandWrapperFactory} from "./command-wrapper-factory";
export class CommandSuite {
  private logger: Logger = new Logger(module.id);

  private metadata: Dictionary<string, string> = new Dictionary<string, string>();

  private commands: Dictionary<string, IRespCommand> = new Dictionary<string, IRespCommand>();

  private nullCommand: NullCommand = new NullCommand();

  private factory: CommandWrapperFactory = new CommandWrapperFactory();

  constructor() {
      this.addCommand(
          "info",
          new InfoCommand()
      );
      this.addCommand(
          "get",
          new GetCommand()
      );
      this.addCommand(
          "set",
          new SetCommand()
      );
      this.addCommand(
          "ping",
          new PingCommand()
      );
      this.addCommand(
          "echo",
          new EchoCommand()
      );
      this.addCommand(
          "quit",
          new QuitCommand()
      );
      this.addCommand(
          "time",
          new TimeCommand()
      );
      this.addCommand(
          "del",
          new DelCommand()
      );
      this.addCommand(
          "exists",
          new ExistsCommand()
      );
      this.addCommand(
          "incr",
          new IncrCommand(1)
      );
      this.addCommand(
          "decr",
          new IncrCommand(-1)
      );
      this.addCommand(
          "hset",
          new HsetCommand()
      );
      this.addCommand(
          "hget",
          new HgetCommand()
      );
      this.addCommand(
          "client",
          new ClientCommand()
      );
      this.addCommand(
          "select",
          new SelectCommand()
      );
      this.addCommand(
          "dbsize",
          new DBSizeCommand()
      );
      this.addCommand(
          "incrby",
          new IncrByCommand(1)
      );
      this.addCommand(
          "decrby",
          new IncrByCommand(-1)
      );
      this.addCommand(
          "zadd",
          new ZaddCommand()
      );
      this.addCommand(
          "sadd",
          new SAddCommand()
      );
      this.addCommand(
          "scard",
          new SCardCommand()
      );
      this.addCommand(
          "sismember",
          new SIsMemberCommand()
      );
      this.addCommand(
          "smembers",
          new SMembersCommand()
      );
      this.addCommand(
          "smove",
          new SMoveCommand()
      );
      this.addCommand(
          "zcard",
          new ZCardCommand()
      );
      this.addCommand(
          "zcount",
          new ZCountCommand()
      );
      this.addCommand(
          "zincrby",
          new ZIncrByCommand()
      );
      this.addCommand(
          "zrange",
          new ZRangeCommand()
      );
      this.addCommand(
          "zrem",
          new ZRemCommand()
      );
      this.addCommand(
          "type",
          new TypeCommand()
      );
      this.addCommand(
          "script",
          new ScriptCommand(
              2,
              1,
              "script"
          )
      );
      this.addCommand(
          "eval",
          new ScriptCommand(
              -1,
              2,
              "eval"
          )
      );
      this.addCommand(
          "evalsha",
          new ScriptCommand(
              -1,
              2,
              "evalsha"
          )
      );
      this.addCommand(
          "expire",
          new ExpireCommand()
      );
      this.addCommand(
          "rename",
          new RenameCommand()
      );
      this.addCommand(
          "flushdb",
          new FlushDbCommand()
      );
      this.addCommand(
          "flushall",
          new FlushAllCommand()
      );
      this.addCommand(
          "mset",
          new MsetCommand()
      );
      this.addCommand(
          "keys",
          new KeysCommand()
      );
      this.addCommand(
          "lindex",
          new LIndexCommand()
      );
      this.addCommand(
          "llen",
          new LLenCommand()
      );
      this.addCommand(
          "rpop",
          new RPopCommand()
      );
      this.addCommand(
          "rpush",
          new RPushCommand()
      );
      this.addCommand(
          "move",
          new MoveCommand()
      );
      this.addCommand(
          "getset",
          new GetSetCommand()
      );
      this.addCommand(
          "lpop",
          new LPopCommand()
      );
      this.addCommand(
          "lpush",
          new LPushCommand()
      );
      this.addCommand(
          "lset",
          new LSetCommand()
      );
      this.addCommand(
          "lrange",
          new LRangeCommand()
      );
      this.addCommand(
          "lrem",
          new LRemCommand()
      );
      this.addCommand(
          "zrank",
          new ZRankCommand()
      );
      this.addCommand(
          "ltrim",
          new LTrimCommand()
      );
      this.addCommand(
          "mget",
          new MGetCommand()
      );
      this.addCommand(
          "randomkey",
          new RandomKeyCommand()
      );
      this.addCommand(
          "renamenx",
          new RenameNxCommand()
      );
      this.addCommand(
          "rpoplpush",
          new RPoplPushCommand()
      );
      this.addCommand(
          "sdiff",
          new SDiffCommand()
      );
      this.addCommand(
          "setnx",
          new SetNxCommand()
      );
      this.addCommand(
          "sinter",
          new SInterCommand(
              -1,
              1,
              "sinter"
          )
      );
      this.addCommand(
          "sinterstore",
          new SInterCommand(
              -1,
              2,
              "sinterstore"
          )
      );
      this.addCommand(
          "srem",
          new SRemCommand()
      );
      this.addCommand(
          "sunion",
          new SUnionCommand(
              -1,
              1,
              "sunion"
          )
      );
      this.addCommand(
          "sunionstore",
          new SUnionCommand(
              -1,
              2,
              "sunionstore"
          )
      );
      this.addCommand(
          "ttl",
          new TtlCommand()
      );
      this.addCommand(
          "brpop",
          new BRPopCommand(
              -1,
              2,
              "brpop"
          )
      );
      this.addCommand(
          "blpop",
          new BLPopCommand(
              -1,
              2,
              "blpop"
          )
      );
      this.addCommand(
          "brpoplpush",
          new BRPoplPushCommand()
      );
      this.addCommand(
          "multi",
          new MultiCommand()
      );
      this.addCommand(
          "discard",
          new DiscardCommand()
      );
      this.addCommand(
          "exec",
          new ExecCommand()
      );
      this.addCommand(
          "publish",
          new PublishCommand()
      );
      this.addCommand(
          "subscribe",
          new SubscribeCommand()
      );
      this.addCommand(
          "unsubscribe",
          new UnsubscribeCommand()
      );
      this.addCommand(
          "hmset",
          new HsetCommand()
      );
      // 2020-01-17 v1.0.10
      this.addCommand(
          "hgetall",
          new HgetallCommand()
      );
      this.addCommand(
          "zrangebyscore",
          new ZRangeByScoreCommand()
      );
      this.addCommand(
          "zscore",
          new ZScoreCommand()
      );
      this.addCommand(
          "pexpire",
          new PExpireCommand()
      );
  }

  public getCommand(name: string): IRespCommand {
      const gotCommand = this.commands.get(name.toLowerCase());
      if (!gotCommand) {
          return this.nullCommand;
      }
      return gotCommand;
  }

  protected addCommand(name: string, command: IRespCommand): void {
      this.commands.put(
          name,
          this.factory.wrap(command)
      );
  }
}
