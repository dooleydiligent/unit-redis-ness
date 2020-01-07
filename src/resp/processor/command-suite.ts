import { Dictionary } from '../../dictionary';
import { Logger } from '../../logger';
import { CommandWrapperFactory } from './command-wrapper-factory';
import { ClientCommand } from './command/client-command';
import { DBSizeCommand } from './command/dbsize-command';
import { DelCommand } from './command/del-command';
import { EchoCommand } from './command/echo-command';
import { ExistsCommand } from './command/exists-command';
import { GetCommand } from './command/get-command';
import { HgetCommand } from './command/hget-command';
import { HsetCommand } from './command/hset-command';
import { IncrCommand } from './command/incr-command';
import { IncrByCommand } from './command/incrby-command';
import { InfoCommand } from './command/info-command';
import { NullCommand } from './command/null-command';
import { PingCommand } from './command/ping-command';
import { QuitCommand } from './command/quit-command';
import { IRespCommand } from './command/resp-command';
import { SelectCommand } from './command/select-command';
import { SetCommand } from './command/set-command';
import { TimeCommand } from './command/time-command';
import { ZaddCommand } from './command/zadd-command';

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
