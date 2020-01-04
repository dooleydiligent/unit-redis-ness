import { Dictionary } from '../../dictionary';
import { Logger } from '../../logger';
import { CommandWrapperFactory } from './command-wrapper-factory';
import { DelCommand } from './command/del-command';
import { EchoCommand } from './command/echo-command';
import { GetCommand } from './command/get-command';
import { InfoCommand } from './command/info-command';
import { NullCommand } from './command/null-command';
import { PingCommand } from './command/ping-command';
import { QuitCommand } from './command/quit-command';
import { IRespCommand } from './command/resp-command';
import { SetCommand } from './command/set-command';
import { TimeCommand } from './command/time-command';

export class CommandSuite {
  private logger: Logger = new Logger(module.id);
  private metadata: Dictionary<string> = new Dictionary<string>();
  private commands: Dictionary<string> = new Dictionary<string>();
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
