import { Dictionary } from '../../dictionary';
import { Logger } from '../../logger';
import { CommandWrapperFactory } from './command-wrapper-factory';
import { ClientCommand } from './command/client-command';
import { DBSizeCommand } from './command/db/dbsize-command';
import { SelectCommand } from './command/db/select-command';
import { HgetCommand } from './command/hash/hget-command';
import { HsetCommand } from './command/hash/hset-command';
import { DelCommand } from './command/key/del-command';
import { ExistsCommand } from './command/key/exists-command';
import { NullCommand } from './command/null-command';
import { IRespCommand } from './command/resp-command';
import { EchoCommand } from './command/server/echo-command';
import { InfoCommand } from './command/server/info-command';
import { PingCommand } from './command/server/ping-command';
import { QuitCommand } from './command/server/quit-command';
import { TimeCommand } from './command/server/time-command';
import { SAddCommand } from './command/set/sadd-command';
import { SCardCommand } from './command/set/scard-command';
import { SIsMemberCommand } from './command/set/sismember-command';
import { SMembersCommand } from './command/set/smembers-command';
import { SMoveCommand } from './command/set/smove-command';
import { ZaddCommand } from './command/sset/zadd-command';
import { GetCommand } from './command/string/get-command';
import { IncrCommand } from './command/string/incr-command';
import { IncrByCommand } from './command/string/incrby-command';
import { SetCommand } from './command/string/set-command';

export class CommandSuite {
  private logger: Logger = new Logger(module.id);
  private metadata: Dictionary<string, string> = new Dictionary<string, string>();
  private commands: Dictionary<string, IRespCommand> = new Dictionary<string, IRespCommand>();
  private nullCommand: NullCommand = new NullCommand();
  private factory: CommandWrapperFactory = new CommandWrapperFactory();
  constructor() {
    this.addCommand('info', new InfoCommand());
    this.addCommand('get', new GetCommand());
    this.addCommand('set', new SetCommand());
    this.addCommand('ping', new PingCommand());
    this.addCommand('echo', new EchoCommand());
    this.addCommand('quit', new QuitCommand());
    this.addCommand('time', new TimeCommand());
    this.addCommand('del', new DelCommand());
    this.addCommand('exists', new ExistsCommand());
    this.addCommand('incr', new IncrCommand(1));
    this.addCommand('decr', new IncrCommand(-1));
    this.addCommand('hset', new HsetCommand());
    this.addCommand('hget', new HgetCommand());
    this.addCommand('client', new ClientCommand());
    this.addCommand('select', new SelectCommand());
    this.addCommand('dbsize', new DBSizeCommand());
    this.addCommand('incrby', new IncrByCommand(1));
    this.addCommand('decrby', new IncrByCommand(-1));
    this.addCommand('zadd', new ZaddCommand());
    this.addCommand('sadd', new SAddCommand());
    this.addCommand('scard', new SCardCommand());
    this.addCommand('sismember', new SIsMemberCommand());
    this.addCommand('smembers', new SMembersCommand());
    this.addCommand('smove', new SMoveCommand());
  }
  public getCommand(name: string): IRespCommand {
    const gotCommand = this.commands.get(name.toLowerCase());
    if (!gotCommand) {
      return this.nullCommand;
    }
    return gotCommand;
  }
  protected addCommand(name: string, command: IRespCommand): void {
    this.commands.put(name, this.factory.wrap(command));
  }
}
